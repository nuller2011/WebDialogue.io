const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('client'));

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('video-offer', (offer) => {
        socket.broadcast.emit('video-offer', offer);
    });

    socket.on('video-answer', (answer) => {
        socket.broadcast.emit('video-answer', answer);
    });

    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(8080, () => {
    console.log('Server is running on port 8080');
});
