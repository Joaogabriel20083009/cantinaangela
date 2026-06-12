import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import {
  Coffee, LogOut, Users, ShoppingBag, Clock, DollarSign,
  Search, Plus, Minus, Trash2, Check, X, UserPlus, Info, CheckCircle2, ChevronRight, FileSpreadsheet,
  MessageCircle, Send, Upload, Pencil, Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const {
    users,
    products,
    orders,
    payments,
    logout,
    addDebt,
    updateOrderStatus,
    approvePayment,
    rejectPayment,
    registerUser,
    addProduct,
    updateProduct,
    getClientLedger,
    messages,
    sendMessage,
    config,
    updateConfig
  } = useApp();

  const [activeTab, setActiveTab] = useState('fiado'); // 'fiado', 'reservas', 'pagamentos', 'clientes', 'chat'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  
  // Estados para Registro de Fiado
  const [selectedClient, setSelectedClient] = useState(null);
  const [cart, setCart] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Estados para Novo Cliente
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientCpf, setNewClientCpf] = useState('');
  const [newClientTelefone, setNewClientTelefone] = useState('');
  const [addClientError, setAddClientError] = useState('');

  // Estados para Modal de Comprovante Grande
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  // Estados para Criar Produto
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Salgados');
  const [newProductError, setNewProductError] = useState('');
  const [newProductImage, setNewProductImage] = useState(null);
  const [newProductImageName, setNewProductImageName] = useState('');

  // Estados para Editar Produto
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductStock, setEditProductStock] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('Salgados');
  const [editProductImage, setEditProductImage] = useState(null);
  const [editProductImageName, setEditProductImageName] = useState('');
  const [editProductError, setEditProductError] = useState('');

  // Estado para Modal do Carrinho do Admin
  const [showCartModal, setShowCartModal] = useState(false);

  // Estado para Visualizar Planilha do Aluno
  const [selectedLedgerClient, setSelectedLedgerClient] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [lastLoadedClientId, setLastLoadedClientId] = useState(null);

  useEffect(() => {
    if (selectedLedgerClient) {
      const isDifferentClient = selectedLedgerClient.id !== lastLoadedClientId;
      if (isDifferentClient || ledgerData.length === 0) {
        setLedgerLoading(true);
        setLedgerData([]);
      }
      getClientLedger(selectedLedgerClient.id)
        .then(data => {
          setLedgerData(data);
          setLastLoadedClientId(selectedLedgerClient.id);
          setLedgerLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLedgerLoading(false);
        });
    } else {
      setLedgerData([]);
      setLastLoadedClientId(null);
    }
  }, [selectedLedgerClient, orders, payments]);

  // Estados para Chat com Alunos
  const [selectedChatUserId, setSelectedChatUserId] = useState(null);
  const [adminChatText, setAdminChatText] = useState('');

  // Estados para Configuração do Pix (Admin)
  const [configPixKey, setConfigPixKey] = useState('');
  const [configBeneficiario, setConfigBeneficiario] = useState('');
  const [configLoading, setConfigLoading] = useState(false);

  const lastConfigRef = useRef(null);

  useEffect(() => {
    if (config && JSON.stringify(config) !== JSON.stringify(lastConfigRef.current)) {
      setConfigPixKey(config.pixKey || '');
      setConfigBeneficiario(config.beneficiario || '');
      lastConfigRef.current = config;
    }
  }, [config]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configPixKey.trim() || !configBeneficiario.trim()) {
      showToast('Todos os campos de configuração são obrigatórios.', 'error');
      return;
    }
    setConfigLoading(true);
    try {
      await updateConfig({
        pixKey: configPixKey.trim(),
        beneficiario: configBeneficiario.trim()
      });
      showToast('Configurações do Pix atualizadas com sucesso!');
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar configurações.', 'error');
    } finally {
      setConfigLoading(false);
    }
  };

  // Notificações Toast
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filtrar categorias dos produtos
  const categories = ['Todos', 'Salgados', 'Bebidas', 'Saudáveis', 'Doces'];

  // Filtragem de clientes para a busca de fiado e para a aba de clientes
  const filteredClients = users.filter(u => {
    if (u.role === 'ADMIN') return false;
    const query = searchTerm.toLowerCase();
    const cleanCpf = u.cpf.replace(/\D/g, '');
    const cleanQuery = query.replace(/\D/g, '');
    
    return u.nome.toLowerCase().includes(query) || 
           (cleanQuery && cleanCpf.includes(cleanQuery)) ||
           u.cpf.includes(query);
  });

  const fiadoFilteredClients = users.filter(u => {
    if (u.role === 'ADMIN') return false;
    const query = clientSearch.toLowerCase();
    const cleanCpf = u.cpf.replace(/\D/g, '');
    const cleanQuery = query.replace(/\D/g, '');
    
    return u.nome.toLowerCase().includes(query) || 
           (cleanQuery && cleanCpf.includes(cleanQuery)) ||
           u.cpf.includes(query);
  });

  // Filtragem de produtos por busca e categoria
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    return matchesCategory;
  });

  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    if (product.estoque <= 0) {
      showToast(`O produto ${product.nome} está sem estoque!`, 'error');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantidade >= product.estoque) {
          showToast(`Estoque máximo atingido para ${product.nome}!`, 'error');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantidade: 1 }];
    });
    showToast(`Adicionado: ${product.nome}`);
  };

  // Remover / Diminuir do carrinho
  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem.quantidade === 1) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      );
    });
  };

  const removeAllFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Finalizar Registro de Fiado
  const handleConfirmDebt = async () => {
    if (!selectedClient) {
      showToast('Por favor, selecione um cliente.', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('O carrinho está vazio.', 'error');
      return;
    }

    try {
      await addDebt(selectedClient.id, cart);
      showToast(`Dívida de R$ ${cartTotal.toFixed(2)} registrada para ${selectedClient.nome}!`);
      setCart([]);
      setSelectedClient(null);
      setClientSearch('');
      setShowCartDrawer(false);
    } catch (err) {
      showToast(err.message || 'Erro ao registrar fiado.', 'error');
    }
  };

  // Cadastrar Novo Cliente
  const handleAddClient = (e) => {
    e.preventDefault();
    setAddClientError('');
    if (!newClientNome || !newClientCpf || !newClientTelefone) {
      setAddClientError('Preencha todos os campos.');
      return;
    }

    try {
      registerUser({
        nome: newClientNome,
        cpf: newClientCpf,
        telefone: newClientTelefone,
        senha: 'user123' // Senha padrão
      });
      showToast('Cliente cadastrado com sucesso!');
      setNewClientNome('');
      setNewClientCpf('');
      setNewClientTelefone('');
      setShowAddClientModal(false);
    } catch (err) {
      setAddClientError(err.message || 'Erro ao cadastrar cliente.');
    }
  };

  // Criar Produto
  const handleCreateProduct = (e) => {
    e.preventDefault();
    setNewProductError('');

    if (!newProductName || !newProductPrice || !newProductStock) {
      setNewProductError('Preencha todos os campos.');
      return;
    }

    try {
      addProduct({
        nome: newProductName,
        preco: parseFloat(newProductPrice),
        estoque: parseInt(newProductStock),
        categoria: newProductCategory,
        imagem: newProductImage
      });
      showToast(`Produto "${newProductName}" criado com sucesso!`);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('');
      setNewProductCategory('Salgados');
      setNewProductImage(null);
      setNewProductImageName('');
      setShowAddProductModal(false);
    } catch (err) {
      setNewProductError('Erro ao criar produto.');
    }
  };

  // Abrir Modal de Edição de Produto
  const handleOpenEditProductModal = (product) => {
    setEditingProduct(product);
    setEditProductName(product.nome);
    setEditProductPrice(product.preco.toString());
    setEditProductStock(product.estoque.toString());
    setEditProductCategory(product.categoria);
    setEditProductImage(product.imagem);
    setEditProductImageName('');
    setEditProductError('');
    setShowEditProductModal(true);
  };

  // Salvar Alterações do Produto
  const handleUpdateProduct = (e) => {
    e.preventDefault();
    setEditProductError('');

    if (!editProductName || !editProductPrice || !editProductStock) {
      setEditProductError('Preencha todos os campos.');
      return;
    }

    try {
      updateProduct(editingProduct.id, {
        nome: editProductName,
        preco: parseFloat(editProductPrice),
        estoque: parseInt(editProductStock),
        categoria: editProductCategory,
        imagem: editProductImage
      });
      showToast(`Produto "${editProductName}" editado com sucesso!`);
      setShowEditProductModal(false);
      setEditingProduct(null);
    } catch (err) {
      setEditProductError('Erro ao editar produto.');
    }
  };

  // Enviar mensagem no chat com o aluno
  const handleAdminSendMessage = (e) => {
    e.preventDefault();
    if (!selectedChatUserId || !adminChatText.trim()) return;
    try {
      sendMessage('u-admin', selectedChatUserId, adminChatText.trim());
      setAdminChatText('');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar mensagem', 'error');
    }
  };

  // Cálculo de totais
  const cartTotal = cart.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col pb-24 md:pb-6 font-sans selection:bg-amber-500/10 selection:text-amber-700">
      
      {/* Toast Notificações */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 animate-slide-down ${
          toast.type === 'error' 
            ? 'bg-rose-50 border border-rose-200 text-rose-600' 
            : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Admin */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 px-4 py-4 flex items-center justify-between shadow-sm shadow-neutral-100/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/15">
            <Coffee size={20} className="text-neutral-950" />
          </div>
          <div>
            <h1 className="text-md font-bold leading-tight text-neutral-900">Painel Administrativo</h1>
            <span className="text-[10px] text-amber-700 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Cantina</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-2.5 bg-neutral-100 hover:bg-rose-50 border border-neutral-200 rounded-2xl text-neutral-600 hover:text-rose-600 hover:border-rose-200 transition-all duration-200 cursor-pointer active:scale-95"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Layout Grid Adaptativo */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* Navegação de Abas - Desktop Topo / Mobile no Rodapé */}
        <div className="hidden md:flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <button
            onClick={() => setActiveTab('fiado')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'fiado' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <ShoppingBag size={18} />
            <span>Registrar Fiado</span>
          </button>
          <button
            onClick={() => { setActiveTab('reservas'); setSearchTerm(''); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'reservas' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <Clock size={18} />
            <span>Reservas do Dia</span>
            {orders.filter(o => o.status === 'PENDENTE').length > 0 && (
              <span className="bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {orders.filter(o => o.status === 'PENDENTE').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('pagamentos'); setSearchTerm(''); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pagamentos' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <DollarSign size={18} />
            <span>Pagamentos</span>
            {payments.filter(p => p.status_aprovacao === 'PENDENTE').length > 0 && (
              <span className="bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {payments.filter(p => p.status_aprovacao === 'PENDENTE').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('clientes'); setSearchTerm(''); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'clientes' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <Users size={18} />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => { setActiveTab('chat'); setSelectedChatUserId(users.find(u => u.role === 'CLIENT')?.id || null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <MessageCircle size={18} />
            <span>Chat Alunos</span>
          </button>
          <button
            onClick={() => { setActiveTab('config'); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'config' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <Settings size={18} />
            <span>Pix</span>
          </button>
        </div>

        {/* -------------------- CONTEÚDO DAS ABAS -------------------- */}

        {/* 1. ABA REGISTRAR FIADO */}
        {activeTab === 'fiado' && (
          <div className="flex flex-col gap-6">
            
            {/* Card Seleção de Cliente */}
            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-800">1. Selecionar Cliente</h3>
                <button 
                  onClick={() => setShowAddClientModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>Novo Cliente</span>
                </button>
              </div>
              
              {selectedClient ? (
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center">
                      {selectedClient.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-neutral-900">{selectedClient.nome}</div>
                      <div className="text-xs text-neutral-500 font-medium">CPF: {selectedClient.cpf}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase font-black tracking-wider">Saldo Devedor</div>
                      <div className="font-black text-rose-600 text-base">R$ {selectedClient.saldo_devedor.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                      className="text-neutral-400 hover:text-neutral-600 p-1.5 hover:bg-amber-100/50 rounded-lg transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente por Nome ou CPF..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    icon={Search}
                  />
                  
                  {clientSearch.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-white border border-neutral-200 rounded-2xl max-h-52 overflow-y-auto shadow-xl">
                      {fiadoFilteredClients.length > 0 ? (
                        fiadoFilteredClients.map(client => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(client);
                              setClientSearch('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center justify-between border-b border-neutral-100 last:border-b-0 transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-extrabold text-sm block text-neutral-800">{client.nome}</span>
                              <span className="text-xs text-neutral-500 font-medium">CPF: {client.cpf}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-neutral-500 block uppercase">Dívida Atual</span>
                              <span className="text-xs font-black text-rose-600">R$ {client.saldo_devedor.toFixed(2)}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-5 text-center flex flex-col items-center gap-2">
                          <p className="text-sm text-neutral-500 font-medium">Nenhum cliente cadastrado com esse nome/CPF.</p>
                          <button
                            type="button"
                            onClick={() => {
                              const cleaned = clientSearch.replace(/\D/g, '');
                              const isNumeric = cleaned.length > 0;
                              if (isNumeric) {
                                if (cleaned.length <= 11) {
                                  // CPF format
                                  let val = cleaned;
                                  if (val.length > 9) {
                                    val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
                                  } else if (val.length > 6) {
                                    val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
                                  } else if (val.length > 3) {
                                    val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
                                  }
                                  setNewClientCpf(val);
                                  setNewClientNome('');
                                  setNewClientTelefone('');
                                } else {
                                  // Phone format
                                  let val = cleaned;
                                  if (val.length > 10) {
                                    val = val.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
                                  } else if (val.length > 6) {
                                    val = val.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
                                  } else if (val.length > 2) {
                                    val = val.replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
                                  }
                                  setNewClientTelefone(val);
                                  setNewClientNome('');
                                  setNewClientCpf('');
                                }
                              } else {
                                setNewClientNome(clientSearch);
                                setNewClientCpf('');
                                setNewClientTelefone('');
                              }
                              setShowAddClientModal(true);
                              setClientSearch('');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 hover:text-amber-800 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/25 transition-all cursor-pointer active:scale-95 shadow-sm"
                          >
                            <UserPlus size={14} />
                            <span>Cadastrar "{clientSearch}" Agora</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Grid de Produtos */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-800">2. Escolher Produtos</h3>
              </div>
              
              {/* Categorias Filtro & Criar Produto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-neutral-900 text-white font-black shadow-sm'
                          : 'bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-1.5 text-xs font-black text-amber-700 hover:text-amber-800 bg-amber-500/10 px-4 py-2.5 rounded-full border border-amber-500/25 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95 shrink-0"
                >
                  <Plus size={14} />
                  <span>Criar Produto</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredProducts.map(p => (
                  <Card
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col justify-between h-64 p-3 border-neutral-200 relative group cursor-pointer active:scale-95 shadow-sm bg-white"
                  >
                    {/* Imagem do Produto */}
                    <div className="h-28 w-full bg-neutral-100 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center border border-neutral-200/40">
                      {p.imagem ? (
                        <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Coffee className="text-neutral-300" size={32} />
                      )}

                      {/* Botão de Editar (Pencil) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar adicionar ao carrinho
                          handleOpenEditProductModal(p);
                        }}
                        className="absolute top-2 left-2 p-1.5 bg-white/95 hover:bg-amber-500 hover:text-neutral-950 text-neutral-600 rounded-lg shadow-sm border border-neutral-200/50 cursor-pointer active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                        title="Editar Produto"
                      >
                        <Pencil size={12} />
                      </button>
                      
                      {/* Estoque Badge */}
                      <div className={`absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                        p.estoque <= 0
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : p.estoque < 5
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        Estoque: {p.estoque}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">{p.categoria}</span>
                        <h4 className="font-extrabold text-xs text-neutral-800 leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors mt-0.5">
                          {p.nome}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black text-amber-600">R$ {p.preco.toFixed(2)}</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-500/10">
                          <Plus size={14} />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* 2. ABA RESERVAS DO DIA */}
        {activeTab === 'reservas' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Reservas Solicitadas</h3>
                <p className="text-xs text-neutral-500 mt-1">Gerencie as reservas de lanches separadas por dia</p>
              </div>
              
              <div className="w-full md:w-80">
                <Input
                  placeholder="Filtrar por nome do aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
            </div>

            {/* Filtro de Status */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { value: 'TODOS', label: 'Todos' },
                { value: 'PENDENTE', label: 'Pendentes' },
                { value: 'PRONTO', label: 'Prontos' },
                { value: 'ENTREGUE', label: 'Entregues' },
                { value: 'CANCELADO', label: 'Cancelados' }
              ].map(status => {
                const count = orders.filter(o => {
                  const matchesSearch = o.user?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                  return (status.value === 'TODOS' || o.status === status.value) && matchesSearch;
                }).length;
                return (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      statusFilter === status.value
                        ? 'bg-neutral-900 text-white font-black shadow-sm'
                        : 'bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {status.label} ({count})
                  </button>
                );
              })}
            </div>

            {(() => {
              const filteredOrders = orders.filter(o => {
                const matchesSearch = o.user?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                const matchesStatus = statusFilter === 'TODOS' || o.status === statusFilter;
                return matchesSearch && matchesStatus;
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl shadow-sm">
                    <Clock size={48} className="text-neutral-350 mx-auto mb-3" />
                    <p className="text-sm font-bold text-neutral-500">Nenhuma reserva localizada.</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {statusFilter === 'TODOS' 
                        ? 'As reservas feitas pelos clientes aparecerão aqui em tempo real.' 
                        : `Não há reservas com status "${statusFilter.toLowerCase()}" para os filtros selecionados.`}
                    </p>
                  </div>
                );
              }

              // Agrupar pedidos por dia
              const groupedOrders = filteredOrders.reduce((acc, order) => {
                const dateObj = new Date(order.data);
                const dateKey = dateObj.toLocaleDateString('pt-BR');
                if (!acc[dateKey]) {
                  acc[dateKey] = [];
                }
                acc[dateKey].push(order);
                return acc;
              }, {});

              return (
                <div className="flex flex-col gap-8">
                  {Object.keys(groupedOrders).map(dateKey => {
                    const todayStr = new Date().toLocaleDateString('pt-BR');
                    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');
                    
                    let dayLabel = dateKey;
                    if (dateKey === todayStr) {
                      dayLabel = 'Hoje';
                    } else if (dateKey === yesterdayStr) {
                      dayLabel = 'Ontem';
                    }

                    return (
                      <div key={dateKey} className="flex flex-col gap-4">
                        {/* Header de Data */}
                        <div className="flex items-center gap-3 border-b border-neutral-200 pb-2">
                          <span className="text-sm font-black text-neutral-900 uppercase tracking-wider">{dayLabel} ({dateKey})</span>
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            {groupedOrders[dateKey].length} {groupedOrders[dateKey].length === 1 ? 'reserva' : 'reservas'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupedOrders[dateKey].map(order => {
                            const orderDate = new Date(order.data);
                            const formattedTime = orderDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const formattedDate = orderDate.toLocaleDateString('pt-BR');

                            return (
                              <Card key={order.id} className="border-neutral-200 flex flex-col justify-between gap-4 bg-white shadow-sm">
                                <div>
                                  {/* Header da Reserva */}
                                  <div className="flex justify-between items-start border-b border-neutral-100 pb-3 mb-3">
                                    <div>
                                      <div className="font-black text-neutral-800 text-base">{order.user?.nome}</div>
                                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5 block">
                                        ID: #{order.id.slice(-6)} • {formattedDate} às {formattedTime}
                                      </span>
                                      
                                      {/* Tipo de Pagamento */}
                                      <div className="mt-1.5 flex items-center flex-wrap gap-1.5">
                                        {order.tipoPagamento === 'PIX' ? (
                                          <>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                                              order.statusPagamento === 'PAGO'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-amber-50 border-amber-200 text-amber-700'
                                            }`}>
                                              PIX: {order.statusPagamento === 'PAGO' ? 'Pago' : 'Aguardando Pix'}
                                            </span>
                                            {order.statusPagamento === 'PENDENTE' && (() => {
                                              const associatedPayment = payments.find(p => p.orderId === order.id);
                                              if (associatedPayment) {
                                                return (
                                                  <button
                                                    onClick={() => setSelectedProofUrl(associatedPayment.comprovante_url)}
                                                    className="text-[9px] text-[#107c41] hover:text-[#0b592e] font-black underline cursor-pointer"
                                                    type="button"
                                                  >
                                                    Ver Comprovante
                                                  </button>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </>
                                        ) : (
                                          <span className="text-[9px] px-2 py-0.5 rounded-full font-black border uppercase bg-neutral-100 border-neutral-200 text-neutral-500 tracking-wider">
                                            FIADO
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                                      order.status === 'PENDENTE'
                                        ? 'bg-amber-50 border-amber-100 text-amber-700'
                                        : order.status === 'PRONTO'
                                        ? 'bg-blue-500/10 border-blue-200 text-blue-600'
                                        : order.status === 'ENTREGUE'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        : 'bg-rose-50 border-rose-100 text-rose-600'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>

                                  {/* Itens do Pedido */}
                                  <div className="flex flex-col gap-1.5 pl-1.5">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="text-sm text-neutral-700 flex justify-between">
                                        <span>
                                          <strong className="text-amber-600 font-extrabold">{item.quantidade}x</strong> {item.nome}
                                        </span>
                                        <span className="text-neutral-500 text-xs font-semibold">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Rodapé da Reserva */}
                                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between mt-2">
                                  <div>
                                    <span className="text-[9px] text-neutral-400 font-black block uppercase tracking-wider">Total</span>
                                    <span className="text-lg font-black text-amber-600">R$ {order.total.toFixed(2)}</span>
                                  </div>

                                  {/* Ações da Reserva */}
                                  <div className="flex gap-2">
                                    {order.status === 'PENDENTE' && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateOrderStatus(order.id, 'CANCELADO');
                                              showToast('Reserva cancelada, estoque devolvido.');
                                            } catch (err) {
                                              showToast(err.message || 'Erro ao rejeitar reserva.', 'error');
                                            }
                                          }}
                                          className="px-3.5 py-2.5 bg-white hover:bg-rose-50 border border-neutral-300 text-xs font-bold rounded-xl text-rose-600 transition-all cursor-pointer active:scale-95"
                                        >
                                          Rejeitar
                                        </button>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateOrderStatus(order.id, 'PRONTO');
                                              showToast('Pedido marcado como pronto para retirada!');
                                            } catch (err) {
                                              showToast(err.message || 'Erro ao marcar pronto.', 'error');
                                            }
                                          }}
                                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                                        >
                                          Marcar Pronto
                                        </button>
                                      </>
                                    )}
                                    
                                    {order.status === 'PRONTO' && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateOrderStatus(order.id, 'CANCELADO');
                                              showToast('Reserva cancelada, estoque devolvido.');
                                            } catch (err) {
                                              showToast(err.message || 'Erro ao cancelar reserva.', 'error');
                                            }
                                          }}
                                          className="px-3.5 py-2.5 bg-white hover:bg-rose-50 border border-neutral-300 text-xs font-bold rounded-xl text-rose-600 transition-all cursor-pointer active:scale-95"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await updateOrderStatus(order.id, 'ENTREGUE');
                                              showToast(order.tipoPagamento === 'PIX' && order.statusPagamento === 'PAGO'
                                                ? 'Pedido entregue! (Já pago via Pix)'
                                                : 'Pedido entregue e cobrado no fiado!'
                                              );
                                            } catch (err) {
                                              showToast(err.message || 'Erro ao entregar pedido.', 'error');
                                            }
                                          }}
                                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                                        >
                                          <Check size={14} />
                                          <span>
                                            {order.tipoPagamento === 'PIX' && order.statusPagamento === 'PAGO'
                                              ? 'Entregar (Pago)'
                                              : 'Entregar e Cobrar'}
                                          </span>
                                        </button>
                                      </>
                                    )}

                                    {order.status === 'ENTREGUE' && (
                                      <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-2 border border-emerald-200 rounded-xl flex items-center gap-1">
                                        <CheckCircle2 size={14} />
                                        <span>
                                          {order.tipoPagamento === 'PIX' && order.statusPagamento === 'PAGO'
                                            ? 'Entregue (Pago Pix)'
                                            : 'Entregue e Fiado cobrado'}
                                        </span>
                                      </div>
                                    )}

                                    {order.status === 'CANCELADO' && (
                                      <div className="text-xs text-neutral-400 font-bold bg-neutral-100 px-3 py-2 border border-neutral-200 rounded-xl">
                                        Reserva Cancelada
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* 3. ABA APROVAÇÃO DE PAGAMENTOS */}
        {activeTab === 'pagamentos' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">Aprovação de Pagamentos</h3>
              <p className="text-xs text-neutral-500 mt-1">Confirme os comprovantes de Pix enviados pelos alunos para abater saldo devedor</p>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl shadow-sm">
                <DollarSign size={48} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-500">Nenhum pagamento registrado.</p>
              </div>
            ) : (
              (() => {
                const groupedPayments = payments.reduce((acc, payment) => {
                  const dateObj = new Date(payment.data);
                  const dateKey = dateObj.toLocaleDateString('pt-BR');
                  if (!acc[dateKey]) {
                    acc[dateKey] = [];
                  }
                  acc[dateKey].push(payment);
                  return acc;
                }, {});

                return (
                  <div className="flex flex-col gap-8">
                    {Object.keys(groupedPayments).map(dateKey => {
                      const todayStr = new Date().toLocaleDateString('pt-BR');
                      const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');
                      
                      let dayLabel = dateKey;
                      if (dateKey === todayStr) {
                        dayLabel = 'Hoje';
                      } else if (dateKey === yesterdayStr) {
                        dayLabel = 'Ontem';
                      }

                      return (
                        <div key={dateKey} className="flex flex-col gap-4">
                          {/* Header de Data */}
                          <div className="flex items-center gap-3 border-b border-neutral-200 pb-2">
                            <span className="text-sm font-black text-neutral-900 uppercase tracking-wider">{dayLabel} ({dateKey})</span>
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                              {groupedPayments[dateKey].length} {groupedPayments[dateKey].length === 1 ? 'pagamento' : 'pagamentos'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedPayments[dateKey].map(payment => {
                              const paymentDate = new Date(payment.data);
                              const formattedTime = paymentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                              const formattedDate = paymentDate.toLocaleDateString('pt-BR');

                              return (
                                <Card key={payment.id} className="border-neutral-200 flex flex-col justify-between gap-5 bg-white shadow-sm">
                                  <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="font-black text-neutral-800 block text-base leading-snug">{payment.user?.nome}</span>
                                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mt-0.5">
                                          {formattedDate} às {formattedTime}
                                        </span>
                                      </div>
                                      
                                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                                        payment.status_aprovacao === 'PENDENTE'
                                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                                          : payment.status_aprovacao === 'APROVADO'
                                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                          : 'bg-rose-50 border-rose-100 text-rose-600'
                                      }`}>
                                        {payment.status_aprovacao}
                                      </span>
                                    </div>

                                    <div className="flex items-baseline gap-1 mt-1 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80 justify-center">
                                      <span className="text-[10px] text-neutral-500 font-black uppercase tracking-wider">Valor Informado:</span>
                                      <span className="text-xl font-black text-amber-600">R$ {payment.valor.toFixed(2)}</span>
                                    </div>

                                    {/* Preview do Comprovante */}
                                    <div className="mt-2">
                                      <span className="text-[9px] font-black text-neutral-400 block uppercase mb-1.5 pl-1 tracking-wider">Comprovante de pagamento</span>
                                      <div 
                                        onClick={() => setSelectedProofUrl(payment.comprovante_url)}
                                        className="h-28 w-full border border-neutral-200 rounded-2xl bg-neutral-50 overflow-hidden cursor-zoom-in relative group transition-all hover:border-neutral-300 shadow-inner"
                                      >
                                        <img
                                          src={payment.comprovante_url}
                                          alt="Comprovante"
                                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white transition-all">
                                          Clique para ampliar
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ações */}
                                  <div className="border-t border-neutral-100 pt-4 flex gap-3">
                                    {payment.status_aprovacao === 'PENDENTE' ? (
                                      <>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await rejectPayment(payment.id);
                                              showToast('Pagamento rejeitado.', 'error');
                                            } catch (err) {
                                              showToast(err.message || 'Erro ao rejeitar pagamento.', 'error');
                                            }
                                          }}
                                          className="flex-1 py-3 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-neutral-300 transition-all cursor-pointer active:scale-95 text-center"
                                        >
                                          Rejeitar
                                        </button>
                                        <button
                                          onClick={async () => {
                                            try {
                                              await approvePayment(payment.id);
                                              showToast(`Pagamento de R$ ${payment.valor.toFixed(2)} aprovado! Dívida amortizada.`);
                                            } catch (err) {
                                              showToast(err.message || 'Erro ao aprovar pagamento.', 'error');
                                            }
                                          }}
                                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
                                        >
                                          <Check size={14} />
                                          <span>Aprovar</span>
                                        </button>
                                      </>
                                    ) : (
                                      <div className="w-full text-center py-2 bg-neutral-50 text-xs font-bold text-neutral-500 rounded-xl border border-neutral-200">
                                        {payment.status_aprovacao === 'APROVADO' 
                                          ? 'Pagamento Aprovado (Saldo Abatido)' 
                                          : 'Pagamento Rejeitado'}
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* 4. ABA CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Clientes Cadastrados</h3>
                <p className="text-xs text-neutral-500 mt-1">Busque alunos e verifique suas dívidas acumuladas na cantina</p>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="flex-1 md:w-80">
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                  />
                </div>
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <UserPlus size={18} />
                  <span className="hidden sm:inline">Adicionar Aluno</span>
                </button>
              </div>
            </div>

            <Card className="border-neutral-200 p-0 overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-[#f8f9fc] text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">CPF</th>
                      <th className="px-6 py-4">Telefone</th>
                      <th className="px-6 py-4 text-right">Saldo Devedor</th>
                      <th className="px-6 py-4 text-center">Planilha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-100 text-amber-700 font-bold flex items-center justify-center shrink-0 border border-neutral-200/50">
                            {client.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-sm text-neutral-900">{client.nome}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 font-medium">{client.cpf}</td>
                        <td className="px-6 py-4 text-sm text-neutral-500 font-medium">{client.telefone}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-base font-black ${client.saldo_devedor > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            R$ {client.saldo_devedor.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedLedgerClient(client)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-[#0b592e] bg-[#107c41]/10 hover:bg-[#107c41]/15 px-3 py-1.5 rounded-xl border border-[#107c41]/20 transition-all cursor-pointer active:scale-95"
                            title="Ver planilha de extrato"
                          >
                            <FileSpreadsheet size={14} />
                            <span>Abrir</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-sm font-bold text-neutral-400">
                          Nenhum cliente correspondente encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* 5. ABA CHAT COM ALUNOS */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm h-[600px]">
            
            {/* Painel Esquerdo: Lista de Alunos */}
            <div className="md:col-span-1 border-r border-neutral-200 flex flex-col h-full overflow-hidden bg-neutral-50/50">
              <div className="p-4 border-b border-neutral-200 shrink-0 bg-white">
                <h4 className="font-extrabold text-sm text-neutral-800">Conversas com Alunos</h4>
                <p className="text-[10px] text-neutral-400 font-bold mt-0.5">Selecione um aluno para responder as mensagens</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
                {users
                  .filter(u => u.role === 'CLIENT')
                  .map(client => {
                    const clientLastMsg = messages
                      .filter(m => (m.senderId === client.id && m.recipientId === 'u-admin') || (m.senderId === 'u-admin' && m.recipientId === client.id))
                      .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

                    const unreadCount = messages
                      .filter(m => m.senderId === client.id && m.recipientId === 'u-admin' && new Date(m.data) > new Date(Date.now() - 1200000)).length; // Simulado

                    const isSelected = selectedChatUserId === client.id;

                    return (
                      <button
                        key={client.id}
                        onClick={() => setSelectedChatUserId(client.id)}
                        className={`w-full text-left p-4 flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#107c41]/5 border-l-4 border-[#107c41]' : 'hover:bg-neutral-50 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                            isSelected ? 'bg-[#107c41] text-white' : 'bg-neutral-200 text-neutral-700 border border-neutral-200/50'
                          }`}>
                            {client.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-neutral-800 block truncate">{client.nome}</span>
                            <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                              {clientLastMsg ? clientLastMsg.text : 'Sem mensagens anteriores'}
                            </span>
                          </div>
                        </div>
                        
                        {clientLastMsg && (
                          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-[8px] text-neutral-400 font-bold">
                              {new Date(clientLastMsg.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {unreadCount > 0 && !isSelected && (
                              <span className="bg-[#107c41] text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Painel Direito: Janela de Chat */}
            <div className="md:col-span-2 flex flex-col h-full overflow-hidden bg-white">
              {selectedChatUserId ? (() => {
                const activeClient = users.find(u => u.id === selectedChatUserId);
                const conversation = messages
                  .filter(m => 
                    (m.senderId === selectedChatUserId && m.recipientId === 'u-admin') ||
                    (m.senderId === 'u-admin' && m.recipientId === selectedChatUserId)
                  )
                  .sort((a, b) => new Date(a.data) - new Date(b.data));

                return (
                  <>
                    {/* Header do Chat */}
                    <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
                      <div>
                        <h4 className="font-extrabold text-sm text-neutral-800">{activeClient.nome}</h4>
                        <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-0.5">
                          CPF: {activeClient.cpf} • Dívida Fiado: R$ {activeClient.saldo_devedor.toFixed(2)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setSelectedLedgerClient(activeClient)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#107c41] hover:text-[#0b592e] bg-[#107c41]/10 px-3 py-1.5 rounded-xl border border-[#107c41]/20 transition-all cursor-pointer"
                      >
                        <FileSpreadsheet size={14} />
                        <span>Ver Extrato</span>
                      </button>
                    </div>

                    {/* Histórico do Chat */}
                    <div className="flex-1 p-4 overflow-y-auto bg-neutral-50 flex flex-col gap-3">
                      {conversation.map(msg => {
                        const isAdmin = msg.senderId === 'u-admin';
                        const dateObj = new Date(msg.data);
                        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[80%] ${
                              isAdmin ? 'self-end items-end' : 'self-start items-start'
                            }`}
                          >
                            <span className="text-[9px] text-neutral-400 font-bold mb-0.5">{msg.senderName}</span>
                            <div className={`p-3 rounded-2xl border text-[13px] leading-relaxed ${
                              isAdmin 
                                ? 'bg-[#107c41] border-[#0e6b37] text-white rounded-tr-none'
                                : 'bg-white border-neutral-200 text-neutral-800 rounded-tl-none' 
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-neutral-400 mt-0.5">{timeStr}</span>
                          </div>
                        );
                      })}
                      
                      {conversation.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                          <MessageCircle size={40} className="text-neutral-300 mb-2" />
                          <p className="text-sm font-bold text-neutral-500">Nenhuma mensagem ainda.</p>
                          <p className="text-xs text-neutral-400 mt-1">Envie uma mensagem para iniciar a conversa com o aluno.</p>
                        </div>
                      )}
                    </div>

                    {/* Input do Chat */}
                    <form onSubmit={handleAdminSendMessage} className="p-4 bg-white border-t border-neutral-200 flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={adminChatText}
                        onChange={(e) => setAdminChatText(e.target.value)}
                        placeholder={`Escrever resposta para ${activeClient.nome.split(' ')[0]}...`}
                        className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-xl focus:outline-none focus:border-[#107c41] text-xs font-sans"
                      />
                      <button 
                        type="submit"
                        className="px-5 bg-[#107c41] hover:bg-[#0b592e] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 shrink-0"
                      >
                        <Send size={14} />
                        <span>Enviar</span>
                      </button>
                    </form>
                  </>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageCircle size={48} className="text-neutral-350 mb-3" />
                  <p className="text-sm font-bold text-neutral-500">Nenhuma conversa ativa.</p>
                  <p className="text-xs text-neutral-400 mt-1">Selecione um aluno na lista ao lado para conversar.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 6. ABA CONFIGURAÇÕES */}
        {activeTab === 'config' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">Configurações do Pix</h3>
              <p className="text-xs text-neutral-500 mt-1">Atualize a chave Pix e o nome do beneficiário para recebimento dos pagamentos dos alunos</p>
            </div>

            <Card className="border-neutral-200 p-6 flex flex-col gap-5 bg-white shadow-sm">
              <h3 className="font-extrabold text-base text-neutral-800 border-b border-neutral-100 pb-2">Dados de Pagamento</h3>
              
              <form onSubmit={handleSaveConfig} className="flex flex-col gap-5">
                <Input
                  label="Chave Pix (CNPJ, Telefone ou CPF)"
                  placeholder="Ex: 12.345.678/0001-99"
                  value={configPixKey}
                  onChange={(e) => setConfigPixKey(e.target.value)}
                  required
                />

                <Input
                  label="Nome do Beneficiário"
                  placeholder="Ex: Cantina da Angela Ltda."
                  value={configBeneficiario}
                  onChange={(e) => setConfigBeneficiario(e.target.value)}
                  required
                />

                <Button
                  variant="success"
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={configLoading}
                  className="mt-2"
                >
                  {configLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando Configurações...</span>
                    </div>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        )}

      </main>

      {/* -------------------- BARRA DE NAVEGAÇÃO MOBILE (DOCK) -------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-2.5 flex justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('fiado')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'fiado' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <ShoppingBag size={20} />
          <span className="text-[10px] font-bold">Registrar Fiado</span>
        </button>
        <button
          onClick={() => { setActiveTab('reservas'); setSearchTerm(''); }}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
            activeTab === 'reservas' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <Clock size={20} />
          {orders.filter(o => o.status === 'PENDENTE').length > 0 && (
            <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black">
              {orders.filter(o => o.status === 'PENDENTE').length}
            </span>
          )}
          <span className="text-[10px] font-bold">Reservas</span>
        </button>
        <button
          onClick={() => { setActiveTab('pagamentos'); setSearchTerm(''); }}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
            activeTab === 'pagamentos' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <DollarSign size={20} />
          {payments.filter(p => p.status_aprovacao === 'PENDENTE').length > 0 && (
            <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black">
              {payments.filter(p => p.status_aprovacao === 'PENDENTE').length}
            </span>
          )}
          <span className="text-[10px] font-bold">Pagamentos</span>
        </button>
        <button
          onClick={() => { setActiveTab('clientes'); setSearchTerm(''); }}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'clientes' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] font-bold">Clientes</span>
        </button>
        <button
          onClick={() => { setActiveTab('chat'); setSelectedChatUserId(users.find(u => u.role === 'CLIENT')?.id || null); }}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'chat' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <MessageCircle size={20} />
          <span className="text-[10px] font-bold">Chat</span>
        </button>
        <button
          onClick={() => { setActiveTab('config'); }}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'config' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <Settings size={20} />
          <span className="text-[10px] font-bold">Pix</span>
        </button>
      </nav>

      {/* -------------------- MODAL: NOVO CLIENTE -------------------- */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white border-neutral-200 p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-neutral-900">
                <UserPlus className="text-amber-600" size={20} />
                <span>Cadastrar Novo Cliente</span>
              </h3>
              <button 
                onClick={() => { setShowAddClientModal(false); setAddClientError(''); }}
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="flex flex-col gap-4">
              <Input
                label="Nome Completo"
                placeholder="Ex: João da Silva Santos"
                value={newClientNome}
                onChange={(e) => setNewClientNome(e.target.value)}
                required
              />
              
              <Input
                label="CPF"
                placeholder="Ex: 111.111.111-11"
                value={newClientCpf}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').slice(0, 11);
                  if (val.length > 9) {
                    val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
                  } else if (val.length > 6) {
                    val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
                  } else if (val.length > 3) {
                    val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
                  }
                  setNewClientCpf(val);
                }}
                required
              />

              <Input
                label="Telefone Celular"
                placeholder="Ex: (11) 98888-7777"
                value={newClientTelefone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').slice(0, 11);
                  if (val.length > 10) {
                    val = val.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
                  } else if (val.length > 6) {
                    val = val.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
                  } else if (val.length > 2) {
                    val = val.replace(/^(\d{2})(\d{0,4})$/, '($1) $2');
                  }
                  setNewClientTelefone(val);
                }}
                required
              />

              {addClientError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                  {addClientError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => { setShowAddClientModal(false); setAddClientError(''); }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                >
                  Cadastrar Aluno
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* -------------------- MODAL: COMPROVANTE AMPLIADO -------------------- */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedProofUrl(null)}>
          <div className="relative max-w-lg w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedProofUrl(null)} 
                className="bg-white hover:bg-neutral-100 p-2.5 rounded-full text-neutral-600 border border-neutral-200 cursor-pointer active:scale-95 transition-all shadow-md"
              >
                <X size={20} />
              </button>
            </div>
            <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden p-2 shadow-2xl">
              <img
                src={selectedProofUrl}
                alt="Comprovante Ampliado"
                className="w-full h-auto object-contain rounded-2xl max-h-[80vh]"
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------- BOTÃO FLUTUANTE DO CARRINHO -------------------- */}
      {totalCartItems > 0 && activeTab === 'fiado' && (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCartModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-sm py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-amber-400"
          >
            <ShoppingBag size={18} />
            <span>Ver Carrinho ({totalCartItems}) - R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* -------------------- MODAL: CARRINHO / FECHAR PEDIDO -------------------- */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg bg-white border-neutral-200 p-6 flex flex-col gap-5 shadow-2xl h-[560px] justify-between">
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h3 className="font-black text-lg text-neutral-900 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-amber-500" />
                  <span>Resumo do Pedido</span>
                </h3>
                <button 
                  onClick={() => setShowCartModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="font-extrabold text-sm text-neutral-800 block truncate">{item.nome}</span>
                      <span className="text-xs text-amber-600 font-extrabold">R$ {item.preco.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-black w-6 text-center text-neutral-800">{item.quantidade}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeAllFromCart(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg transition-colors ml-1 cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4 mt-4 flex flex-col gap-4 bg-neutral-50 p-2.5 rounded-2xl">
              {selectedClient ? (
                <div className="text-xs bg-white p-3 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
                  <span className="text-neutral-400 font-bold uppercase text-[10px]">Cliente:</span>
                  <span className="font-black text-neutral-700 truncate max-w-44">{selectedClient.nome}</span>
                </div>
              ) : (
                <div className="text-xs bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center justify-between text-rose-700 font-bold">
                  <span>Nenhum cliente selecionado! Feche este carrinho para escolher o cliente acima.</span>
                </div>
              )}

              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-neutral-500">Dívida Total:</span>
                <span className="text-2xl font-black text-amber-600">R$ {cartTotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowCartModal(false)}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={cart.length === 0 || !selectedClient}
                  onClick={() => {
                    handleConfirmDebt();
                    setShowCartModal(false);
                  }}
                >
                  Confirmar Dívida
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* -------------------- MODAL: NOVO PRODUTO -------------------- */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white border-neutral-200 p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-neutral-900">
                <ShoppingBag className="text-amber-600" size={20} />
                <span>Criar Novo Produto</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProductError('');
                  setNewProductImage(null);
                  setNewProductImageName('');
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
              <Input
                label="Nome do Produto"
                placeholder="Ex: Coxinha de Carne"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preço (R$)"
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  required
                />
                
                <Input
                  label="Estoque Inicial"
                  placeholder="Ex: 20"
                  type="number"
                  min="1"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-neutral-700">Categoria</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-neutral-300 text-neutral-800 rounded-2xl transition-all duration-200 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-base"
                >
                  <option value="Salgados">Salgados</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Saudáveis">Saudáveis</option>
                  <option value="Doces">Doces</option>
                </select>
              </div>

              {/* Imagem do Produto */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-neutral-700">Imagem do Produto (Opcional)</label>
                <div className="relative border border-dashed border-neutral-300 hover:border-amber-500/50 rounded-2xl bg-neutral-50 p-4 transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewProductImageName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProductImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {newProductImage ? (
                    <div className="flex items-center justify-between w-full gap-2 px-1">
                      <span className="text-xs font-bold text-neutral-800 truncate flex-1 text-left">{newProductImageName}</span>
                      <span className="text-[10px] text-amber-600 font-extrabold shrink-0">Substituir</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors py-1">
                      <Upload size={16} />
                      <span className="text-xs font-bold">Enviar foto do produto</span>
                    </div>
                  )}
                </div>
              </div>

              {newProductError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                  {newProductError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowAddProductModal(false);
                    setNewProductError('');
                    setNewProductImage(null);
                    setNewProductImageName('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                >
                  Criar Produto
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* -------------------- MODAL: EDITAR PRODUTO -------------------- */}
      {showEditProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white border-neutral-200 p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-neutral-900">
                <Pencil className="text-amber-600" size={20} />
                <span>Editar Produto</span>
              </h3>
              <button 
                onClick={() => {
                  setShowEditProductModal(false);
                  setEditProductError('');
                  setEditProductImage(null);
                  setEditProductImageName('');
                  setEditingProduct(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4">
              <Input
                label="Nome do Produto"
                placeholder="Ex: Coxinha de Carne"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preço (R$)"
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editProductPrice}
                  onChange={(e) => setEditProductPrice(e.target.value)}
                  required
                />
                
                <Input
                  label="Estoque"
                  placeholder="Ex: 20"
                  type="number"
                  min="0"
                  value={editProductStock}
                  onChange={(e) => setEditProductStock(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-neutral-700">Categoria</label>
                <select
                  value={editProductCategory}
                  onChange={(e) => setEditProductCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-neutral-300 text-neutral-800 rounded-2xl transition-all duration-200 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-base"
                >
                  <option value="Salgados">Salgados</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Saudáveis">Saudáveis</option>
                  <option value="Doces">Doces</option>
                </select>
              </div>

              {/* Imagem do Produto */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-neutral-700">Imagem do Produto (Opcional)</label>
                <div className="relative border border-dashed border-neutral-300 hover:border-amber-500/50 rounded-2xl bg-neutral-50 p-4 transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditProductImageName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditProductImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {editProductImage ? (
                    <div className="flex items-center justify-between w-full gap-2 px-1">
                      <span className="text-xs font-bold text-neutral-800 truncate flex-1 text-left">
                        {editProductImageName || "Imagem Atual"}
                      </span>
                      <span className="text-[10px] text-amber-600 font-extrabold shrink-0">Substituir</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors py-1">
                      <Upload size={16} />
                      <span className="text-xs font-bold">Enviar foto do produto</span>
                    </div>
                  )}
                </div>
              </div>

              {editProductError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl">
                  {editProductError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  fullWidth
                  type="button"
                  onClick={() => {
                    setShowEditProductModal(false);
                    setEditProductError('');
                    setEditProductImage(null);
                    setEditProductImageName('');
                    setEditingProduct(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* -------------------- MODAL: PLANILHA DE EXTRATO DO CLIENTE (EXCEL) -------------------- */}
      {selectedLedgerClient && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLedgerClient(null)}>
          <Card className="w-full max-w-5xl bg-white border-neutral-200 p-6 flex flex-col gap-4 shadow-2xl h-[90vh] md:h-[680px] justify-between" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-[#107c41]" size={24} />
                  <div>
                    <h3 className="font-black text-lg text-neutral-900 leading-tight">
                      Planilha de Extrato - {selectedLedgerClient.nome}
                    </h3>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      CPF: {selectedLedgerClient.cpf} • Telefone: {selectedLedgerClient.telefone}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const headers = ['Data', 'Tipo', 'Detalhes', 'Valor (R$)', 'Saldo Acumulado (R$)'];
                      const rows = ledgerData.map(row => [
                        new Date(row.data).toLocaleDateString('pt-BR'),
                        row.tipo,
                        row.detalhes.replace(/,/g, ';'),
                        row.valor.toFixed(2),
                        row.saldo.toFixed(2)
                      ]);
                      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `extrato_cantina_${selectedLedgerClient.nome.replace(/\s+/g, '_').toLowerCase()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast('Planilha exportada com sucesso (CSV)!');
                    }}
                    className="flex items-center gap-1.5 text-xs font-black text-[#107c41] hover:text-[#0b592e] bg-[#107c41]/10 px-3 py-2 rounded-xl border border-[#107c41]/20 transition-all cursor-pointer active:scale-95 shadow-sm"
                    disabled={ledgerLoading}
                  >
                    <FileSpreadsheet size={14} />
                    <span className="hidden sm:inline">Exportar CSV</span>
                  </button>
                  <button 
                    onClick={() => setSelectedLedgerClient(null)}
                    className="text-neutral-400 hover:text-neutral-600 p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Simulação de Excel Interface */}
              <div className="flex-1 overflow-hidden flex flex-col bg-[#f3f4f6] rounded-xl border border-neutral-300 font-mono text-[13px] text-neutral-800">
                
                {/* Excel Header Window Bar */}
                <div className="bg-[#107c41] text-white px-4 py-1.5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded flex items-center justify-center text-[#107c41] font-black text-[10px]">X</div>
                    <span className="font-sans text-[11px] font-bold tracking-wide">Microsoft Excel - extrato_{selectedLedgerClient.nome.split(' ')[0].toLowerCase()}.xlsx</span>
                  </div>
                  <div className="text-[9px] opacity-75 font-sans">Autosalvar: LIGADO</div>
                </div>

                {/* Excel Menu Tabs */}
                <div className="bg-[#f3f2f1] border-b border-neutral-200 px-3 py-1 flex items-center gap-4 text-xs font-sans text-neutral-500 select-none shrink-0">
                  <span className="font-bold text-neutral-800 border-b-2 border-[#107c41] pb-0.5 px-1">Página Inicial</span>
                  <span className="hidden sm:inline">Inserir</span>
                  <span className="hidden sm:inline">Fórmulas</span>
                  <span>Dados</span>
                </div>

                {/* Excel Formula Bar */}
                <div className="bg-white border-b border-neutral-200 px-3 py-1 flex items-center gap-2 select-none shrink-0">
                  <div className="bg-[#f3f2f1] border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-500 font-bold min-w-10 text-center">
                    E{ledgerData.length + 2}
                  </div>
                  <div className="h-4 w-[1px] bg-neutral-300"></div>
                  <span className="text-[#107c41] font-sans font-black italic text-sm">fx</span>
                  <div className="flex-1 px-2 py-0.5 border border-neutral-200 rounded text-xs font-sans bg-[#fcfbfa] truncate">
                    =SUM(D2:D{ledgerData.length + 1})
                  </div>
                </div>

                {/* Grid de Dados com Scroll */}
                <div className="flex-1 overflow-auto bg-[#e1e2e5] p-1">
                  <table className="border-collapse bg-white w-full min-w-[700px] border border-neutral-300">
                    <thead>
                      <tr className="bg-[#f3f2f1] select-none text-neutral-500 text-center text-xs">
                        <th className="border border-neutral-300 w-10 bg-[#f3f2f1]"></th>
                        <th className="border border-neutral-300 py-1.5 w-28 font-bold">A</th>
                        <th className="border border-neutral-300 py-1.5 w-40 font-bold">B</th>
                        <th className="border border-neutral-300 py-1.5 font-bold">C</th>
                        <th className="border border-neutral-300 py-1.5 w-32 font-bold">D</th>
                        <th className="border border-neutral-300 py-1.5 w-40 font-bold">E</th>
                      </tr>
                      <tr className="bg-[#f3f2f1] text-neutral-700 text-xs font-bold text-center">
                        <th className="border border-neutral-300 bg-[#f3f2f1] py-1">1</th>
                        <th className="border border-neutral-300 py-1 text-left px-2">Data</th>
                        <th className="border border-neutral-300 py-1 text-left px-2">Tipo</th>
                        <th className="border border-neutral-300 py-1 text-left px-2">Detalhes</th>
                        <th className="border border-neutral-300 py-1 text-right px-2">Valor (R$)</th>
                        <th className="border border-neutral-300 py-1 text-right px-2 bg-[#f3f2f1]/40">Saldo Acumulado (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerLoading ? (
                        <tr>
                          <td colSpan="6" className="border border-neutral-300 px-4 py-8 text-center text-neutral-500 font-sans font-bold">
                            Carregando extrato...
                          </td>
                        </tr>
                      ) : ledgerData.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="border border-neutral-300 px-4 py-8 text-center text-neutral-500 font-sans font-bold">
                            Nenhum registro encontrado para este aluno.
                          </td>
                        </tr>
                      ) : (
                        ledgerData.map((row, index) => {
                          const rowNum = index + 2;
                          const dateObj = new Date(row.data);
                          const dateStr = dateObj.toLocaleDateString('pt-BR');
                          const isInitial = row.id === 'initial';
                          
                          return (
                            <tr key={row.id} className="hover:bg-blue-50/20 text-xs">
                              <td className="border border-neutral-300 bg-[#f3f2f1] text-center text-neutral-500 text-[10px] select-none font-bold py-1.5">{rowNum}</td>
                              <td className="border border-neutral-200 px-2 py-1.5 text-neutral-600 font-medium">{dateStr}</td>
                              <td className="border border-neutral-200 px-2 py-1.5 font-semibold text-left">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.valor > 0 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                    : isInitial 
                                    ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {row.tipo}
                                </span>
                              </td>
                              <td className="border border-neutral-200 px-2 py-1.5 text-left text-neutral-700 truncate max-w-xs" title={row.detalhes}>
                                {row.detalhes}
                              </td>
                              <td className={`border border-neutral-200 px-2 py-1.5 text-right font-black ${
                                row.valor > 0 
                                  ? 'text-rose-600' 
                                  : isInitial 
                                  ? 'text-neutral-700'
                                  : 'text-emerald-600'
                              }`}>
                                {row.valor > 0 ? `+` : ''}{row.valor.toFixed(2)}
                              </td>
                              <td className="border border-neutral-200 px-2 py-1.5 text-right font-black bg-[#fcfcfa] text-neutral-900">
                                R$ {row.saldo.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}

                      {/* Total Row */}
                      {!ledgerLoading && (
                        <tr className="bg-neutral-50/80 font-bold text-xs">
                          <td className="border border-neutral-300 bg-[#f3f2f1] text-center text-neutral-500 text-[10px] select-none font-bold py-1.5">
                            {ledgerData.length + 2}
                          </td>
                          <td className="border border-neutral-200 px-2 py-1.5 text-[#107c41] font-bold text-left italic" colSpan="3">
                            Total Atual devedor (=SUM(D2:D{ledgerData.length + 1}))
                          </td>
                          <td className="border border-neutral-200 px-2 py-1.5 text-right font-black text-neutral-500">
                          </td>
                          <td className="border border-neutral-200 px-2 py-1.5 text-right font-black text-[#107c41] bg-[#f3f2f1] border-b-4 border-double border-b-[#107c41]">
                            R$ {selectedLedgerClient.saldo_devedor.toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Sheet Bar */}
                <div className="bg-[#f3f2f1] border-t border-neutral-300 px-3 py-1 flex items-center gap-1.5 text-xs text-neutral-500 select-none shrink-0">
                  <div className="bg-white border-x border-t border-neutral-350 px-3 py-0.5 text-xs font-bold text-[#107c41] flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#107c41]"></div>
                    <span>Extrato_{selectedLedgerClient.nome.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100 shrink-0">
              <Button variant="primary" onClick={() => setSelectedLedgerClient(null)}>
                Fechar Planilha
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
