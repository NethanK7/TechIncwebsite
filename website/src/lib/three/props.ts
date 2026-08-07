/**
 * Procedural prop library.
 *
 * Each builder returns a flat list of geometry pieces tagged with a material
 * key, positioned in its own local space with its base at y = 0. The district
 * builder then stamps a prop into the world with a matrix and merges every
 * piece by material key — so a district of forty structures costs about six
 * draw calls instead of four hundred.
 *
 * That pipeline is why these can be as detailed as they are: window bands, roof
 * plant, blade assemblies and railings are all free once merged, because the
 * cost is vertices in one buffer rather than objects in the scene graph.
 *
 * Props are recognisable objects rather than abstract blocks, and each district
 * gets a mix appropriate to its ERP module — a factory district has sawtooth
 * sheds, silos and chimneys; a distribution district has containers, racking
 * and loading bays. The world is legible as a working site.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  LatheGeometry,
  Matrix4,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three'

import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import type { Rng } from './rng'

export type MatKey = 'shell' | 'light' | 'mid' | 'dark' | 'glass' | 'ink' | 'plate'

export interface Piece {
  geo: BufferGeometry
  mat: MatKey
}

export type Prop = (r: Rng) => Piece[]

/* -------------------------------------------------------------------------- */
/*  Primitive helpers                                                          */
/* -------------------------------------------------------------------------- */

/** Axis-aligned box, positioned by its centre. */
function box(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: MatKey,
): Piece {
  const geo = new BoxGeometry(w, h, d)
  geo.translate(x, y, z)
  return { geo, mat }
}

function cyl(
  rt: number,
  rb: number,
  h: number,
  x: number,
  y: number,
  z: number,
  mat: MatKey,
  seg = 16,
): Piece {
  const geo = new CylinderGeometry(rt, rb, h, seg)
  geo.translate(x, y, z)
  return { geo, mat }
}

function cone(r: number, h: number, x: number, y: number, z: number, mat: MatKey, seg = 16): Piece {
  const geo = new ConeGeometry(r, h, seg)
  geo.translate(x, y, z)
  return { geo, mat }
}

function sphere(r: number, x: number, y: number, z: number, mat: MatKey, seg = 12): Piece {
  const geo = new SphereGeometry(r, seg, Math.max(6, seg / 2))
  geo.translate(x, y, z)
  return { geo, mat }
}

/** Rotate a piece in place about its own origin, then translate. */
function xform(p: Piece, m: Matrix4): Piece {
  p.geo.applyMatrix4(m)
  return p
}

const rotX = (a: number) => new Matrix4().makeRotationX(a)
const rotY = (a: number) => new Matrix4().makeRotationY(a)
const rotZ = (a: number) => new Matrix4().makeRotationZ(a)
const move = (x: number, y: number, z: number) => new Matrix4().makeTranslation(x, y, z)

/**
 * Horizontal window bands up a facade.
 *
 * Thin inset boxes on all four sides. This one detail does more than any other
 * to make a plain box read as an occupied building, and because it merges into
 * the same buffer it is effectively free.
 */
function windowBands(
  w: number,
  h: number,
  d: number,
  floors: number,
  mat: MatKey = 'mid',
): Piece[] {
  const out: Piece[] = []
  const gap = h / (floors + 1)
  const band = Math.min(gap * 0.42, 1.1)
  for (let i = 1; i <= floors; i++) {
    const y = gap * i
    // Slightly wider than the shell so it cuts a visible groove.
    out.push(box(w * 1.01, band, d * 0.86, 0, y, 0, mat))
    out.push(box(w * 0.86, band, d * 1.01, 0, y, 0, mat))
  }
  return out
}

/** Rooftop plant: a few small blocks and a vent stack. */
function roofPlant(r: Rng, w: number, d: number, top: number): Piece[] {
  const out: Piece[] = []
  const n = r.int(1, 3)
  for (let i = 0; i < n; i++) {
    const bw = r.range(w * 0.14, w * 0.3)
    const bh = r.range(0.8, 2.4)
    out.push(
      box(
        bw,
        bh,
        bw * r.range(0.7, 1.3),
        r.range(-w * 0.28, w * 0.28),
        top + bh / 2,
        r.range(-d * 0.28, d * 0.28),
        'light',
      ),
    )
  }
  if (r.chance(0.5)) {
    const sh = r.range(2, 5)
    out.push(cyl(0.3, 0.35, sh, r.range(-w * 0.2, w * 0.2), top + sh / 2, r.range(-d * 0.2, d * 0.2), 'mid', 10))
  }
  return out
}

/** Perimeter parapet, so roofs have a lip and catch a shadow line. */
function parapet(w: number, d: number, top: number, t = 0.4, h = 0.7): Piece[] {
  return [
    box(w, h, t, 0, top + h / 2, d / 2 - t / 2, 'light'),
    box(w, h, t, 0, top + h / 2, -d / 2 + t / 2, 'light'),
    box(t, h, d, w / 2 - t / 2, top + h / 2, 0, 'light'),
    box(t, h, d, -w / 2 + t / 2, top + h / 2, 0, 'light'),
  ]
}

