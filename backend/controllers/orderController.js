import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const orderController = {
  /**
   * 1. Adicionar dívida ao cliente (simulando carrinho de pedidos)
   * Registra uma compra imediata de fiado: atualiza estoque, adiciona valor ao saldo_devedor e gera pedido entregue.
   */
  addDebt: async (req, res) => {
    const { userId, items } = req.body; // items: [{ id, quantidade }]

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Dados do pedido inválidos ou incompletos.' });
    }

    try {
      // Usamos uma transação para garantir consistência total do banco
      const result = await prisma.$transaction(async (tx) => {
        // Verificar se o cliente existe
        const user = await tx.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          throw new Error('Cliente não encontrado.');
        }

        let totalOrderValue = 0;
        const itemsToSave = [];

        // Validar estoque e calcular preços
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.id }
          });

          if (!product) {
            throw new Error(`Produto não localizado: ID ${item.id}`);
          }

          if (product.estoque < item.quantidade) {
            throw new Error(`Estoque insuficiente para o produto: ${product.nome}`);
          }

          // Atualizar o estoque do produto
          await tx.product.update({
            where: { id: product.id },
            data: { estoque: product.estoque - item.quantidade }
          });

          const subtotal = product.preco * item.quantidade;
          totalOrderValue += subtotal;

          itemsToSave.push({
            productId: product.id,
            nome: product.nome,
            preco: product.preco,
            quantidade: item.quantidade
          });
        }

        // Incrementar o saldo devedor do cliente
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { saldo_devedor: user.saldo_devedor + totalOrderValue }
        });

        // Criar o registro do pedido já finalizado (ENTREGUE)
        const order = await tx.order.create({
          data: {
            userId: userId,
            status: 'ENTREGUE',
            total: totalOrderValue,
            items: itemsToSave, // Campo Json
            tipoPagamento: 'FIADO'
          }
        });

        return { order, updatedUser };
      });

      return res.status(251).json({
        message: 'Dívida registrada com sucesso no saldo do cliente!',
        order: result.order,
        novo_saldo: result.updatedUser.saldo_devedor
      });
    } catch (error) {
      console.error('Erro ao registrar dívida:', error.message);
      return res.status(400).json({ error: error.message || 'Erro ao processar dívida.' });
    }
  },

  /**
   * 2. Listar reservas do dia para o painel do Admin
   * Retorna pedidos pendentes, prontos ou entregues criados na data de hoje.
   */
  getDailyReserves: async (req, res) => {
    try {
      const dailyOrders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              nome: true,
              telefone: true
            }
          }
        },
        orderBy: {
          data: 'desc'
        }
      });

      return res.status(200).json(dailyOrders);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      return res.status(500).json({ error: 'Erro ao buscar reservas.' });
    }
  },

  /**
   * Fazer reserva (Cliente reserva lanche)
   * Reduz estoque mas não adiciona dívida ainda (fica PENDENTE)
   */
  createReserve: async (req, res) => {
    const { userId, items, status, tipoPagamento } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Itens da reserva inválidos.' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        let total = 0;
        const itemsToSave = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.id }
          });

          if (!product) throw new Error('Produto não localizado.');
          if (product.estoque < item.quantidade) throw new Error(`Estoque esgotado para ${product.nome}`);

          await tx.product.update({
            where: { id: product.id },
            data: { estoque: product.estoque - item.quantidade }
          });

          total += product.preco * item.quantidade;
          itemsToSave.push({
            productId: product.id,
            nome: product.nome,
            preco: product.preco,
            quantidade: item.quantidade
          });
        }

        const orderStatus = status || 'PENDENTE';

        if (orderStatus === 'ENTREGUE') {
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) throw new Error('Cliente não encontrado.');
          await tx.user.update({
            where: { id: userId },
            data: { saldo_devedor: user.saldo_devedor + total }
          });
        }

        const newOrder = await tx.order.create({
          data: {
            userId,
            status: orderStatus,
            total,
            items: itemsToSave,
            tipoPagamento: tipoPagamento || 'FIADO'
          }
        });

        return newOrder;
      });

      return res.status(201).json({ message: 'Reserva efetuada com sucesso!', order: result });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  /**
   * Atualizar status da reserva (ex: PENDENTE -> PRONTO -> ENTREGUE / CANCELADO)
   * Se for alterado para ENTREGUE, adiciona a dívida ao saldo do cliente.
   * Se for CANCELADO, devolve o estoque dos produtos.
   */
  updateStatus: async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body; // PENDENTE, PRONTO, ENTREGUE, CANCELADO

    if (!['PENDENTE', 'PRONTO', 'ENTREGUE', 'CANCELADO'].includes(status)) {
      return res.status(400).json({ error: 'Status de pedido inválido.' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { user: true }
        });

        if (!order) throw new Error('Reserva não encontrada.');
        if (order.status === status) return order;

        // Se mudou para ENTREGUE e não estava entregue ainda, acrescenta ao saldo devedor do cliente
        if (status === 'ENTREGUE' && order.status !== 'ENTREGUE') {
          await tx.user.update({
            where: { id: order.userId },
            data: { saldo_devedor: order.user.saldo_devedor + order.total }
          });
        }

        // Se foi CANCELADO, devolve os produtos ao estoque
        if (status === 'CANCELADO' && order.status !== 'CANCELADO') {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                estoque: { increment: item.quantidade }
              }
            });
          }
        }

        // Atualizar status do pedido
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: { status }
        });

        return updatedOrder;
      });

      return res.status(200).json({ message: `Status atualizado para ${status}`, order: result });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }
  }
};

export default orderController;
