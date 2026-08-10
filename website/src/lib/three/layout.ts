/**
 * World layout and camera flight path.
 *
 * The world is a white architectural model of a working site, seen from above at
 * a consistent downward angle — the "table-top model" framing that makes the 3D
 * read as a designed object rather than a game level.
 *
 * The world tells the story in five beats:
 *
 *   01 BEFORE       a DERELICT YARD to the north-west — a business with no
 *                   system at all: off-grid, unlit, unwired, nobody walking
 *   02 DEPARTMENTS  six DISTRICTS ringing the core, each a recognisable kind of
 *                   company — construction, warehousing, manufacturing,
 *                   accounts, sales, people — each tinted, each still separate
 *   03 THE CORE     the monolith at world origin: Frappe, one database
 *   04 WIRING       the conduits light in sequence, one department at a time
 *   05 AFTER        the same city as beat 02, seen from above, fully connected
 *
 * An ASCENT beyond the ring carries the five NXTGEN phases, visible from the
 * final overhead.
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
  /** Which camera stage frames this district. Two districts share each stage. */
  stage: string
  at: Vector3
  /** Footprint radius for prop scatter. */
  radius: number
  seed: number
  /** Prop mix, resolved against the library in city.ts. */
  mix: { prop: string; count: number }[]
  /** Height the conduit terminates at. */
  anchorHeight: number
  /**
   * Faint district tint, applied to the ground apron and the conduit.
   *
   * Deliberately barely-there, around 10% saturation. Enough that the eye reads
   * the districts as distinct places, not enough to break the white-model look.
   */
  accent: number
  /** How many people walk this district. */
  crowd: number
}

export const CORE = { at: new Vector3(0, 0, 0), height: 46 }

export const DISTRICTS: District[] = [
  {
    key: 'construction',
    label: 'Construction & Projects',
    stage: 'departments',
    at: new Vector3(-196, 0, 52),
    radius: 46,
    seed: 6449,
    anchorHeight: 15,
    accent: 0xecdcc9, // terracotta — work in progress
    crowd: 22,
    mix: [
      { prop: 'crane', count: 3 },
      { prop: 'scaffoldFrame', count: 3 },
      { prop: 'siteHuts', count: 4 },
      { prop: 'containerStack', count: 2 },
      { prop: 'palletYard', count: 2 },
    ],
  },
  {
    key: 'warehousing',
    label: 'Warehousing & Distribution',
    stage: 'departments',
    at: new Vector3(96, 0, -150),
    radius: 50,
    seed: 3163,
    anchorHeight: 13,
    accent: 0xd2e2ca, // sage — movement and flow
    crowd: 20,
    mix: [
      { prop: 'warehouse', count: 3 },
      { prop: 'containerStack', count: 5 },
      { prop: 'rackRow', count: 4 },
      { prop: 'gantryCrane', count: 2 },
      { prop: 'palletYard', count: 3 },
    ],
  },
  {
    key: 'manufacturing',
    label: 'Manufacturing',
    stage: 'departments',
    at: new Vector3(-78, 0, -168),
    radius: 52,
    seed: 2087,
    anchorHeight: 14,
    accent: 0xe6d9c2, // warm sand — heat and process
    crowd: 24,
    mix: [
      { prop: 'sawtoothFactory', count: 3 },
      { prop: 'coolingTower', count: 2 },
      { prop: 'chimney', count: 3 },
      { prop: 'siloCluster', count: 2 },
      { prop: 'tank', count: 3 },
      { prop: 'pipeRack', count: 3 },
      { prop: 'conveyor', count: 2 },
    ],
  },
  {
    key: 'accounts',
    label: 'Finance & Accounts',
    stage: 'departments',
    at: new Vector3(188, 0, 18),
    radius: 44,
    seed: 1041,
    anchorHeight: 16,
    accent: 0xcfdfeb, // cool blue — the ledger
    crowd: 18,
    mix: [
      { prop: 'vaultBlock', count: 1 },
      { prop: 'landmarkTower', count: 1 },
      { prop: 'officeTower', count: 8 },
      { prop: 'plaza', count: 1 },
      { prop: 'tree', count: 16 },
    ],
  },
  {
    key: 'sales',
    label: 'Sales & CRM',
    stage: 'departments',
    at: new Vector3(152, 0, 168),
    radius: 42,
    seed: 4271,
    anchorHeight: 17,
    accent: 0xdfd7ec, // violet — the pipeline
    crowd: 24,
    mix: [
      { prop: 'landmarkTower', count: 2 },
      { prop: 'officeTower', count: 8 },
      { prop: 'cabinetRow', count: 2 },
      { prop: 'plaza', count: 1 },
      { prop: 'solarField', count: 1 },
      { prop: 'tree', count: 14 },
    ],
  },
  {
    key: 'people',
    label: 'HR & Payroll',
    stage: 'departments',
    at: new Vector3(-58, 0, 182),
    radius: 46,
    seed: 5393,
    anchorHeight: 12,
    accent: 0xcde5e2, // teal — people
    crowd: 34,
    mix: [
      { prop: 'campusBlock', count: 2 },
      { prop: 'officeTower', count: 4 },
      { prop: 'plaza', count: 2 },
      { prop: 'solarField', count: 1 },
      { prop: 'tree', count: 26 },
    ],
  },
]

/**
 * The derelict yard: the same prop library, deliberately mis-organised.
 * Scattered off-grid, unwired, and — pointedly — nobody walking in it.
 */
export const DERELICT = {
  at: new Vector3(-306, 0, -268),
  radius: 62,
  seed: 7717,
  mix: [
    { prop: 'warehouse', count: 2 },
    { prop: 'officeTower', count: 3 },
    { prop: 'siloCluster', count: 1 },
    { prop: 'containerStack', count: 2 },
    { prop: 'siteHuts', count: 2 },
  ],
}

