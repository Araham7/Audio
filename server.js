const WebSocket = require('ws');
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

let transmitter = null;
let receivers = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (data, isBinary) => {
    if (isBinary && transmitter === ws) {
      console.log(`Received ${data.length} bytes from transmitter`);
      let forwarded = 0;
      receivers.forEach((receiver) => {
        if (receiver.readyState === WebSocket.OPEN) {
          receiver.send(data, { binary: true });
          forwarded++;
        }
      });
      console.log(`Forwarded to ${forwarded} receivers`);
    }
  });

  ws.on('close', () => {
    if (ws === transmitter) {
      console.log('Transmitter disconnected');
      transmitter = null;
    } else {
      console.log('Receiver disconnected');
      receivers.delete(ws);
    }
  });

  // Assign role: first client is transmitter, others are receivers
  if (!transmitter) {
    transmitter = ws;
    console.log('Client assigned as transmitter');
  } else {
    receivers.add(ws);
    console.log('Client assigned as receiver');
  }
});

wss.on('listening', () => {
  console.log('WebSocket server listening on port 8080');
});

wss.on('error', (err) => {
  console.error('WebSocket server error:', err);
});
