import { useEffect, useRef, useState, type FormEvent } from 'react'
import { track } from '@/lib/analytics'

/**
 * Declarative form island, shared by the contact and support pages.
 *
 * The fields are described as data rather than markup so both pages get
 * identical validation, error handling, honeypot and timing behaviour without
 * duplicating any of it — and adding a field is a one-line change.
 *
 * Progressive enhancement note: this is one of the few places on the site that
 * genuinely requires JavaScript, because it posts JSON to a validated endpoint.
 * The pages that use it therefore always print the email address and phone
 * number next to the form, so there is a working path with the island inert.
 */

export interface Field {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select'
  required?: boolean
  placeholder?: string
  options?: string[]
  /** Grid span out of 2 columns. */
  wide?: boolean
  autoComplete?: string
  help?: string
}

interface Props {
  endpoint: string
  fields: Field[]
  submitLabel: string
  /** Extra values posted alongside the fields (e.g. `kind`). */
  hidden?: Record<string, string>
  successTitle: string
  successBody: string
  /** Analytics name. */
  formName: string
}

type State = 'idle' | 'sending' | 'done' | 'error'

export default function Form({
  endpoint,
  fields,
  submitLabel,
  hidden = {},
  successTitle,
  successBody,
  formName,
}: Props) {
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string>('')
  const [badField, setBadField] = useState<string>('')
  const [reference, setReference] = useState<string>('')
  const mounted = useRef(Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  // Reset the fill-time baseline on mount so a cached page does not report an
  // implausibly long elapsed time — and so a bfcache restore starts fresh.
  useEffect(() => {
    mounted.current = Date.now()
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending') return

    setState('sending')
    setError('')
    setBadField('')

    const form = new FormData(event.currentTarget)
    const payload: Record<string, unknown> = {
      ...hidden,
      elapsed: Date.now() - mounted.current,
      page: location.pathname,
      referrer: document.referrer || undefined,
      session: track.sessionId(),
    }
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') payload[key] = value
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        field?: string
        reference?: string
        ticket?: string | number
      }

      if (!res.ok || !body.ok) {
        setState('error')
        setError(body.error ?? 'Something went wrong. Please try again, or email us directly.')
        setBadField(String(body.field ?? ''))
        track.formSubmit(formName, false)
        return
      }

      setReference(String(body.reference ?? body.ticket ?? ''))
      setState('done')
      track.formSubmit(formName, true)
      formRef.current?.reset()
    } catch {
      setState('error')
      setError('We could not reach our systems. Please try again, or email us directly.')
      track.formSubmit(formName, false)
    }
  }

  if (state === 'done') {
    return (
      <div className="fm fm--done" role="status" aria-live="polite">
        <svg className="fm__tick" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 12.5 10.5 16 17 9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <h3 className="fm__title">{successTitle}</h3>
        <p className="fm__body">{successBody}</p>
        {reference && (
          <p className="fm__ref">
            Reference <strong>{reference}</strong>
          </p>
        )}
      </div>
    )
  }

  return (
    <form ref={formRef} className="fm" onSubmit={onSubmit} noValidate>
      {/* Honeypot. Hidden from humans and from assistive tech, visible to bots. */}
      <div className="fm__pot" aria-hidden="true">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="fm__grid">
        {fields.map((field) => {
          const id = `f-${field.name}`
          const invalid = badField === field.name
          return (
            <p
              key={field.name}
              className={`fm__row${field.wide || field.type === 'textarea' ? ' fm__row--wide' : ''}`}
            >
              <label className="fm__label" htmlFor={id}>
                {field.label}
                {field.required && <span aria-hidden="true"> *</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={id}
                  name={field.name}
                  rows={6}
                  required={field.required}
                  placeholder={field.placeholder}
                  aria-invalid={invalid || undefined}
                  aria-describedby={field.help ? `${id}-help` : undefined}
                />
              ) : field.type === 'select' ? (
                <span className="fm__selectWrap">
                  <select
                    id={id}
                    name={field.name}
                    required={field.required}
                    defaultValue=""
                    aria-invalid={invalid || undefined}
                  >
                    <option value="" disabled>
                      Choose one
                    </option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={field.type ?? 'text'}
                  required={field.required}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  aria-invalid={invalid || undefined}
                  aria-describedby={field.help ? `${id}-help` : undefined}
                />
              )}

              {field.help && (
                <span className="fm__help" id={`${id}-help`}>
                  {field.help}
                </span>
              )}
            </p>
          )
        })}
      </div>

      {state === 'error' && (
        <p className="fm__error" role="alert">
          {error}
        </p>
      )}

      <div className="fm__foot">
        <button className="btn btn--solid" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : submitLabel}
        </button>
        <span className="fm__note">
          We reply within one business day. No newsletters, no reselling your details.
        </span>
      </div>
    </form>
  )
}
