/**
 * Materials.
 *
 * The look is a white architectural model photographed on a pale ice-blue
 * field: soft-shaded near-white volumes, real soft shadows, distance haze that
 * dissolves into the background colour. No wireframes, no glow on the models.
 *
 * Getting this right is almost entirely about *value range*. Everything sits
 * between roughly 0.80 and 0.98 luminance, so form is described by very small
 * differences in shading plus the shadows underneath. That is why the lights
 * are strong and the ambient is warm-neutral rather than dark: a normal
 * three-point setup would crush this palette into flat grey.
 *
 * The single exception to the achromatic rule is the conduit, which is the one
 * element allowed to emit — and it emits above 1.0 so that bloom picks it up
 * while the near-white models, sitting below the bloom threshold, do not.
 */

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  ShaderMaterial,
  Uniform,
} from 'three'

/* -------------------------------------------------------------------------- */
/*  Palette — mirrors the CSS custom properties in styles/global.css           */
/* -------------------------------------------------------------------------- */

/**
 * Palette.
 *
 * The values are spread wider than they look, and deliberately so. On a
 * white-on-white subject the eye needs a real ladder of tones to read form, and
 * the tone curve in the grade pass compresses whatever it is given — so the
 * source values have to start further apart than the final image suggests.
 *
 * The ground is a distinctly cooler, deeper blue than the models. That
 * separation is what makes white structures sit *on* a surface rather than
 * dissolve into it, and it is the main reason the reference's models read as
 * physical objects.
 */
export const PALETTE = {
  /** Background / fog. Must track the CSS `--sky-*` field or the canvas edge
   *  becomes visible where the two meet. */
  sky: 0xdde8f3,
  skyFar: 0xd2e0ee,
  /** Ground: cooler and deeper than any model tone. */
  ground: 0xcfdeeb,
  /** District aprons: a step up from the ground, a step below the models. */
  plate: 0xdae6f1,
  /** Model whites, lightest to darkest. */
  shellLight: 0xffffff,
  shell: 0xf0f4f9,
  shellMid: 0xd2dce8,
  shellDark: 0xa9b8c9,
  ink: 0x0b0d18,
}

/* -------------------------------------------------------------------------- */
/*  Shared uniforms                                                            */
/* -------------------------------------------------------------------------- */

export const uTime = new Uniform(0)
export const uSpeed = new Uniform(0)
export const uProgress = new Uniform(0)

export function tickMaterials(elapsed: number, speed: number, progress: number): void {
  uTime.value = elapsed
  uSpeed.value = speed
  uProgress.value = progress
}

/* -------------------------------------------------------------------------- */
/*  Model shells                                                               */
/* -------------------------------------------------------------------------- */

/**
 * High roughness with a trace of sheen. A fully matte white loses its edges
 * against the sky at grazing angles; a little specular keeps the silhouettes
 * legible where a roof meets the background.
 */
const shell = (color: number, roughness = 0.82) =>
  new MeshStandardMaterial({
    color: new Color(color),
    roughness,
    metalness: 0,
    // Flat-shaded facets read as a physical model rather than a render.
    flatShading: false,
  })

/** Main body of every structure. */
export const matShell = shell(PALETTE.shell, 0.84)
/** Roofs, caps and upward-facing planes — catches the key light. */
export const matShellLight = shell(PALETTE.shellLight, 0.78)
/** Recesses, undersides, window bands. */
export const matShellMid = shell(PALETTE.shellMid, 0.88)
/** Deepest tone: openings, shadowed slots, tyres, machinery. */
export const matShellDark = shell(PALETTE.shellDark, 0.9)

/** Ground plate under each district — between the ground and the models. */
export const matPlate = shell(PALETTE.plate, 0.95)

/** The few genuinely dark details (figures, signage, apertures) that give the
 *  otherwise-white scene a sense of contrast, exactly as the reference does. */
export const matInk = new MeshStandardMaterial({
  color: new Color(0x2c3444),
  roughness: 0.6,
  metalness: 0,
})

/** Faceted glass for tower curtain walls. Non-transparent — a real transmissive
 *  material costs a second render pass for no visible gain at this scale. */
export const matGlass = new MeshStandardMaterial({
  color: new Color(0xcfdcea),
  roughness: 0.28,
  metalness: 0.1,
})

/* -------------------------------------------------------------------------- */
/*  Ground                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Pale ground that receives shadows and fades into the sky at the horizon.
 *
 * A plain MeshStandardMaterial would show a hard edge where the plane ends.
 * This one is a standard material with an injected radial fade, so shadows and
 * lighting still work while the boundary dissolves.
 */
