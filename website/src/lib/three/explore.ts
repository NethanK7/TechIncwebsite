/**
 * Explore mode — the easter egg.
 *
 * Hands the camera over to the visitor: WASD to walk the ERP city, mouse to
 * look, shift to run, F to fly. It reuses the exact world the scroll journey
 * builds, so there is no second scene to maintain and nothing extra to download
 * beyond this file.
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
 * Two movement modes
 * ------------------
 * Walking is grounded: fixed eye height, gravity, ground-plane heading, so
 * looking up at a crane does not launch you at it. Flying is the opposite and
 * deliberately so — heading follows the full view direction, gravity is off, and
 * the speed roughly quadruples, because the world is about 1.3km across and a
 * walking pace makes the outposts feel like a chore rather than a destination.
 *
 * Neither mode collides with the city. You pass through the districts, which is
 * a deliberate trade: real collision would need a spatial index over a few
 * hundred thousand merged triangles for something nobody is trying to speedrun.
 * The exceptions are a soft cylinder at the world edge and a keep-out around the
 * core, both of which push rather than stop.
 */

import { Euler, MathUtils, PerspectiveCamera, Vector3 } from 'three'

import { DISTRICTS, DERELICT, CORE, OUTPOSTS } from './layout'

/** Where the camera sits above the ground while walking, in world units. */
const EYE_HEIGHT = 5.2
const WALK_SPEED = 30
const RUN_MULTIPLIER = 2.8
/** How quickly velocity reaches the target. Higher is twitchier. */
const ACCEL = 9
const GRAVITY = 90
const JUMP_SPEED = 34

/**
 * Flight.
 *
 * Faster and floatier than walking on purpose: a lower acceleration means the
 * camera keeps drifting after the key is released, which reads as momentum
 * rather than as a camera being dragged. `FLY_LIFT` is the vertical rate for
 * Space and C, which is deliberately slower than the horizontal speed — rising
 * too fast makes it impossible to judge your own altitude.
 */
const FLY_SPEED = 92
const FLY_BOOST = 3.2
const FLY_ACCEL = 4.2
const FLY_LIFT = 58
/** Height of the core's mast plus clearance — the highest thing worth clearing. */
const MAX_ALTITUDE = 430

/**
 * How far out you may travel.
 *
 * Comfortably past the outpost ring (which reaches about 470 units out), so you
 * can fly right around the outside of the model and look back at it. The ground
 * plane is 3000 across, so the edge of the world is never the edge of the ground.
 */
const WORLD_RADIUS = 820

/**
 * The one solid object in the world.
 *
 * Explore mode has no collision mesh — you walk through the districts, which is
 * a deliberate trade (see the header). The core is the exception, because it is
 * the only object big enough that walking into it puts the camera *inside* the
 * geometry: you get backfaces, the podium filling the top and bottom of the
 * frame, and the whole scene reading as broken. Its podium is 31 units across,
 * so a 34-unit keep-out stops you at the steps with the monolith filling the
 * view — which is the shot you actually want when you arrive.
 *
 * It only applies below the crown. Above that you are clear of the structure and
 * flying over the core is one of the better things you can do up there.
 */
const CORE_KEEP_OUT = 34
const CORE_CLEARANCE = CORE.height + 26
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
  nearest(): { key: string; label: string; distance: number; blurb: string; inside: boolean } | null
  /** Movement mode and altitude, for the readout. */
  state(): { flying: boolean; altitude: number }
  destroy(): void
}

interface Place {
  key: string
  label: string
  at: Vector3
  radius: number
  /** Shown once you are actually standing in it — the reason it is here. */
  blurb: string
}

/**
 * What each district is running, keyed by district.
 *
 * Real ERPNext doctypes rather than feature-speak: the point of walking the city
 * is to see that every building is one part of one system, and naming the actual
 * documents is what makes that concrete.
 */
const BLURBS: Record<string, string> = {
  construction: 'Projects, Tasks and Timesheets. Hours and materials cost to the job as they happen.',
  warehousing: 'Stock Entries, Delivery Notes and the Stock Ledger. Every movement, one running balance.',
  manufacturing: 'BOMs, Work Orders and Job Cards. Production consumes stock and books its own cost.',
  accounts: 'The General Ledger. Every transaction in this city posts here, in the same database write.',
  sales: 'Leads, Quotations, Sales Orders. The pipeline that becomes the invoices next door.',
  people: 'Employees, Attendance, Salary Slips. Payroll posts to the ledger with EPF and ETF handled.',
}

