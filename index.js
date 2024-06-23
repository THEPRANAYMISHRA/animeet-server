const express = require('express');
const http = require('http')
const socketIo = require('socket.io')
const app = express()
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();
const meetings = {}


io.on('connection', (socket) => {
    console.log("user connected with id " + socket.id);

    socket.on('create-meeting', ({ roomId, peerId }) => {
        meetings[roomId] = peerId
        socket.join(roomId)
        io.to(socket.id).emit('meeting-created', roomId);
        console.log(meetings);
    })

    socket.on('join-meeting', ({ email, roomId }) => {
        console.log(' user ', email, ' room ', roomId)
        emailToSocketMapping.set(email, socket.id)
        socketToEmailMapping.set(socket.id, email)
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('new-user-joined', email)
        socket.emit('joined-meeting', roomId)
    })

    socket.on('call-user', ({ email, offer }) => {
        console.log("offer", offer, 'email', email)
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToSocketMapping.get(email);
        socket.to(socketId).emit('incoming-call', { from: fromEmail, offer })
    })

    socket.on("call-accepted", ({ email, answer }) => {
        let socketId = emailToSocketMapping.get(email)
        socket.to(socketId).emit('call-accepted', { answer })
    })

    socket.on('leave-meeting', (roomdId) => {
        console.log('you want to leave roomId ' + roomdId)
    })

    socket.on('disconnect', () => {
        console.log(`User disconnected with ID: ${socket.id}`);
    });
});

server.listen(4500, () => {
    console.log("Server is running at 4500")
});