export function makeGroundMaterial(size: number): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color(PALETTE.ground),
    roughness: 0.97,
    metalness: 0,
  })

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFadeSize = new Uniform(size * 0.5)

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGroundXy;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvGroundXy = position.xy;',
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vGroundXy;\nuniform float uFadeSize;',
      )
      // Fade the *output* rather than the albedo, so shadows fade out with it.
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float gEdge = 1.0 - smoothstep(0.42, 0.98, length(vGroundXy) / uFadeSize);
         gl_FragColor.rgb = mix(vec3(${((PALETTE.skyFar >> 16) & 255) / 255}, ${
           ((PALETTE.skyFar >> 8) & 255) / 255
         }, ${(PALETTE.skyFar & 255) / 255}), gl_FragColor.rgb, gEdge);`,
      )
  }

  return mat
}

/* -------------------------------------------------------------------------- */
/*  Conduit — the connective element, and the only emitter in the scene        */
/* -------------------------------------------------------------------------- */

/**
 * A tube that is invisible until its district is reached, then fills from the
 * core outward carrying travelling pulses.
 *
 * Values deliberately exceed 1.0 so the bloom pass — whose threshold sits above
 * the brightest model white — picks up the conduit and nothing else.
 */
export function makeConduitMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: {
      uTime,
      uSpeed,
      /** 0 = dark, 1 = fully wired. */
      uFill: new Uniform(0),
      uPulses: new Uniform(2.5),
      uGain: new Uniform(1),
      /** District accent, pushed toward white. Set per route in conduits.ts. */
      uTint: new Uniform(new Color(0xdcf0ff)),
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vFresnel;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vFresnel = 1.0 - abs(dot(normalize(-mv.xyz), n));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uFill;
      uniform float uPulses;
      uniform float uGain;
      uniform vec3 uTint;

      varying vec2 vUv;
      varying float vFresnel;

      void main() {
        // uv.x runs 0 at the core to 1 at the district.
        float along = vUv.x;

        // Fill sweeps outward with a soft leading edge, so it reads as energy
        // arriving rather than as a progress bar.
        float filled = 1.0 - smoothstep(uFill - 0.05, uFill + 0.03, along);

        // Travelling pulses, faster while the camera is moving.
        float rate = 0.30 + uSpeed * 0.5;
        float pulse = pow(1.0 - fract(along * uPulses - uTime * rate), 10.0);

        // Bright down the tube's spine, softer at the silhouette.
        float spine = 1.0 - smoothstep(0.0, 0.6, abs(vUv.y - 0.5) * 2.0);

        float v = filled * (0.34 * spine + 0.20 * vFresnel);
        v += filled * pulse * 1.5 * uGain;

        // Carries the district's accent so each route is identifiable, but
        // heavily desaturated — it has to read as light, not as a coloured pipe.
        gl_FragColor = vec4(uTint * v * 1.25, clamp(v * 1.4, 0.0, 1.0));
      }
    `,
  })
}

/* -------------------------------------------------------------------------- */
/*  Dot trail — the halftone field that runs beneath each conduit              */
/* -------------------------------------------------------------------------- */

/**
 * A grid of small flat discs on the ground under the conduit route, which
 * brighten in a wave as the fill passes over them.
 *
 * Rendered as one InstancedMesh with the wave computed per-instance in the
 * shader, so a few thousand discs cost a single draw call. `aAlong` is each
 * disc's position along the route, precomputed on the CPU.
 */
export function makeDotMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime,
      uFill: new Uniform(0),
      uColor: new Uniform(new Color(0x6fbfe4)),
    },
    vertexShader: /* glsl */ `
      attribute float aAlong;
      attribute float aJitter;
      uniform float uFill;
      uniform float uTime;
      varying float vGlow;

      void main() {
        // Only dots the fill has passed light up, with a bright crest at the
        // leading edge so the wave has a visible front.
        float passed = 1.0 - smoothstep(uFill - 0.02, uFill + 0.06, aAlong);
        float crest = exp(-pow((aAlong - uFill) * 26.0, 2.0));
        float shimmer = 0.75 + 0.25 * sin(uTime * 2.0 + aJitter * 30.0);

        vGlow = passed * 0.4 * shimmer + crest * 0.9;

        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vGlow;
      void main() {
        if (vGlow < 0.01) discard;
        gl_FragColor = vec4(uColor * vGlow * 1.4, vGlow * 0.85);
      }
    `,
  })
}

/* -------------------------------------------------------------------------- */
/*  Atmosphere                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Full-screen gradient behind everything, so the sky is a soft vertical wash
 * rather than a flat fill. Drawn as a fixed screen-space quad.
 */
export function makeSkyMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTop: new Uniform(new Color(PALETTE.skyFar)),
      uBottom: new Uniform(new Color(PALETTE.sky)),
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        // Already in clip space: this quad ignores the camera entirely.
        gl_Position = vec4(position.xy * 2.0, 0.999, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(mix(uTop, uBottom, smoothstep(0.0, 0.85, vUv.y)), 1.0);
      }
    `,
  })
}

export const SHARED_MATERIALS = [
  matShell,
  matShellLight,
  matShellMid,
  matShellDark,
  matPlate,
  matInk,
  matGlass,
]