/** Five platforms climbing away to the south-east — the NXTGEN phases. */
export const ASCENT = {
  start: new Vector3(258, 3, 200),
  step: new Vector3(26, 19, 46),
  count: 5,
  size: 38,
}

export const GROUND_SIZE = 3000

/** Unique stage keys that own at least one district, in flight order. */
export const DISTRICT_STAGES = [...new Set(DISTRICTS.map((d) => d.stage))]

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
 * One keyframe per scroll stage: six frames, being the hero plus five stages.
 *
 * The two district stops each sit back far enough to hold *both* districts of
 * their pair in frame, aimed at the midpoint between them. Each is offset
 * perpendicular to the conduit routes — a camera sitting on a route flies
 * through the tube and fills the frame with a white bar.
 */
export const KEYFRAMES: Keyframe[] = [
  // 00 — establishing. Whole site, model low in frame so the headline owns the
  // upper half.
  { key: 'origin', pos: [262, 300, 412], look: [0, 96, 0], fov: 38 },

  // 01 — BEFORE. Down among the derelict yard: off-grid, unlit, unwired.
  { key: 'problem', pos: [-222, 74, -178], look: [-306, 10, -268], fov: 44 },

  // 02 — DEPARTMENTS. High and wide over the whole ring, so all six read at
  // once as separate, tinted, unconnected places. The core is deliberately not
  // the subject yet.
  { key: 'departments', pos: [-16, 330, 396], look: [-4, 6, 6], fov: 40 },

  // 03 — THE CORE. Drop onto the monolith at close range.
  { key: 'core', pos: [84, 76, 94], look: [0, 22, 0], fov: 40 },

  // 04 — WIRING. Pull back to mid-height on the opposite side, where the
  // conduits leaving the core are the dominant shape in frame.
  { key: 'connected', pos: [-104, 158, -66], look: [40, 10, 40], fov: 46 },

  // 05 — AFTER. A true overhead: the same city as stage 02, now fully lit.
  { key: 'unified', pos: [96, 392, 356], look: [-8, 0, 24], fov: 34 },
]

export const STAGE_KEYS = KEYFRAMES.map((k) => k.key)
export const STAGE_COUNT = KEYFRAMES.length

/* -------------------------------------------------------------------------- */
/*  Curves                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * `centripetal` parameterisation matters here. The keyframes are unevenly
 * spaced — the climb to the 392-unit overhead is several times a district hop —
 * and uniform Catmull-Rom overshoots badly on uneven spacing, which would swing
 * the camera through the ground.
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
 * The curve is sampled with `getPoint(u)`, not `getPointAt(u)`. `getPointAt`
 * normalises by arc length, giving constant camera *speed* — which would mean
 * each stage of copy covered a different amount of the story. `getPoint` gives
 * every segment an equal share of u, so one stage of scroll is always exactly
 * one stage of narrative, and speed varies instead. That varying speed is what
 * makes the long moves feel like flight.
 */
export function stageAt(progress: number): { index: number; local: number } {
  const span = 1 / (STAGE_COUNT - 1)
  const raw = Math.max(0, Math.min(0.999999, progress)) / span
  const index = Math.floor(raw)
  return { index, local: raw - index }
}

/**
 * Which keyframe's *copy* should be showing — which is not the same question as
 * which curve segment the camera is on.
 *
 * `stageAt` answers the camera's question: six keyframes make five segments, so
 * it returns 0–4 and the final keyframe is only ever a segment's endpoint. Used
 * for the copy that would mean the last beat never becomes current — you would
 * reach the closing overhead with the previous stage still highlighted.
 *
 * The narrative question is "which keyframe am I at", so this rounds to the
 * nearest one. Every beat gets an equal share of the scroll, including the last.
 */
export function narrativeStage(progress: number): number {
  const p = Math.max(0, Math.min(1, progress))
  return Math.round(p * (STAGE_COUNT - 1))
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
 * Keyed on the district's *stage*, not its own name, so both districts in a pair
 * light together — which is exactly the point being made: Buying, Manufacturing
 * and Stock are one flow, not three separate features.
 *
 * Lighting starts slightly before arrival so the pulse leads the viewer in, and
 * once lit a conduit stays lit — so by the overhead the whole network is glowing
 * at once, which is the payoff the copy promises.
 */
export const WIRING_STAGE = 'connected'

/**
 * How lit district `index` of `total` should be at this progress, 0→1.
 *
 * All six conduits belong to the wiring stage, but they light *in sequence*
 * across it rather than together — you watch the departments join one at a time,
 * which is the beat the copy is describing. Each gets its own slice of the stage
 * with a slight overlap, so the wiring reads as a continuous sweep rather than
 * six separate switches.
 *
 * Lighting begins a little before the camera arrives, so the first pulse leads
 * the viewer in; and once lit a conduit stays lit, so by the final overhead the
 * whole network is glowing at once. That is the payoff the last stage promises.
 */
export function conduitLevel(index: number, total: number, progress: number): number {
  const stageIndex = STAGE_KEYS.indexOf(WIRING_STAGE)
  if (stageIndex < 0) return 0

  const span = 1 / (STAGE_COUNT - 1)
  // Begin just before the stage starts; finish just before it ends.
  const stageStart = (stageIndex - 0.85) * span
  const stageEnd = (stageIndex - 0.05) * span

  const slice = (stageEnd - stageStart) / total
  const from = stageStart + slice * index
  // 1.9 slices each, so consecutive districts overlap and the sweep is smooth.
  const to = from + slice * 1.9

  if (progress <= from) return 0
  if (progress >= to) return 1
  return (progress - from) / (to - from)
}
