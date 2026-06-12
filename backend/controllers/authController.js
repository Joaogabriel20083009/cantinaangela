import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'cantina-super-secret-key';

/**
 * Controller de Autenticação
 */
const authController = {
  /**
   * Realiza login do usuário (Admin ou Cliente) com geração de token JWT
   */
  login: async (req, res) => {
    try {
      const { identifier, senha } = req.body;

      if (!identifier || !senha) {
        return res.status(400).json({ error: 'Identificador (Telefone ou CPF) e senha são obrigatórios.' });
      }

      // Limpar caracteres especiais para busca
      const cleanedInput = identifier.replace(/\D/g, '');

      // Buscar usuário pelo CPF ou Telefone
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { cpf: cleanedInput },
            { telefone: cleanedInput }
          ]
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário (Telefone ou CPF) não cadastrado.' });
      }

      // Validar senha (em produção, usar bcrypt.compare)
      // Aqui validamos senha plana ou criptografada para fins de demonstração
      let isPasswordValid = false;
      if (user.senha.startsWith('$2b$') || user.senha.startsWith('$2a$')) {
        isPasswordValid = await bcrypt.compare(senha, user.senha);
      } else {
        isPasswordValid = user.senha === senha; // fallback para senha plana durante a transição
      }

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      // Gerar Token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role, nome: user.nome },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Retornar dados do usuário e token
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          telefone: user.telefone,
          cpf: user.cpf,
          saldo_devedor: user.saldo_devedor,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  },

  /**
   * Registro de novo cliente (criado pelo Admin ou cadastro inicial)
   */
  register: async (req, res) => {
    try {
      const { nome, telefone, cpf, senha, role } = req.body;

      if (!nome || !telefone || !cpf) {
        return res.status(400).json({ error: 'Nome, telefone e CPF são obrigatórios.' });
      }

      const cleanedCpf = cpf.replace(/\D/g, '');

      // Verificar se CPF já existe
      const existingUser = await prisma.user.findUnique({
        where: { cpf: cleanedCpf }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Este CPF já está cadastrado.' });
      }

      // Criptografar senha (senha padrão se não informada)
      const defaultPassword = senha || 'user123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          nome,
          telefone,
          cpf: cleanedCpf,
          senha: hashedPassword,
          role: role || 'CLIENT',
          saldo_devedor: 0.0
        }
      });

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        user: {
          id: newUser.id,
          nome: newUser.nome,
          cpf: newUser.cpf,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
  }
};

export default authController;
