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
  Color,
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
import {
  ASCENT,
  CORE,
  DERELICT,
  GROUND_SIZE,
  PYLON_LINES,
  type District,
  type Outpost,
} from './layout'
import {
  bake,
  cabinetRow,
  conveyor,
  fuelStation,
  gantryCrane,
  hospitalBlock,
  palletYard,
  pipeRack,
  pylon,
  quayCrane,
  scaffoldFrame,
  shipHull,
  solarField,
  sportsField,
  storefrontRow,
  streetLamp,
  waterTower,
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
  windTurbine: windTurbine(),
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
  pipeRack,
  conveyor,
  gantryCrane,
  palletYard,
  solarField,
  scaffoldFrame,
  quayCrane,
  shipHull,
  storefrontRow,
  hospitalBlock,
  sportsField,
  pylon,
  streetLamp,
  waterTower,
  fuelStation,
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
  pipeRack: 18,
  conveyor: 18,
  gantryCrane: 16,
  palletYard: 12,
  solarField: 18,
  scaffoldFrame: 12,
  quayCrane: 30,
  shipHull: 60,
  storefrontRow: 26,
  hospitalBlock: 22,
  sportsField: 26,
  pylon: 9,
  streetLamp: 2,
  waterTower: 9,
  fuelStation: 18,
}

/** Props that may sit inside another prop's footprint (scale/detail dressing). */
const OVERLAP_EXEMPT = new Set(['figure', 'tree', 'streetLamp'])

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

  // Ground apron, tinted with the district's accent. This is where nearly all
  // of the scene's colour lives: a large, very desaturated field under each
  // district, which the eye reads as "these are different places" long before it
  // could name the colours. The structures themselves stay white.
  const apronMat = matPlate.clone()
  apronMat.color = new Color(d.accent)
  const apron = new Mesh(new CircleGeometry(d.radius * 1.12, 64), apronMat)
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
      apronMat.dispose()
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Outposts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One outpost: the same scatter-and-merge as a district, with two differences.
 *
 * There is no conduit anchor, because an outpost is not a department of the same
 * company and must not appear to be wired into the core — the six lit conduits
 * are load-bearing for the story.
 *
 * And an outpost may carry water. The port's plate sits a hair above the ground
 * and slightly below the props baked onto it, so the moored hull reads as
 * floating at its boot line rather than parked on a blue rectangle.
 */
