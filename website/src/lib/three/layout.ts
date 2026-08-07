/**
 * World layout and camera flight path.
 *
 * The world is a white architectural model of a working site, seen from above
 * at a consistent 28–34° downward angle — the "table-top model" framing the
 * reference uses, and the reason its 3D reads as a designed object rather than
 * as a game level.
 *
 * The narrative the layout encodes:
 *
 *   · a DERELICT YARD out to the north-west — disconnected systems, unwired
 *   · the CORE at world origin — the Frappe platform
 *   · six DISTRICTS ringing the core, one per ERP module, each wired to it
 *   · an ASCENT to the south-east — the five NXTGEN phases, climbing
 *
 * KEYFRAMES is the single source of truth for the flight. Its length and order
 * must match the stage list rendered by components/sections/Journey.astro.
 */

import { CatmullRomCurve3, Vector3 } from 'three'

/* -------------------------------------------------------------------------- */
/*  Places                                                                     */
/* -------------------------------------------------------------------------- */

export interface District {
  key: string
  label: string
  at: Vector3
  /** Footprint radius for prop scatter. */
  radius: number
  seed: number
  /** Prop mix, by name. Resolved against the prop library in city.ts. */
  mix: { prop: string; count: number }[]
  /** Height the conduit terminates at. */
  anchorHeight: number
}

export const CORE = { at: new Vector3(0, 0, 0), height: 46 }

/**
 * Six districts on an irregular ring at radius ~160. Irregular on purpose: an
 * even hexagon reads as a diagram, and the whole point is that this looks like
 * a place.
 *
 * Each mix is chosen so the district is identifiable from the air — you should
 * be able to tell the factory from the distribution yard without reading a word.
 */
