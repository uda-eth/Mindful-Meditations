import { NextApiRequest, NextApiResponse } from 'next';
import { SpeechClient } from '@google-cloud/speech';
import WebSocket from 'ws';
import { IncomingMessage } from 'http'; // Import necessary for proper typing
import { Socket } from 'net'; // Import necessary for proper typing

const speechClient = new SpeechClient();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Check if the WebSocket server is already initialized
  if ((res.socket as any)?.server?.io) return; // Cast to 'any' to bypass type checking

  const wss = new WebSocket.Server({ noServer: true });

  if (res.socket) {
    const server = res.socket as any; // You might want to create a proper type for this
    if (!server.wss) {
      server.wss = wss;
      server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          wss.emit('connection', ws, request);
        });
      });
    }
  }

  if (res.socket) {
    const server = res.socket as any; // Using 'any' to bypass type checking
    if (server.wss) {
      server.wss.on('connection', (ws: WebSocket) => {
        const recognizeStream = speechClient.streamingRecognize({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
          },
          interimResults: true,
        }).on('data', (data) => {
          ws.send(data.results[0]?.alternatives[0]?.transcript || '');
        });

        ws.on('message', (message: Buffer) => {
          recognizeStream.write(message); // Process audio chunks
        });

        ws.on('close', () => {
          recognizeStream.end();
        });
      }); // Closing brace for server.wss.on('connection', ...)
    } // Closing brace for if (server.wss)
  } // Closing brace for if (res.socket)
}; // Closing brace for the exported function

export const config = {
  api: {
    bodyParser: false,
  }
};
