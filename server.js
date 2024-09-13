const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketIo = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('startTranscription', () => {
      // Logic for starting transcription
      console.log('Transcription started');
    });

    socket.on('audioChunk', (audioChunk) => {
      // Logic for processing audio chunk
      console.log('Received audio chunk');
    });

    socket.on('endTranscription', () => {
      // Logic for ending transcription
      console.log('Transcription ended');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
