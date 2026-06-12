import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default {
  list: async (req, res) => {
    try {
      const messages = await prisma.message.findMany({
        include: { sender: true, recipient: true },
        orderBy: { data: 'asc' }
      });
      res.json(messages.map(m => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderId === 'u-admin' ? 'Admin' : m.sender.nome,
        recipientId: m.recipientId,
        text: m.text,
        data: m.data
      })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  create: async (req, res) => {
    try {
      const { senderId, recipientId, text } = req.body;
      const message = await prisma.message.create({
        data: { senderId, recipientId, text }
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
