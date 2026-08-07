/**
 * The animated layer: people walking, vans driving, turbines turning.
 *
 * A still model reads as a diagram. Movement — even slow, even tiny — is what
 * makes it read as a working site, which is the whole claim the page is making.
 *
 * Everything here runs on the GPU. Each system is one InstancedMesh whose vertex
 * shader computes the instance's position from a shared clock plus per-instance
 * attributes, so a crowd of two hundred people costs one draw call and no
 * per-frame CPU work at all. The alternative — writing instance matrices from
 * JavaScript every frame — is a few hundred matrix composes and a full buffer
 * upload per frame, for identical output.
 *
 * The animation is injected into `MeshStandardMaterial` via `onBeforeCompile`
 * rather than written as a bespoke `ShaderMaterial`, so the moving objects are
 * lit and fogged exactly like the static city. A hand-written shader would have
 * to reimplement all of that and would still drift out of step with it.
 *
 * Shadows: the scene's shadow map is deliberately frozen after the first frames
 * (see journey.ts) because nothing static ever moves. Animated objects therefore
 * do not cast into it, and instead carry their own soft contact shadow — a flat
 * darkened disc that follows them. On a bright overhead scene that reads better
 * than a real shadow anyway, and costs one more instanced draw.
 */

import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  ShaderMaterial,
  Uniform,
  Vector3,
} from 'three'

import { PALETTE, uTime } from './materials'
import { bladeGeometry, figureGeometry, vanGeometry } from './props'
import { rng, type Rng } from './rng'

/** Shared walk cycle constants, so people and their shadows stay in step. */
const STRIDE = 5.2

export interface Animated {
  group: Group
  /** Called once per frame with elapsed seconds. */
  update(elapsed: number): void
  dispose(): void
}

/* -------------------------------------------------------------------------- */
/*  Crowds                                                                     */
/* -------------------------------------------------------------------------- */

export interface WalkerSite {
  at: Vector3
  radius: number
  count: number
  seed: number
}

/**
 * People walking looping routes inside each district.
 *
 * Each person gets an ellipse — centre, two radii, a rotation, a speed and a
 * phase. Ellipses rather than circles, and each one rotated, because a district
 * of concentric circles reads as a fairground; rotated ellipses at different
 * scales read as people going about unrelated errands.
 *
 * The shader derives facing from the path tangent, so everyone walks forwards.
 */
