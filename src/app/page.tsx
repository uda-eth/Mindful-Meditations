import dynamic from 'next/dynamic'

const VoiceJournal = dynamic(() => import('../components/VoiceJournal'), { ssr: false })
const MeditationGuides = dynamic(() => import('../components/MeditationGuides'), { ssr: false })
const Community = dynamic(() => import('../components/Community'), { ssr: false })

export default function Home() {
  return (
    <main>
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-800">Welcome to Your Mindfulness Journey</h1>

        <section className="mb-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Voice Journal</h2>
          <VoiceJournal />
        </section>

        <section className="mb-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Meditation Guides</h2>
          <MeditationGuides />
        </section>

        <section className="mb-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Community</h2>
          <Community />
        </section>
      </div>
    </main>
  );
}
