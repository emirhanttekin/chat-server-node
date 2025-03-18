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
    console.log("🟢 Yeni kullanıcı bağlandı:", socket.id);

    // 📌 Kullanıcı Gruba Katılıyor
    socket.on("joinGroup", ({ userId, groupId }) => {
        socket.join(groupId);
        activeUsers[userId] = { socketId: socket.id, groupId };
        console.log(`✅ Kullanıcı ${userId}, ${groupId} grubuna katıldı`);
    });

    // 📌 Metin Mesajı Gönderme
    socket.on("sendMessage", ({ groupId, message, senderId, senderName, senderProfileImageUrl }) => {
        const timestamp = new Date().toISOString(); 
    
        console.log(`📩 Mesaj Alındı -> Grup: ${groupId}, Mesaj: ${message}, Gönderen: ${senderId}, Profil Resmi: ${senderProfileImageUrl}`);
    
        const messageData = {
            message: message,
            senderId: senderId,
            senderName: senderName,
            senderProfileImageUrl: senderProfileImageUrl,
            groupId: groupId,
            timestamp: timestamp
        };

        io.to(groupId).emit("receiveMessage", messageData); 
    
        console.log(`✅ Mesaj yayınlandı: ${JSON.stringify(messageData)} -> Grup ${groupId}`);
    });

    // 📌 Fotoğraf Mesajı Gönderme
    socket.on("sendImageMessage", ({ groupId, senderId, senderName, senderProfileImageUrl, imageUrl }) => {
        const timestamp = new Date().toISOString(); 
    
        console.log(`📸 Fotoğraf Alındı -> Grup: ${groupId}, Gönderen: ${senderId}, Resim: ${imageUrl}`);
    
        const messageData = {
            senderId: senderId,
            senderName: senderName,
            senderProfileImageUrl: senderProfileImageUrl,
            groupId: groupId,
            imageUrl: imageUrl, // 🔥 Resim URL'sini ekledik
            timestamp: timestamp
        };

        io.to(groupId).emit("receiveImageMessage", messageData); 
    
        console.log(`✅ Fotoğraf mesajı yayınlandı: ${JSON.stringify(messageData)} -> Grup ${groupId}`);
    });

    // 📌 Kullanıcı Bağlantıyı Kestiğinde
    socket.on("disconnect", () => {
        Object.keys(activeUsers).forEach(userId => {
            if (activeUsers[userId].socketId === socket.id) {
                delete activeUsers[userId];
            }
        });
        console.log("🔴 Kullanıcı bağlantıyı kesti:", socket.id);
    });
});

// 📌 Server Başlatılıyor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`🚀 Server çalışıyor: Port ${PORT}`)
);
