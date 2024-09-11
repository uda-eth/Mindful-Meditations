import React from 'react';
import LoginForm from '../src/components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
