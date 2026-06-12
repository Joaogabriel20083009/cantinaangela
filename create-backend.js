const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const routesDir = path.join(backendDir, 'routes');
const controllersDir = path.join(backendDir, 'controllers');

fs.mkdirSync(routesDir, { recursive: true });
fs.mkdirSync(controllersDir, { recursive: true });

// Copiar controllers existentes
const refControllersDir = path.join(__dirname, 'backend-reference', 'controllers');
if (fs.existsSync(refControllersDir)) {
  const files = fs.readdirSync(refControllersDir);
  for (const file of files) {
    fs.copyFileSync(path.join(refControllersDir, file), path.join(controllersDir, file));
  }
}

// 1. productController.js
fs.writeFileSync(path.join(controllersDir, 'productController.js'), `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  list: async (req, res) => {
    try {
      const products = await prisma.product.findMany();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  create: async (req, res) => {
    try {
      const { nome, preco, estoque, imageUrl } = req.body;
      const product = await prisma.product.create({
        data: { nome, preco: parseFloat(preco), estoque: parseInt(estoque), imageUrl }
      });
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, preco, estoque, imageUrl } = req.body;
      const product = await prisma.product.update({
        where: { id },
        data: { nome, preco: parseFloat(preco), estoque: parseInt(estoque), imageUrl }
      });
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
`);

// 2. messageController.js
fs.writeFileSync(path.join(controllersDir, 'messageController.js'), `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
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
`);

// 3. userController.js
fs.writeFileSync(path.join(controllersDir, 'userController.js'), `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  list: async (req, res) => {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getClientLedger: async (req, res) => {
    const { userId } = req.params;
    try {
      const client = await prisma.user.findUnique({ where: { id: userId } });
      if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

      const orders = await prisma.order.findMany({
        where: { userId, status: 'ENTREGUE' }
      });
      const payments = await prisma.payment.findMany({
        where: { userId, status_aprovacao: 'APROVADO' }
      });

      // Lógica de ledger simplificada
      const events = [
        ...orders.map(o => ({
          id: o.id, data: o.data, tipo: 'Consumo', detalhes: o.total.toString(), valor: o.total
        })),
        ...payments.map(p => ({
          id: p.id, data: p.data, tipo: 'Pagamento', detalhes: 'Comprovante aprovado', valor: -p.valor
        }))
      ].sort((a, b) => new Date(a.data) - new Date(b.data));

      let runningBalance = 0;
      const ledger = events.map(e => {
        runningBalance += e.valor;
        return { ...e, saldo: runningBalance };
      });

      res.json(ledger);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
`);

// Create Routes
const routes = {
  authRoutes: \`
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
  \`,
  productRoutes: \`
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.list);
router.post('/', productController.create);
router.put('/:id', productController.update);

module.exports = router;
  \`,
  orderRoutes: \`
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/daily', orderController.getDailyReserves);
router.post('/debt', orderController.addDebt);
router.post('/reserve', orderController.createReserve);
router.put('/:orderId/status', orderController.updateStatus);

module.exports = router;
  \`,
  paymentRoutes: \`
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.listPayments);
router.post('/upload', paymentController.uploadReceipt);
router.put('/:paymentId/approve', paymentController.approve);
router.put('/:paymentId/reject', paymentController.reject);

module.exports = router;
  \`,
  messageRoutes: \`
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/', messageController.list);
router.post('/', messageController.create);

module.exports = router;
  \`,
  userRoutes: \`
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.list);
router.get('/:userId/ledger', userController.getClientLedger);

module.exports = router;
  \`
};

for (const [routeFile, content] of Object.entries(routes)) {
  fs.writeFileSync(path.join(routesDir, \`\${routeFile}.js\`), content.trim());
}

console.log('Backend files generated successfully!');
