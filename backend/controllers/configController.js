import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../config.json');

const defaultConfig = {
  pixKey: "12.345.678/0001-99",
  beneficiario: "Cantina da Angela Ltda."
};

const readConfig = () => {
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config:', error);
    return defaultConfig;
  }
};

const writeConfig = (config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error writing config:', error);
    return { success: false, error: error.message };
  }
};

export default {
  get: async (req, res) => {
    const config = readConfig();
    res.json(config);
  },
  update: async (req, res) => {
    const { pixKey, beneficiario } = req.body;
    if (!pixKey || !beneficiario) {
      return res.status(400).json({ error: 'Chave Pix e Beneficiário são obrigatórios.' });
    }
    const config = { pixKey, beneficiario };
    const result = writeConfig(config);
    if (!result.success) {
      // Retornar o erro específico para ajudar diagnóstico localmente
      return res.status(500).json({ error: 'Erro ao salvar configurações.', detail: result.error });
    }
    res.json({ message: 'Configurações atualizadas com sucesso!', config });
  }
};
