import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error(`Erro: Arquivo não encontrado em ${schemaPath}`);
  process.exit(1);
}

const target = process.argv[2];

if (!target) {
  console.log('Uso: node scripts/switch-db.js [postgresql | sqlite]');
  process.exit(0);
}

let content = fs.readFileSync(schemaPath, 'utf8');

if (target === 'postgresql' || target === 'postgres') {
  // Substituir sqlite por postgresql
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  // Substituir url do sqlite por env
  content = content.replace(/url\s*=\s*"file:\.\/dev\.db"/g, 'url = env("DATABASE_URL")');
  
  fs.writeFileSync(schemaPath, content);
  console.log('✅ schema.prisma alterado para PostgreSQL com sucesso!');
  console.log('Lembre-se de definir a variável de ambiente DATABASE_URL no seu ambiente.');
} else if (target === 'sqlite') {
  // Substituir postgresql por sqlite
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  // Substituir env por url do sqlite
  content = content.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');
  
  fs.writeFileSync(schemaPath, content);
  console.log('✅ schema.prisma alterado para SQLite com sucesso!');
} else {
  console.error('❌ Banco inválido. Escolha "postgresql" ou "sqlite".');
  process.exit(1);
}
