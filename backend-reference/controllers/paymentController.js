const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const paymentController = {
  /**
   * 3. Upload de comprovante de pagamento (simula a lógica de armazenamento)
   * Recebe o valor pago, o arquivo enviado (ou base64) e cria um registro pendente.
   */
  uploadReceipt: async (req, res) => {
    try {
      const { userId, valor, comprovanteBase64 } = req.body;

      if (!userId || !valor) {
        return res.status(400).json({ error: 'ID do usuário e valor do pagamento são obrigatórios.' });
      }

      const parsedValor = parseFloat(valor);
      if (isNaN(parsedValor) || parsedValor <= 0) {
        return res.status(400).json({ error: 'O valor do pagamento deve ser maior que zero.' });
      }

      // Simulação do armazenamento do arquivo:
      // Se estivéssemos usando Multer + S3, faríamos upload e pegaríamos a URL:
      // const comprovanteUrl = req.file ? req.file.location : defaultUrl;
      
      // Para o MVP ou demonstração, se vier uma string base64 nós a armazenamos,
      // ou geramos uma URL fictícia que aponta para o comprovante.
      let comprovanteUrl = comprovanteBase64;
      if (!comprovanteUrl) {
        comprovanteUrl = `https://storage.cantinadaangela.com/comprovantes/comp_${Date.now()}_u${userId}.png`;
      }

      // Validar se o cliente existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Cliente não encontrado para este pagamento.' });
      }

      // Criar registro de pagamento PENDENTE
      const payment = await prisma.payment.create({
        data: {
          userId,
          valor: parsedValor,
          comprovante_url: comprovanteUrl,
          status_aprovacao: 'PENDENTE'
        }
      });

      return res.status(201).json({
        message: 'Comprovante enviado com sucesso e enviado para análise do Admin!',
        payment
      });
    } catch (error) {
      console.error('Erro no upload do comprovante:', error);
      return res.status(500).json({ error: 'Erro ao processar envio do comprovante.' });
    }
  },

  /**
   * Listar todos os comprovantes para o Admin (filtra por status se necessário)
   */
  listPayments: async (req, res) => {
    try {
      const { status } = req.query; // PENDENTE, APROVADO, REJEITADO (opcional)

      const queryFilter = {};
      if (status) {
        queryFilter.status_aprovacao = status;
      }

      const paymentsList = await prisma.payment.findMany({
        where: queryFilter,
        include: {
          user: {
            select: {
              nome: true,
              cpf: true
            }
          }
        },
        orderBy: {
          data: 'desc'
        }
      });

      return res.status(200).json(paymentsList);
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      return res.status(500).json({ error: 'Erro ao buscar comprovantes.' });
    }
  },

  /**
   * Aprovar pagamento (Admin aprova e desconta da dívida do cliente)
   */
  approve: async (req, res) => {
    const { paymentId } = req.params;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Obter o pagamento
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { user: true }
        });

        if (!payment) throw new Error('Pagamento não localizado.');
        if (payment.status_aprovacao !== 'PENDENTE') {
          throw new Error(`Este pagamento já foi ${payment.status_aprovacao.toLowerCase()}.`);
        }

        // 1. Atualizar o status do pagamento para APROVADO
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: { status_aprovacao: 'APROVADO' }
        });

        // 2. Abater o valor do saldo devedor do cliente (garantindo que não seja menor que zero)
        const novoSaldo = Math.max(0, payment.user.saldo_devedor - payment.valor);
        await tx.user.update({
          where: { id: payment.userId },
          data: { saldo_devedor: novoSaldo }
        });

        return updatedPayment;
      });

      return res.status(200).json({
        message: 'Pagamento aprovado com sucesso! Saldo devedor do aluno atualizado.',
        payment: result
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }
  },

  /**
   * Rejeitar pagamento
   */
  reject: async (req, res) => {
    const { paymentId } = req.params;

    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pagamento não localizado.' });
      }

      if (payment.status_aprovacao !== 'PENDENTE') {
        return res.status(400).json({ error: `Este pagamento já está com status ${payment.status_aprovacao}.` });
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { status_aprovacao: 'REJEITADO' }
      });

      return res.status(200).json({
        message: 'Pagamento rejeitado. Nenhuma alteração foi feita no saldo devedor do cliente.',
        payment: updatedPayment
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao rejeitar pagamento.' });
    }
  }
};

module.exports = paymentController;