/* -------------------------------------------------------------------------- */
/*  Buildings                                                                  */
/* -------------------------------------------------------------------------- */

/** Mid-rise office block with setbacks and banded facades. */
export const officeTower =
  (minH = 14, maxH = 42): Prop =>
  (r) => {
    const out: Piece[] = []
    const w = r.range(9, 15)
    const d = w * r.range(0.75, 1.25)
    const total = r.power(minH, maxH, 1.5)

    // Two or three stacked volumes, each stepping in. Setbacks are what give a
    // procedural tower a silhouette instead of a profile.
    const tiers = r.int(2, 3)
    let y = 0
    let cw = w
    let cd = d
    for (let i = 0; i < tiers; i++) {
      const th = i === tiers - 1 ? total - y : total * r.range(0.3, 0.5)
      const floors = Math.max(2, Math.round(th / 3.2))
      out.push(box(cw, th, cd, 0, y + th / 2, 0, 'shell'))
      windowBands(cw, th, cd, floors, 'mid').forEach((p) => out.push(xform(p, move(0, y, 0))))
      y += th
      out.push(...parapet(cw, cd, y))
      cw *= r.range(0.72, 0.86)
      cd *= r.range(0.72, 0.86)
    }
    out.push(...roofPlant(r, cw, cd, y))

    // Ground-floor glazing, recessed.
    out.push(box(w * 0.9, 3.4, d * 0.9, 0, 1.7, 0, 'glass'))
    return out
  }

/** Slender glass tower — the signature landmark of a district. */
export const landmarkTower =
  (h = 56): Prop =>
  (r) => {
    const out: Piece[] = []
    const w = r.range(10, 13)
    const d = w * r.range(0.85, 1.1)
    const total = h * r.range(0.9, 1.1)

    out.push(box(w, total, d, 0, total / 2, 0, 'shell'))
    // Vertical mullion fins rather than horizontal bands: reads as a curtain
    // wall and distinguishes the landmark from the ordinary blocks around it.
    const fins = 7
    for (let i = 0; i < fins; i++) {
      const t = (i / (fins - 1) - 0.5) * w * 0.92
      out.push(box(0.4, total * 0.97, d * 1.01, t, total / 2, 0, 'mid'))
    }
    out.push(box(w * 1.03, total * 0.94, d * 0.9, 0, total / 2, 0, 'glass'))
    out.push(...parapet(w, d, total, 0.5, 1.2))

    // Crown: a stepped cap and a mast.
    out.push(box(w * 0.6, 2.4, d * 0.6, 0, total + 1.2, 0, 'light'))
    out.push(cyl(0.18, 0.28, 9, 0, total + 7, 0, 'mid', 8))
    return out
  }

/** Bank / finance block: colonnade and a heavy cornice. */
export const vaultBlock: Prop = (r) => {
  const out: Piece[] = []
  const w = r.range(16, 22)
  const d = r.range(12, 17)
  const h = r.range(11, 15)

  out.push(box(w, h, d, 0, h / 2, 0, 'shell'))
  out.push(...windowBands(w, h, d, 3, 'mid'))
  // Cornice, stepped twice.
  out.push(box(w * 1.06, 0.9, d * 1.06, 0, h + 0.45, 0, 'light'))
  out.push(box(w * 0.98, 0.7, d * 0.98, 0, h + 1.25, 0, 'light'))

  // Portico: a run of columns on the front face under a pediment.
  const cols = 6
  const step = (w * 0.78) / (cols - 1)
  for (let i = 0; i < cols; i++) {
    const x = -w * 0.39 + step * i
    out.push(cyl(0.62, 0.62, h * 0.72, x, (h * 0.72) / 2, d / 2 + 1.8, 'light', 12))
  }
  out.push(box(w * 0.9, 1.1, 4.4, 0, h * 0.72 + 0.55, d / 2 + 1.8, 'light'))
  // Steps.
  for (let i = 0; i < 3; i++) {
    out.push(box(w * 0.92 - i * 0.6, 0.45, 5.6 - i * 0.9, 0, 0.22 + i * 0.45, d / 2 + 2.6, 'light'))
  }
  return out
}

/** Warehouse / distribution shed with a barrel roof and loading bays. */
export const warehouse: Prop = (r) => {
  const out: Piece[] = []
  const w = r.range(22, 38)
  const d = r.range(14, 22)
  const h = r.range(7, 10)

  out.push(box(w, h, d, 0, h / 2, 0, 'shell'))

  // Barrel roof from a half-cylinder, laid on its side.
  const roof = new CylinderGeometry(d * 0.52, d * 0.52, w, 20, 1, false, 0, Math.PI)
  roof.applyMatrix4(rotZ(Math.PI / 2))
  roof.applyMatrix4(rotY(Math.PI / 2))
  roof.translate(0, h, 0)
  out.push({ geo: roof, mat: 'light' })

  // Loading bays along the long face: recessed doors plus a dock apron.
  const bays = r.int(3, 6)
  const step = (w * 0.8) / bays
  for (let i = 0; i < bays; i++) {
    const x = -w * 0.4 + step * (i + 0.5)
    out.push(box(step * 0.62, h * 0.6, 0.5, x, h * 0.3, d / 2, 'dark'))
    out.push(box(step * 0.72, 0.4, 2.6, x, 0.9, d / 2 + 1.3, 'mid'))
  }
  return out
}

