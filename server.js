require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const ip = require('ip'); // IP adresini almak için

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // 🔥 Tüm IP'lerden bağlantıyı kabul et (geliştirme için)
        methods: ["GET", "POST"],
        credentials: true
    }
});

let activeUsers = {};

// 🔌 Kullanıcı Socket.IO'ya bağlandığında
io.on("connection", (socket) => {
    console.log("🔌 Yeni kullanıcı bağlandı:", socket.id);

    // 👤 Kullanıcı bir gruba katıldığında
    socket.on("joinGroup", ({ userId, groupId }) => {
        socket.join(groupId);
        activeUsers[userId] = { socketId: socket.id, groupId };
        console.log(`👤 Kullanıcı ${userId}, ${groupId} grubuna katıldı`);
    });

    // 📩 Kullanıcı mesaj gönderdiğinde
    socket.on("sendMessage", ({ groupId, message, senderId }) => {
        const timestamp = new Date().toISOString(); // Sunucu saati

        // Gruba bağlı tüm istemcilere mesajı gönder
        io.to(groupId).emit("receiveMessage", { message, senderId, groupId, timestamp });
        console.log(`📩 Mesaj gönderildi -> ${message}`);
    });

    // ❌ Kullanıcı bağlantıyı kestiğinde
    socket.on("disconnect", () => {
        Object.keys(activeUsers).forEach(userId => {
            if (activeUsers[userId].socketId === socket.id) {
                delete activeUsers[userId];
            }
        });
        console.log("❌ Kullanıcı bağlantıyı kesti:", socket.id);
    });
});

// 🌍 Sunucuyu başlat
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀 Server çalışıyor: http://${ip.address()}:${PORT}`)
);

