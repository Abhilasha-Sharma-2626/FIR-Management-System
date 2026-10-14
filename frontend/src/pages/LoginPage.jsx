import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import loginImage from '../assets/images/login_civic_architecture.jpg';

export function LoginPage() {
  return (
    <AuthLayout
      title="Citizen & Officer Sign In"
      subtitle="Sign in to access your registered reports, tracking updates, and case records."
      imageSrc={loginImage}
      imageAlt="Architectural pillars of a dignified Indian civic justice institution"
      quoteText="Justice is not merely an ideal; it is the deliberate practice of accountability, open records, and public trust."
      tagText="Secure Portal Access"
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