/** Factory shed with a sawtooth north-light roof. */
export const sawtoothFactory: Prop = (r) => {
  const out: Piece[] = []
  const w = r.range(26, 40)
  const d = r.range(18, 26)
  const h = r.range(8, 11)

  out.push(box(w, h, d, 0, h / 2, 0, 'shell'))

  // Sawtooth: alternating vertical glazing and sloped roof panes.
  const teeth = r.int(4, 6)
  const tw = w / teeth
  for (let i = 0; i < teeth; i++) {
    const x = -w / 2 + tw * (i + 0.5)
    const rise = tw * 0.55
    out.push(box(tw * 0.98, rise, d, x, h + rise / 2, 0, 'glass'))
    const pane = new BoxGeometry(tw * 1.02, 0.35, d * 1.02)
    pane.applyMatrix4(rotZ(Math.atan2(rise, tw)))
    pane.translate(x, h + rise * 0.72, 0)
    out.push({ geo: pane, mat: 'light' })
  }

  // Extract ducts on the flank.
  for (let i = 0; i < r.int(1, 3); i++) {
    const dh = r.range(5, 11)
    const x = r.range(-w * 0.35, w * 0.35)
    out.push(cyl(1.0, 1.15, dh, x, h + dh / 2, -d / 2 - 1.4, 'mid', 12))
    out.push(cyl(1.25, 1.25, 0.6, x, h + dh, -d / 2 - 1.4, 'light', 12))
  }
  return out
}

/** Cooling towers — the hyperboloid silhouette, built as a lathe. */
export const coolingTower: Prop = (r) => {
  const out: Piece[] = []
  const h = r.range(20, 30)
  const base = h * 0.30
  const waist = h * 0.19
  const lip = h * 0.23

  // Hyperboloid profile: wide base, pinched waist, flaring rim.
  const pts: Vector2[] = []
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // cosh-like curve gives the true cooling-tower profile.
    const rad = waist + (base - waist) * Math.pow(1 - t, 2.1) + (lip - waist) * Math.pow(t, 2.6)
    pts.push(new Vector2(rad, t * h))
  }
  const shellGeo = new LatheGeometry(pts, 28)
  out.push({ geo: shellGeo, mat: 'shell' })

  // Rim ring and the internal shadow of the opening.
  const ring = new TorusGeometry(lip, 0.4, 8, 28)
  ring.applyMatrix4(rotX(Math.PI / 2))
  ring.translate(0, h, 0)
  out.push({ geo: ring, mat: 'light' })
  const cap = new CircleGeometry(lip * 0.94, 28)
  cap.applyMatrix4(rotX(Math.PI / 2))
  cap.translate(0, h - 1.6, 0)
  out.push({ geo: cap, mat: 'dark' })

  // Air-intake legs around the base.
  const legs = 14
  for (let i = 0; i < legs; i++) {
    const a = (i / legs) * Math.PI * 2
    const lr = base * 0.96
    out.push(
      cyl(0.42, 0.42, base * 0.34, Math.cos(a) * lr, (base * 0.34) / 2, Math.sin(a) * lr, 'mid', 6),
    )
  }
  return out
}

/** Silo cluster with conical caps and a linking gantry. */
export const siloCluster: Prop = (r) => {
  const out: Piece[] = []
  const n = r.int(3, 5)
  const rad = r.range(2.4, 3.6)
  const h = r.range(14, 22)
  const pitch = rad * 2.25

  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * pitch
    out.push(cyl(rad, rad, h, x, h / 2, 0, 'shell', 18))
    out.push(cone(rad * 1.06, rad * 1.1, x, h + rad * 0.55, 0, 'light', 18))
    // Banding rings, which is what makes a cylinder read as a silo.
    for (let b = 1; b <= 3; b++) {
      const ring = new TorusGeometry(rad * 1.02, 0.16, 6, 18)
      ring.applyMatrix4(rotX(Math.PI / 2))
      ring.translate(x, (h / 4) * b, 0)
      out.push({ geo: ring, mat: 'mid' })
    }
  }
  // Gantry across the tops.
  const span = pitch * (n - 1) + rad * 2
  out.push(box(span, 0.9, 1.8, 0, h + rad * 1.3, 0, 'mid'))
  out.push(box(span, 0.25, 2.4, 0, h + rad * 1.9, 0, 'light'))
  return out
}

/** Wind turbine. Three blades, tapered mast, on a footing. */
/**
 * Wind turbine mast, footing and nacelle.
 *
 * `height` is optional and, when given, overrides the random draw — the scatter
 * needs to know where the nacelle ended up so it can hang a turning rotor on it,
 * and inferring that from the RNG stream afterwards is not possible.
 */
