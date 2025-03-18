require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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

    // 📌 Tek bir `sendMessage` fonksiyonu ile hem metin hem de resimli mesajlar işleniyor
    socket.on("sendMessage", ({ groupId, message, senderId, senderName, senderProfileImageUrl, imageUrl }) => {
        const timestamp = new Date().toISOString();

        console.log(`📩 Yeni Mesaj Alındı -> Grup: ${groupId}, Gönderen: ${senderId}, Mesaj: ${message}, Resim: ${imageUrl}`);

        const messageData = {
            message: message || "",  // **🔥 Eğer mesaj boşsa "", null olmaması için**
            senderId,
            senderName,
            senderProfileImageUrl,
            groupId,
            imageUrl: imageUrl || null,  // **🔥 Eğer resim yoksa null bırak**
            timestamp
        };

        io.to(groupId).emit("receiveMessage", messageData); // **🔥 Tek event ile hem metin hem de resimli mesajlar gönderilecek**

        console.log(`✅ Mesaj yayınlandı: ${JSON.stringify(messageData)} -> Grup ${groupId}`);
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
