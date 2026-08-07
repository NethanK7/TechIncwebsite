/**
 * Conduits — the visual argument of the whole site.
 *
 * Each district is joined to the core by a glowing tube plus a halftone field of
 * dots on the ground beneath it. Both are dark until the camera reaches that
 * district, then fill from the core outward carrying travelling pulses. By the
 * overhead stage every conduit is lit at once: six departments, one platform,
 * physically wired together.
 *
 * Built with CatmullRomCurve3 → TubeGeometry, and the dot field is one
 * InstancedMesh whose wave is computed per-instance in the shader — so the whole
 * connective layer costs twelve draw calls for six routes.
 */

import {
  CatmullRomCurve3,
  CircleGeometry,
  Group,
  InstancedMesh,
  InstancedBufferAttribute,
  Matrix4,
  Mesh,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from 'three'

import { makeConduitMaterial, makeDotMaterial } from './materials'
import { conduitLevel } from './layout'
import { rng } from './rng'

export interface Conduit {
  key: string
  material: ShaderMaterial
  dotMaterial: ShaderMaterial | null
}

export interface BuiltConduits {
  group: Group
  update(progress: number): void
  dispose(): void
}

/**
 * Route from the core out to a district.
 *
 * A shallow ground-hugging arc rather than a straight line: it leaves the core
 * low, sags to about seven units at the midpoint, and rises into the district.
 * A straight line between two points reads as a diagram; a sagging cable reads
 * as infrastructure.
 *
 * Staying low is also what keeps it out of the camera's near field — the flight
 * path sits at 76 units, and anything arcing higher flares across the frame.
 *
 * The lateral bow keeps six routes from collapsing into a star at the core.
 */
function routeCurve(from: Vector3, to: Vector3, bow: number): CatmullRomCurve3 {
  const span = from.distanceTo(to)
  const flat = new Vector3(to.x - from.x, 0, to.z - from.z).normalize()
  const side = new Vector3(-flat.z, 0, flat.x).multiplyScalar(bow * span * 0.11)

  const a = from.clone().lerp(to, 0.2)
  a.y = from.y * 0.55 + 3
  a.add(side.clone().multiplyScalar(0.5))

  const mid = from.clone().lerp(to, 0.5)
  // Deliberately low. The camera flies at 76 units; a route arcing higher than
  // about 12 crosses the near plane and flares white across the whole frame.
  mid.y = 7
  mid.add(side)

  const c = from.clone().lerp(to, 0.8)
  c.y = to.y * 0.55 + 3
  c.add(side.clone().multiplyScalar(0.5))

  return new CatmullRomCurve3([from, a, mid, c, to], false, 'centripetal', 0.5)
}

/**
 * The halftone dot field beneath a route.
 *
 * Dots are laid in a staggered lattice along the curve's ground projection, each
 * carrying its normalised position along the route as an instance attribute so
 * the shader can light them as a wave without any per-frame CPU work.
 */
function buildDots(
  curve: CatmullRomCurve3,
  material: ShaderMaterial,
): { mesh: InstancedMesh; dispose(): void } {
  const r = rng(2222)
  const alongRow = 74
  const across = 5
  const matrices: Matrix4[] = []
  const alongs: number[] = []
  const jitters: number[] = []

  const scratch = new Matrix4()
  const point = new Vector3()
  const next = new Vector3()

  for (let i = 0; i < alongRow; i++) {
    const t = i / (alongRow - 1)
    curve.getPoint(t, point)
    curve.getPoint(Math.min(1, t + 0.01), next)

    // Perpendicular to the route on the ground plane.
    const dir = new Vector3(next.x - point.x, 0, next.z - point.z).normalize()
    const perp = new Vector3(-dir.z, 0, dir.x)

    for (let j = 0; j < across; j++) {
      // Stagger alternate rows so the lattice reads as a halftone rather than
      // as a grid of squares.
      const offset = (j - (across - 1) / 2) * 5.5 + (i % 2 ? 2.75 : 0)
      // Thin the field toward its edges.
      if (Math.abs(offset) > 12 && r.chance(0.55)) continue

      const size = 1.15 - Math.abs(offset) / 26
      scratch.makeScale(size, size, size)
      scratch.setPosition(
        point.x + perp.x * offset,
        0.14,
        point.z + perp.z * offset,
      )
      matrices.push(scratch.clone())
      alongs.push(t)
      jitters.push(r())
    }
  }

  const geo = new CircleGeometry(1, 10)
  geo.rotateX(-Math.PI / 2)
  geo.deleteAttribute('uv')
  geo.deleteAttribute('normal')

  const mesh = new InstancedMesh(geo, material, matrices.length)
  matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
  mesh.instanceMatrix.needsUpdate = true
  mesh.geometry.setAttribute('aAlong', new InstancedBufferAttribute(new Float32Array(alongs), 1))
  mesh.geometry.setAttribute('aJitter', new InstancedBufferAttribute(new Float32Array(jitters), 1))
  mesh.frustumCulled = false
  mesh.renderOrder = 3

  return { mesh, dispose: () => geo.dispose() }
}

export function buildConduits(
  coreAnchor: Vector3,
  districts: { key: string; anchor: Vector3 }[],
  withDots = true,
): BuiltConduits {
  const group = new Group()
  group.name = 'conduits'
  const conduits: Conduit[] = []
  const owned: { dispose(): void }[] = []

  districts.forEach((d, i) => {
    // Alternate the bow so adjacent routes separate visibly at the core.
    const bow = (i % 2 === 0 ? 1 : -1) * (0.65 + (i % 3) * 0.22)
    const curve = routeCurve(coreAnchor, d.anchor, bow)

    const geo = new TubeGeometry(curve, 170, 0.6, 8, false)
    const material = makeConduitMaterial()
    const mesh = new Mesh(geo, material)
    mesh.frustumCulled = false
    mesh.renderOrder = 5
    group.add(mesh)
    owned.push({ dispose: () => geo.dispose() })

    let dotMaterial: ShaderMaterial | null = null
    if (withDots) {
      dotMaterial = makeDotMaterial()
      const dots = buildDots(curve, dotMaterial)
      group.add(dots.mesh)
      owned.push(dots)
    }

    conduits.push({ key: d.key, material, dotMaterial })
  })

  return {
    group,
    update(progress) {
      for (const c of conduits) {
        const level = conduitLevel(c.key, progress)
        c.material.uniforms.uFill!.value = level
        if (c.dotMaterial) c.dotMaterial.uniforms.uFill!.value = level
      }
    },
    dispose() {
      owned.forEach((o) => o.dispose())
      conduits.forEach((c) => {
        c.material.dispose()
        c.dotMaterial?.dispose()
      })
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Ascent ramps                                                               */
/* -------------------------------------------------------------------------- */

export interface BuiltRamps {
  group: Group
  update(methodologyProgress: number): void
  dispose(): void
}

/**
 * Short conduits joining consecutive NXTGEN platforms, filling in sequence as
 * the camera climbs — so the methodology reads as phases handing off to each
 * other rather than as five separate boxes.
 */
export function buildAscentRamps(anchors: Vector3[]): BuiltRamps {
  const group = new Group()
  group.name = 'ramps'
  const links: { material: ShaderMaterial; dispose(): void }[] = []

  for (let i = 0; i < anchors.length - 1; i++) {
    const from = anchors[i]!
    const to = anchors[i + 1]!
    // Arc up and over so the link is visible above the platforms.
    const mid = from.clone().lerp(to, 0.5).add(new Vector3(0, 7, 0))
    const curve = new CatmullRomCurve3([from, mid, to], false, 'centripetal', 0.5)

    const geo = new TubeGeometry(curve, 70, 0.55, 8, false)
    const material = makeConduitMaterial()
    material.uniforms.uPulses!.value = 1.5
    material.uniforms.uGain!.value = 1.3
    const mesh = new Mesh(geo, material)
    mesh.frustumCulled = false
    mesh.renderOrder = 5
    group.add(mesh)
    links.push({ material, dispose: () => geo.dispose() })
  }

  return {
    group,
    update(methodologyProgress) {
      links.forEach((l, i) => {
        const start = i / links.length
        const end = (i + 1) / links.length
        const t = (methodologyProgress - start) / Math.max(0.0001, end - start)
        l.material.uniforms.uFill!.value = Math.max(0, Math.min(1, t))
      })
    },
    dispose() {
      links.forEach((l) => {
        l.dispose()
        l.material.dispose()
      })
    },
  }
}
