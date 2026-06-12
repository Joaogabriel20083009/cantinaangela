import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default {
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
