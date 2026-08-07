/**
 * Builds the world from the prop library.
 *
 * There are no authored 3D models in this project. Every structure is generated
 * from a seed, so the layout is identical on every load, the download is a few
 * kilobytes of code rather than megabytes of GLTF, and any part of the city can
 * be reshaped by changing a number.
 *
 * The whole file is organised around one performance idea: props contribute
 * *geometry*, not objects. Each district merges every piece its props produced
 * into one buffer per material, so a district of forty detailed structures is
 * six or seven draw calls. That budget is what pays for window bands, crane
 * lattices, turbine blades and hundreds of little figures.
 */

import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  Euler,
  Group,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { rng } from './rng'
import { ASCENT, CORE, DERELICT, GROUND_SIZE, type District } from './layout'
import {
  bake,
  cabinetRow,
  campusBlock,
  chimney,
  containerStack,
  coolingTower,
  crane,
  figure,
  landmarkTower,
  officeTower,
  plaza,
  rackRow,
  sawtoothFactory,
  siloCluster,
  siteHuts,
  tank,
  tree,
  truck,
  vaultBlock,
  warehouse,
  windTurbine,
  type MatKey,
  type Prop,
} from './props'
import {
  makeGroundMaterial,
  matGlass,
  matInk,
  matPlate,
  matShell,
  matShellDark,
  matShellLight,
  matShellMid,
} from './materials'

/** Prop name → builder. Districts reference props by name in layout.ts. */
const LIBRARY: Record<string, Prop> = {
  officeTower: officeTower(),
  landmarkTower: landmarkTower(),
  vaultBlock,
  warehouse,
  sawtoothFactory,
  coolingTower,
  siloCluster,
  windTurbine,
  containerStack,
  rackRow,
  tank,
  crane,
  siteHuts,
  campusBlock,
  plaza,
  chimney,
  tree,
  figure,
  truck,
  cabinetRow,
}

const MATERIALS: Record<MatKey, typeof matShell> = {
  shell: matShell,
  light: matShellLight,
  mid: matShellMid,
  dark: matShellDark,
  glass: matGlass,
  ink: matInk,
  plate: matPlate,
}

/**
 * Approximate footprint radius per prop, used for overlap rejection.
 *
 * Measuring the real bounds of every generated prop would be exact but would
 * force us to build each one twice. These are conservative estimates, and the
 * consequence of one being slightly wrong is two structures standing a little
 * close — which in a dense working site is not a defect.
 */
const FOOTPRINT: Record<string, number> = {
  officeTower: 10,
  landmarkTower: 9,
  vaultBlock: 15,
  warehouse: 20,
  sawtoothFactory: 22,
  coolingTower: 12,
  siloCluster: 12,
  windTurbine: 16,
  containerStack: 16,
  rackRow: 15,
  tank: 11,
  crane: 16,
  siteHuts: 8,
  campusBlock: 16,
  plaza: 13,
  chimney: 4,
  tree: 3,
  figure: 1,
  truck: 8,
  cabinetRow: 9,
}

/** Props that may sit inside another prop's footprint (scale/detail dressing). */
const OVERLAP_EXEMPT = new Set(['figure', 'tree'])

/* -------------------------------------------------------------------------- */
/*  Merging                                                                    */
/* -------------------------------------------------------------------------- */

/** Merge each material bucket into a single shadow-casting mesh. */
function meshesFromBuckets(
  buckets: Map<MatKey, BufferGeometry[]>,
  name: string,
): { meshes: Mesh[]; dispose(): void } {
  const meshes: Mesh[] = []
  const owned: BufferGeometry[] = []

  for (const [key, geos] of buckets) {
    if (!geos.length) continue
    const merged = mergeGeometries(geos, false)
    geos.forEach((g) => g.dispose())
    if (!merged) continue
    // Normals must be recomputed: the source pieces were rotated and translated
    // individually, and merging does not fix up their normal matrices.
    merged.computeVertexNormals()
    merged.computeBoundingSphere()

    const mesh = new Mesh(merged, MATERIALS[key])
    mesh.name = `${name}:${key}`
    mesh.castShadow = true
    mesh.receiveShadow = true
    meshes.push(mesh)
    owned.push(merged)
  }

  return {
    meshes,
    dispose: () => owned.forEach((g) => g.dispose()),
  }
}

