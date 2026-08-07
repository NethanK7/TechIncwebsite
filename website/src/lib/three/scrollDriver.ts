/**
 * Turns raw scroll position into the damped `progress` value the camera flies on.
 *
 * The damping is the whole trick. Feeding scroll straight into a camera on a
 * spline feels mechanical and jitters with every wheel tick. Passing it through
 * a critically-damped spring gives the camera mass: it leads into a move, and
 * it settles rather than stopping. vectrfl.com does exactly this — its bundle
 * carries `cameraSmoothTime`, `cameraVelocity` and `progressDamp`.
 *
 * The velocity that falls out of the spring is reused as a motion signal:
 * conduit pulses accelerate and the grain lifts while the camera is moving fast.
 */

export interface ScrollDriverOptions {
  /** Seconds for the value to close most of the gap. Higher = heavier camera. */
  smoothTime?: number
  /** Hard cap on progress-per-second, so a flung scrollbar cannot teleport. */
  maxSpeed?: number
}

export class ScrollDriver {
  /** Where scroll says we are, 0→1. */
  target = 0
  /** Where the camera actually is, 0→1. */
  current = 0
  /** Signed progress-per-second. */
  velocity = 0

  private smoothTime: number
  private maxSpeed: number
  private el: HTMLElement | null = null

  constructor({ smoothTime = 0.42, maxSpeed = 1.4 }: ScrollDriverOptions = {}) {
    this.smoothTime = smoothTime
    this.maxSpeed = maxSpeed
  }

  /**
   * Track an element's scroll span. Progress is 0 when its top hits the top of
   * the viewport and 1 when its bottom hits the bottom.
   */
  attach(el: HTMLElement): void {
    this.el = el
    this.measure()
    this.current = this.target
  }

  private spanTop = 0
  private spanLength = 1

  measure(): void {
    if (!this.el) return
    const rect = this.el.getBoundingClientRect()
    this.spanTop = rect.top + window.scrollY
    this.spanLength = Math.max(1, this.el.offsetHeight - window.innerHeight)
    this.read()
  }

  /** Sample scroll position. Cheap enough to call every frame. */
  read(): void {
    if (!this.el) return
    const y = window.scrollY - this.spanTop
    this.target = Math.max(0, Math.min(1, y / this.spanLength))
  }

  /**
   * Critically-damped spring toward `target`.
   *
   * Standard implicit formulation (Game Programming Gems 4): unconditionally
   * stable for any dt, unlike an explicit spring which explodes when a
   * background tab returns with a huge delta.
   */
  update(dt: number): number {
    this.read()

    // Clamp dt: a tab restored after a minute must not integrate a minute.
    const step = Math.min(dt, 1 / 20)

    const omega = 2 / this.smoothTime
    const x = omega * step
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

    let change = this.current - this.target
    const maxChange = this.maxSpeed * this.smoothTime
    change = Math.max(-maxChange, Math.min(maxChange, change))

    const temp = (this.velocity + omega * change) * step
    this.velocity = (this.velocity - omega * temp) * exp
    let result = this.target + (change + temp) * exp

    // Never overshoot past the target on the closing approach — an overshoot at
    // the end of the timeline would fly the camera past the gateway.
    if (this.target - this.current > 0 === result > this.target) {
      result = this.target
      this.velocity = (result - this.target) / step
    }

    this.current = result
    return this.current
  }

  /** 0→1 normalised speed, for driving pulse rate and grain intensity. */
  get intensity(): number {
    return Math.min(1, Math.abs(this.velocity) / 0.35)
  }

  /** Jump without animating — used after a view transition or an anchor jump. */
  snap(): void {
    this.measure()
    this.current = this.target
    this.velocity = 0
  }
}
