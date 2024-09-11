import React from 'react';
import Link from 'next/link';

const HomeScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Mindfulness App</h1>
      <div className="space-y-4">
        <Link href="/login" className="block px-6 py-3 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600 transition duration-300">
          Log In
        </Link>
        <Link href="/signup" className="block px-6 py-3 bg-green-500 text-white rounded-lg text-center hover:bg-green-600 transition duration-300">
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default HomeScreen;