/* -------------------------------------------------------------------------- */
/*  Districts                                                                  */
/* -------------------------------------------------------------------------- */

export interface BuiltDistrict {
  key: string
  group: Group
  /** Where the district's conduit terminates. */
  anchor: Vector3
  dispose(): void
}

/**
 * Scatter a district's prop mix on a disc, reject overlaps, and merge.
 *
 * Placement is rejection sampling on a disc rather than a grid: a grid reads as
 * a spreadsheet, which is precisely the thing this site argues against. Larger
 * props are placed first so the small dressing fills the gaps around them
 * instead of blocking the space a warehouse needed.
 */
export function buildDistrict(d: District): BuiltDistrict {
  const r = rng(d.seed)
  const group = new Group()
  group.name = `district:${d.key}`

  const buckets = new Map<MatKey, BufferGeometry[]>()
  const placed: { x: number; z: number; rad: number }[] = []

  // Largest first.
  const queue = [...d.mix].sort(
    (a, b) => (FOOTPRINT[b.prop] ?? 8) - (FOOTPRINT[a.prop] ?? 8),
  )

  for (const entry of queue) {
    const build = LIBRARY[entry.prop]
    if (!build) continue
    const rad = FOOTPRINT[entry.prop] ?? 8
    const exempt = OVERLAP_EXEMPT.has(entry.prop)

    for (let i = 0; i < entry.count; i++) {
      let x = 0
      let z = 0
      let ok = false

      for (let attempt = 0; attempt < 60; attempt++) {
        const angle = r.range(0, Math.PI * 2)
        // sqrt on the radius gives uniform area density; without it everything
        // bunches in the middle.
        const dist = Math.sqrt(r()) * (d.radius - rad * 0.5)
        x = d.at.x + Math.cos(angle) * dist
        z = d.at.z + Math.sin(angle) * dist
        if (
          exempt ||
          !placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.rad + rad + 3.5)
        ) {
          ok = true
          break
        }
      }
      if (!ok) continue

      // Structures snap to one of four cardinal orientations so the district
      // reads as planned; dressing rotates freely.
      const yaw = exempt || entry.prop === 'tree'
        ? r.range(0, Math.PI * 2)
        : Math.round(r.range(0, 4)) * (Math.PI / 2) + r.range(-0.06, 0.06)

      bake(
        build(r),
        new Matrix4().compose(new Vector3(x, 0, z), new Quaternion().setFromEuler(new Euler(0, yaw, 0)), new Vector3(1, 1, 1)),
        buckets,
      )
      if (!exempt) placed.push({ x, z, rad })
    }
  }

  const built = meshesFromBuckets(buckets, d.key)
  built.meshes.forEach((m) => group.add(m))

  // Ground apron: a very slightly lighter disc so each district reads as a
  // developed plot rather than structures floating on open ground.
  const apron = new Mesh(new CircleGeometry(d.radius * 1.12, 64), matPlate)
  apron.rotation.x = -Math.PI / 2
  apron.position.set(d.at.x, 0.06, d.at.z)
  apron.receiveShadow = true
  group.add(apron)

  return {
    key: d.key,
    group,
    anchor: new Vector3(d.at.x, d.anchorHeight, d.at.z),
    dispose() {
      built.dispose()
      apron.geometry.dispose()
    },
  }
}

/**
 * The derelict yard.
 *
 * Same prop library, deliberately mis-organised: props are rotated off the grid,
 * spread thinly, and set into a slightly sunken plate. It reads as the same
 * business before anything was joined up.
 */
