import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, Sparkles, KeyRound } from 'lucide-react';
import Input from '../ui/Input';
import PasswordInput from '../ui/PasswordInput';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password drawer
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login(email, password);
      setServerSuccess(`Signed in as ${result.user?.fullName || result.user?.email}`);
      
      // Redirect to the authenticated dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      setServerError(err.message || 'Invalid credentials or unable to reach backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (role) => {
    if (role === 'CITIZEN') {
      setEmail('citizen.priya@casesync.gov.in');
      setPassword('Citizen@12345');
    } else if (role === 'SHO') {
      setEmail('sho.central@casesync.gov.in');
      setPassword('Officer@12345');
    } else if (role === 'IO') {
      setEmail('io.central@casesync.gov.in');
      setPassword('Officer@12345');
    }
    setErrors({});
    setServerError('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotStatus({ success: false, message: 'Please provide a valid registered email.' });
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStatus({ success: true, message: data.message || 'Reset link sent to registered email.' });
      } else {
        setForgotStatus({ success: false, message: data.message || 'Could not process request.' });
      }
    } catch (err) {
      setForgotStatus({ success: false, message: err.message || 'Backend connection error.' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Demo Credentials Helper Pill */}
      <div className="p-2.5 rounded-lg bg-ivory border border-borderSoft text-xs flex items-center justify-between">
        <span className="font-medium text-slate-muted flex items-center gap-1.5 text-[11px]">
          <Sparkles className="w-3 h-3 text-saffron shrink-0" />
          Test Accounts:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoAccount('CITIZEN')}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-soft border border-borderSoft text-[10px] font-semibold text-slate hover:text-navy transition-colors"
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('SHO')}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-soft border border-borderSoft text-[10px] font-semibold text-slate hover:text-navy transition-colors"
          >
            SHO
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('IO')}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-soft border border-borderSoft text-[10px] font-semibold text-slate hover:text-navy transition-colors"
          >
            IO
          </button>
        </div>
      </div>

      {/* Alerts */}
      {serverError && (
        <div className="p-2.5 rounded-lg bg-civicRed/10 border border-civicRed/20 text-xs text-civicRed flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <p className="leading-snug">{serverError}</p>
        </div>
      )}

      {serverSuccess && (
        <div className="p-2.5 rounded-lg bg-civicGreen/10 border border-civicGreen/20 text-xs text-civicGreen flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <p className="leading-snug">{serverSuccess}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <Input
          label="Registered Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4 text-slate-muted" />}
          autoComplete="email"
        />

        <div>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            error={errors.password}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between mt-1.5 text-xs">
            <label className="flex items-center gap-1.5 text-slate cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-borderSoft text-navy focus:ring-navy"
              />
              <span className="text-[11px]">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              className="text-[11px] font-medium text-navy hover:text-orangeAccent hover:underline transition-colors focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full mt-1 font-semibold"
        >
          Sign In
        </Button>
      </form>

      {/* Sign Up Navigation */}
      <div className="text-center pt-1 text-xs text-slate">
        <span>Need an account? </span>
        <Link
          to="/signup"
          className="font-semibold text-navy hover:text-orangeAccent hover:underline transition-colors"
        >
          Register as Citizen
        </Link>
      </div>

      {/* Inline Password Recovery Drawer */}
      {showForgotPassword && (
        <div className="p-3 rounded-lg bg-ivory border border-borderSoft text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-semibold text-navy">
            <span className="flex items-center gap-1.5 text-[11px]">
              <KeyRound className="w-3 h-3 text-navy" />
              Password Reset
            </span>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotStatus(null);
              }}
              className="text-slate hover:text-navy text-[11px]"
            >
              Close
            </button>
          </div>
          <form onSubmit={handleForgotPassword} className="flex gap-2">
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="flex-1 px-2.5 py-1.5 text-xs border border-borderSoft rounded-md bg-white focus:outline-none focus:border-navy"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={forgotLoading}
              className="shrink-0 text-xs py-1"
            >
              Send
            </Button>
          </form>
          {forgotStatus && (
            <p className={`text-[11px] ${forgotStatus.success ? 'text-civicGreen' : 'text-civicRed'}`}>
              {forgotStatus.message}
            </p>
          )}
        </div>
      )}

    </div>
  );
}

export default LoginForm;
