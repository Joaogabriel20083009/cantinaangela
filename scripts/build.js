import { execSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';

try {
  if (isVercel) {
    console.log('🔄 Ambiente Vercel detectado. Preparando banco PostgreSQL...');
    
    // 1. Mudar o provider para postgresql dinamicamente
    console.log('⚙️ Alternando schema.prisma para PostgreSQL...');
    execSync('node scripts/switch-db.js postgresql', { stdio: 'inherit' });
    
    // 2. Regenerar o Prisma Client para PostgreSQL
    console.log('📦 Regenerando Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 3. Criar as tabelas no Neon
    console.log('🚀 Executando prisma db push no Neon...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // 4. Inserir o administrador inicial
    console.log('🌱 Executando seed do administrador...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
  } else {
    console.log('💻 Ambiente local detectado. Ignorando migração do banco...');
  }

  // 5. Compilar o frontend
  console.log('🏗️ Compilando o frontend Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('✅ Build concluído com sucesso!');
} catch (error) {
  console.error('❌ Ocorreu um erro durante o build:', error);
  process.exit(1);
}
