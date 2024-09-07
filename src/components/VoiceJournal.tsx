'use client';
import React, { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface JournalEntry {
  id: string | number;
  transcript: string;
  createdAt: string | number | Date;
}

const VoiceJournal: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true });

  useEffect(() => {
    fetchPastEntries();
  }, []);

  const fetchPastEntries = async () => {
    try {
      const response = await fetch('/api/get-journal-entries');
      if (response.ok) {
        const entries = await response.json();
        console.log('Fetched entries:', entries); // Add this line
        setPastEntries(entries);
      } else {
        console.error('Failed to fetch entries:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleTranscribe = async () => {
    if (!mediaBlobUrl) {
      console.error('No audio recorded');
      return;
    }

    setIsTranscribing(true);
    try {
      const audioBlob = await fetch(mediaBlobUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      console.log('Transcription response:', data); // Add this line
      setTranscript(data.transcript);

      await saveTranscriptToDatabase(data.transcript);

    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscript('Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const saveTranscriptToDatabase = async (transcriptText: string) => {
    try {
      console.log('Saving transcript:', transcriptText);
      const response = await fetch('/api/save-journal-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      });

      if (!response.ok) {
        throw new Error('Failed to save journal entry');
      }

      const savedEntry = await response.json();
      console.log('Journal entry saved successfully:', savedEntry);
      await fetchPastEntries(); // Refresh past entries after saving
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleEntrySelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    if (selectedId) {
      const entry = pastEntries.find(e => e.id.toString() === selectedId) || null;
      setSelectedEntry(entry);
      setShowPopup(true);
    }
  };

  return (
    <div className="voice-journal p-4 bg-white rounded-lg shadow relative">
      <h2 className="text-2xl font-bold mb-4">Voice Journal</h2>
      <button
        className={`px-4 py-2 rounded ${status === 'recording' ? 'bg-red-500' : 'bg-blue-500'} text-white mr-2`}
        onClick={status === 'recording' ? handleStopRecording : startRecording}
      >
        {status === 'recording' ? 'Stop Recording' : 'Start Recording'}
      </button>
      {mediaBlobUrl && (
        <button
          className={`px-4 py-2 rounded bg-green-500 text-white ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleTranscribe}
          disabled={isTranscribing}
        >
          {isTranscribing ? 'Transcribing...' : 'Transcribe'}
        </button>
      )}
      <select
        className="ml-2 px-4 py-2 rounded bg-purple-500 text-white"
        onChange={handleEntrySelect}
        value={selectedEntry ? selectedEntry.id : ''}
      >
        <option value="">View Past Entries</option>
        {pastEntries.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {new Date(entry.createdAt).toLocaleString()}
          </option>
        ))}
      </select>
      {mediaBlobUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recorded Audio:</h3>
          <audio src={mediaBlobUrl} controls className="w-full" />
        </div>
      )}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Transcript:</h3>
        <p className="bg-gray-100 p-4 rounded">{transcript || 'Your journal entry will appear here...'}</p>
      </div>
      {showPopup && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Journal Entry</h3>
            <p className="mb-4">{selectedEntry.transcript}</p>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(selectedEntry.createdAt).toLocaleString()}
            </p>
            <button
              className="px-4 py-2 rounded bg-red-500 text-white"
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceJournal;