export function buildCrowd(sites: WalkerSite[]): Animated {
  const group = new Group()
  group.name = 'crowd'

  const total = sites.reduce((n, s) => n + s.count, 0)
  if (!total) {
    return { group, update: () => {}, dispose: () => {} }
  }

  // Per-instance path description.
  const centre = new Float32Array(total * 2)
  const ellipse = new Float32Array(total * 3) // radiusA, radiusB, rotation
  const motion = new Float32Array(total * 2) // speed, phase

  let i = 0
  for (const site of sites) {
    const r: Rng = rng(site.seed ^ 0x5eed)
    for (let n = 0; n < site.count; n++) {
      centre[i * 2] = site.at.x + r.range(-1, 1) * site.radius * 0.45
      centre[i * 2 + 1] = site.at.z + r.range(-1, 1) * site.radius * 0.45

      const a = r.range(4, site.radius * 0.42)
      ellipse[i * 3] = a
      ellipse[i * 3 + 1] = a * r.range(0.35, 1.0)
      ellipse[i * 3 + 2] = r.range(0, Math.PI)

      // Angular speed scaled so linear pace is roughly human regardless of loop
      // size — a person on a small loop should not sprint.
      motion[i * 2] = (r.range(1.1, 1.9) / Math.max(4, a)) * (r.chance(0.5) ? 1 : -1)
      motion[i * 2 + 1] = r.range(0, Math.PI * 2)
      i++
    }
  }

  const geo = figureGeometry()
  geo.setAttribute('aCentre', new InstancedBufferAttribute(centre, 2))
  geo.setAttribute('aEllipse', new InstancedBufferAttribute(ellipse, 3))
  geo.setAttribute('aMotion', new InstancedBufferAttribute(motion, 2))

  const material = new MeshStandardMaterial({
    color: new Color(0x2f3746),
    roughness: 0.65,
    metalness: 0,
  })
  injectWalk(material)

  const mesh = new InstancedMesh(geo, material, total)
  // The shader positions every instance; the matrices stay identity.
  const identity = new Matrix4()
  for (let n = 0; n < total; n++) mesh.setMatrixAt(n, identity)
  mesh.instanceMatrix.needsUpdate = true
  mesh.frustumCulled = false
  mesh.castShadow = false
  mesh.receiveShadow = false
  group.add(mesh)

  // Contact shadows, following the identical path.
  const shadowGeo = new CircleGeometry(0.62, 10)
  shadowGeo.rotateX(-Math.PI / 2)
  shadowGeo.deleteAttribute('uv')
  shadowGeo.deleteAttribute('normal')
  shadowGeo.setAttribute('aCentre', new InstancedBufferAttribute(centre, 2))
  shadowGeo.setAttribute('aEllipse', new InstancedBufferAttribute(ellipse, 3))
  shadowGeo.setAttribute('aMotion', new InstancedBufferAttribute(motion, 2))

  const shadowMat = makeContactShadowMaterial()
  const shadows = new InstancedMesh(shadowGeo, shadowMat, total)
  for (let n = 0; n < total; n++) shadows.setMatrixAt(n, identity)
  shadows.instanceMatrix.needsUpdate = true
  shadows.frustumCulled = false
  shadows.renderOrder = 2
  group.add(shadows)

  return {
    group,
    update: () => {
      // Nothing: uTime is shared and already advanced by tickMaterials.
    },
    dispose: () => {
      geo.dispose()
      shadowGeo.dispose()
      material.dispose()
      shadowMat.dispose()
    },
  }
}

/** The path maths, shared by the figure material and its contact shadow. */
const WALK_PATH_GLSL = /* glsl */ `
  attribute vec2 aCentre;
  attribute vec3 aEllipse;   // radiusA, radiusB, rotation
  attribute vec2 aMotion;    // angular speed, phase
  uniform float uTime;

  // Returns world XZ, and writes the heading (radians) and the stride phase.
  vec2 walkPath(out float heading, out float stride) {
    float t = uTime * aMotion.x + aMotion.y;
    vec2 local = vec2(cos(t) * aEllipse.x, sin(t) * aEllipse.y);

    float c = cos(aEllipse.z), s = sin(aEllipse.z);
    mat2 spin = mat2(c, -s, s, c);
    vec2 world = aCentre + spin * local;

    // Tangent of the ellipse, rotated the same way, gives the facing.
    vec2 tangent = spin * vec2(-sin(t) * aEllipse.x, cos(t) * aEllipse.y) * sign(aMotion.x);
    heading = atan(tangent.x, tangent.y);

    // Stride frequency follows actual ground speed, so nobody moonwalks.
    stride = t * ${STRIDE.toFixed(1)};
    return world;
  }

  mat2 rot2(float a) {
    float ca = cos(a), sa = sin(a);
    return mat2(ca, sa, -sa, ca);
  }
`

/**
 * Inject the walk into a standard material.
 *
 * Replacing `<begin_vertex>` puts our transform before three.js computes the
 * model-view position, so lighting, fog and depth all follow the animated
 * position for free.
 */
