import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTIONS, bandFor, scoreAnswers, type Question } from '@/lib/data/assessment'
import { track } from '@/lib/analytics'
import type { Lattice } from '@/lib/three/lattice'

/**
 * ERP readiness assessment.
 *
 * One question at a time, with the 3D readiness lattice building alongside it.
 * The score is shown immediately from local computation, then the answers are
 * posted for storage — so a backend problem never presents as a broken tool.
 * The server recomputes the score independently before storing it, because it
 * becomes a lead qualification signal.
 *
 * The lattice is loaded lazily and its absence is not an error state: on a device
 * without WebGL the assessment simply has no visualiser.
 */

interface Answer {
  question: string
  answer: string
  score: number
}

type Phase = 'intro' | 'asking' | 'result'

export default function Assessment() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(Answer | null)[]>(() => QUESTIONS.map(() => null))
  const [sending, setSending] = useState(false)
  const [saveNote, setSaveNote] = useState('')
  const [wantsFollowUp, setWantsFollowUp] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const latticeRef = useRef<Lattice | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const startedAt = useRef(Date.now())

  const answered = answers.filter(Boolean) as Answer[]
  const score = scoreAnswers(answered)
  const band = bandFor(score)
  const current: Question | undefined = QUESTIONS[index]

  /* ---- Lattice lifecycle ---- */

  useEffect(() => {
    let cancelled = false
    const mount = stageRef.current
    if (!mount) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    import('@/lib/three/lattice')
      .then(({ startLattice }) => {
        if (cancelled) return
        latticeRef.current = startLattice(mount, QUESTIONS.length)
      })
      .catch(() => {
        /* no visualiser; the assessment still works */
      })

    return () => {
      cancelled = true
      latticeRef.current?.destroy()
      latticeRef.current = null
    }
  }, [])

  useEffect(() => {
    latticeRef.current?.setActive(phase === 'asking' ? index : -1)
  }, [index, phase])

  useEffect(() => {
    latticeRef.current?.setScore(phase === 'result' ? score : 0)
  }, [phase, score])

  /* ---- Flow ---- */

  const begin = () => {
    startedAt.current = Date.now()
    setPhase('asking')
    track.formStep('assessment', 1)
  }

  const choose = useCallback(
    (option: { label: string; score: number }) => {
      if (!current) return

      const next = [...answers]
      next[index] = { question: current.question, answer: option.label, score: option.score }
      setAnswers(next)
      latticeRef.current?.setPillar(index, option.score)

      if (index < QUESTIONS.length - 1) {
        setIndex(index + 1)
        track.formStep('assessment', index + 2)
        // Move focus to the new question so keyboard and screen-reader users
        // are not left behind on a control that has just been replaced.
        requestAnimationFrame(() => headingRef.current?.focus())
      } else {
        setPhase('result')
        track.formStep('assessment', QUESTIONS.length + 1)
      }
    },
    [answers, current, index],
  )

  const back = () => {
    if (index === 0) {
      setPhase('intro')
      return
    }
    setIndex(index - 1)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  const restart = () => {
    setAnswers(QUESTIONS.map(() => null))
    QUESTIONS.forEach((_, i) => latticeRef.current?.setPillar(i, 0))
    latticeRef.current?.setScore(0)
    setIndex(0)
    setSaveNote('')
    setWantsFollowUp(false)
    setPhase('intro')
  }

  /* ---- Submission ---- */

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setSaveNote('')

    const form = new FormData(event.currentTarget)
    const payload: Record<string, unknown> = {
      answers: answered,
      elapsed: Date.now() - startedAt.current,
      page: location.pathname,
      session: track.sessionId(),
    }
    for (const [k, v] of form.entries()) if (typeof v === 'string' && v) payload[k] = v

    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !body.ok) {
        setSaveNote(body.error ?? 'We could not send that. Please email us instead.')
        track.formSubmit('assessment', false)
      } else {
        setWantsFollowUp(true)
        track.formSubmit('assessment', true)
      }
    } catch {
      setSaveNote('We could not reach our systems. Please email us instead.')
      track.formSubmit('assessment', false)
    } finally {
      setSending(false)
    }
  }

  /* ---- Render ---- */

  const progress = phase === 'result' ? 1 : answered.length / QUESTIONS.length

  return (
    <div className="as">
      <div className="as__panel">
        {/* Progress rail — always present so the length of the task is honest. */}
        <div className="as__rail" aria-hidden="true">
          <span className="as__railFill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className="as__count mono">
          {phase === 'result'
            ? `Complete · ${QUESTIONS.length} of ${QUESTIONS.length}`
            : `Question ${Math.min(index + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}
        </p>

        {phase === 'intro' && (
          <div className="as__intro">
            <h2 className="as__q" tabIndex={-1} ref={headingRef}>
              How ready are you for an ERP implementation?
            </h2>
            <p className="as__hint">
              Ten questions, about five minutes. You get a score, the reasoning behind it, and
              what we would actually do next — including if that is “wait”.
            </p>
            <ul className="as__promises">
              <li>No email required to see your score</li>
              <li>Scored on readiness to benefit now, not on how much software you own</li>
              <li>We will tell you if the answer is not yet</li>
            </ul>
            <button className="btn btn--solid" type="button" onClick={begin}>
              Start the assessment
            </button>
          </div>
        )}

        {phase === 'asking' && current && (
          <div className="as__question">
            <h2 className="as__q" tabIndex={-1} ref={headingRef}>
              {current.question}
            </h2>
            <p className="as__hint">{current.hint}</p>

            <ul className="as__options" role="list">
              {current.options.map((option) => {
                const selected = answers[index]?.answer === option.label
                return (
                  <li key={option.label}>
                    <button
                      type="button"
                      className={`as__option${selected ? ' is-selected' : ''}`}
                      onClick={() => choose(option)}
                      aria-pressed={selected}
                    >
                      <span>{option.label}</span>
                      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M1 7h12M9 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>

            <button className="as__back" type="button" onClick={back}>
              ← Back
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="as__result">
            <p className="eyebrow">Your readiness score</p>
            <p className="as__score num" aria-label={`${score} out of 100`}>
              {score}
              <span className="as__scoreMax">/100</span>
            </p>
            <p className="as__band mono">{band.name}</p>

            <h2 className="as__q as__q--result" tabIndex={-1} ref={headingRef}>
              {band.headline}
            </h2>
            <p className="as__body">{band.body}</p>

            <div className="as__next">
              <p className="eyebrow">What we would do next</p>
              <p className="as__body">{band.next}</p>
            </div>

            {!wantsFollowUp ? (
              <form className="as__form" onSubmit={save}>
                <p className="as__formLead">
                  Want this written up properly, with the reasoning against your specific
                  answers? Leave your details and we will send it over.
                </p>
                <div className="as__fields">
                  <p>
                    <label htmlFor="as-name">Name</label>
                    <input id="as-name" name="name" type="text" autoComplete="name" />
                  </p>
                  <p>
                    <label htmlFor="as-email">Work email</label>
                    <input id="as-email" name="email" type="email" autoComplete="email" required />
                  </p>
                  <p>
                    <label htmlFor="as-org">Organisation</label>
                    <input id="as-org" name="organization" type="text" autoComplete="organization" />
                  </p>
                  <p>
                    <label htmlFor="as-phone">Phone</label>
                    <input id="as-phone" name="phone" type="tel" autoComplete="tel" />
                  </p>
                </div>
                {/* Honeypot */}
                <div className="fm__pot" aria-hidden="true">
                  <input name="company_website" type="text" tabIndex={-1} autoComplete="off" />
                </div>
                {saveNote && (
                  <p className="as__note" role="alert">
                    {saveNote}
                  </p>
                )}
                <div className="as__actions">
                  <button className="btn btn--solid" type="submit" disabled={sending}>
                    {sending ? 'Sending…' : 'Send me the write-up'}
                  </button>
                  <button className="as__back" type="button" onClick={restart}>
                    Start again
                  </button>
                </div>
              </form>
            ) : (
              <div className="as__thanks" role="status">
                <h3 className="as__thanksTitle">On its way.</h3>
                <p className="as__body">
                  We have your answers and your score. A consultant will send the write-up and a
                  recommendation within one business day.
                </p>
                <div className="as__actions">
                  <a className="btn btn--solid" href="/contact">
                    Book a consultation
                  </a>
                  <button className="as__back" type="button" onClick={restart}>
                    Start again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3D lattice. Purely a visualiser — never required to complete the tool. */}
      <div className="as__stage" ref={stageRef} aria-hidden="true">
        <div className="as__stageLabel mono">Readiness lattice</div>
      </div>
    </div>
  )
}
