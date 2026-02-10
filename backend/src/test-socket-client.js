/**
 * One-off client to verify Socket.io server: connect, send message, receive ack, disconnect.
 * Run with: npm run test:socket (requires server running on PORT, default 3001)
 */
import { io } from 'socket.io-client';

const PORT = Number(process.env.PORT) || 3001;
const url = `http://127.0.0.1:${PORT}`;

const socket = io(url, { autoConnect: true });

socket.on('connect', () => {
  console.log('connected', socket.id);
  socket.emit('message', { text: 'hello' }, (ack) => {
    console.log('ack', ack);
    if (ack?.ok && ack?.echo?.text === 'hello') {
      console.log('OK: message send/receive verified');
    } else {
      console.error('FAIL: unexpected ack', ack);
      process.exitCode = 1;
    }
    socket.close();
  });
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  process.exit(process.exitCode ?? 0);
});
