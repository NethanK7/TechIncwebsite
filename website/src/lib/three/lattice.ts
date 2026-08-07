/**
 * The readiness lattice — the assessment page's 3D scene.
 *
 * Ten pillars in a ring, one per question. Answering a question grows its
 * pillar to the height of that answer's score, so the shape of your readiness
 * builds up in front of you as you go. On completion a central monolith rises to
 * the overall score.
 *
 * Deliberately a separate, much smaller engine than lib/three/journey.ts: its own
 * renderer, no post-processing, ~20 meshes. It shares the palette and materials
 * so the two scenes read as the same world, but there is no reason for an
 * assessment widget to carry a bloom chain.
 *
 * Like the journey, it is entirely optional — the assessment is fully usable
 * with this module absent, refused, or torn down.
 */

import {
  AmbientLight,
  BoxGeometry,
  Clock,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'

import { PALETTE } from './materials'

/** Fraction of full height an unanswered pillar rests at. */
const REST = 0.12
const RING_RADIUS = 9.5
const PILLAR_W = 1.25
const MAX_H = 11

export interface Lattice {
  /** Set a question's value, 0–10. */
  setPillar(index: number, score: number): void
  /** 0–100 overall; raises the central monolith. */
  setScore(score: number): void
  /** Highlight the question currently being answered. */
  setActive(index: number): void
  destroy(): void
}

export function startLattice(mount: HTMLElement, count: number): Lattice | null {
  let renderer: WebGLRenderer
  try {
    const probe = document.createElement('canvas').getContext('webgl2')
    if (!probe) return null
    const info = probe.getExtension('WEBGL_debug_renderer_info')
    const name = info ? String(probe.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '') : ''
    if (/swiftshader|llvmpipe|software/i.test(name)) return null

    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' })
  } catch {
    return null
  }

  const canvas = renderer.domElement
  canvas.className = 'lattice__canvas'
  canvas.setAttribute('aria-hidden', 'true')
  mount.appendChild(canvas)

  const size = () => ({
    w: mount.clientWidth || 480,
    h: mount.clientHeight || 480,
  })
  let { w, h } = size()

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  // Transparent clear: the section's CSS gradient shows through, so the widget
  // sits on the page rather than in a box.
  renderer.setClearAlpha(0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(38, w / Math.max(1, h), 0.5, 200)

  /* ---- Lighting: same recipe as the main scene, scaled down ---- */

  scene.add(new HemisphereLight(0xf4f9ff, 0xc2d3e6, 0.7))
  scene.add(new AmbientLight(0xffffff, 0.22))
  const key = new DirectionalLight(0xffffff, 2.3)
  key.position.set(-16, 26, 14)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  const s = 20
  key.shadow.camera.left = -s
  key.shadow.camera.right = s
  key.shadow.camera.top = s
  key.shadow.camera.bottom = -s
  key.shadow.camera.far = 90
  key.shadow.normalBias = 0.05
  scene.add(key)
  const fill = new DirectionalLight(0xd6e6f8, 0.5)
  fill.position.set(18, 10, -14)
  scene.add(fill)

  /* ---- Materials (local, so disposal is self-contained) ---- */

  const matBase = new MeshStandardMaterial({
    color: new Color(PALETTE.plate),
    roughness: 0.95,
    metalness: 0,
  })
  const matPillar = new MeshStandardMaterial({
    color: new Color(PALETTE.shell),
    roughness: 0.82,
    metalness: 0,
  })
  const matPillarActive = new MeshStandardMaterial({
    color: new Color(PALETTE.shellLight),
    roughness: 0.6,
    metalness: 0.05,
  })
  const matCore = new MeshStandardMaterial({
    color: new Color(PALETTE.shellLight),
    roughness: 0.55,
    metalness: 0.08,
  })
  const matRing = new MeshStandardMaterial({
    color: new Color(PALETTE.shellMid),
    roughness: 0.7,
    metalness: 0,
  })

  const world = new Group()
  scene.add(world)

  /* ---- Base plate ---- */

  const plate = new Mesh(new CylinderGeometry(RING_RADIUS + 4, RING_RADIUS + 4.4, 0.7, 72), matBase)
  plate.position.y = -0.35
  plate.receiveShadow = true
  world.add(plate)

  const plateRing = new Mesh(new RingGeometry(RING_RADIUS + 3.4, RING_RADIUS + 3.7, 96), matRing)
  plateRing.rotation.x = -Math.PI / 2
  plateRing.position.y = 0.02
  world.add(plateRing)

  // Catcher plane so pillars cast onto something even outside the plate.
  const shadowCatcher = new Mesh(new PlaneGeometry(80, 80), matBase)
  shadowCatcher.rotation.x = -Math.PI / 2
  shadowCatcher.position.y = -0.7
  shadowCatcher.receiveShadow = true
  shadowCatcher.visible = false
  world.add(shadowCatcher)

  /* ---- Pillars ---- */

  interface Pillar {
    mesh: Mesh
    cap: Mesh
    target: number
    current: number
  }

  const pillars: Pillar[] = []
  const geo = new BoxGeometry(PILLAR_W, 1, PILLAR_W)
  // Pivot at the base so scaling y grows upward rather than from the centre.
  geo.translate(0, 0.5, 0)
  const capGeo = new BoxGeometry(PILLAR_W * 1.24, 0.22, PILLAR_W * 1.24)

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * RING_RADIUS
    const z = Math.sin(angle) * RING_RADIUS

    const mesh = new Mesh(geo, matPillar)
    mesh.position.set(x, 0, z)
    mesh.rotation.y = -angle
    mesh.scale.y = 0.001
    mesh.castShadow = true
    mesh.receiveShadow = true
    world.add(mesh)

    const cap = new Mesh(capGeo, matPillarActive)
    cap.position.set(x, 0.1, z)
    cap.rotation.y = -angle
    cap.castShadow = true
    world.add(cap)

    // Resting height, not zero: an all-flat ring reads as a broken widget rather
    // than as an empty scale waiting to be filled.
    pillars.push({ mesh, cap, target: REST, current: 0 })
  }

  /* ---- Central monolith + score rings ---- */

  const coreGeo = new CylinderGeometry(1.5, 2.2, 1, 6)
  coreGeo.translate(0, 0.5, 0)
  const core = new Mesh(coreGeo, matCore)
  core.scale.y = 0.001
  core.castShadow = true
  world.add(core)

  const haloGeos = [new TorusGeometry(3.4, 0.09, 8, 72), new TorusGeometry(4.6, 0.07, 8, 72)]
  const halos = haloGeos.map((g, i) => {
    const m = new Mesh(g, matRing)
    m.rotation.x = Math.PI / 2
    m.position.y = 0.5 + i * 0.35
    world.add(m)
    return m
  })

  /* ---- State ---- */

  let scoreTarget = 0
  let scoreCurrent = 0
  let activeIndex = -1
  let destroyed = false
  const clock = new Clock()

  /** Critically-damped approach. Same feel as the journey's camera. */
  const approach = (current: number, target: number, dt: number, rate = 6) =>
    current + (target - current) * (1 - Math.exp(-rate * dt))

  function frame(): void {
    if (destroyed) return
    const dt = Math.min(clock.getDelta(), 1 / 20)
    const t = clock.getElapsedTime()

    for (let i = 0; i < pillars.length; i++) {
      const p = pillars[i]!
      p.current = approach(p.current, p.target, dt)
      const height = Math.max(0.001, p.current * MAX_H)
      p.mesh.scale.y = height
      p.cap.position.y = height + 0.11
      p.mesh.material = i === activeIndex ? matPillarActive : matPillar
      // The active pillar lifts slightly, so which question you are on is legible
      // in the 3D as well as in the form.
      const lift = i === activeIndex ? 0.35 + Math.sin(t * 2.4) * 0.08 : 0
      p.mesh.position.y = lift
      p.cap.position.y = height + 0.11 + lift
    }

    scoreCurrent = approach(scoreCurrent, scoreTarget, dt, 4)
    core.scale.y = Math.max(0.001, (scoreCurrent / 100) * (MAX_H + 3))
    halos.forEach((halo, i) => {
      halo.rotation.z = t * (i % 2 === 0 ? 0.22 : -0.16)
      halo.position.y = 0.5 + i * 0.35 + (scoreCurrent / 100) * (MAX_H + 1)
      halo.scale.setScalar(0.7 + (scoreCurrent / 100) * 0.5)
    })

    // Slow turntable. The scene is small, so a gentle orbit does the work of
    // showing its shape without any interaction.
    const orbit = t * 0.11
    camera.position.set(Math.sin(orbit) * 26, 17.5, Math.cos(orbit) * 26)
    camera.lookAt(0, 4.5, 0)

    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  let raf = requestAnimationFrame(frame)

  function resize(): void {
    if (destroyed) return
    const next = size()
    w = next.w
    h = next.h
    camera.aspect = w / Math.max(1, h)
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  const ro = new ResizeObserver(resize)
  ro.observe(mount)

  return {
    setPillar(index, score) {
      const p = pillars[index]
      // Answers scale into the range above the resting height, so an answered
      // pillar is always visibly taller than an unanswered one.
      if (p) p.target = REST + Math.max(0, Math.min(1, score / 10)) * (1 - REST)
    },
    setScore(score) {
      scoreTarget = Math.max(0, Math.min(100, score))
    },
    setActive(index) {
      activeIndex = index
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      geo.dispose()
      capGeo.dispose()
      coreGeo.dispose()
      haloGeos.forEach((g) => g.dispose())
      plate.geometry.dispose()
      plateRing.geometry.dispose()
      shadowCatcher.geometry.dispose()
      ;[matBase, matPillar, matPillarActive, matCore, matRing].forEach((m) => m.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}

export { Vector3 as _V }
