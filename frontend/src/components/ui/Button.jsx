import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg';

  const variants = {
    primary:
      'bg-navy text-white hover:bg-navy-light focus-visible:ring-navy shadow-subtle hover:shadow-card active:bg-navy-dark',
    secondary:
      'bg-white text-ink border border-borderSoft hover:bg-ivory hover:border-slate-light/40 focus-visible:ring-navy shadow-subtle',
    accent:
      'bg-saffron text-ink font-semibold hover:bg-saffron-light focus-visible:ring-saffron shadow-subtle active:bg-saffron-dark',
    ghost:
      'bg-transparent text-slate hover:text-navy hover:bg-black/5 focus-visible:ring-slate',
    outline:
      'bg-transparent text-navy border border-navy/30 hover:bg-navy/5 hover:border-navy focus-visible:ring-navy',
    destructive:
      'bg-civicRed text-white hover:bg-red-700 focus-visible:ring-civicRed shadow-subtle',
    danger:
      'bg-civicRed text-white hover:bg-red-700 focus-visible:ring-civicRed shadow-subtle',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}

export default Button;
