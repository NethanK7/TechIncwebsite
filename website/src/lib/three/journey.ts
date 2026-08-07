/**
 * The journey engine.
 *
 * Owns the renderer, the scene, the camera flight, the post chain and the frame
 * loop. Everything else in lib/three is a generator this file assembles.
 *
 * Three properties matter more than anything visual:
 *
 *   · It is entirely optional. Every word on the page is static HTML; this module
 *     is dynamically imported after LCP and can fail, be refused, or be torn down
 *     at any point without the page losing meaning.
 *   · It never runs a second loop. The frame callback lives on GSAP's ticker —
 *     the same ticker driving Lenis — so scroll and render advance together.
 *   · It watches its own frame rate and degrades itself: shadows first, then
 *     resolution, then it removes the canvas entirely rather than presenting a
 *     slideshow.
 *
 * The lighting is the part worth reading. A white model on a pale field needs a
 * strong key, a bright sky-to-ground hemisphere fill, and real soft shadows —
 * the shadows are doing most of the work of describing form, because the value
 * range across the surfaces themselves is deliberately tiny.
 */

import {
  ACESFilmicToneMapping,
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HalfFloatType,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

import { gsap } from '../scroll'
import { track } from '../analytics'
import { GradeShader } from './grade'
import { ScrollDriver } from './scrollDriver'
import {
  buildAscent,
  buildCore,
  buildDerelict,
  buildDistrict,
  buildGround,
  buildRoads,
  buildScatter,
} from './city'
import { buildAscentRamps, buildConduits } from './conduits'
import { PALETTE, SHARED_MATERIALS, makeSkyMaterial, tickMaterials } from './materials'
import {
  DISTRICTS,
  KEYFRAMES,
  STAGE_COUNT,
  STAGE_KEYS,
  buildCameraCurves,
  fovAt,
  stageAt,
} from './layout'

export interface Journey {
  destroy(): void
  progress(): number
}

let active: Journey | null = null

/* -------------------------------------------------------------------------- */
/*  Capability detection                                                       */
/* -------------------------------------------------------------------------- */

interface Capability {
  ok: boolean
  shadows: boolean
  shadowSize: number
  bloom: boolean
  dots: boolean
  scatter: boolean
  maxDpr: number
  msaa: number
}

function detect(): Capability {
  const fail: Capability = {
    ok: false,
    shadows: false,
    shadowSize: 0,
    bloom: false,
    dots: false,
    scatter: false,
    maxDpr: 1,
    msaa: 0,
  }

  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return fail

    // Software renderers report as WebGL but cannot sustain a shadow-mapped
    // scene. Better to show the static hero than to stutter through it.
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '') : ''
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return fail

    const cores = navigator.hardwareConcurrency ?? 4
    const mem = (navigator as { deviceMemory?: number }).deviceMemory
    const coarse = matchMedia('(pointer: coarse)').matches
    const weak = cores <= 4 || (mem !== undefined && mem <= 4)

    return {
      ok: true,
      shadows: true,
      // A 4k map over a 900-unit shadow frustum is about 0.22 units per texel,
      // which is enough for a crisp contact edge under a 10-unit building.
      shadowSize: weak ? 1024 : coarse ? 2048 : 4096,
      bloom: !weak,
      dots: !weak,
      scatter: !weak,
      // Above 2 costs 2.25x the fill for a difference nobody can see.
      maxDpr: weak ? 1.25 : coarse ? 1.75 : 2,
      msaa: weak ? 0 : 4,
    }
  } catch {
    return fail
  }
}

/* -------------------------------------------------------------------------- */
/*  Entry                                                                      */
/* -------------------------------------------------------------------------- */

