'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import styled from 'styled-components';

interface JournalEntry {
  id: string | number;
  transcript: string;
  createdAt: string | number | Date;
}

const formatTranscript = (rawTranscript: string): string => {
  // Capitalize the first letter of each sentence
  const capitalizedTranscript = rawTranscript.replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
  
  // Add line breaks for readability (e.g., every 100 characters)
  const formattedTranscript = capitalizedTranscript.replace(/(.{100})/g, "$1\n");
  
  return formattedTranscript;
};

interface VoiceJournalProps {
  // Add any props here if needed
}

interface Window {
  webkitAudioContext: typeof AudioContext;
}

const VoiceJournal: React.FC<VoiceJournalProps> = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioDetected, setIsAudioDetected] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { status, startRecording, stopRecording, mediaBlobUrl, error } = useReactMediaRecorder({
    audio: true,
    onStart: () => {
      setIsAudioDetected(false);
      checkAudioLevels();
    },
    onStop: (blobUrl, blob) => {
      console.log('Recording stopped, blob URL:', blobUrl);
      console.log('Blob size:', blob.size, 'bytes');
      setAudioURL(blobUrl);
      setAudioBlob(blob);
      if (blob.size < 1000) {
        console.warn('Audio file is very small, might be empty');
      }
    },
  });

  const checkAudioLevels = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function checkLevel() {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          if (sum > 0) {
            setIsAudioDetected(true);
          }
          if (status === 'recording') {
            requestAnimationFrame(checkLevel);
          }
        }
        checkLevel();
      });
  };

  useEffect(() => {
    if (error) {
      console.error('Media Recorder Error:', error);
    }
  }, [error]);

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
    setIsTranscribing(true);
    try {
      if (!audioBlob) {
        console.error('No audio recorded');
        return;
      }

      if (!isAudioDetected) {
        console.log('No audio detected during recording');
        setTranscript('No speech detected. Please try recording again.');
        return;
      }

      if (audioBlob.size < 1000) {
        setTranscript('The recorded audio is too short or empty. Please try recording again.');
        return;
      }

      if (!checkNetworkStatus()) {
        setTranscript('No internet connection. Please check your network and try again.');
        return;
      }

      const sampleRate = await checkAudioSampleRate(audioBlob);
      console.log('Audio sample rate:', sampleRate);
      if (sampleRate !== 16000) {
        console.warn('Sample rate is not 16000 Hz, which is preferred by Google Speech-to-Text API');
      }

      // Log audio format details
      console.log('Audio MIME type:', audioBlob.type);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.transcript) {
        setTranscript(data.transcript);
        addJournalEntry(data.transcript);
        await saveTranscriptToDatabase(data.transcript);
      } else {
        setTranscript(data.message || 'Transcription failed. Please try again.');
      }
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

  const handleCleanup = async () => {
    console.log('Cleanup function called');
    try {
      const response = await fetch('/api/cleanup-empty-entries', { method: 'POST' });
      console.log('Cleanup response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Cleanup response data:', data);
        await fetchPastEntries();
        console.log('Fetched past entries after cleanup');
      } else {
        console.error('Failed to clean up empty entries');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
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

  const visualizeAudio = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');

        function draw() {
          if (!canvasCtx || !canvas) return;
          requestAnimationFrame(draw);

          analyser.getByteFrequencyData(dataArray);
          canvasCtx.fillStyle = 'rgb(200, 200, 200)';
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            canvasCtx.fillStyle = `rgb(50,50,${barHeight + 100})`;
            canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
            x += barWidth + 1;
          }
        }

        draw();
      });
  };

  const checkMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      return false;
    }
  };

  const handleStartRecording = async () => {
    const microphoneAvailable = await checkMicrophone();
    if (microphoneAvailable) {
      startRecording();
      setIsAudioDetected(false);
    } else {
      alert('Unable to access microphone. Please check your settings and try again.');
    }
  };

  const checkAudioSampleRate = (audioBlob: Blob): Promise<number> => {
    return new Promise((resolve, reject) => {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const reader = new FileReader();
      reader.onload = () => {
        audioContext.decodeAudioData(reader.result as ArrayBuffer, (buffer) => {
          resolve(buffer.sampleRate);
        }, reject);
      };
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  const checkNetworkStatus = () => {
    return navigator.onLine;
  };

  class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
    constructor(props: {children: React.ReactNode}) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error("Uncaught error:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return <h1>Something went wrong. Please refresh the page and try again.</h1>;
      }

      return this.props.children;
    }
  }

  useEffect(() => {
    let animationFrameId: number | null = null;
    if (status === 'recording') {
      const startVisualization = () => {
        animationFrameId = requestAnimationFrame(startVisualization);
        visualizeAudio();
      };
      startVisualization();
    }
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [status]);

  return (
    <ErrorBoundary>
      <div className="voice-journal p-4 bg-white rounded-lg shadow relative">
        <h2 className="text-2xl font-bold mb-4">Voice Journal</h2>
        <button
          className={`px-4 py-2 rounded ${status === 'recording' ? 'bg-red-500' : 'bg-blue-500'} text-white mr-2`}
          onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
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
            <audio ref={audioRef} src={mediaBlobUrl || undefined} controls />
            <button onClick={() => audioRef.current?.play()}>
              Play Recorded Audio
            </button>
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
        <button
          className="px-4 py-2 rounded bg-red-500 text-white mt-4"
          onClick={handleCleanup}
        >
          Clean Up Empty Entries
        </button>
        {transcript && (
          <TranscriptDisplay>
            {formatTranscript(transcript)}
          </TranscriptDisplay>
        )}
        {!isAudioDetected && status === 'stopped' && (
          <p>No audio detected during recording. Please try again.</p>
        )}
        <canvas ref={canvasRef} className="w-full h-16" />
      </div>
    </ErrorBoundary>
  );
};

const TranscriptDisplay = styled.div`
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

export default VoiceJournal;
