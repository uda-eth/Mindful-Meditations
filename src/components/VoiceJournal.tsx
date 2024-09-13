import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './VoiceJournal.module.css';

interface JournalEntry {
  id: string | number;
  transcript: string;
  createdAt: string | number | Date;
}

const formatTranscript = (rawTranscript: string): string => {
  const capitalizedTranscript = rawTranscript.replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
  const formattedTranscript = capitalizedTranscript.replace(/(.{100})/g, "$1\n");
  return formattedTranscript;
};

const VoiceJournal: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  useEffect(() => {
    fetchPastEntries();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      socketRef.current = io();

      socketRef.current.on('transcription', (result: { transcript: string; isFinal: boolean }) => {
        if (result.isFinal) {
          setFinalTranscript(prev => prev + ' ' + result.transcript);
          setTranscript('');
        } else {
          setTranscript(result.transcript);
        }
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(chunks => [...chunks, event.data]);
          if (socketRef.current) {
            socketRef.current.emit('audioChunk', event.data);
          }
        }
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
      socketRef.current.emit('startTranscription');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.emit('endTranscription');
      socketRef.current.disconnect();
    }
    setIsRecording(false);
    setAudioChunks([]);
  };

  const fetchPastEntries = async () => {
    try {
      const response = await fetch('/api/get-journal-entries');
      if (response.ok) {
        const entries = await response.json();
        setPastEntries(entries);
      } else {
        console.error('Failed to fetch entries:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
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

  const addJournalEntry = (transcriptText: string) => {
    const newEntry = {
      id: Date.now(),
      transcript: transcriptText,
      createdAt: new Date().toISOString(),
    };
    setPastEntries(prevEntries => [...prevEntries, newEntry]);
  };

  return (
    <div className="voice-journal p-4 bg-white rounded-lg shadow relative">
      <h2 className="text-2xl font-bold mb-4">Voice Journal</h2>
      <button
        className={`px-4 py-2 rounded ${isRecording ? 'bg-red-500' : 'bg-blue-500'} text-white mr-2`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
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
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Transcript:</h3>
        <div className={styles.transcriptDisplay}>
          {finalTranscript}
          <span className={styles.interimTranscript}>{transcript}</span>
        </div>
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