/** Every labelled destination, for the compass readout and the fast-travel keys. */
export function places(): Place[] {
  return [
    {
      key: 'core',
      label: 'The Frappe core — one database',
      at: CORE.at.clone(),
      radius: 40,
      blurb: 'One framework, one database. Every district around you reads and writes these same rows.',
    },
    ...DISTRICTS.map((d) => ({
      key: d.key,
      label: d.label,
      at: d.at.clone(),
      radius: d.radius,
      blurb: BLURBS[d.key] ?? '',
    })),
    // The outer ring: the industries, as places. They carry their own copy.
    ...OUTPOSTS.map((o) => ({
      key: o.key,
      label: o.label,
      at: o.at.clone(),
      radius: o.radius,
      blurb: o.blurb,
    })),
    {
      key: 'derelict',
      label: 'Before — a business with no system',
      at: DERELICT.at.clone(),
      radius: DERELICT.radius,
      blurb: 'Nothing is wired to anything. No conduits, no ledger, nobody walking. This is the starting point.',
    },
  ]
}

export function startExplore(host: ExploreHost): ExploreSession {
  const { camera, canvas } = host

  const PLACES = places()

  // Start on the approach to the core, looking straight at it — a legible
  // opening shot rather than wherever the scroll happened to leave the camera.
  // Close enough that the core is the nearest labelled place, so the readout
  // names the thing filling the screen.
  const position = new Vector3(0, EYE_HEIGHT, 86)
  const velocity = new Vector3()
  let verticalVelocity = 0
  let grounded = true

  // Yaw/pitch kept as scalars rather than read back off the camera: decomposing
  // a quaternion into Euler angles every frame is unstable near vertical, which
  // is exactly where a mouse-look camera spends time.
  // yaw 0 faces -Z. Standing at +Z looking back at the origin is therefore yaw 0,
  // not PI — heading is (-sin yaw, 0, -cos yaw), same as the camera's local -Z.
  let yaw = 0
  let pitch = -0.02

  const keys = new Set<string>()
  let destroyed = false
  let locked = false

  /** Movement mode. Walking until the visitor asks for flight. */
  let flying = false
  /** Timestamp of the last Space press, for the double-tap shortcut. */
  let lastSpace = 0

  /* ---- Input ---- */

  const HANDLED = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
    'ShiftLeft', 'ShiftRight', 'Space',
    'KeyF', 'KeyC', 'ControlLeft', 'ControlRight',
  ])

  /** Double-tapping Space within this window takes off, as most games do. */
  const DOUBLE_TAP_MS = 320

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape') return // pointer lock handles its own exit
    // Only swallow the keys we actually use, so browser shortcuts still work.
    if (!HANDLED.has(e.code)) return
    e.preventDefault()

    // F toggles flight. Double-tapping Space is the second way in, because it is
    // the gesture people already try, and a control nobody discovers is a
    // control nobody has.
    if (e.code === 'KeyF' && !e.repeat) {
      flying = !flying
      if (flying) verticalVelocity = 0
    } else if (e.code === 'Space' && !e.repeat) {
      const now = performance.now()
      if (!flying && now - lastSpace < DOUBLE_TAP_MS) {
        flying = true
        verticalVelocity = 0
      }
      lastSpace = now
    }

    keys.add(e.code)
  }
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code)

  const look = (dx: number, dy: number) => {
    yaw -= dx * LOOK_SENSITIVITY
    pitch -= dy * LOOK_SENSITIVITY
    // Just short of straight up/down, so the horizon never flips.
    pitch = MathUtils.clamp(pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (locked) {
      look(e.movementX, e.movementY)
    } else if (dragging) {
      // Drag fallback. `movementX` is unreliable outside pointer lock in some
      // browsers, so track the delta ourselves.
      look(e.clientX - lastX, e.clientY - lastY)
      lastX = e.clientX
      lastY = e.clientY
    }
  }

  const onLockChange = () => {
    const wasLocked = locked
    locked = document.pointerLockElement === canvas
    // Releasing the pointer (Escape, or tabbing away) exits the mode entirely
    // rather than leaving the visitor in a half-state with no way back.
    //
    // Only when the lock was actually engaged, though. A browser that refuses
    // the request outright — no user gesture in the chain, an unsupported or
    // policy-blocked context — also fires this event, and treating that as an
    // exit would eject the visitor the instant they entered.
    if (wasLocked && !locked && !destroyed) host.onExit()
  }

  /**
   * Drag-to-look, for when pointer lock is unavailable.
   *
   * Pointer lock can be refused for reasons that have nothing to do with the
   * visitor: no user gesture survived the dynamic import chain, an embedded
   * context, or a browser policy. Without a fallback that leaves someone inside
   * explore mode able to move but unable to turn, which is worse than not
   * offering the mode at all.
   */
  let dragging = false
  let lastX = 0
  let lastY = 0

  const onMouseDown = (e: MouseEvent) => {
    if (locked || destroyed) return
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
  }
  const onMouseUp = () => {
    dragging = false
  }

  const onClick = () => {
    if (!locked && !destroyed) {
      // Returns a promise in modern browsers; a rejection here is exactly the
      // case the drag fallback exists for, so swallow it rather than logging.
      const req = canvas.requestPointerLock() as unknown as Promise<void> | undefined
      if (req && typeof req.catch === 'function') req.catch(() => {})
    }
  }

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mouseup', onMouseUp)
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

    const boosting = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const ahead = keys.has('KeyW') || keys.has('ArrowUp')
    const back = keys.has('KeyS') || keys.has('ArrowDown')
    const rightward = keys.has('KeyD') || keys.has('ArrowRight')
    const leftward = keys.has('KeyA') || keys.has('ArrowLeft')

    if (flying) {
      // Heading follows the full view direction, pitch included: you fly where
      // you are looking. That is the whole difference from walking, and it is
      // what makes climbing feel like flying rather than like riding a lift.
      const cosPitch = Math.cos(pitch)
      forward.set(-Math.sin(yaw) * cosPitch, Math.sin(pitch), -Math.cos(yaw) * cosPitch)
      right.set(Math.cos(yaw), 0, -Math.sin(yaw))

      desired.set(0, 0, 0)
      if (ahead) desired.add(forward)
      if (back) desired.sub(forward)
      if (rightward) desired.add(right)
      if (leftward) desired.sub(right)
      if (desired.lengthSq() > 0) {
        desired.normalize().multiplyScalar(FLY_SPEED * (boosting ? FLY_BOOST : 1))
      }

      // Direct vertical thrust on top of the view-relative movement, so you can
      // hold altitude while looking down at something.
      const lift =
        (keys.has('Space') ? 1 : 0) -
        (keys.has('KeyC') || keys.has('ControlLeft') || keys.has('ControlRight') ? 1 : 0)
      desired.y += lift * FLY_LIFT * (boosting ? 1.8 : 1)

      const k = 1 - Math.exp(-FLY_ACCEL * step)
      velocity.lerp(desired, k)
      position.addScaledVector(velocity, step)

      // Ceiling and floor. Touching down does not land you — you keep flying at
      // ground level until you press F, which is what people expect.
      if (position.y > MAX_ALTITUDE) {
        position.y = MAX_ALTITUDE
        velocity.y = Math.min(velocity.y, 0)
      }
      if (position.y < EYE_HEIGHT) {
        position.y = EYE_HEIGHT
        velocity.y = Math.max(velocity.y, 0)
      }
      verticalVelocity = 0
      grounded = false
    } else {
      // Heading vectors on the ground plane: looking up should not slow you down.
      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
      right.set(Math.cos(yaw), 0, -Math.sin(yaw))

      desired.set(0, 0, 0)
      if (ahead) desired.add(forward)
      if (back) desired.sub(forward)
      if (rightward) desired.add(right)
      if (leftward) desired.sub(right)

      const speed = WALK_SPEED * (boosting ? RUN_MULTIPLIER : 1)
      if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed)

      // Frame-rate independent approach, the same form used by the scroll camera.
      const k = 1 - Math.exp(-ACCEL * step)
      velocity.lerp(desired, k)
      velocity.y = 0
      position.addScaledVector(velocity, step)

      // Vertical: a small hop, then gravity back to eye height. Leaving flight
      // mid-air falls through this same branch, so you drop rather than teleport.
      if (keys.has('Space') && grounded) {
        verticalVelocity = JUMP_SPEED
        grounded = false
      }
      if (!grounded || position.y > EYE_HEIGHT) {
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

    // And out of the core, but only below its crown — above that there is
    // nothing to walk into and flying over it is the point. Same soft push, so
    // walking into it slides you around the podium rather than stopping you dead
    // against an invisible wall.
    if (position.y < CORE_CLEARANCE) {
      const fromCore = Math.hypot(position.x - CORE.at.x, position.z - CORE.at.z)
      if (fromCore < CORE_KEEP_OUT && fromCore > 0.001) {
        const push = (CORE_KEEP_OUT - fromCore) / fromCore
        position.x += (position.x - CORE.at.x) * push
        position.z += (position.z - CORE.at.z) * push
        velocity.multiplyScalar(0.6)
      }
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
    return {
      key: best.key,
      label: best.label,
      distance: Math.round(bestDist),
      blurb: best.blurb,
      // Inside its footprint, so the readout can switch from "how far" to "what
      // this place is" exactly when you arrive.
      inside: bestDist <= best.radius,
    }
  }

  return {
    update,
    nearest,
    state: () => ({ flying, altitude: Math.round(position.y - EYE_HEIGHT) }),
    destroy() {
      if (destroyed) return
      destroyed = true
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('pointerlockchange', onLockChange)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('blur', onBlur)
      keys.clear()
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    },
  }
}
