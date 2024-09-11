import React from 'react';
import SignupForm from '../src/components/SignupForm';

const SignupPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Create Account</h1>
      <SignupForm />
    </div>
  );
};

export default SignupPage;
