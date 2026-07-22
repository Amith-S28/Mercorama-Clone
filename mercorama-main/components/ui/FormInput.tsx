import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface FormInputProps extends React.ComponentProps<'input'> {
  label?: string
  helperText?: string
  errorText?: string
}

function FormInput({ label, helperText, errorText, className, id, ...props }: FormInputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <Input
        id={inputId}
        aria-invalid={!!errorText}
        aria-describedby={
          errorText
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-helper`
              : undefined
        }
        className={className}
        {...props}
      />
      {errorText && (
        <p id={`${inputId}-error`} className="text-xs text-red-600 dark:text-red-400 mt-1">
          {errorText}
        </p>
      )}
      {!errorText && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  )
}

export { FormInput }
