import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';
import signupImage from '../assets/images/signup_civic_trust.jpg';

export function SignupPage() {
  return (
    <AuthLayout
      title="Create Citizen Account"
      subtitle="Register to submit digital incident reports and follow your case progress online."
      imageSrc={signupImage}
      imageAlt="Citizen receiving verified digital acknowledgment at a modern civic service desk"
      quoteText="Every citizen has the fundamental right to be heard without fear, delay, or arbitrary barriers."
      tagText="Public Intake Registration"
    >
      <SignupForm />
    </AuthLayout>
  );
}

export default SignupPage;
