/**
 * Explore mode — the easter egg.
 *
 * Hands the camera over to the visitor: WASD to walk the ERP city, mouse to
 * look, shift to run, space to rise, E to read a district. It reuses the exact
 * world the scroll journey builds, so there is no second scene to maintain and
 * nothing extra to download beyond this file.
 *
 * How it takes control
 * --------------------
 * The journey engine owns the renderer, the scene and the frame loop. Explore
 * mode does not fork any of that; it asks the engine for a controller
 * (`engine.takeControl()`), which suspends the scroll-driven camera and lets
 * this module position the camera each frame instead. Releasing hands it back.
 * One renderer, one loop, one scene — the alternative would double the memory
 * for a feature most visitors never find.
 *
 * Movement is deliberately grounded: eye height is fixed, gravity pulls you back
 * to it, and district aprons are not solid — you walk through the city, not
 * around a collision mesh. Building collision would need a spatial index over a
 * few thousand merged triangles for something nobody is trying to speedrun.
 * Instead the world bounds are a soft cylinder that pushes you back in.
 */

import { Euler, MathUtils, PerspectiveCamera, Vector3 } from 'three'

import { DISTRICTS, DERELICT, CORE } from './layout'

/** Where the camera sits above the ground while walking, in world units. */
const EYE_HEIGHT = 5.2
const WALK_SPEED = 42
const RUN_MULTIPLIER = 2.6
/** How quickly velocity reaches the target. Higher is twitchier. */
const ACCEL = 9
const GRAVITY = 90
const JUMP_SPEED = 34
const WORLD_RADIUS = 560
const LOOK_SENSITIVITY = 0.0022

export interface ExploreHost {
  camera: PerspectiveCamera
  /** Element that receives pointer lock and key focus. */
  canvas: HTMLCanvasElement
  /** Called when the visitor exits, so the host can resume the scroll journey. */
  onExit: () => void
}

export interface ExploreSession {
  /** Advance one frame. Called by the host's existing loop. */
  update(dt: number): void
  /** Nearest labelled place, for the on-screen readout. */
  nearest(): { key: string; label: string; distance: number } | null
  destroy(): void
}

interface Place {
  key: string
  label: string
  at: Vector3
  radius: number
}

/** Every labelled destination, for the compass readout and the fast-travel keys. */
export function places(): Place[] {
  return [
    { key: 'core', label: 'The Frappe core — one database', at: CORE.at.clone(), radius: 40 },
    ...DISTRICTS.map((d) => ({
      key: d.key,
      label: d.label,
      at: d.at.clone(),
      radius: d.radius,
    })),
    {
      key: 'derelict',
      label: 'Before — a business with no system',
      at: DERELICT.at.clone(),
      radius: DERELICT.radius,
    },
  ]
}

export function startExplore(host: ExploreHost): ExploreSession {
  const { camera, canvas } = host

  const PLACES = places()

  // Start just outside the core, looking at it — a legible opening shot rather
  // than wherever the scroll happened to leave the camera.
  const position = new Vector3(0, EYE_HEIGHT, 120)
  const velocity = new Vector3()
  let verticalVelocity = 0
  let grounded = true

  // Yaw/pitch kept as scalars rather than read back off the camera: decomposing
  // a quaternion into Euler angles every frame is unstable near vertical, which
  // is exactly where a mouse-look camera spends time.
  let yaw = Math.PI
  let pitch = -0.06

  const keys = new Set<string>()
  let destroyed = false
  let locked = false

  /* ---- Input ---- */

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') return // pointer lock handles its own exit
    // Only swallow the keys we actually use, so browser shortcuts still work.
    if (HANDLED.has(e.code)) {
      e.preventDefault()
      keys.add(e.code)
    }
  }
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)

  const HANDLED = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
    'ShiftLeft', 'ShiftRight', 'Space',
  ])

  const onMouseMove = (e: MouseEvent) => {
    if (!locked) return
    yaw -= e.movementX * LOOK_SENSITIVITY
    pitch -= e.movementY * LOOK_SENSITIVITY
    // Just short of straight up/down, so the horizon never flips.
    pitch = MathUtils.clamp(pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05)
  }

  const onLockChange = () => {
    locked = document.pointerLockElement === canvas
    // Releasing the pointer (Escape, or tabbing away) exits the mode entirely
    // rather than leaving the visitor in a half-state with no way back.
    if (!locked && !destroyed) host.onExit()
  }

  const onClick = () => {
    if (!locked && !destroyed) canvas.requestPointerLock()
  }

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('pointerlockchange', onLockChange)
  canvas.addEventListener('click', onClick)

  // Losing focus with keys held would leave the visitor sliding forever.
  const onBlur = () => keys.clear()
  window.addEventListener('blur', onBlur)

  /* ---- Frame ---- */

  const forward = new Vector3()
  const right = new Vector3()
  const desired = new Vector3()
  const euler = new Euler(0, 0, 0, 'YXZ')

  function update(dt: number): void {
    if (destroyed) return
    const step = Math.min(dt, 1 / 20)

    // Heading vectors on the ground plane: looking up should not slow you down.
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
    right.set(Math.cos(yaw), 0, -Math.sin(yaw))

    desired.set(0, 0, 0)
    if (keys.has('KeyW') || keys.has('ArrowUp')) desired.add(forward)
    if (keys.has('KeyS') || keys.has('ArrowDown')) desired.sub(forward)
    if (keys.has('KeyD') || keys.has('ArrowRight')) desired.add(right)
    if (keys.has('KeyA') || keys.has('ArrowLeft')) desired.sub(right)

    const running = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const speed = WALK_SPEED * (running ? RUN_MULTIPLIER : 1)
    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed)

    // Frame-rate independent approach, the same form used by the scroll camera.
    const k = 1 - Math.exp(-ACCEL * step)
    velocity.lerp(desired, k)
    position.addScaledVector(velocity, step)

    // Vertical: a small hop, then gravity back to eye height.
    if (keys.has('Space') && grounded) {
      verticalVelocity = JUMP_SPEED
      grounded = false
    }
    if (!grounded) {
      verticalVelocity -= GRAVITY * step
      position.y += verticalVelocity * step
      if (position.y <= EYE_HEIGHT) {
        position.y = EYE_HEIGHT
        verticalVelocity = 0
        grounded = true
      }
    } else {
      position.y = EYE_HEIGHT
    }

    // Soft world bound: pushed back rather than stopped dead, so hitting the
    // edge feels like the model ending and not like a wall.
    const flat = Math.hypot(position.x, position.z)
    if (flat > WORLD_RADIUS) {
      const pull = (flat - WORLD_RADIUS) / flat
      position.x -= position.x * pull
      position.z -= position.z * pull
      velocity.multiplyScalar(0.9)
    }

    camera.position.copy(position)
    euler.set(pitch, yaw, 0)
    camera.quaternion.setFromEuler(euler)
  }

  function nearest() {
    let best: Place | null = null
    let bestDist = Infinity
    for (const p of PLACES) {
      const d = Math.hypot(p.at.x - position.x, p.at.z - position.z)
      if (d < bestDist) {
        bestDist = d
        best = p
      }
    }
    if (!best) return null
    return { key: best.key, label: best.label, distance: Math.round(bestDist) }
  }

  return {
    update,
    nearest,
    destroy() {
      if (destroyed) return
      destroyed = true
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onLockChange)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('blur', onBlur)
      keys.clear()
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    },
  }
}