export const windTurbine =
  (height?: number): Prop =>
  (r) => {
  const out: Piece[] = []
  const h = height ?? r.range(24, 38)

  out.push(cyl(1.5, 2.4, 0.8, 0, 0.4, 0, 'light', 16))
  out.push(cyl(0.52, 1.1, h, 0, h / 2, 0, 'shell', 14))

  // Nacelle.
  const nac = new CapsuleGeometry(1.0, 2.6, 6, 10)
  nac.applyMatrix4(rotZ(Math.PI / 2))
  nac.translate(0, h, 0.4)
  out.push({ geo: nac, mat: 'light' })
  out.push(sphere(0.75, 0, h, -1.2, 'light', 10))

  // Blades are deliberately absent here — they are drawn by the animated layer
  // in city.ts as an InstancedMesh so they can actually turn. `buildScatter`
  // records each turbine's hub position for that.
  return out
}

/** Where a turbine's blades attach, given its mast height. Used by the animated
 *  layer to place the rotating assembly. */
export const turbineHub = (h: number): [number, number, number] => [0, h, -1.6]

/** Stacked shipping containers. */
export const containerStack: Prop = (r) => {
  const out: Piece[] = []
  const cw = 6.2
  const ch = 2.6
  const cd = 2.5
  const cols = r.int(3, 6)
  const rows = r.int(2, 4)
  const high = r.int(2, 4)

  for (let x = 0; x < cols; x++) {
    for (let z = 0; z < rows; z++) {
      // Ragged stack heights read as a working yard rather than a data cube.
      const stack = Math.max(1, high - r.int(0, 2))
      for (let y = 0; y < stack; y++) {
        const px = (x - (cols - 1) / 2) * (cw + 0.5)
        const pz = (z - (rows - 1) / 2) * (cd + 0.5)
        out.push(box(cw, ch, cd, px, ch / 2 + y * ch, pz, y % 2 ? 'light' : 'shell'))
        // Corrugation: three shallow grooves per long face.
        for (let g = -1; g <= 1; g++) {
          out.push(box(cw * 0.9, ch * 0.62, 0.12, px + g * cw * 0.3, ch / 2 + y * ch, pz + cd / 2, 'mid'))
        }
      }
    }
  }
  return out
}

/** Warehouse racking rows — open steel frames with pallets. */
export const rackRow: Prop = (r) => {
  const out: Piece[] = []
  const bays = r.int(4, 7)
  const levels = r.int(3, 4)
  const bw = 4.2
  const bh = 3.0
  const d = 2.6
  const len = bays * bw

  // Uprights.
  for (let i = 0; i <= bays; i++) {
    const x = -len / 2 + i * bw
    for (const z of [-d / 2, d / 2]) {
      out.push(box(0.32, bh * levels, 0.32, x, (bh * levels) / 2, z, 'mid'))
    }
  }
  // Beams and pallets.
  for (let l = 1; l <= levels; l++) {
    const y = l * bh
    for (const z of [-d / 2, d / 2]) {
      out.push(box(len, 0.26, 0.3, 0, y, z, 'mid'))
    }
    for (let i = 0; i < bays; i++) {
      if (r.chance(0.28)) continue
      const x = -len / 2 + bw * (i + 0.5)
      const ph = r.range(1.2, 2.0)
      out.push(box(bw * 0.78, ph, d * 0.9, x, y + ph / 2 + 0.2, 0, r.chance(0.5) ? 'light' : 'shell'))
    }
  }
  return out
}

/** Horizontal storage tank on saddles. */
export const tank: Prop = (r) => {
  const out: Piece[] = []
  const rad = r.range(2.6, 4.0)
  const len = r.range(12, 20)

  const body = new CylinderGeometry(rad, rad, len, 20)
  body.applyMatrix4(rotZ(Math.PI / 2))
  body.translate(0, rad + 1.4, 0)
  out.push({ geo: body, mat: 'shell' })

  for (const s of [-1, 1]) {
    out.push(sphere(rad, (s * len) / 2, rad + 1.4, 0, 'light', 14))
    out.push(box(rad * 1.6, 1.4, rad * 2.1, (s * len) / 3, 0.7, 0, 'mid'))
  }
  // Access ladder and a top valve.
  out.push(box(0.5, rad + 1.4, 0.2, -len / 2 + 1.5, (rad + 1.4) / 2, rad * 0.9, 'mid'))
  out.push(cyl(0.4, 0.4, 1.4, len * 0.1, rad * 2 + 2.0, 0, 'mid', 8))
  return out
}

