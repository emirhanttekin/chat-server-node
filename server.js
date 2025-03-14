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
    
        console.log(`📩 Mesaj Alındı -> Grup: ${groupId}, Mesaj: ${message}, Gönderen: ${senderId}`);
    
        // 🔥 **Burada hata olabilir, grupta kaç kişi var bakalım**
        const roomClients = io.sockets.adapter.rooms.get(groupId);
        console.log(`👀 Grup ${groupId} içinde ${roomClients ? roomClients.size : 0} kullanıcı var.`);
    
        // **Mesajı yayına alalım**
        io.to(groupId).emit("receiveMessage", { message, senderId, groupId, timestamp });


        console.log(`📩 Mesaj yayınlandı: ${message} -> Grup ${groupId}`);
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
server.listen(PORT, () =>
    console.log(`🚀 Server çalışıyor: Port ${PORT}`)
);