export function buildOutpost(o: Outpost): { key: string; group: Group; dispose(): void } {
  const r = rng(o.seed)
  const group = new Group()
  group.name = `outpost:${o.key}`

  const buckets = new Map<MatKey, BufferGeometry[]>()
  const placed: { x: number; z: number; rad: number }[] = []
  const owned: BufferGeometry[] = []
  const ownedMats: (typeof matPlate)[] = []

  // Water first, so everything else is baked knowing where the shoreline is.
  if (o.water) {
    const waterMat = matPlate.clone()
    waterMat.color = new Color(0xc2d6e8)
    waterMat.roughness = 0.32
    const water = new Mesh(new CircleGeometry(o.water, 72), waterMat)
    water.rotation.x = -Math.PI / 2
    // Below the district aprons but above the ground plane, so the quay's own
    // apron reads as land sitting in it.
    water.position.set(o.at.x + o.radius * 0.95, 0.03, o.at.z - o.radius * 0.95)
    water.receiveShadow = true
    group.add(water)
    owned.push(water.geometry as BufferGeometry)
    ownedMats.push(waterMat)
  }

  const queue = [...o.mix].sort((a, b) => (FOOTPRINT[b.prop] ?? 8) - (FOOTPRINT[a.prop] ?? 8))

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
        const dist = Math.sqrt(r()) * (o.radius - rad * 0.5)
        x = o.at.x + Math.cos(angle) * dist
        z = o.at.z + Math.sin(angle) * dist
        if (exempt || !placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.rad + rad + 4)) {
          ok = true
          break
        }
      }
      if (!ok) continue

      // The port's quay machinery all faces the same way, along the water's
      // edge. Cranes pointing in four directions would read as a scrapyard.
      const quayside = o.key === 'port' && (entry.prop === 'quayCrane' || entry.prop === 'shipHull')
      const yaw = quayside
        ? -Math.PI / 4 + r.range(-0.04, 0.04)
        : exempt || entry.prop === 'tree'
          ? r.range(0, Math.PI * 2)
          : Math.round(r.range(0, 4)) * (Math.PI / 2) + r.range(-0.06, 0.06)

      bake(
        build(r),
        new Matrix4().compose(
          new Vector3(x, 0, z),
          new Quaternion().setFromEuler(new Euler(0, yaw, 0)),
          new Vector3(1, 1, 1),
        ),
        buckets,
      )
      if (!exempt) placed.push({ x, z, rad })
    }
  }

  const built = meshesFromBuckets(buckets, o.key)
  built.meshes.forEach((m) => group.add(m))

  const apronMat = matPlate.clone()
  apronMat.color = new Color(o.accent)
  const apron = new Mesh(new CircleGeometry(o.radius * 1.1, 64), apronMat)
  apron.rotation.x = -Math.PI / 2
  apron.position.set(o.at.x, 0.055, o.at.z)
  apron.receiveShadow = true
  group.add(apron)
  owned.push(apron.geometry as BufferGeometry)
  ownedMats.push(apronMat)

  return {
    key: o.key,
    group,
    dispose() {
      built.dispose()
      owned.forEach((g) => g.dispose())
      ownedMats.forEach((m) => m.dispose())
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Pylon runs                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Straight runs of transmission towers between the utility outpost and the
 * industrial districts, with catenary spans strung between them.
 *
 * The spans are what sell it. A line of towers alone reads as a line of towers;
 * a line of towers with wires sagging between them reads as infrastructure, and
 * it gives the open ground a direction the eye can follow.
 */
export function buildPylons(): { group: Group; dispose(): void } {
  const r = rng(6607)
  const group = new Group()
  group.name = 'pylons'
  const buckets = new Map<MatKey, BufferGeometry[]>()

  for (const line of PYLON_LINES) {
    const dir = new Vector3().subVectors(line.to, line.from)
    const yaw = Math.atan2(dir.x, dir.z)
    // Stop short of both ends so a tower never lands inside a footprint.
    const a = line.from.clone().addScaledVector(dir, 0.16)
    const b = line.from.clone().addScaledVector(dir, 0.84)

    const towers: Vector3[] = []
    for (let i = 0; i < line.count; i++) {
      const t = line.count === 1 ? 0.5 : i / (line.count - 1)
      const p = new Vector3().lerpVectors(a, b, t)
      towers.push(p)
      bake(
        pylon(r),
        new Matrix4().compose(
          p,
          // Cross-arms run perpendicular to the line, so the wires leave the
          // insulators square instead of at an angle.
          new Quaternion().setFromEuler(new Euler(0, yaw + Math.PI / 2, 0)),
          new Vector3(1, 1, 1),
        ),
        buckets,
      )
    }

    // Catenary spans, approximated as three short segments per wire per span.
    for (let i = 0; i < towers.length - 1; i++) {
      const p0 = towers[i]!
      const p1 = towers[i + 1]!
      const span = p0.distanceTo(p1)
      const sag = span * 0.045
      for (const height of [26, 30.5]) {
        for (const side of [-1, 1]) {
          const off = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(side * 9)
          const segs = 4
          for (let s = 0; s < segs; s++) {
            const t0 = s / segs
            const t1 = (s + 1) / segs
            const y0 = height - Math.sin(Math.PI * t0) * sag
            const y1 = height - Math.sin(Math.PI * t1) * sag
            const from = new Vector3().lerpVectors(p0, p1, t0).add(off).setY(y0)
            const to = new Vector3().lerpVectors(p0, p1, t1).add(off).setY(y1)
            const seg = new Vector3().subVectors(to, from)
            const g = new CylinderGeometry(0.11, 0.11, seg.length(), 4)
            g.deleteAttribute('uv')
            const mid = new Vector3().addVectors(from, to).multiplyScalar(0.5)
            const q = new Quaternion().setFromUnitVectors(
              new Vector3(0, 1, 0),
              seg.clone().normalize(),
            )
            g.applyMatrix4(new Matrix4().compose(mid, q, new Vector3(1, 1, 1)))
            const list = buckets.get('mid')
            if (list) list.push(g)
            else buckets.set('mid', [g])
          }
        }
      }
    }
  }

  const built = meshesFromBuckets(buckets, 'pylons')
  built.meshes.forEach((m) => group.add(m))
  return { group, dispose: built.dispose }
}

/* -------------------------------------------------------------------------- */
/*  Street lighting                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Lamp posts down both sides of every road.
 *
 * A repeated object at a fixed interval is the strongest scale cue available: it
 * tells the eye how big a warehouse is, and — walking or flying the road in
 * explore mode — how fast you are moving. Both lines of every road merge into one
 * mesh, so several hundred lamps are a single draw call.
 */
export function buildStreetFurniture(
  routes: { from: Vector3; to: Vector3 }[],
): { group: Group; dispose(): void } {
  const r = rng(1279)
  const group = new Group()
  group.name = 'streetFurniture'
  const buckets = new Map<MatKey, BufferGeometry[]>()

  for (const route of routes) {
    const dir = new Vector3().subVectors(route.to, route.from).setY(0)
    const len = dir.length()
    if (len < 90) continue
    const unit = dir.clone().normalize()
    // Perpendicular, for the two lines either side of the carriageway.
    const side = new Vector3(-unit.z, 0, unit.x)
    const yaw = Math.atan2(unit.x, unit.z)

    // Skip the aprons at both ends, the same 34 units the traffic shader uses.
    const usable = len - 68
    const spacing = 34
    const n = Math.max(0, Math.floor(usable / spacing))

    for (let i = 0; i <= n; i++) {
      const along = 34 + (usable * i) / Math.max(1, n)
      for (const s of [-1, 1]) {
        const p = route.from
          .clone()
          .addScaledVector(unit, along)
          .addScaledVector(side, s * 6.2)
        bake(
          streetLamp(r),
          new Matrix4().compose(
            new Vector3(p.x, 0, p.z),
            // The lamp's arm reaches along local +Z; turn each one to overhang
            // the road it lights rather than the verge behind it.
            new Quaternion().setFromEuler(new Euler(0, yaw + (s > 0 ? Math.PI / 2 : -Math.PI / 2), 0)),
            new Vector3(1, 1, 1),
          ),
          buckets,
        )
      }
    }
  }

  const built = meshesFromBuckets(buckets, 'streetFurniture')
  built.meshes.forEach((m) => group.add(m))
  return { group, dispose: built.dispose }
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
): { group: Group; hubs: { at: Vector3; yaw: number; length: number }[]; dispose(): void } {
  const r = rng(9901)
  const group = new Group()
  group.name = 'scatter'
  const buckets = new Map<MatKey, BufferGeometry[]>()

  const clear = (x: number, z: number, pad: number) =>
    Math.hypot(x, z) > 90 + pad &&
    Math.hypot(x - DERELICT.at.x, z - DERELICT.at.z) > DERELICT.radius + pad &&
    districts.every((d) => Math.hypot(x - d.at.x, z - d.at.z) > d.radius + pad)

  // Wind turbines in a loose line, reading as a far-field utility. Masts and
  // nacelles bake into the static mesh; the hub position and facing of each are
  // handed back so buildRotors can hang a turning rotor on it.
  //
  // The scatter now reaches past the outpost ring rather than stopping at ±430,
  // so the ground keeps going for as long as an explorer keeps flying — an empty
  // plane beyond the last building is what makes a world feel like a diorama.
  const hubs: { at: Vector3; yaw: number; length: number }[] = []
  let placed = 0
  for (let i = 0; i < 400 && placed < 14; i++) {
    const x = r.range(-620, 620)
    const z = r.range(-620, 620)
    if (!clear(x, z, 46)) continue

    const yaw = r.range(0, Math.PI * 2)
    const height = r.range(24, 38)

    bake(
      windTurbine(height)(r),
      new Matrix4().compose(
        new Vector3(x, 0, z),
        new Quaternion().setFromEuler(new Euler(0, yaw, 0)),
        new Vector3(1, 1, 1),
      ),
      buckets,
    )

    // The nacelle sits at (0, h, -1.6) in the prop's local space; rotate that
    // offset by the same yaw so the rotor lands on the nacelle, not beside it.
    const off = new Vector3(0, height, -1.6).applyAxisAngle(new Vector3(0, 1, 0), yaw)
    hubs.push({
      at: new Vector3(x + off.x, off.y, z + off.z),
      yaw,
      length: height * 0.38,
    })
    placed++
  }

  // Tree clumps.
  let clumps = 0
  for (let i = 0; i < 1400 && clumps < 52; i++) {
    const x = r.range(-640, 640)
    const z = r.range(-640, 640)
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
  return { group, hubs, dispose: built.dispose }
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
export function buildRoads(routes: { from: Vector3; to: Vector3 }[]): {
  mesh: Mesh
  dispose(): void
} {
  const geos: BufferGeometry[] = []

  for (const route of routes) {
    const dir = new Vector3().subVectors(route.to, route.from).setY(0)
    const len = dir.length()
    if (len < 60) continue
    const angle = Math.atan2(dir.x, dir.z)
    const g = new PlaneGeometry(6, len - 56)
    g.rotateX(-Math.PI / 2)
    g.rotateY(angle)
    const mid = new Vector3().addVectors(route.from, route.to).multiplyScalar(0.5)
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
