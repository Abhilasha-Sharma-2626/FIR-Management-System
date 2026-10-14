import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input from './Input';

export const PasswordInput = forwardRef(function PasswordInput(
  { label = 'Password', error, ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      ref={ref}
      label={label}
      type={showPassword ? 'text' : 'password'}
      error={error}
      leftIcon={<Lock className="w-4 h-4 text-slate-muted" />}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-slate-muted hover:text-navy focus:outline-none focus-visible:text-navy p-1 transition-colors"
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      }
      {...props}
    />
  );
});

export default PasswordInput;
