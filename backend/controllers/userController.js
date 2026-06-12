import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default {
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

      const events = [
        ...orders.map(o => ({
          id: o.id, data: o.data, tipo: o.tipoPagamento === 'PIX' ? 'Consumo (Pix)' : 'Consumo (Fiado)', detalhes: 'Compra efetuada', valor: o.total
        })),
        ...payments.map(p => ({
          id: p.id, data: p.data, tipo: 'Pagamento Pix', detalhes: 'Comprovante aprovado', valor: -p.valor
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
