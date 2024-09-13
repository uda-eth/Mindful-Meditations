import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import VoiceJournal from '../src/components/VoiceJournal';

const VoiceJournalPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Voice Journal</h1>
      <VoiceJournal />
    </div>
  );
};

export default VoiceJournalPage;