/** Tower crane — mast, jib, counter-jib, hook block. */
export const crane: Prop = (r) => {
  const out: Piece[] = []
  const h = r.range(28, 42)
  const jib = r.range(20, 30)

  out.push(box(4.4, 1.2, 4.4, 0, 0.6, 0, 'light'))
  // Lattice mast: four legs plus cross-bracing.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      out.push(box(0.36, h, 0.36, sx * 1.5, h / 2, sz * 1.5, 'mid'))
    }
  }
  const braces = Math.floor(h / 3.4)
  for (let i = 1; i < braces; i++) {
    const y = (h / braces) * i
    out.push(box(3.3, 0.22, 0.22, 0, y, 1.5, 'mid'))
    out.push(box(3.3, 0.22, 0.22, 0, y, -1.5, 'mid'))
    out.push(box(0.22, 0.22, 3.3, 1.5, y, 0, 'mid'))
  }

  // Slewing unit, jib and counter-jib.
  const rot = rotY(r.range(0, Math.PI * 2))
  const top: Piece[] = []
  top.push(box(4.2, 2.2, 4.2, 0, h + 1.1, 0, 'light'))
  top.push(box(jib, 0.9, 1.5, jib / 2 + 2, h + 2.6, 0, 'mid'))
  top.push(box(jib, 0.25, 2.2, jib / 2 + 2, h + 3.4, 0, 'light'))
  top.push(box(jib * 0.34, 0.8, 1.4, -(jib * 0.34) / 2 - 2, h + 2.6, 0, 'mid'))
  top.push(box(3.4, 2.4, 2.6, -(jib * 0.34) - 2, h + 2.4, 0, 'shell'))
  // A-frame and hoist rope.
  top.push(box(0.3, 5.0, 0.3, 0, h + 5.2, 0, 'mid'))
  const trolley = jib * r.range(0.4, 0.8) + 2
  top.push(box(1.6, 0.8, 1.6, trolley, h + 2.1, 0, 'mid'))
  const rope = r.range(8, 20)
  top.push(box(0.14, rope, 0.14, trolley, h + 1.7 - rope / 2, 0, 'mid'))
  top.push(box(1.8, 1.0, 1.8, trolley, h + 1.7 - rope, 0, 'dark'))
  top.forEach((p) => out.push(xform(p, rot)))
  return out
}

/** Site huts / portable offices, stacked two high. */
export const siteHuts: Prop = (r) => {
  const out: Piece[] = []
  const n = r.int(2, 4)
  const w = 8.0
  const h = 2.9
  const d = 3.2
  for (let i = 0; i < n; i++) {
    const z = (i - (n - 1) / 2) * (d + 0.4)
    const stack = r.chance(0.4) ? 2 : 1
    for (let s = 0; s < stack; s++) {
      out.push(box(w, h, d, 0, h / 2 + s * h, z, s ? 'light' : 'shell'))
      out.push(box(w * 0.18, h * 0.66, 0.3, -w * 0.28, h * 0.33 + s * h, z + d / 2, 'dark'))
      out.push(box(w * 0.3, h * 0.34, 0.3, w * 0.2, h * 0.52 + s * h, z + d / 2, 'glass'))
    }
    if (stack === 2) {
      out.push(box(1.2, h, 0.3, w / 2 - 0.8, h * 1.5, z + d / 2 + 0.3, 'mid'))
    }
  }
  return out
}

/** Low campus building with a courtyard — used for the HR district. */
export const campusBlock: Prop = (r) => {
  const out: Piece[] = []
  const w = r.range(22, 30)
  const d = r.range(16, 22)
  const h = r.range(6, 9)
  const t = r.range(5, 7)

  // Four wings around an open court.
  out.push(box(w, h, t, 0, h / 2, -d / 2 + t / 2, 'shell'))
  out.push(box(w, h, t, 0, h / 2, d / 2 - t / 2, 'shell'))
  out.push(box(t, h, d - t * 2, -w / 2 + t / 2, h / 2, 0, 'shell'))
  out.push(box(t, h, d - t * 2, w / 2 - t / 2, h / 2, 0, 'shell'))

  for (const p of [
    box(w * 1.01, h * 0.34, t * 0.9, 0, h * 0.52, -d / 2 + t / 2, 'mid'),
    box(w * 1.01, h * 0.34, t * 0.9, 0, h * 0.52, d / 2 - t / 2, 'mid'),
  ]) {
    out.push(p)
  }
  out.push(...parapet(w, d, h, 0.4, 0.6))
  // Courtyard paving and a planting bed.
  out.push(box(w - t * 2, 0.2, d - t * 2, 0, 0.1, 0, 'light'))
  out.push(cyl(2.2, 2.2, 0.5, 0, 0.25, 0, 'plate', 16))
  return out
}

/** Plaza: a stepped platform with a low wall. Reads as civic space. */
export const plaza: Prop = (r) => {
  const out: Piece[] = []
  const size = r.range(18, 26)
  for (let i = 0; i < 3; i++) {
    out.push(box(size - i * 2.4, 0.4, size - i * 2.4, 0, 0.2 + i * 0.4, 0, 'light'))
  }
  out.push(cyl(size * 0.16, size * 0.16, 0.5, 0, 1.5, 0, 'plate', 24))
  return out
}

