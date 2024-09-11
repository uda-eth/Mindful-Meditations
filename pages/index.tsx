import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <div>
      <Head>
        <title>Mindfulness App</title>
        <meta name="description" content="Your mindfulness journey starts here" />
      </Head>

      <main>
        <h1>Welcome to Mindfulness App</h1>
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign Up</Link>
      </main>
    </div>
  );
};

export default Home;