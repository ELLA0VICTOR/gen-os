import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <label className="field" htmlFor={inputId}>
      {label && <span className="field-label">{label}</span>}
      <input id={inputId} className={`input ${className}`} {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Textarea({ label, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id ?? props.name

  return (
    <label className="field" htmlFor={inputId}>
      {label && <span className="field-label">{label}</span>}
      <textarea id={inputId} className={`input textarea ${className}`} {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