/** Chimney stack with banding. */
export const chimney: Prop = (r) => {
  const out: Piece[] = []
  const h = r.range(22, 34)
  const rb = r.range(1.6, 2.4)
  out.push(cyl(rb * 0.62, rb, h, 0, h / 2, 0, 'shell', 16))
  out.push(cyl(rb * 0.72, rb * 0.72, 1.0, 0, h, 0, 'light', 16))
  out.push(cyl(rb * 0.58, rb * 0.58, 0.8, 0, h - 0.2, 0, 'dark', 16))
  for (let i = 1; i <= 3; i++) {
    const ring = new TorusGeometry(rb * (1 - (i / 4) * 0.35) * 1.04, 0.14, 6, 16)
    ring.applyMatrix4(rotX(Math.PI / 2))
    ring.translate(0, (h / 4) * i, 0)
    out.push({ geo: ring, mat: 'mid' })
  }
  return out
}

/** Trees, for scale and softness between hard structures. */
export const tree: Prop = (r) => {
  const out: Piece[] = []
  const h = r.range(4, 8)
  out.push(cyl(0.22, 0.3, h * 0.42, 0, (h * 0.42) / 2, 0, 'mid', 8))
  // Two overlapping spheroids read as a canopy far better than one.
  out.push(sphere(h * 0.3, 0, h * 0.66, 0, 'light', 10))
  out.push(sphere(h * 0.22, h * 0.14, h * 0.82, -h * 0.1, 'shell', 10))
  return out
}

/**
 * A person. Tiny, dark, and the single most valuable prop in the library —
 * nothing else establishes the scale of an architectural model as immediately.
 */
export const figure: Prop = (r) => {
  const out: Piece[] = []
  const h = r.range(1.65, 1.85)
  const body = new CapsuleGeometry(h * 0.13, h * 0.42, 4, 8)
  body.translate(0, h * 0.5, 0)
  out.push({ geo: body, mat: 'ink' })
  out.push(sphere(h * 0.115, 0, h * 0.9, 0, 'ink', 8))
  return out
}

/** Delivery truck: cab plus box body on wheels. */
export const truck: Prop = (r) => {
  const out: Piece[] = []
  const bl = r.range(9, 13)
  out.push(box(bl, 3.0, 2.7, 0, 2.3, 0, 'light'))
  out.push(box(3.2, 2.4, 2.6, -bl / 2 - 1.6, 2.0, 0, 'shell'))
  out.push(box(2.0, 1.0, 2.7, -bl / 2 - 2.2, 2.7, 0, 'glass'))
  out.push(box(bl + 4.4, 0.5, 2.4, -1.2, 0.85, 0, 'mid'))
  for (const x of [-bl / 2 - 1.2, bl * 0.1, bl * 0.35]) {
    for (const z of [-1.35, 1.35]) {
      const w = new CylinderGeometry(0.7, 0.7, 0.45, 12)
      w.applyMatrix4(rotX(Math.PI / 2))
      w.translate(x, 0.7, z)
      out.push({ geo: w, mat: 'dark' })
    }
  }
  return out
}

