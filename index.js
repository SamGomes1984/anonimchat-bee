import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminId = process.env.ADMIN_USER_ID;
const bot = new TelegramBot(token);
const app = express();
app.use(express.json());

const messageMap = new Map();

// Webhook endpoint for Telegram
app.post(`/webhook/${token}`, async (req, res) => {
    const msg = req.body;
    const chatId = msg.message.chat.id;

    // Greeting
    if (msg.message.text === '/start') {
        bot.sendMessage(chatId, `Hi ${msg.message.from.first_name}! 👋\nIf you have any questions, just send them here.`);
        return res.sendStatus(200);
    }

    // User to admin message
    if (chatId.toString() !== adminId.toString()) {
        const forwarded = await bot.forwardMessage(adminId, chatId, msg.message.message_id);
        messageMap.set(forwarded.message_id, chatId);
        return res.sendStatus(200);
    }

    // Admin reply
    const reply = msg.message.reply_to_message;
    if (reply) {
        const userId = messageMap.get(reply.message_id);
        if (!userId) return res.sendStatus(200);

        const m = msg.message;
        if (m.text) bot.sendMessage(userId, m.text);
        else if (m.photo) bot.sendPhoto(userId, m.photo.at(-1).file_id, { caption: m.caption });
        else if (m.document) bot.sendDocument(userId, m.document.file_id, { caption: m.caption });
        else if (m.video) bot.sendVideo(userId, m.video.file_id, { caption: m.caption });
        else if (m.audio) bot.sendAudio(userId, m.audio.file_id, { caption: m.caption });
        else if (m.voice) bot.sendVoice(userId, m.voice.file_id);
        else if (m.sticker) bot.sendSticker(userId, m.sticker.file_id);
    }

    res.sendStatus(200);
});

// Set webhook route
app.get('/', async (req, res) => {
    const url = 'https://anonimchat-bee.onrender.com';
    await bot.setWebHook(`${url}/webhook/${token}`);
    res.send('Webhook set');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
