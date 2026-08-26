import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
type ButtonSize = 'sm' | 'md' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render styles onto the single child element (e.g. an <a>) instead of a <button>. */
  asChild?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-br from-[var(--allevo-action-start)] to-[var(--allevo-action-end)] text-[var(--allevo-text-on-action)] font-bold shadow-[0_10px_24px_-8px_var(--brand-strategy)] hover:brightness-105 active:scale-[0.98]',
  secondary: 'bg-[var(--hover-wash)] hover:bg-[var(--hover-wash-strong)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-semibold',
  ghost: 'text-[var(--text-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-wash-strong)] font-semibold',
  danger: 'bg-rose-500 hover:bg-rose-400 text-[var(--text-primary)] font-bold',
  icon: 'text-[var(--text-subtle)] hover:text-[var(--brand-strategy-ink)] hover:bg-[var(--hover-wash-strong)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs rounded-[var(--radius-control)] gap-1.5',
  md: 'min-h-11 px-4 text-sm rounded-[var(--radius-control)] gap-2',
  icon: 'min-h-11 min-w-11 w-11 h-11 rounded-[var(--radius-control)] justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, type, asChild, ...props }, ref) => {
    const sharedClassName = cn(
      'inline-flex items-center font-sans transition-all duration-[var(--motion-fast)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(sharedClassName, (children as React.ReactElement<any>).props.className),
      });
    }

    return (
      <button ref={ref} type={type ?? 'button'} className={sharedClassName} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
