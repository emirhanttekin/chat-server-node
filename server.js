require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const ip = require('ip'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
        credentials: true
    }
});

let activeUsers = {};


io.on("connection", (socket) => {
    console.log(" Yeni kullanıcı bağlandı:", socket.id);

    
    socket.on("joinGroup", ({ userId, groupId }) => {
        socket.join(groupId);
        activeUsers[userId] = { socketId: socket.id, groupId };
        console.log(` Kullanıcı ${userId}, ${groupId} grubuna katıldı`);
    });
    


socket.on("sendMessage", ({ groupId, message, senderId }) => {
    const timestamp = new Date().toISOString(); 

    console.log(`Mesaj Alındı -> Grup: ${groupId}, Mesaj: ${message}, Gönderen: ${senderId}`);

    const roomClients = io.sockets.adapter.rooms.get(groupId);
    console.log(` Grup ${groupId} içinde ${roomClients ? roomClients.size : 0} kullanıcı var.`);


    const messageData = {
        message: message,
        senderId: senderId,
        groupId: groupId,
        timestamp: timestamp
    };

    io.to(groupId).emit("receiveMessage", messageData); 

    console.log(` Mesaj yayınlandı: ${JSON.stringify(messageData)} -> Grup ${groupId}`);
});

    

  
    socket.on("disconnect", () => {
        Object.keys(activeUsers).forEach(userId => {
            if (activeUsers[userId].socketId === socket.id) {
                delete activeUsers[userId];
            }
        });
        console.log(" Kullanıcı bağlantıyı kesti:", socket.id);
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(` Server çalışıyor: Port ${PORT}`)
);

