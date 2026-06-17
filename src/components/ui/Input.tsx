import { clsx } from 'clsx';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  required?: boolean;
}

export function Input({
  label,
  error,
  icon,
  className,
  required,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="text-alert-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'input-base',
            icon && 'pl-10',
            error && 'border-alert-danger focus:border-alert-danger focus:ring-red-100',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-alert-danger">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export function Select({
  label,
  error,
  className,
  required,
  options = [],
  children,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="text-alert-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        className={clsx(
          'select-base',
          error && 'border-alert-danger focus:border-alert-danger focus:ring-red-100',
          className
        )}
        {...props}
      >
        {options.length > 0 && (
          <>
            <option value="">请选择</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </>
        )}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-alert-danger">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function Textarea({
  label,
  error,
  className,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="text-alert-danger ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'input-base resize-y min-h-[80px]',
          error && 'border-alert-danger focus:border-alert-danger focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-alert-danger">{error}</p>}
    </div>
  );
}

export default Input;