function injectWalk(material: MeshStandardMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + WALK_PATH_GLSL)
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        float heading, stride;
        vec2 groundXz = walkPath(heading, stride);

        vec3 transformed = position;

        // Swing the legs. Front and back leg are separated on local X, so the
        // sign of x selects which half of the cycle each is on.
        if (transformed.y < 0.62 && transformed.y > 0.02) {
          float side = sign(transformed.x);
          float swing = sin(stride + (side > 0.0 ? 0.0 : 3.14159));
          transformed.z += swing * 0.30 * (0.62 - transformed.y);
        }

        // Body bob, twice per stride.
        transformed.y += abs(sin(stride)) * 0.045;

        // Face along the path, then place in the world.
        transformed.xz = rot2(heading) * transformed.xz;
        transformed.x += groundXz.x;
        transformed.z += groundXz.y;
        `,
      )
    // Normals must be rotated with the body or the lighting swims as people turn.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      /* glsl */ `
      #include <beginnormal_vertex>
      {
        float h2, s2;
        walkPath(h2, s2);
        objectNormal.xz = rot2(h2) * objectNormal.xz;
      }
      `,
    )
  }
}

/**
 * Soft elliptical blob under a walker.
 *
 * Multiplicative rather than alpha-blended: a translucent black disc over a
 * near-white ground goes grey and muddy, whereas darkening the destination keeps
 * the ground's own tint and reads as a real shadow.
 */
function makeContactShadowMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: 2, // MultiplyBlending
    side: DoubleSide,
    uniforms: { uTime, uStrength: new Uniform(0.3) },
    vertexShader: /* glsl */ `
      ${WALK_PATH_GLSL}
      varying vec2 vLocal;
      void main() {
        float heading, stride;
        vec2 groundXz = walkPath(heading, stride);

        vec3 p = position;
        vLocal = p.xz / 0.62;
        // Shadow tightens as the foot lands, which sells the contact.
        p.xz *= 0.75 + abs(sin(stride)) * 0.3;
        p.x += groundXz.x;
        p.z += groundXz.y;
        p.y = 0.06;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      varying vec2 vLocal;
      void main() {
        float d = length(vLocal);
        if (d > 1.0) discard;
        float a = (1.0 - smoothstep(0.15, 1.0, d)) * uStrength;
        gl_FragColor = vec4(vec3(1.0 - a), 1.0);
      }
    `,
  })
}

/* -------------------------------------------------------------------------- */
/*  Traffic                                                                    */
/* -------------------------------------------------------------------------- */

export interface Route {
  from: Vector3
  to: Vector3
}

/**
 * Vans running the roads between the core and each district.
 *
 * Each van gets a route, a lane offset and a phase; the shader lerps along the
 * route, wraps, and faces along it. Two lanes so traffic runs both ways, which
 * is what makes it read as a working site rather than a conveyor.
 */
export function buildTraffic(routes: Route[], perRoute = 3): Animated {
  const group = new Group()
  group.name = 'traffic'

  const total = routes.length * perRoute
  if (!total) return { group, update: () => {}, dispose: () => {} }

  const from = new Float32Array(total * 2)
  const to = new Float32Array(total * 2)
  const motion = new Float32Array(total * 3) // speed, phase, lane offset
  const r = rng(4711)

  let i = 0
  for (const route of routes) {
    for (let n = 0; n < perRoute; n++) {
      // Half the vans run the route backwards.
      const flip = n % 2 === 1
      const a = flip ? route.to : route.from
      const b = flip ? route.from : route.to
      from[i * 2] = a.x
      from[i * 2 + 1] = a.z
      to[i * 2] = b.x
      to[i * 2 + 1] = b.z
      motion[i * 3] = r.range(0.018, 0.032)
      motion[i * 3 + 1] = r.range(0, 1)
      motion[i * 3 + 2] = flip ? -2.6 : 2.6
      i++
    }
  }

  const geo = vanGeometry()
  geo.setAttribute('aFrom', new InstancedBufferAttribute(from, 2))
  geo.setAttribute('aTo', new InstancedBufferAttribute(to, 2))
  geo.setAttribute('aMotion', new InstancedBufferAttribute(motion, 3))

  const material = new MeshStandardMaterial({
    color: new Color(PALETTE.shellLight),
    roughness: 0.7,
    metalness: 0,
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        attribute vec2 aFrom;
        attribute vec2 aTo;
        attribute vec3 aMotion; // speed, phase, lane
        uniform float uTime;

        vec2 drive(out float heading) {
          vec2 dir = aTo - aFrom;
          float len = length(dir);
          vec2 unit = dir / max(len, 0.0001);
          vec2 lane = vec2(-unit.y, unit.x) * aMotion.z;

          // The road stops short of both aprons, so the vans should too.
          float t = fract(uTime * aMotion.x + aMotion.y);
          vec2 a = aFrom + unit * 34.0;
          vec2 b = aTo - unit * 34.0;

          heading = atan(unit.x, unit.y);
          return mix(a, b, t) + lane;
        }

        mat2 rot2(float a) {
          float ca = cos(a), sa = sin(a);
          return mat2(ca, sa, -sa, ca);
        }
        `,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        float heading;
        vec2 groundXz = drive(heading);
        vec3 transformed = position;
        // The van geometry points along +X; the heading is measured from +Z.
        transformed.xz = rot2(heading + 1.5707963) * transformed.xz;
        transformed.x += groundXz.x;
        transformed.z += groundXz.y;
        `,
      )
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        #include <beginnormal_vertex>
        {
          float h2;
          drive(h2);
          objectNormal.xz = rot2(h2 + 1.5707963) * objectNormal.xz;
        }
        `,
      )
  }

  const mesh = new InstancedMesh(geo, material, total)
  const identity = new Matrix4()
  for (let n = 0; n < total; n++) mesh.setMatrixAt(n, identity)
  mesh.instanceMatrix.needsUpdate = true
  mesh.frustumCulled = false
  mesh.castShadow = false
  group.add(mesh)

  return {
    group,
    update: () => {},
    dispose: () => {
      geo.dispose()
      material.dispose()
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Turbines                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Rotor assemblies for the scattered wind turbines.
 *
 * Only a handful exist, so these are driven from the CPU: one matrix compose
 * each per frame is cheaper to read than another shader injection, and the
 * count never grows.
 */
export function buildRotors(hubs: { at: Vector3; yaw: number; length: number }[]): Animated {
  const group = new Group()
  group.name = 'rotors'
  if (!hubs.length) return { group, update: () => {}, dispose: () => {} }

  // One geometry at the median length; the per-instance scale covers the rest.
  const median = hubs.map((h) => h.length).sort((a, b) => a - b)[Math.floor(hubs.length / 2)]!
  const geo = bladeGeometry(median)
  const material = new MeshStandardMaterial({
    color: new Color(PALETTE.shellLight),
    roughness: 0.72,
    metalness: 0,
  })

  const mesh = new InstancedMesh(geo, material, hubs.length)
  mesh.frustumCulled = false
  mesh.castShadow = false
  group.add(mesh)

  const r = rng(8842)
  const speeds = hubs.map(() => r.range(0.35, 0.72) * (r.chance(0.5) ? 1 : -1))
  const scales = hubs.map((h) => h.length / median)
  const matrix = new Matrix4()
  const spin = new Matrix4()
  const yaw = new Matrix4()
  const place = new Matrix4()
  const scale = new Matrix4()

  return {
    group,
    update(elapsed) {
      for (let i = 0; i < hubs.length; i++) {
        const hub = hubs[i]!
        // Spin in the rotor's own plane, then yaw the whole assembly to face the
        // way its nacelle points, then translate to the hub.
        spin.makeRotationZ(elapsed * speeds[i]!)
        scale.makeScale(scales[i]!, scales[i]!, 1)
        yaw.makeRotationY(hub.yaw)
        place.makeTranslation(hub.at.x, hub.at.y, hub.at.z)
        matrix.multiplyMatrices(place, yaw).multiply(spin).multiply(scale)
        mesh.setMatrixAt(i, matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    },
    dispose: () => {
      geo.dispose()
      material.dispose()
    },
  }
}

export { AdditiveBlending as _Additive }