export function buildDerelict(): { group: Group; dispose(): void } {
  const r = rng(DERELICT.seed)
  const group = new Group()
  group.name = 'derelict'
  const buckets = new Map<MatKey, BufferGeometry[]>()
  const placed: { x: number; z: number; rad: number }[] = []

  for (const entry of DERELICT.mix) {
    const build = LIBRARY[entry.prop]
    if (!build) continue
    const rad = FOOTPRINT[entry.prop] ?? 8
    for (let i = 0; i < entry.count; i++) {
      let x = 0
      let z = 0
      for (let a = 0; a < 40; a++) {
        const angle = r.range(0, Math.PI * 2)
        const dist = Math.sqrt(r()) * DERELICT.radius
        x = DERELICT.at.x + Math.cos(angle) * dist
        z = DERELICT.at.z + Math.sin(angle) * dist
        if (!placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.rad + rad + 10)) break
      }
      bake(
        build(r),
        new Matrix4().compose(
          new Vector3(x, 0, z),
          // Free rotation and a slight tilt: nothing here shares an axis.
          new Quaternion().setFromEuler(
            new Euler(r.range(-0.03, 0.03), r.range(0, Math.PI * 2), r.range(-0.03, 0.03)),
          ),
          new Vector3(1, 1, 1),
        ),
        buckets,
      )
      placed.push({ x, z, rad })
    }
  }

  const built = meshesFromBuckets(buckets, 'derelict')
  built.meshes.forEach((m) => group.add(m))

  // Severed conduit stubs: each leaves a structure and simply stops.
  const stubs: BufferGeometry[] = []
  for (let i = 0; i < 7; i++) {
    const from = placed[i % placed.length]!
    const len = r.range(14, 30)
    const a = r.range(0, Math.PI * 2)
    const g = new CylinderGeometry(0.5, 0.5, len, 6)
    g.applyMatrix4(new Matrix4().makeRotationZ(Math.PI / 2))
    g.applyMatrix4(new Matrix4().makeRotationY(a))
    g.translate(from.x + (Math.cos(a) * len) / 2, r.range(3, 9), from.z + (Math.sin(a) * len) / 2)
    g.deleteAttribute('uv')
    stubs.push(g)
  }
  const stubGeo = mergeGeometries(stubs, false)
  stubs.forEach((g) => g.dispose())
  if (stubGeo) {
    stubGeo.computeVertexNormals()
    const m = new Mesh(stubGeo, matShellDark)
    m.castShadow = true
    group.add(m)
  }

  const plate = new Mesh(new CircleGeometry(DERELICT.radius * 1.2, 64), matShellMid)
  plate.rotation.x = -Math.PI / 2
  plate.position.set(DERELICT.at.x, 0.04, DERELICT.at.z)
  plate.receiveShadow = true
  group.add(plate)

  return {
    group,
    dispose() {
      built.dispose()
      stubGeo?.dispose()
      plate.geometry.dispose()
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Core                                                                       */
/* -------------------------------------------------------------------------- */

export interface BuiltCore {
  group: Group
  anchor: Vector3
  update(elapsed: number): void
  dispose(): void
}

/**
 * The Frappe platform: a single hexagonal monolith inside three slowly
 * contra-rotating rings, on a tiered podium.
 *
 * It is the only radially symmetric structure in the world — everything else is
 * orthogonal. That is what makes it read as the thing the districts are
 * organised around rather than as one more building.
 */
export function buildCore(): BuiltCore {
  const group = new Group()
  group.name = 'core'
  const owned: BufferGeometry[] = []

  const add = (geo: BufferGeometry, mat: typeof matShell, cast = true) => {
    geo.deleteAttribute('uv')
    geo.computeVertexNormals()
    const m = new Mesh(geo, mat)
    m.castShadow = cast
    m.receiveShadow = true
    group.add(m)
    owned.push(geo)
    return m
  }

  // Podium.
  for (let i = 0; i < 3; i++) {
    const g = new CylinderGeometry(30 - i * 5, 31 - i * 5, 2.2, 6)
    g.translate(0, 1.1 + i * 2.2, 0)
    add(g, i === 2 ? matShellLight : matShell)
  }

  // Tapering hexagonal shaft with floor banding.
  const shaft = new CylinderGeometry(9.5, 15, CORE.height, 6)
  shaft.translate(0, CORE.height / 2 + 6.6, 0)
  add(shaft, matShell)

  const bands: BufferGeometry[] = []
  for (let i = 1; i < 10; i++) {
    const t = i / 10
    const rad = (15 - t * 5.5) * 1.03
    const g = new CylinderGeometry(rad, rad, 0.55, 6)
    g.translate(0, 6.6 + t * CORE.height, 0)
    g.deleteAttribute('uv')
    bands.push(g)
  }
  const bandGeo = mergeGeometries(bands, false)
  bands.forEach((g) => g.dispose())
  if (bandGeo) add(bandGeo, matShellMid)

  // Crown.
  const crown = new CylinderGeometry(6.5, 10, 5, 6)
  crown.translate(0, CORE.height + 9, 0)
  add(crown, matShellLight)
  const mast = new CylinderGeometry(0.35, 0.5, 12, 8)
  mast.translate(0, CORE.height + 17, 0)
  add(mast, matShellMid)

  // Three rings on the podium, contra-rotating. Slow asymmetric motion is what
  // makes the core feel powered rather than parked.
  const rings: Mesh[] = []
  ;[
    { r: 38, t: 0.55 },
    { r: 50, t: 0.45 },
    { r: 62, t: 0.35 },
  ].forEach((spec, i) => {
    const geo = new TorusGeometry(spec.r, spec.t, 8, 96)
    geo.deleteAttribute('uv')
    geo.rotateX(Math.PI / 2)
    const mesh = new Mesh(geo, i === 1 ? matShellLight : matShellMid)
    mesh.position.y = 3.5 + i * 1.6
    mesh.castShadow = true
    group.add(mesh)
    owned.push(geo)
    rings.push(mesh)
  })

  const apron = new Mesh(new RingGeometry(30, 74, 96), matPlate)
  apron.rotation.x = -Math.PI / 2
  apron.position.y = 0.05
  apron.receiveShadow = true
  group.add(apron)

  return {
    group,
    anchor: new Vector3(0, CORE.height * 0.66, 0),
    update(elapsed) {
      rings.forEach((ring, i) => {
        ring.rotation.z = elapsed * 0.05 * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.35)
      })
    },
    dispose() {
      owned.forEach((g) => g.dispose())
      apron.geometry.dispose()
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Ascent — the five NXTGEN phases                                            */
/* -------------------------------------------------------------------------- */

export interface BuiltAscent {
  group: Group
  anchors: Vector3[]
  dispose(): void
}

export function buildAscent(): BuiltAscent {
  const group = new Group()
  group.name = 'ascent'
  const anchors: Vector3[] = []
  const buckets = new Map<MatKey, BufferGeometry[]>()
  const r = rng(8123)

  for (let i = 0; i < ASCENT.count; i++) {
    const pos = new Vector3(
      ASCENT.start.x + ASCENT.step.x * i,
      ASCENT.start.y + ASCENT.step.y * i,
      ASCENT.start.z + ASCENT.step.z * i,
    )
    // Platforms shrink as they climb: forced perspective makes the top of the
    // stair feel further away and higher than it measures.
    const size = ASCENT.size * (1 - i * 0.08)

    const pieces = []
    const slabGeo = new BoxGeometry(size, 2.6, size)
    slabGeo.translate(0, 0, 0)
    pieces.push({ geo: slabGeo, mat: 'light' as MatKey })

    // Pilotis carrying the platform down to nothing — it should read as built,
    // not as a floating tile.
    const legH = 8 + i * 3
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new BoxGeometry(1.5, legH, 1.5)
        leg.translate((sx * size) / 2.6, -legH / 2 - 1.3, (sz * size) / 2.6)
        pieces.push({ geo: leg, mat: 'mid' as MatKey })
      }
    }

    // A marker block and a figure on each platform: the phase, and a person.
    const mh = 7 - i * 0.7
    const marker = new BoxGeometry(4.5, mh, 4.5)
    marker.translate(size * 0.24, mh / 2 + 1.3, -size * 0.24)
    pieces.push({ geo: marker, mat: 'shell' as MatKey })

    bake(pieces, new Matrix4().makeTranslation(pos.x, pos.y, pos.z), buckets)
    bake(
      figure(r),
      new Matrix4().makeTranslation(pos.x - size * 0.2, pos.y + 1.3, pos.z + size * 0.15),
      buckets,
    )

    anchors.push(new Vector3(pos.x, pos.y + 1.3, pos.z))
  }

  const built = meshesFromBuckets(buckets, 'ascent')
  built.meshes.forEach((m) => group.add(m))

  return { group, anchors, dispose: built.dispose }
}

/* -------------------------------------------------------------------------- */
/*  Ground                                                                     */
/* -------------------------------------------------------------------------- */

export function buildGround(): { mesh: Mesh; dispose(): void } {
  const mat = makeGroundMaterial(GROUND_SIZE)
  const geo = new PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 1, 1)
  const mesh = new Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = true
  // Always relevant and enormous; culling it makes it pop in and out.
  mesh.frustumCulled = false
  return {
    mesh,
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Scatter — wind turbines and trees across the open ground between districts  */
/* -------------------------------------------------------------------------- */

/**
 * Fills the empty ground so the districts sit in a landscape rather than on a
 * blank plane. Rejects anything that would land inside a district footprint.
 */
export function buildScatter(
  districts: { at: Vector3; radius: number }[],
): { group: Group; dispose(): void } {
  const r = rng(9901)
  const group = new Group()
  group.name = 'scatter'
  const buckets = new Map<MatKey, BufferGeometry[]>()

  const clear = (x: number, z: number, pad: number) =>
    Math.hypot(x, z) > 90 + pad &&
    Math.hypot(x - DERELICT.at.x, z - DERELICT.at.z) > DERELICT.radius + pad &&
    districts.every((d) => Math.hypot(x - d.at.x, z - d.at.z) > d.radius + pad)

  // Wind turbines in a loose line, reading as a far-field utility.
  let placed = 0
  for (let i = 0; i < 300 && placed < 9; i++) {
    const x = r.range(-420, 420)
    const z = r.range(-420, 420)
    if (!clear(x, z, 46)) continue
    bake(
      windTurbine(r),
      new Matrix4().compose(
        new Vector3(x, 0, z),
        new Quaternion().setFromEuler(new Euler(0, r.range(0, Math.PI * 2), 0)),
        new Vector3(1, 1, 1),
      ),
      buckets,
    )
    placed++
  }

  // Tree clumps.
  let clumps = 0
  for (let i = 0; i < 900 && clumps < 26; i++) {
    const x = r.range(-430, 430)
    const z = r.range(-430, 430)
    if (!clear(x, z, 22)) continue
    const n = r.int(3, 7)
    for (let t = 0; t < n; t++) {
      bake(
        tree(r),
        new Matrix4().makeTranslation(x + r.range(-9, 9), 0, z + r.range(-9, 9)),
        buckets,
      )
    }
    clumps++
  }

  const built = meshesFromBuckets(buckets, 'scatter')
  built.meshes.forEach((m) => group.add(m))
  return { group, dispose: built.dispose }
}

/* -------------------------------------------------------------------------- */
/*  Roads — hairline connectors on the ground between core and districts        */
/* -------------------------------------------------------------------------- */

/**
 * Flat ribbons from the core apron out to each district apron.
 *
 * They are always present, unlike the conduits which light up as you travel.
 * Having the physical roads there from the start makes the conduits read as
 * *data* arriving over existing infrastructure, rather than as the only thing
 * connecting anything.
 */
export function buildRoads(districts: { at: Vector3 }[]): { mesh: Mesh; dispose(): void } {
  const geos: BufferGeometry[] = []

  for (const d of districts) {
    const dir = new Vector3(d.at.x, 0, d.at.z)
    const len = dir.length()
    const angle = Math.atan2(dir.x, dir.z)
    const g = new PlaneGeometry(6, len - 56)
    g.rotateX(-Math.PI / 2)
    g.rotateY(angle)
    const mid = dir.clone().multiplyScalar(0.5)
    g.translate(mid.x, 0.09, mid.z)
    g.deleteAttribute('uv')
    geos.push(g)
  }

  const merged = mergeGeometries(geos, false)!
  geos.forEach((g) => g.dispose())
  merged.computeVertexNormals()

  const mesh = new Mesh(merged, matPlate)
  mesh.receiveShadow = true
  return { mesh, dispose: () => merged.dispose() }
}
