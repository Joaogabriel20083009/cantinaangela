import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default {
  list: async (req, res) => {
    try {
      const products = await prisma.product.findMany();
      // Mapear imageUrl do DB para a propriedade imagem esperada no frontend
      res.json(products.map(p => ({ ...p, imagem: p.imageUrl, categoria: p.categoria || 'Salgados' })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  create: async (req, res) => {
    try {
      const { nome, preco, estoque, imageUrl, imagem, categoria } = req.body;
      const finalImageUrl = imageUrl || imagem;
      const product = await prisma.product.create({
        data: { 
          nome, 
          preco: parseFloat(preco), 
          estoque: parseInt(estoque), 
          imageUrl: finalImageUrl,
          categoria: categoria || 'Salgados'
        }
      });
      res.status(201).json({ ...product, imagem: product.imageUrl });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, preco, estoque, imageUrl, imagem, categoria } = req.body;
      const finalImageUrl = imageUrl || imagem;
      const product = await prisma.product.update({
        where: { id },
        data: { 
          nome, 
          preco: parseFloat(preco), 
          estoque: parseInt(estoque), 
          imageUrl: finalImageUrl,
          categoria: categoria || undefined
        }
      });
      res.json({ ...product, imagem: product.imageUrl });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.product.delete({
        where: { id }
      });
      res.json({ message: 'Produto deletado com sucesso!' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
