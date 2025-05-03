import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Update in production
        methods: ["GET", "POST"],
        credentials: true,
    },
});

let transmitter = null;
let receivers = new Set();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    if (!transmitter) {
        transmitter = socket;
        console.log(`Client ${socket.id} assigned as transmitter`);
    } else {
        receivers.add(socket);
        console.log(`Client ${socket.id} assigned as receiver`);
    }

    // Listening for data sent by the transmitter
    socket.on('sendData', (data) => {
        if (socket === transmitter) {
            console.log(`Received data from transmitter: ${data.length} bytes`);
            let forwarded = 0;
            receivers.forEach((receiver) => {
                if (receiver.connected) {
                    receiver.emit('receivedData', data);
                    forwarded++;
                }
            });
            console.log(`Forwarded to ${forwarded} receivers`);
        }
    });

    socket.on('disconnect', () => {
        if (socket === transmitter) {
            console.log('Transmitter disconnected');
            transmitter = null;
            // Optionally promote a receiver to transmitter here
        } else {
            console.log('Receiver disconnected:', socket.id);
            receivers.delete(socket);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
