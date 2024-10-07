const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, '../public')));
app.use('/src', express.static(path.join(__dirname)));
app.use(express.json());

const crowdInputs = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('crowd-input', (data) => {
        const { parameter, value } = data;
        if (!crowdInputs[parameter]) {
            crowdInputs[parameter] = [];
        }
        crowdInputs[parameter].push(value);

        // Broadcast the new input to all connected clients
        io.emit('update', { type: 'newCrowdInput', data: { parameter, value } });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});