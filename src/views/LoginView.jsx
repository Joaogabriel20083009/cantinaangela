import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { LogIn, User, Lock, Coffee, Eye, EyeOff, UserPlus } from 'lucide-react';

const LoginView = () => {
  const { login, registerUser } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  
  // Login states
  const [identifier, setIdentifier] = useState('');
  
  // Shared states
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);

  // Register states
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');

  // Formata apenas CPF (11 dígitos)
  const handleIdentifierChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Apenas números
    if (value.length > 11) value = value.slice(0, 11);
    
    // Formata como CPF (ex: 000.000.000-00)
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    }
    
    setIdentifier(value);
    setError('');
  };

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    }
    
    setCpf(value);
    setError('');
  };

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
    }
    
    setTelefone(value);
    setError('');
  };

  const handleSenhaChange = (e) => {
    setSenha(e.target.value);
    setError('');
  };

  const handleConfirmSenhaChange = (e) => {
    setConfirmSenha(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      if (!nome || !telefone || !cpf || !senha || !confirmSenha) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
      if (senha !== confirmSenha) {
        setError('As senhas não coincidem.');
        return;
      }
    } else {
      if (!identifier || !senha) {
        setError('CPF e senha são obrigatórios.');
        return;
      }
    }

    setLoading(true);
    setError('');

    // Simulando atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      if (isRegister) {
        await registerUser({
          nome,
          telefone: telefone.replace(/\D/g, ''),
          cpf: cpf.replace(/\D/g, ''),
          senha,
          role: 'CLIENT'
        });
        // Login automático após registro bem-sucedido
        await login(cpf.replace(/\D/g, ''), senha);
      } else {
        await login(identifier.replace(/\D/g, ''), senha);
      }
    } catch (err) {
      setError(err.message || (isRegister ? 'Erro ao realizar cadastro.' : 'Erro ao fazer login.'));
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setNome('');
    setTelefone('');
    setCpf('');
    setIdentifier('');
    setSenha('');
    setConfirmSenha('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-neutral-50 text-neutral-800 overflow-y-auto py-12 selection:bg-amber-500/10">
      
      {/* Container Principal */}
      <div className="w-full max-w-md flex flex-col gap-8">
        
        {/* Logo / Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/15 mb-4 animate-bounce-subtle">
            <Coffee size={32} className="text-neutral-950" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Cantina da Angela
          </h1>
          <p className="text-sm font-semibold text-neutral-500 mt-1">
            Gestão de lanches e saldo devedor escolar
          </p>
        </div>

        {/* Card de Login/Cadastro */}
        <Card className="shadow-xl shadow-neutral-200/50 border-neutral-200/60 bg-white/90 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-6 text-center text-neutral-800">
            {isRegister ? 'Crie sua conta' : 'Acesse sua conta'}
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {isRegister && (
              <>
                <Input
                  label="Nome Completo"
                  id="register-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setError(''); }}
                  icon={User}
                  required
                />

                <Input
                  label="Telefone Celular"
                  id="register-telefone"
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  icon={Phone}
                  required
                />

                <Input
                  label="CPF"
                  id="register-cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  icon={User}
                  required
                />
              </>
            )}

            {!isRegister && (
              <Input
                label="CPF"
                id="login-identifier"
                type="text"
                placeholder="000.000.000-00"
                value={identifier}
                onChange={handleIdentifierChange}
                icon={User}
                required
              />
            )}
            
            <Input
              label="Senha"
              id="login-senha"
              type={showSenha ? 'text' : 'password'}
              placeholder="••••••••"
              value={senha}
              onChange={handleSenhaChange}
              icon={Lock}
              trailingIcon={showSenha ? EyeOff : Eye}
              onTrailingIconClick={() => setShowSenha(!showSenha)}
              required
            />

            {isRegister && (
              <Input
                label="Confirmar Senha"
                id="register-confirm-senha"
                type={showConfirmSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmSenha}
                onChange={handleConfirmSenhaChange}
                icon={Lock}
                trailingIcon={showConfirmSenha ? EyeOff : Eye}
                onTrailingIconClick={() => setShowConfirmSenha(!showConfirmSenha)}
                required
              />
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-sm font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              className="mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>{isRegister ? 'Cadastrando...' : 'Entrando...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
                  <span>{isRegister ? 'Cadastrar Conta' : 'Acessar Cantina'}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span
              onClick={toggleMode}
              className="text-sm font-semibold text-neutral-500 hover:text-amber-600 cursor-pointer transition-colors"
            >
              {isRegister ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}
            </span>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default LoginView;