export const DISTRICTS: District[] = [
  {
    key: 'finance',
    label: 'Finance & Accounting',
    at: new Vector3(-128, 0, -48),
    radius: 42,
    seed: 1041,
    anchorHeight: 16,
    mix: [
      { prop: 'vaultBlock', count: 1 },
      { prop: 'landmarkTower', count: 1 },
      { prop: 'officeTower', count: 9 },
      { prop: 'plaza', count: 1 },
      { prop: 'tree', count: 16 },
      { prop: 'figure', count: 11 },
    ],
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
    at: new Vector3(24, 0, -150),
    radius: 50,
    seed: 2087,
    anchorHeight: 14,
    mix: [
      { prop: 'sawtoothFactory', count: 3 },
      { prop: 'coolingTower', count: 2 },
      { prop: 'chimney', count: 3 },
      { prop: 'siloCluster', count: 2 },
      { prop: 'tank', count: 4 },
      { prop: 'truck', count: 3 },
      { prop: 'figure', count: 14 },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory & Distribution',
    at: new Vector3(158, 0, -37),
    radius: 48,
    seed: 3163,
    anchorHeight: 13,
    mix: [
      { prop: 'warehouse', count: 3 },
      { prop: 'containerStack', count: 5 },
      { prop: 'rackRow', count: 5 },
      { prop: 'truck', count: 5 },
      { prop: 'figure', count: 14 },
    ],
  },
  {
    key: 'crm',
    label: 'CRM & Sales',
    at: new Vector3(126, 0, 103),
    radius: 40,
    seed: 4271,
    anchorHeight: 17,
    mix: [
      { prop: 'landmarkTower', count: 2 },
      { prop: 'officeTower', count: 9 },
      { prop: 'cabinetRow', count: 2 },
      { prop: 'plaza', count: 1 },
      { prop: 'tree', count: 14 },
      { prop: 'figure', count: 15 },
    ],
  },
  {
    key: 'hr',
    label: 'HRMS & Payroll',
    at: new Vector3(-24, 0, 158),
    radius: 44,
    seed: 5393,
    anchorHeight: 12,
    mix: [
      { prop: 'campusBlock', count: 2 },
      { prop: 'officeTower', count: 5 },
      { prop: 'plaza', count: 2 },
      { prop: 'tree', count: 26 },
      { prop: 'figure', count: 22 },
    ],
  },
  {
    key: 'projects',
    label: 'Projects & Services',
    at: new Vector3(-145, 0, 82),
    radius: 42,
    seed: 6449,
    anchorHeight: 15,
    mix: [
      { prop: 'crane', count: 2 },
      { prop: 'siteHuts', count: 4 },
      { prop: 'officeTower', count: 5 },
      { prop: 'containerStack', count: 2 },
      { prop: 'truck', count: 2 },
      { prop: 'figure', count: 14 },
    ],
  },
]

/**
 * The derelict yard: the same kinds of structures as the city, but scattered,
 * rotated off-axis, unlit and unwired. Deliberately built from the *same* prop
 * library so the contrast is organisational rather than stylistic — the point is
 * that these are the same departments, just not connected.
 */
export const DERELICT = {
  at: new Vector3(-300, 0, -260),
  radius: 60,
  seed: 7717,
  mix: [
    { prop: 'warehouse', count: 2 },
    { prop: 'officeTower', count: 3 },
    { prop: 'siloCluster', count: 1 },
    { prop: 'containerStack', count: 2 },
    { prop: 'siteHuts', count: 2 },
    { prop: 'figure', count: 5 },
  ],
}

/** Five platforms climbing away to the south-east — the NXTGEN phases. */
export const ASCENT = {
  start: new Vector3(250, 3, 190),
  step: new Vector3(26, 19, 46),
  count: 5,
  size: 38,
}

export const GROUND_SIZE = 3000

/* -------------------------------------------------------------------------- */
/*  Camera keyframes                                                           */
/* -------------------------------------------------------------------------- */

export interface Keyframe {
  key: string
  pos: [number, number, number]
  look: [number, number, number]
  fov?: number
}

/**
 * One keyframe per scroll stage.
 *
 * Every district shot places the camera between the core and that district,
 * looking outward — so its conduit runs away from the viewer into the buildings
 * and leads the eye where the copy is pointing.
 *
 * The hero shot aims *above* the city centre on purpose: that pushes the model
 * into the lower half of the frame and leaves the upper half clear for the
 * headline, which is exactly how the reference composes its hero.
 */
export const KEYFRAMES: Keyframe[] = [
  // 00 — establishing. Aimed well above the site so the model settles into the
  // lower half of the frame and the headline owns the upper half.
  { key: 'origin', pos: [250, 285, 400], look: [0, 90, 0], fov: 38 },

  // 01 — the derelict yard.
  { key: 'problem', pos: [-218, 82, -168], look: [-300, 12, -260], fov: 44 },

  // 02 — the core.
  { key: 'core', pos: [82, 84, 92], look: [0, 18, 0], fov: 40 },

  // 03..08 — one pass per district.
  //
  // All six sit 108 units out and 76 up, giving a steady ~31 degree look-down
  // across the whole sequence. That consistency is what makes the flight read as
  // authored rather than wandering.
  //
  // Each is offset *perpendicular* to the core-to-district axis, never on it:
  // the conduit runs along that axis, so a camera on the line flies through the
  // tube and fills the frame with a white bar.
  { key: 'finance', pos: [-21, 76, -63], look: [-128, 12, -48], fov: 42 },
  { key: 'manufacturing', pos: [60, 76, -48], look: [24, 12, -150], fov: 44 },
  { key: 'inventory', pos: [78, 76, 35], look: [158, 12, -37], fov: 42 },
  { key: 'crm', pos: [20, 76, 83], look: [126, 14, 103], fov: 42 },
  { key: 'hr', pos: [-61, 76, 56], look: [-24, 10, 158], fov: 44 },
  { key: 'projects', pos: [-88, 76, -10], look: [-145, 14, 82], fov: 42 },

  // 09 — a true overhead: the whole wired network at once.
  { key: 'unified', pos: [95, 360, 340], look: [0, 0, 0], fov: 34 },

  // 10 — down onto the ascent, looking along the climb.
  { key: 'methodology', pos: [242, 137, 400], look: [302, 40, 282], fov: 42 },
]

export const STAGE_KEYS = KEYFRAMES.map((k) => k.key)
export const STAGE_COUNT = KEYFRAMES.length

/* -------------------------------------------------------------------------- */
/*  Curves                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `centripetal` parameterisation matters here. Our keyframes are very unevenly
 * spaced — the climb from a district shot up to the 336-unit overhead is many
 * times a district-to-district hop — and uniform Catmull-Rom overshoots badly on
 * uneven spacing, which would swing the camera through the ground.
 */
export function buildCameraCurves(): { path: CatmullRomCurve3; lookAt: CatmullRomCurve3 } {
  return {
    path: new CatmullRomCurve3(
      KEYFRAMES.map((k) => new Vector3(...k.pos)),
      false,
      'centripetal',
      0.5,
    ),
    lookAt: new CatmullRomCurve3(
      KEYFRAMES.map((k) => new Vector3(...k.look)),
      false,
      'centripetal',
      0.5,
    ),
  }
}

/**
 * Which stage a progress value sits in, and how far through it.
 *
 * We sample the curve with `getPoint(u)`, not `getPointAt(u)`. `getPointAt`
 * normalises by arc length, giving constant camera *speed* — which would mean
 * each stage of copy covered a different amount of the story. `getPoint` gives
 * every keyframe segment an equal share of u, so one stage of scroll is always
 * exactly one stage of narrative, and speed varies instead. The varying speed is
 * what makes the long moves feel like flight.
 */
export function stageAt(progress: number): { index: number; local: number } {
  const span = 1 / (STAGE_COUNT - 1)
  const raw = Math.max(0, Math.min(0.999999, progress)) / span
  const index = Math.floor(raw)
  return { index, local: raw - index }
}

export function fovAt(progress: number): number {
  const { index, local } = stageAt(progress)
  const a = KEYFRAMES[index]?.fov ?? 38
  const b = KEYFRAMES[Math.min(index + 1, STAGE_COUNT - 1)]?.fov ?? a
  return a + (b - a) * local
}

/**
 * How lit a district's conduit should be at this progress, 0→1.
 *
 * Lighting starts slightly *before* the camera arrives so the pulse leads the
 * viewer in, and once lit a conduit stays lit — so by the overhead stage the
 * entire network is glowing at once, which is the payoff the copy promises.
 */
export function conduitLevel(districtKey: string, progress: number): number {
  const i = STAGE_KEYS.indexOf(districtKey)
  if (i < 0) return 0
  const span = 1 / (STAGE_COUNT - 1)
  const from = (i - 0.9) * span
  const to = (i - 0.05) * span
  if (progress <= from) return 0
  if (progress >= to) return 1
  return (progress - from) / (to - from)
}
