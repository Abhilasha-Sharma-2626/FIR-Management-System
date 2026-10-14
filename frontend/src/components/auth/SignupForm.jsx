import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import Input from '../ui/Input';
import PasswordInput from '../ui/PasswordInput';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    idProofLast4: '',
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please provide a valid email.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Min. 8 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone)) {
      errs.phone = '10 to 15 digits.';
    }

    if (formData.idProofLast4 && !/^[0-9]{4}$/.test(formData.idProofLast4)) {
      errs.idProofLast4 = 'Must be 4 digits.';
    }

    if (!formData.consent) {
      errs.consent = 'Required.';
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
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        idProofType: formData.idProofLast4 ? 'AADHAAR' : undefined,
        idProofLast4: formData.idProofLast4 ? formData.idProofLast4.trim() : undefined,
      };

      const res = await register(payload);
      if (res.success) {
        setServerSuccess('Citizen account created! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login');
        }, 800);
      }
    } catch (err) {
      setServerError(err.message || 'Unable to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      
      {/* Officer Notice */}
      <div className="py-1.5 px-2.5 rounded-md bg-ivory border border-borderSoft text-[11px] text-slate-muted flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-navy shrink-0" />
        <span>Citizen Registration (Officer roles are provisioned by station admins).</span>
      </div>

      {/* Server Alerts */}
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

      {/* Compact Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        
        {/* Full Name & Email in 2 columns on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Priya Sharma"
            required
            error={errors.fullName}
            leftIcon={<User className="w-3.5 h-3.5 text-slate-muted" />}
            autoComplete="name"
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="priya@example.com"
            required
            error={errors.email}
            leftIcon={<Mail className="w-3.5 h-3.5 text-slate-muted" />}
            autoComplete="email"
          />
        </div>

        {/* Passwords in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <PasswordInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            required
            error={errors.password}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            required
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
        </div>

        {/* Optional Phone & ID Proof last 4 digits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Input
            label="Phone (Optional)"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="98XXXXXXXX"
            error={errors.phone}
            autoComplete="tel"
          />
          <Input
            label="ID Proof Last 4 (Optional)"
            name="idProofLast4"
            value={formData.idProofLast4}
            onChange={handleChange}
            placeholder="e.g. 4321"
            maxLength={4}
            error={errors.idProofLast4}
            helperText="PO7 Ethics: Only last 4 digits are saved."
          />
        </div>

        {/* Consent Checkbox */}
        <div className="pt-0.5">
          <label className="flex items-start gap-2 text-[11px] text-slate cursor-pointer select-none">
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              className="w-3.5 h-3.5 mt-0.5 rounded border-borderSoft text-navy focus:ring-navy shrink-0"
            />
            <span className="leading-tight">
              I acknowledge that information submitted is recorded for official verification under Indian public safety procedures.
            </span>
          </label>
          {errors.consent && (
            <p className="text-[11px] text-civicRed mt-0.5 pl-5">Please accept to continue.</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full font-semibold mt-1"
        >
          Create Citizen Account
        </Button>
      </form>

      {/* Return to Login */}
      <div className="text-center pt-0.5 text-xs text-slate">
        <span>Already registered? </span>
        <Link
          to="/login"
          className="font-semibold text-navy hover:text-orangeAccent hover:underline transition-colors"
        >
          Sign In
        </Link>
      </div>

    </div>
  );
}

export default SignupForm;