/** Server / equipment cabinets in a row — used for the CRM and core districts. */
export const cabinetRow: Prop = (r) => {
  const out: Piece[] = []
  const n = r.int(4, 8)
  const w = 1.9
  const h = r.range(4.4, 5.6)
  const d = 2.6
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * (w + 0.22)
    out.push(box(w, h, d, x, h / 2, 0, 'shell'))
    out.push(box(w * 0.82, h * 0.86, 0.24, x, h * 0.5, d / 2, 'dark'))
    // Vent slots, which give the front face texture at a distance.
    for (let s = 0; s < 5; s++) {
      out.push(box(w * 0.68, 0.1, 0.3, x, h * (0.22 + s * 0.14), d / 2 + 0.05, 'mid'))
    }
    out.push(box(w, 0.3, d, x, h + 0.15, 0, 'light'))
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*  Industrial dressing                                                        */
/* -------------------------------------------------------------------------- */

/** Elevated pipe rack — the thing that makes a plant look like a plant. */
export const pipeRack: Prop = (r) => {
  const out: Piece[] = []
  const len = r.range(24, 44)
  const h = r.range(5, 8)
  const bays = Math.max(3, Math.round(len / 8))

  // Portal frames.
  for (let i = 0; i <= bays; i++) {
    const x = -len / 2 + (len / bays) * i
    out.push(box(0.7, h, 0.7, x, h / 2, -2.2, 'mid'))
    out.push(box(0.7, h, 0.7, x, h / 2, 2.2, 'mid'))
    out.push(box(0.7, 0.6, 5.1, x, h, 0, 'mid'))
  }
  // Pipe runs at two levels, different diameters so it reads as plant rather
  // than as a fence.
  for (const [y, radius, offsets] of [
    [h + 0.9, 0.5, [-1.6, -0.4, 0.8, 1.9]],
    [h - 1.6, 0.34, [-1.2, 0.2, 1.5]],
  ] as [number, number, number[]][]) {
    for (const z of offsets) {
      const g = new CylinderGeometry(radius, radius, len, 10)
      g.applyMatrix4(rotZ(Math.PI / 2))
      g.translate(0, y, z)
      out.push({ geo: g, mat: 'light' })
    }
  }
  return out
}

/** Covered belt conveyor on trestles, running at a slight incline. */
export const conveyor: Prop = (r) => {
  const out: Piece[] = []
  const len = r.range(26, 42)
  const lo = 2.5
  const hi = r.range(9, 14)
  const rise = Math.atan2(hi - lo, len)

  // The belt housing, tilted.
  const housing = new BoxGeometry(Math.hypot(len, hi - lo), 1.9, 2.6)
  housing.applyMatrix4(rotZ(rise))
  housing.translate(0, (lo + hi) / 2, 0)
  out.push({ geo: housing, mat: 'light' })

  const hood = new BoxGeometry(Math.hypot(len, hi - lo) * 0.98, 0.4, 3.1)
  hood.applyMatrix4(rotZ(rise))
  hood.translate(0, (lo + hi) / 2 + 1.1, 0)
  out.push({ geo: hood, mat: 'shell' })

  // Trestles stepping up under it.
  const legs = 4
  for (let i = 0; i <= legs; i++) {
    const t = i / legs
    const x = -len / 2 + len * t
    const y = lo + (hi - lo) * t
    out.push(box(0.6, y, 0.6, x, y / 2, -1.0, 'mid'))
    out.push(box(0.6, y, 0.6, x, y / 2, 1.0, 'mid'))
  }
  // Discharge hopper at the high end.
  out.push(cone(2.4, 3.4, len / 2 + 1.2, hi - 1.2, 0, 'shell', 10))
  return out
}

/** Rail-mounted gantry crane straddling a container lane. */
export const gantryCrane: Prop = (r) => {
  const out: Piece[] = []
  const span = r.range(22, 30)
  const h = r.range(14, 19)

  for (const s of [-1, 1]) {
    // A-frame legs.
    out.push(box(1.1, h, 1.1, (s * span) / 2, h / 2, -3, 'mid'))
    out.push(box(1.1, h, 1.1, (s * span) / 2, h / 2, 3, 'mid'))
    out.push(box(2.6, 0.8, 8, (s * span) / 2, 0.4, 0, 'light'))
    // Cross-brace.
    out.push(box(1.4, 0.5, 6, (s * span) / 2, h * 0.55, 0, 'mid'))
  }
  // Bridge beam and trolley.
  out.push(box(span + 3, 1.8, 2.4, 0, h + 0.9, 0, 'light'))
  out.push(box(span + 3, 0.5, 3.4, 0, h + 1.9, 0, 'shell'))
  const trolley = r.range(-span * 0.3, span * 0.3)
  out.push(box(3, 1.6, 3, trolley, h - 0.6, 0, 'mid'))
  // Spreader on its ropes.
  const drop = r.range(4, 9)
  out.push(box(0.16, drop, 0.16, trolley - 1, h - 1.4 - drop / 2, 0, 'mid'))
  out.push(box(0.16, drop, 0.16, trolley + 1, h - 1.4 - drop / 2, 0, 'mid'))
  out.push(box(6.4, 0.8, 2.6, trolley, h - 1.4 - drop, 0, 'dark'))
  return out
}

/** Pallet yard: low stacks with a wrapped-load look. */
export const palletYard: Prop = (r) => {
  const out: Piece[] = []
  const cols = r.int(3, 5)
  const rows = r.int(2, 4)
  for (let x = 0; x < cols; x++) {
    for (let z = 0; z < rows; z++) {
      if (r.chance(0.18)) continue
      const px = (x - (cols - 1) / 2) * 4.4
      const pz = (z - (rows - 1) / 2) * 4.0
      const stack = r.int(1, 3)
      for (let i = 0; i < stack; i++) {
        // Pallet, then the load sitting on it.
        out.push(box(3.4, 0.3, 3.0, px, 0.15 + i * 1.9, pz, 'mid'))
        out.push(box(3.1, 1.4, 2.7, px, 1.0 + i * 1.9, pz, i % 2 ? 'light' : 'shell'))
      }
    }
  }
  return out
}

/** Rooftop-style solar array on a low frame. */
export const solarField: Prop = (r) => {
  const out: Piece[] = []
  const cols = r.int(4, 7)
  const rows = r.int(2, 3)
  const tilt = -0.42
  for (let x = 0; x < cols; x++) {
    for (let z = 0; z < rows; z++) {
      const px = (x - (cols - 1) / 2) * 5.2
      const pz = (z - (rows - 1) / 2) * 6.4
      const panel = new BoxGeometry(4.6, 0.18, 4.4)
      panel.applyMatrix4(rotX(tilt))
      panel.translate(px, 2.0, pz)
      out.push({ geo: panel, mat: 'glass' })
      out.push(box(0.3, 1.5, 0.3, px - 1.8, 0.75, pz + 1.4, 'mid'))
      out.push(box(0.3, 2.4, 0.3, px + 1.8, 1.2, pz - 1.4, 'mid'))
    }
  }
  return out
}

/** Scaffolded frame — a building mid-construction. */
export const scaffoldFrame: Prop = (r) => {
  const out: Piece[] = []
  const w = r.range(12, 18)
  const d = w * r.range(0.7, 1.1)
  const floors = r.int(3, 6)
  const fh = 3.4

  // Slabs and columns: a structure with no cladding yet.
  for (let f = 0; f <= floors; f++) {
    out.push(box(w, 0.5, d, 0, f * fh, 0, 'light'))
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      out.push(box(0.8, floors * fh, 0.8, (sx * w) / 2.4, (floors * fh) / 2, (sz * d) / 2.4, 'shell'))
    }
  }
  // Scaffold poles and boards around two faces.
  const bays = Math.round(w / 3)
  for (let i = 0; i <= bays; i++) {
    const x = -w / 2 + (w / bays) * i
    out.push(box(0.22, floors * fh + 2, 0.22, x, (floors * fh) / 2, d / 2 + 1.4, 'mid'))
  }
  for (let f = 1; f <= floors; f++) {
    out.push(box(w, 0.16, 1.2, 0, f * fh - 0.4, d / 2 + 1.4, 'mid'))
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*  Geometry for the animated layers                                           */
/* -------------------------------------------------------------------------- */

/**
 * A single walking person, as one merged geometry centred on the origin with
 * feet at y = 0.
 *
 * Returned separately from the `figure` prop because the crowd is drawn as an
 * InstancedMesh whose vertex shader moves each person along a path — so it needs
 * one geometry, not a list of pieces to bake into the static city.
 */
export function figureGeometry(): BufferGeometry {
  const h = 1.75
  const parts: BufferGeometry[] = []

  const body = new CapsuleGeometry(h * 0.13, h * 0.4, 4, 8)
  body.translate(0, h * 0.49, 0)
  parts.push(body)

  const head = new SphereGeometry(h * 0.115, 8, 6)
  head.translate(0, h * 0.88, 0)
  parts.push(head)

  // Two legs, offset along local +Z (the walking direction) so the shader can
  // swing them by sign.
  for (const s of [-1, 1]) {
    const leg = new BoxGeometry(h * 0.075, h * 0.34, h * 0.09)
    leg.translate(s * h * 0.055, h * 0.17, 0)
    parts.push(leg)
  }

  const merged = mergeGeometries(parts, false)!
  parts.forEach((g) => g.dispose())
  merged.deleteAttribute('uv')
  return merged
}

/** Turbine blade assembly, pivoting about the origin in its own XY plane. */
export function bladeGeometry(length: number): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (let i = 0; i < 3; i++) {
    const blade = new BoxGeometry(0.55, length, 0.16)
    const pos = blade.attributes.position!
    for (let v = 0; v < pos.count; v++) {
      if (pos.getY(v) > 0) {
        pos.setX(v, pos.getX(v) * 0.28)
        pos.setZ(v, pos.getZ(v) * 0.5)
      }
    }
    pos.needsUpdate = true
    blade.translate(0, length / 2, 0)
    blade.applyMatrix4(rotZ((i * Math.PI * 2) / 3))
    parts.push(blade)
  }
  const hub = new SphereGeometry(0.75, 10, 6)
  parts.push(hub)

  const merged = mergeGeometries(parts, false)!
  parts.forEach((g) => g.dispose())
  merged.deleteAttribute('uv')
  return merged
}

/** A delivery van, merged, pointing along +X with its base at y = 0. */
export function vanGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = []
  const bodyLen = 8

  const box1 = new BoxGeometry(bodyLen, 2.8, 2.5)
  box1.translate(0, 2.1, 0)
  parts.push(box1)

  const cab = new BoxGeometry(2.8, 2.2, 2.4)
  cab.translate(-bodyLen / 2 - 1.4, 1.9, 0)
  parts.push(cab)

  const chassis = new BoxGeometry(bodyLen + 3.6, 0.5, 2.2)
  chassis.translate(-1, 0.8, 0)
  parts.push(chassis)

  for (const x of [-bodyLen / 2 - 1, bodyLen * 0.1, bodyLen * 0.34]) {
    for (const z of [-1.25, 1.25]) {
      const w = new CylinderGeometry(0.66, 0.66, 0.42, 10)
      w.applyMatrix4(rotX(Math.PI / 2))
      w.translate(x, 0.66, z)
      parts.push(w)
    }
  }

  const merged = mergeGeometries(parts, false)!
  parts.forEach((g) => g.dispose())
  merged.deleteAttribute('uv')
  return merged
}

/* -------------------------------------------------------------------------- */
/*  Baking                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Stamp a prop's pieces into world space, grouped by material key.
 *
 * Mutates the target buckets rather than returning new arrays, because this runs
 * a few hundred times during generation and the allocation churn is measurable.
 */
export function bake(
  pieces: Piece[],
  matrix: Matrix4,
  buckets: Map<MatKey, BufferGeometry[]>,
): void {
  for (const piece of pieces) {
    piece.geo.applyMatrix4(matrix)
    // Merging requires matching attribute sets. Normals are needed for shading,
    // uvs are not used by any model material, so drop them to keep the buffers
    // small and the attribute sets identical.
    piece.geo.deleteAttribute('uv')
    const list = buckets.get(piece.mat)
    if (list) list.push(piece.geo)
    else buckets.set(piece.mat, [piece.geo])
  }
}

export { move, rotX, rotY, rotZ }
