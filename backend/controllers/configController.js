import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfig = {
  pixKey: '12.345.678/0001-99',
  beneficiario: 'Cantina da Angela Ltda.'
};

export default {
  get: async (req, res) => {
    try {
      let cfg = await prisma.config.findUnique({ where: { id: 1 } });
      if (!cfg) {
        cfg = await prisma.config.create({ data: { id: 1, pixKey: defaultConfig.pixKey, beneficiario: defaultConfig.beneficiario } });
      }
      res.json({ pixKey: cfg.pixKey, beneficiario: cfg.beneficiario });
    } catch (error) {
      console.error('Error reading config from DB:', error);
      res.status(500).json({ error: 'Erro ao ler configurações.', detail: error.message });
    }
  },
  update: async (req, res) => {
    const { pixKey, beneficiario } = req.body;
    if (!pixKey || !beneficiario) {
      return res.status(400).json({ error: 'Chave Pix e Beneficiário são obrigatórios.' });
    }
    try {
      const cfg = await prisma.config.upsert({
        where: { id: 1 },
        update: { pixKey, beneficiario },
        create: { id: 1, pixKey, beneficiario }
      });
      res.json({ message: 'Configurações atualizadas com sucesso!', config: { pixKey: cfg.pixKey, beneficiario: cfg.beneficiario } });
    } catch (error) {
      console.error('Error writing config to DB:', error);
      res.status(500).json({ error: 'Erro ao salvar configurações.', detail: error.message });
    }
  }
};
