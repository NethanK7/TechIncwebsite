/**
 * Final grade pass, after tone mapping.
 *
 * Restrained on purpose. The look is a clean product render, not a filmic one,
 * so this does four small jobs and nothing else:
 *
 *   1. Caps saturation. Guarantees the palette stays achromatic-with-a-cool-cast
 *      no matter what a future material does. Enforcing it in a shader is a
 *      stronger guarantee than enforcing it by convention.
 *   2. A gentle lift-and-shoulder curve. On a near-white palette, contrast has to
 *      be added in the mids without clipping the whites, or every roof plane
 *      merges into one flat value.
 *   3. Ordered dither. Wide, very light gradients band badly on 8-bit displays,
 *      and a pale ice-blue sky is the worst case for it.
 *   4. A whisper of grain and a soft vignette, matched across the canvas and the
 *      DOM so they read as one surface.
 */

import { Vector2 } from 'three'

export const GradeShader = {
  name: 'GradeShader',

  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    /** 0→1 camera speed. Lifts grain very slightly while moving. */
    uSpeed: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uGrain: { value: 0.012 },
    uVignette: { value: 0.16 },
    /** Master fade for the intro reveal. */
    uFade: { value: 0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uFade;
    uniform vec2 uResolution;

    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    // 4x4 Bayer matrix. Cheapest effective fix for banding in pale gradients.
    float bayer(vec2 p) {
      int i = int(mod(p.y, 4.0)) * 4 + int(mod(p.x, 4.0));
      float m[16];
      m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
      m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
      m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
      m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
      return m[i] / 16.0 - 0.5;
    }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;

      // --- 1. Rein in saturation ---
      // Not a hard cap any more: the districts carry faint accents that need to
      // survive, and the conduits are tinted. Still pulled toward luma enough
      // that nothing can shout — the scene is a white model with colour on the
      // ground, not a coloured scene.
      float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(lum), c, 0.82);

      // --- 2. Lift and shoulder ---
      // Contrast in the mids only. A straight contrast multiply would clip the
      // roof highlights, which are already close to 1.0.
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
      c = (c - 0.5) * 1.045 + 0.5;

      // --- 3. Vignette ---
      vec2 q = vUv - 0.5;
      q.x *= uResolution.x / max(uResolution.y, 1.0);
      float vig = 1.0 - smoothstep(0.42, 1.05, length(q) * 1.1);
      c *= mix(1.0, vig, uVignette);

      // --- 4. Grain, dither, fade ---
      vec2 gp = vUv * uResolution;
      c += (hash(gp + fract(uTime) * 137.0) - 0.5) * uGrain * (1.0 + uSpeed * 0.6);
      c += bayer(gp) * (1.5 / 255.0);

      // Fade up from the sky colour rather than from black, so the reveal is a
      // dissolve into the page instead of a flash.
      vec3 sky = vec3(0.867, 0.910, 0.953);
      c = mix(sky, c, clamp(uFade, 0.0, 1.0));

      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
}