export function startJourney(mount: HTMLElement): Journey | null {
  if (active) return active

  const cap = detect()
  if (!cap.ok) {
    mount.setAttribute('data-journey-state', 'unsupported')
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.className = 'journey__canvas'
  canvas.setAttribute('aria-hidden', 'true')
  mount.prepend(canvas)

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false, // MSAA happens on the composer target instead
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      failIfMajorPerformanceCaveat: true,
    })
  } catch {
    canvas.remove()
    mount.setAttribute('data-journey-state', 'unsupported')
    return null
  }

  const size = new Vector2()
  /**
   * The canvas is `position: fixed`, so its size is the *viewport* — not the
   * mount, which is eleven screens tall. Measuring the mount here gives an
   * aspect ratio near 0.09 and a vertically crushed frame that looks like the
   * camera is inside the geometry.
   */
  const measure = () => size.set(innerWidth, innerHeight)
  measure()

  let dpr = Math.min(devicePixelRatio || 1, cap.maxDpr)
  renderer.setPixelRatio(dpr)
  renderer.setSize(size.x, size.y, false)
  renderer.outputColorSpace = SRGBColorSpace
  // ACES keeps the near-white roof planes from clipping to a single flat value,
  // which a linear or Reinhard curve does immediately on this palette.
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  renderer.shadowMap.enabled = cap.shadows
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setClearColor(PALETTE.sky, 1)

  /* ---- Scene ---- */

  const scene = new Scene()
  scene.background = new Color(PALETTE.sky)
  // Linear fog, and the near plane has to sit *past* the far side of the world.
  // The establishing shot views the whole 400-unit-wide site from 435 units out,
  // so anything nearer than about 400 would haze the subject itself rather than
  // only the horizon. Exponential fog is wrong here for the same reason: it eats
  // the near ground before it touches the distance.
  scene.fog = new Fog(PALETTE.skyFar, 540, 2100)

  const camera = new PerspectiveCamera(38, size.x / Math.max(1, size.y), 1, 2400)
  camera.position.set(...KEYFRAMES[0]!.pos)

  /* ---- Lighting ---- */

  // Sky-to-ground fill, deliberately restrained. An over-bright hemisphere is
  // the classic mistake on a white-on-white palette: it lifts every face to the
  // same value and the model goes completely flat. Keep it low enough that the
  // key light and the shadows are what describe the form.
  scene.add(new HemisphereLight(0xf4f9ff, 0xc2d3e6, 0.62))
  // Just enough flat ambient to stop shadow interiors going muddy.
  scene.add(new AmbientLight(0xffffff, 0.17))

  const key = new DirectionalLight(0xffffff, 2.65)
  // A single fixed sun. The whole inhabited world fits one shadow frustum, so
  // there is no reason to move it — and moving a shadow-casting light forces a
  // full re-render of every casting mesh into the shadow map.
  key.position.set(-420, 480, 330)
  key.castShadow = cap.shadows
  if (cap.shadows) {
    key.shadow.mapSize.set(cap.shadowSize, cap.shadowSize)
    // One orthographic box covering everything: districts span ±200, the
    // derelict yard reaches -410, the ascent reaches +440. At 560 half-size on a
    // 4096 map that is 0.27 units per texel — sharp enough for a contact edge
    // under a 10-unit building.
    const s = 560
    key.shadow.camera.left = -s
    key.shadow.camera.right = s
    key.shadow.camera.top = s
    key.shadow.camera.bottom = -s
    key.shadow.camera.near = 1
    key.shadow.camera.far = 1600
    // Normal bias rather than constant bias: it scales with surface angle, which
    // removes peter-panning on the many near-vertical facades here.
    key.shadow.bias = -0.0002
    key.shadow.normalBias = 0.45
    key.shadow.radius = 4
  }
  scene.add(key)
  scene.add(key.target)

  // Cool bounce from the opposite side, so shadowed faces keep their form
  // instead of going to a single dead value.
  const fill = new DirectionalLight(0xd6e6f8, 0.5)
  fill.position.set(320, 150, -260)
  scene.add(fill)

  /* ---- Sky gradient ---- */

  // A clip-space quad behind everything, so the sky is a soft wash rather than a
  // flat fill. Rendered first and never depth-tested.
  const skyMat = makeSkyMaterial()
  const skyQuad = new Mesh(new PlaneGeometry(1, 1), skyMat)
  skyQuad.frustumCulled = false
  skyQuad.renderOrder = -100
  scene.add(skyQuad)

  /* ---- World ---- */

  const world = new Group()
  scene.add(world)

  const ground = buildGround()
  world.add(ground.mesh)

  const roads = buildRoads(DISTRICTS)
  world.add(roads.mesh)

  const core = buildCore()
  world.add(core.group)

  const districts = DISTRICTS.map(buildDistrict)
  districts.forEach((d) => world.add(d.group))

  const derelict = buildDerelict()
  world.add(derelict.group)

  const conduits = buildConduits(
    core.anchor,
    districts.map((d) => ({ key: d.key, anchor: d.anchor })),
    cap.dots,
  )
  world.add(conduits.group)

  const ascent = buildAscent()
  world.add(ascent.group)
  const ramps = buildAscentRamps(ascent.anchors)
  world.add(ramps.group)

  const scatter = cap.scatter ? buildScatter(DISTRICTS) : null
  if (scatter) world.add(scatter.group)

  /* ---- Post chain ---- */

  const target = new WebGLRenderTarget(
    Math.max(1, Math.floor(size.x * dpr)),
    Math.max(1, Math.floor(size.y * dpr)),
    { type: HalfFloatType, samples: cap.msaa },
  )

  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))

  // Threshold above 1.0 is the whole trick: the near-white models peak just
  // under 1.0 after tone mapping, and the conduit shader writes above it. So the
  // conduits glow and not one roof does.
  const bloom = new UnrealBloomPass(new Vector2(size.x, size.y), 0.5, 0.5, 1.05)
  bloom.enabled = cap.bloom
  composer.addPass(bloom)

  composer.addPass(new OutputPass())

  const grade = new ShaderPass(GradeShader)
  grade.uniforms.uResolution!.value = new Vector2(size.x, size.y)
  composer.addPass(grade)
  composer.setSize(size.x, size.y)

  /* ---- Camera flight ---- */

  const { path, lookAt } = buildCameraCurves()
  const driver = new ScrollDriver({ smoothTime: 0.4, maxSpeed: 1.5 })
  driver.attach(mount)

  /**
   * Camera filter state.
   *
   * `raw*` holds this frame's curve sample; `cam*` is the filtered value that is
   * actually applied. Seeded from the first keyframe so the opening frame is the
   * composed establishing shot rather than a drift into it.
   */
  const rawPos = new Vector3()
  const rawLook = new Vector3()
  const camPos = new Vector3(...KEYFRAMES[0]!.pos)
  const camLook = new Vector3(...KEYFRAMES[0]!.look)
  let fovCurrent = KEYFRAMES[0]!.fov ?? 38

  /** Filter cutoff. Higher follows the spline more tightly and wobbles more;
   *  lower is calmer but lags the scroll. 9 keeps the lag under ~110ms. */
  const CAMERA_DAMP = 9

  /** Fixed integration step for the camera chain. 120Hz so a 120Hz display still
   *  gets one sub-step per frame and a 60Hz display gets exactly two. */
  const FIXED_STEP = 1 / 120
  /** Precomputed because the step never varies — that is the whole point. */
  const FIXED_K = 1 - Math.exp(-CAMERA_DAMP * FIXED_STEP)
  /** Ceiling on catch-up work after a stall or a backgrounded tab, so a long
   *  gap never turns into hundreds of sub-steps in one frame. */
  const MAX_ACCUM = 0.25
  let accumulator = 0

  /**
   * Opt-in camera telemetry, enabled with `?journeydebug` in the URL.
   *
   * Publishes the camera's world position and orientation on the mount each
   * frame so smoothness can actually be measured rather than eyeballed — the
   * difference between "looks fine to me" and a number. Off by default and free
   * when off; this is the only per-frame DOM write in the loop.
   */
  const debugCamera =
    typeof location !== 'undefined' && location.search.includes('journeydebug')

  /* ---- Frame loop ---- */

  const clock = new Clock()
  let lastStage = -1
  let fade = 0
  let destroyed = false

  const frameTimes: number[] = []
  let degradeLevel = 0
  let watchdog = false
  // Shader compilation and shadow-map warmup always spike the first second;
  // degrading on that would be wrong.
  const armTimer = setTimeout(() => (watchdog = true), 1500)

  function degrade(): void {
    degradeLevel++
    if (degradeLevel === 1 && bloom.enabled) {
      bloom.enabled = false
      return
    }
    if (degradeLevel === 2 && renderer.shadowMap.enabled) {
      // Shadows are the most expensive thing in this scene: a second full pass
      // over every casting mesh.
      renderer.shadowMap.enabled = false
      key.castShadow = false
      SHARED_MATERIALS.forEach((m) => (m.needsUpdate = true))
      return
    }
    if (degradeLevel === 3 && dpr > 1) {
      dpr = 1
      renderer.setPixelRatio(1)
      resize()
      return
    }
    mount.setAttribute('data-journey-state', 'degraded')
    destroy()
  }

  function checkPerf(dt: number): void {
    if (!watchdog || destroyed) return
    frameTimes.push(dt)
    if (frameTimes.length < 90) return
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    frameTimes.length = 0
    if (avg > 1 / 26) degrade()
  }

  function frame(): void {
    if (destroyed) return

    const dt = clock.getDelta()
    const elapsed = clock.getElapsedTime()

    // --- Camera on the spline, integrated on a fixed timestep ---
    //
    // This loop is the reason the flight is steady. Browser frame times jitter
    // by several milliseconds even at a locked refresh rate, and *any* filter
    // advanced by a variable dt turns that jitter into velocity ripple: the
    // camera's turn rate changes slightly every frame, which is precisely what
    // reads as wobble. Compensating the filter coefficient for dt (the usual
    // `1 - e^(-k·dt)` trick) makes the filter converge correctly but does not
    // remove the ripple, because the *scroll target* is also advancing in
    // uneven, input-driven bursts.
    //
    // Accumulating real time and stepping the whole chain — scroll spring, curve
    // sample, position/target/FOV filters — at a constant 1/120s removes the
    // variable from the system entirely. Frame time then affects only how many
    // identical sub-steps run, never how far each one moves.
    accumulator = Math.min(accumulator + dt, MAX_ACCUM)
    while (accumulator >= FIXED_STEP) {
      const p = driver.update(FIXED_STEP)

      // Sampled inside the loop so the filters see a correctly-advanced target
      // at every sub-step rather than one stale sample reused.
      path.getPoint(p, rawPos)
      lookAt.getPoint(p, rawLook)

      camPos.lerp(rawPos, FIXED_K)
      camLook.lerp(rawLook, FIXED_K)
      fovCurrent += (fovAt(p) - fovCurrent) * FIXED_K

      accumulator -= FIXED_STEP
    }

    const progress = driver.current
    const speed = driver.intensity

    camera.position.copy(camPos)
    camera.lookAt(camLook)

    // No roll. Reading and writing `camera.rotation.z` after `lookAt` decomposes
    // the freshly-built quaternion into Euler angles, and that decomposition is
    // degenerate when the camera looks steeply down — which is exactly what the
    // overhead stage does. The result was a visible wobble precisely where the
    // shot should be calmest. A banking camera is a flight-sim affectation
    // anyway; this is architectural-model photography.

    // FOV is filtered in the same loop, for the same reason: it is linear within
    // a segment, so its slope changes abruptly at every knot and would otherwise
    // produce a small zoom kick at each stage boundary.
    if (Math.abs(camera.fov - fovCurrent) > 0.01) {
      camera.fov = fovCurrent
      camera.updateProjectionMatrix()
    }

    // --- Stage bookkeeping ---
    const { index } = stageAt(progress)
    if (index !== lastStage) {
      lastStage = index
      const stageKey = STAGE_KEYS[index] ?? ''
      mount.setAttribute('data-stage', stageKey)
      mount.setAttribute('data-stage-index', String(index))
      track.stage(index, stageKey)
    }

    // --- Systems ---
    tickMaterials(elapsed, speed, progress)
    conduits.update(progress)
    core.update(elapsed)

    const methodologyIndex = STAGE_KEYS.indexOf('methodology')
    ramps.update(
      gsap.utils.clamp(0, 1, progress * (STAGE_COUNT - 1) - (methodologyIndex - 0.7)),
    )

    if (debugCamera) {
      mount.setAttribute(
        'data-cam',
        [
          camera.position.x, camera.position.y, camera.position.z,
          camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w,
        ]
          .map((n) => n.toFixed(8))
          .join(','),
      )
    }

    fade = Math.min(1, fade + dt * 0.9)
    grade.uniforms.uTime!.value = elapsed
    grade.uniforms.uSpeed!.value = speed
    grade.uniforms.uFade!.value = fade

    composer.render()
    checkPerf(dt)
  }

  /* ---- Resize ---- */

  function resize(): void {
    if (destroyed) return
    measure()
    camera.aspect = size.x / Math.max(1, size.y)
    camera.updateProjectionMatrix()
    renderer.setSize(size.x, size.y, false)
    composer.setSize(size.x, size.y)
    bloom.setSize(size.x, size.y)
    grade.uniforms.uResolution!.value.set(size.x, size.y)
    driver.measure()
  }

  const onResize = () => resize()
  // ResizeObserver catches mobile browser chrome collapsing, which `resize` does
  // not reliably fire for.
  const ro = new ResizeObserver(onResize)
  ro.observe(mount)
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('orientationchange', onResize)

  const onVisibility = () => {
    if (document.hidden) {
      gsap.ticker.remove(frame)
    } else {
      clock.getDelta()
      driver.snap()
      gsap.ticker.add(frame)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  const onContextLost = (e: Event) => {
    e.preventDefault()
    mount.setAttribute('data-journey-state', 'lost')
    destroy()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  /* ---- Go ---- */

  // Compile everything up front. Without this the first frames of the flight
  // stutter as each new material reaches the camera.
  try {
    renderer.compile(scene, camera)
  } catch {
    /* non-fatal */
  }

  gsap.ticker.add(frame)
  mount.setAttribute('data-journey-state', 'running')

  // The world is static and the sun is fixed, so the shadow map only needs
  // rendering once. Freezing it after a couple of frames removes an entire
  // scene traversal per frame — by far the largest single saving available here.
  // The core's rotating rings keep their first-frame shadow, which is not
  // noticeable at any point on the flight path.
  if (cap.shadows) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        renderer.shadowMap.autoUpdate = false
      }),
    )
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true

    clearTimeout(armTimer)
    gsap.ticker.remove(frame)
    ro.disconnect()
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onContextLost)

    districts.forEach((d) => d.dispose())
    derelict.dispose()
    conduits.dispose()
    ramps.dispose()
    ascent.dispose()
    scatter?.dispose()
    core.dispose()
    roads.dispose()
    ground.dispose()
    skyQuad.geometry.dispose()
    skyMat.dispose()
    SHARED_MATERIALS.forEach((m) => m.dispose())

    composer.dispose()
    target.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()

    if (active === journey) active = null
    if (mount.getAttribute('data-journey-state') === 'running') {
      mount.setAttribute('data-journey-state', 'stopped')
    }
  }

  const journey: Journey = { destroy, progress: () => driver.current }
  active = journey
  return journey
}

export function stopJourney(): void {
  active?.destroy()
  active = null
}
