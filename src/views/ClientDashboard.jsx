import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import {
  Coffee, LogOut, ShoppingBag, Clock, DollarSign,
  Plus, Minus, Check, X, Upload, History, AlertTriangle, CheckCircle2, ChevronRight, Trash2, FileSpreadsheet,
  MessageCircle, Send, Info
} from 'lucide-react';

const ClientDashboard = () => {
  const {
    currentUser,
    products,
    orders,
    payments,
    logout,
    createReserveOrder,
    uploadPayment,
    getClientLedger,
    messages,
    sendMessage,
    config
  } = useApp();

  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'pagar', 'historico'
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [toast, setToast] = useState(null);

  // Estados para Reserva de Lanches (Cliente)
  const [clientCart, setClientCart] = useState([]);
  
  // Estados para Envio de Comprovante
  const [paymentAmount, setPaymentAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState(null); // base64 string
  const [receiptFileName, setReceiptFileName] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Estados para Checkout / Opção de Pagamento
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutType, setCheckoutType] = useState('FIADO'); // 'FIADO' ou 'PIX'
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);
  const [checkoutReceiptName, setCheckoutReceiptName] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Estados para Planilha de Extrato (Excel)
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    if (currentUser && activeTab === 'extrato') {
      if (ledgerData.length === 0) {
        setLedgerLoading(true);
      }
      getClientLedger(currentUser.id)
        .then(data => {
          setLedgerData(data);
          setLedgerLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLedgerLoading(false);
        });
    }
  }, [currentUser, activeTab, orders, payments]);

  // Estados para Chat com Administrador
  const [showChat, setShowChat] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [chatText, setChatText] = useState('');

  useEffect(() => {
    if (showChat) setShowChatHistory(false);
  }, [showChat]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const categories = ['Todos', 'Salgados', 'Bebidas', 'Saudáveis', 'Doces'];

  // Filtragem de produtos por categoria e disponibilidade
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    const inStock = Number(p.estoque) > 0;
    return matchesCategory && inStock;
  });

  // Adicionar ao carrinho do cliente
  const addToCart = (product) => {
    if (product.estoque <= 0) {
      showToast(`O produto ${product.nome} está sem estoque!`, 'error');
      return;
    }

    setClientCart(prevCart => {
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

  // Remover / Diminuir do carrinho do cliente
  const removeFromCart = (productId) => {
    setClientCart(prevCart => {
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
    setClientCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const cartTotal = clientCart.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const totalCartItems = clientCart.reduce((acc, item) => acc + item.quantidade, 0);

  // Disparar Modal de Checkout (Opção Fiado ou Pix)
  const handleConfirmReservation = () => {
    if (clientCart.length === 0) {
      showToast('O carrinho está vazio.', 'error');
      return;
    }
    setCheckoutType('RESERVA');
    setCheckoutReceipt(null);
    setCheckoutReceiptName('');
    setShowCheckoutModal(true);
  };

  // Processar comprovante do Pix durante checkout
  const handleCheckoutFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCheckoutReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCheckoutReceipt(reader.result); // base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Concluir Reserva com o tipo de pagamento escolhido
  const handleExecuteCheckout = async (e) => {
    e.preventDefault();
    if (checkoutType === 'PIX' && !checkoutReceipt) {
      showToast('Por favor, anexe a foto do comprovante Pix.', 'error');
      return;
    }

    setCheckoutLoading(true);

    try {
      await createReserveOrder(currentUser.id, clientCart, checkoutType, checkoutReceipt);
      if (checkoutType === 'PIX') {
        showToast('Reserva e comprovante enviados! Aguarde a aprovação.');
      } else if (checkoutType === 'FIADO') {
        showToast('Compra registrada no fiado com sucesso!');
      } else {
        showToast('Reserva realizada com sucesso! Retire na cantina.');
      }
      setClientCart([]);
      setShowCheckoutModal(false);
      setActiveTab('historico');
    } catch (err) {
      showToast(err.message || 'Erro ao realizar reserva.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Enviar mensagem no chat com a cantina (Admin)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    try {
      sendMessage(currentUser.id, 'u-admin', chatText.trim());
      setChatText('');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar mensagem', 'error');
    }
  };

  // Processar seleção do arquivo de comprovante e converter para base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result); // URL base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar comprovante
  const handleSendPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      showToast('Por favor, informe um valor de pagamento válido.', 'error');
      return;
    }

    setUploadLoading(true);

    try {
      await uploadPayment(currentUser.id, amount, receiptImage);
      showToast('Comprovante enviado com sucesso! Aguardando aprovação.');
      setPaymentAmount('');
      setReceiptImage(null);
      setReceiptFileName('');
      setActiveTab('historico');
    } catch (err) {
      showToast(err.message || 'Erro ao enviar comprovante.', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // Filtrar histórico do cliente
  const clientOrders = orders.filter(o => o.userId === currentUser.id);
  const clientPayments = payments.filter(p => p.userId === currentUser.id);

  // Junta o histórico de reservas e pagamentos de forma cronológica
  const combinedHistory = [
    ...clientOrders.map(o => ({ ...o, type: 'order' })),
    ...clientPayments.map(p => ({ ...p, type: 'payment' }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

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

      {/* Header Cliente */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-neutral-200/80 px-4 py-4 flex items-center justify-between shadow-sm shadow-neutral-100/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/15">
            <Coffee size={20} className="text-neutral-950" />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 font-black block leading-none uppercase tracking-wider">Bem-vindo(a),</span>
            <h1 className="text-sm font-extrabold text-neutral-800 mt-0.5">{currentUser.nome.split(' ')[0]}</h1>
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

      {/* Grid Layout principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* Navegação de Abas - Desktop Topo */}
        <div className="hidden md:flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-neutral-200/80 shadow-sm">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'menu' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <ShoppingBag size={18} />
            <span>Reservar Lanches</span>
          </button>
          <button
            onClick={() => setActiveTab('pagar')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pagar' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <DollarSign size={18} />
            <span>Enviar Pagamento</span>
          </button>
          <button
            onClick={() => setActiveTab('extrato')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'extrato' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <FileSpreadsheet size={18} />
            <span>Planilha de Extrato</span>
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'historico' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            <History size={18} />
            <span>Meu Histórico</span>
          </button>
        </div>

        {/* -------------------- BANNER DE SALDO DEVEDOR (HERO) -------------------- */}
        <div className="mb-6">
          <Card className={`border-none p-6 text-white overflow-hidden relative shadow-lg ${
            currentUser.saldo_devedor > 0 
              ? 'bg-gradient-to-r from-rose-500 to-rose-400' 
              : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block">Saldo Devedor na Cantina</span>
                <span className="text-3xl sm:text-4xl font-black block tracking-tight mt-0.5">
                  R$ {currentUser.saldo_devedor.toFixed(2)}
                </span>
                
                <span className="inline-flex items-center gap-1.5 mt-2 bg-black/10 border border-white/10 text-xs font-bold px-3 py-1 rounded-full">
                  {currentUser.saldo_devedor > 0 ? (
                    <>
                      <AlertTriangle size={12} />
                      <span>Pendência ativa. Envie Pix para liberar fiado!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Sua conta está em dia!</span>
                    </>
                  )}
                </span>
              </div>

              {currentUser.saldo_devedor > 0 && (
                <button
                  onClick={() => {
                    setPaymentAmount(currentUser.saldo_devedor.toString());
                    setActiveTab('pagar');
                  }}
                  className="bg-white hover:bg-neutral-50 text-rose-600 font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1 self-start sm:self-auto"
                >
                  Pagar Agora com Pix
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
            
            {/* Decorações do fundo */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 transform origin-top-right"></div>
          </Card>
        </div>

        {/* -------------------- CONTEÚDO DAS ABAS -------------------- */}

        {/* 1. ABA RESERVAR LANCHES */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Grid de Cardápio */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">Cardápio do Dia</h3>
              </div>

              {/* Categorias */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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

              {/* Grid de Produtos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map(p => (
                  <Card
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col justify-between h-64 p-3 border-neutral-200 relative group cursor-pointer active:scale-95 bg-white shadow-sm"
                  >
                    {/* Imagem do Produto */}
                    <div className="h-28 w-full bg-neutral-100 rounded-xl overflow-hidden mb-2 relative flex items-center justify-center border border-neutral-200/40">
                      {p.imagem ? (
                        <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Coffee className="text-neutral-300" size={32} />
                      )}
                      
                      {/* Estoque Badge */}
                      <div className={`absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                        p.estoque <= 0
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : p.estoque < 5
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {p.estoque <= 0 ? 'Esgotado' : `${p.estoque} disp.`}
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
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-500/15">
                          <Plus size={14} />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Carrinho de Reservas */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 flex flex-col h-[460px] justify-between border-neutral-200 bg-white">
                <div className="flex flex-col gap-4 h-full overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h3 className="font-black text-lg text-neutral-900 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-amber-500" />
                      <span>Reserva</span>
                    </h3>
                    {totalCartItems > 0 && (
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        {totalCartItems} {totalCartItems === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>

                  {clientCart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <ShoppingBag size={48} className="text-neutral-300 mb-3" />
                      <p className="text-sm font-bold text-neutral-500">Nenhum item adicionado.</p>
                      <p className="text-xs text-neutral-400 mt-1">Toque nos lanches para adicioná-los à sua reserva e garantir sua merenda.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                      {clientCart.map(item => (
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
                              className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors ml-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-4 mt-4 flex flex-col gap-4 bg-neutral-50 p-2.5 rounded-2xl">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-neutral-500">Total Reserva:</span>
                    <span className="text-2xl font-black text-amber-600">R$ {cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="text-[10px] text-neutral-400 leading-normal px-1">
                    *Garantir a reserva garante o estoque do lanche. Escolha a forma de pagamento (Reservar, Fiado ou Pix) na próxima tela.
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    disabled={clientCart.length === 0}
                    onClick={handleConfirmReservation}
                  >
                    Garantir Reserva
                  </Button>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* 2. ABA ENVIAR PAGAMENTO (PIX) */}
        {activeTab === 'pagar' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            
            {/* Card com os dados do PIX da Cantina */}
            <Card className="bg-white border-neutral-200 p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-extrabold text-base text-neutral-800 border-b border-neutral-100 pb-2">Passo 1: Transferir via Pix</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-inner">
                  <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Chave Pix (CNPJ Cantina)</span>
                  <span className="text-base font-black text-amber-600 select-all tracking-wide mt-0.5">{config.pixKey}</span>
                  <span className="text-[10px] text-neutral-500 mt-1 font-semibold">Beneficiário: {config.beneficiario}</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed pl-1">
                  Abra o app do seu banco, transfira o valor desejado para a chave Pix acima, tire um print do comprovante e faça o upload no formulário abaixo.
                </p>
              </div>
            </Card>

            {/* Card de Upload do Comprovante */}
            <Card className="border-neutral-200 p-6 flex flex-col gap-5 bg-white shadow-sm">
              <h3 className="font-extrabold text-base text-neutral-800 border-b border-neutral-100 pb-2">Passo 2: Anexar Comprovante</h3>
              
              <form onSubmit={handleSendPayment} className="flex flex-col gap-5">
                <Input
                  label="Valor Pago (R$)"
                  placeholder="0,00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />

                {/* Caixa de Upload */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-neutral-700">Foto do Comprovante</span>
                  
                  <div className="relative border-2 border-dashed border-neutral-200 hover:border-amber-500/50 rounded-2xl bg-neutral-50 p-6 transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer shadow-inner">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    
                    {receiptImage ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 bg-white">
                          <img
                            src={receiptImage}
                            alt="Pre-visualização"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-800 truncate max-w-64">{receiptFileName}</span>
                        <span className="text-[10px] text-amber-600 font-extrabold">Toque para substituir</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} className="text-neutral-400 group-hover:text-amber-500 transition-colors" />
                        <div>
                          <span className="text-sm font-bold text-neutral-700 block">Escolha uma imagem</span>
                          <span className="text-xs text-neutral-400 mt-1 block font-medium">Suporta formatos JPEG, PNG e prints do celular</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="success"
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={uploadLoading || !receiptImage}
                  className="mt-2"
                >
                  {uploadLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando Comprovante...</span>
                    </div>
                  ) : (
                    <span>Enviar para Aprovação</span>
                  )}
                </Button>
              </form>
            </Card>

          </div>
        )}

        {/* 3. ABA HISTÓRICO DO CLIENTE */}
        {activeTab === 'historico' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">Meu Histórico</h3>
              <p className="text-xs text-neutral-500 mt-1">Consulte o status das suas reservas e o andamento dos seus pagamentos enviados</p>
            </div>

            {combinedHistory.length === 0 ? (
              <div className="text-center py-16 bg-white border border-neutral-200 rounded-3xl shadow-sm">
                <History size={48} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-500">Histórico limpo por enquanto.</p>
                <p className="text-xs text-neutral-400 mt-1">Aqui você poderá ver todos os seus pedidos de lanches e pagamentos enviados.</p>
              </div>
            ) : (
              (() => {
                const groupedHistory = combinedHistory.reduce((acc, item) => {
                  const dateObj = new Date(item.data);
                  const dateKey = dateObj.toLocaleDateString('pt-BR');
                  if (!acc[dateKey]) {
                    acc[dateKey] = [];
                  }
                  acc[dateKey].push(item);
                  return acc;
                }, {});

                return (
                  <div className="flex flex-col gap-8">
                    {Object.keys(groupedHistory).map(dateKey => {
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
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                              {groupedHistory[dateKey].length} {groupedHistory[dateKey].length === 1 ? 'registro' : 'registros'}
                            </span>
                          </div>

                          <div className="flex flex-col gap-4">
                            {groupedHistory[dateKey].map((item) => {
                              const date = new Date(item.data);
                              const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                              const formattedDate = date.toLocaleDateString('pt-BR');

                              if (item.type === 'order') {
                                // É uma Reserva
                                return (
                                  <Card key={`ord-${item.id}`} className="border-neutral-200 bg-white p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] uppercase font-black bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                                          Reserva
                                        </span>
                                        <span className="text-xs text-neutral-400 font-bold">
                                          #{item.id.slice(-6)} • {formattedDate} às {formattedTime}
                                        </span>
                                      </div>
                                      
                                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                                        {item.items.map((prod, pIdx) => (
                                          <span key={pIdx} className="text-sm text-neutral-700">
                                            <strong className="text-neutral-400 font-bold">{prod.quantidade}x</strong> {prod.nome}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-neutral-100 pt-3 sm:pt-0 shrink-0">
                                      <div>
                                        <span className="text-[10px] text-neutral-500 uppercase font-bold block sm:hidden">Valor</span>
                                        <span className="text-md font-black text-neutral-800">R$ {item.total.toFixed(2)}</span>
                                      </div>
                                      
                                      <span className={`text-[10px] mt-1 px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                                        item.status === 'PENDENTE'
                                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                                          : item.status === 'PRONTO'
                                          ? 'bg-blue-50 border-blue-200 text-blue-600 font-extrabold'
                                          : item.status === 'ENTREGUE'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                          : 'bg-rose-50 border-rose-200 text-rose-600'
                                      }`}>
                                        {item.status === 'PENDENTE' 
                                          ? 'Aguardando Preparo' 
                                          : item.status === 'PRONTO' 
                                          ? 'Disponível p/ Retirada!' 
                                          : item.status === 'ENTREGUE'
                                          ? 'Retirado'
                                          : 'Cancelado'}
                                      </span>
                                    </div>
                                  </Card>
                                );
                              } else {
                                // É um Pagamento
                                return (
                                  <Card key={`pay-${item.id}`} className="border-neutral-200 bg-white p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] uppercase font-black bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full">
                                          Envio Pix
                                        </span>
                                        <span className="text-xs text-neutral-400 font-bold">
                                          #{item.id.slice(-6)} • {formattedDate} às {formattedTime}
                                        </span>
                                      </div>
                                      
                                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400 font-semibold">
                                        <span>Comprovante anexado</span>
                                      </div>
                                    </div>

                                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-neutral-100 pt-3 sm:pt-0 shrink-0">
                                      <div>
                                        <span className="text-[10px] text-neutral-500 uppercase font-bold block sm:hidden">Valor Pix</span>
                                        <span className="text-md font-black text-emerald-600">R$ {item.valor.toFixed(2)}</span>
                                      </div>
                                      
                                      <span className={`text-[10px] mt-1 px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                                        item.status_aprovacao === 'PENDENTE'
                                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                                          : item.status_aprovacao === 'APROVADO'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                          : 'bg-rose-50 border-rose-200 text-rose-600'
                                      }`}>
                                        {item.status_aprovacao === 'PENDENTE' 
                                          ? 'Pendente de Confirmação' 
                                          : item.status_aprovacao === 'APROVADO' 
                                          ? 'Abatido da Conta' 
                                          : 'Recusado pela Cantina'}
                                      </span>
                                    </div>
                                  </Card>
                                );
                              }
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

        {/* 4. ABA PLANILHA DE EXTRATO */}
        {activeTab === 'extrato' && (
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Planilha de Extrato (Excel)</h3>
                <p className="text-xs text-neutral-500 mt-1">Acompanhe a evolução detalhada do seu saldo devedor linha por linha</p>
              </div>
              <button
                onClick={() => {
                  const headers = ['Data', 'Tipo', 'Detalhes', 'Valor (R$)', 'Saldo Acumulado (R$)'];
                  const rows = ledgerData.map(row => [
                    new Date(row.data).toLocaleDateString('pt-BR'),
                    row.tipo,
                    row.detalhes.replace(/,/g, ';'), // evitar quebrar CSV
                    row.valor.toFixed(2),
                    row.saldo.toFixed(2)
                  ]);
                  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `extrato_cantina_${currentUser.nome.replace(/\s+/g, '_').toLowerCase()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Planilha exportada com sucesso (CSV)!');
                }}
                className="flex items-center gap-1.5 text-xs font-black text-[#107c41] hover:text-[#0b592e] bg-[#107c41]/10 px-4 py-2.5 rounded-xl border border-[#107c41]/20 transition-all cursor-pointer active:scale-95 shadow-sm"
                disabled={ledgerLoading}
              >
                <FileSpreadsheet size={16} />
                <span>Exportar Excel (.csv)</span>
              </button>
            </div>

            {/* Simulação de Excel Interface */}
            <div className="bg-[#f3f4f6] rounded-2xl border border-neutral-300 shadow-xl overflow-hidden font-mono flex flex-col text-[13px] text-neutral-800">
              
              {/* Excel Header Window Bar */}
              <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-[#107c41] font-black text-xs">X</div>
                  <span className="font-sans text-xs font-bold tracking-wide">Microsoft Excel - extrato_saldo_devedor.xlsx</span>
                </div>
                <div className="flex gap-1.5 text-[10px] opacity-75 font-sans">
                  <span>Autosalvar: LIGADO</span>
                </div>
              </div>

              {/* Excel Menu Tabs */}
              <div className="bg-[#f3f2f1] border-b border-neutral-200 px-3 py-1 flex items-center gap-4 text-xs font-sans text-neutral-600 select-none">
                <span className="font-bold text-neutral-800 border-b-2 border-[#107c41] pb-0.5 px-1 cursor-pointer">Página Inicial</span>
                <span className="hover:text-neutral-800 cursor-pointer">Inserir</span>
                <span className="hover:text-neutral-800 cursor-pointer">Layout da Página</span>
                <span className="hover:text-neutral-800 cursor-pointer">Fórmulas</span>
                <span className="hover:text-neutral-800 cursor-pointer">Dados</span>
                <span className="hover:text-neutral-800 cursor-pointer">Revisão</span>
                <span className="hover:text-neutral-800 cursor-pointer">Exibir</span>
              </div>

              {/* Excel Formula Bar */}
              <div className="bg-white border-b border-neutral-200 px-3 py-1.5 flex items-center gap-2 select-none">
                <div className="bg-[#f3f2f1] border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-500 font-bold min-w-10 text-center">
                  E{ledgerData.length + 2}
                </div>
                <div className="h-4 w-[1px] bg-neutral-300"></div>
                <span className="text-[#107c41] font-sans font-black italic text-sm">fx</span>
                <div className="flex-1 px-2 py-0.5 border border-neutral-200 rounded text-xs font-sans bg-[#fcfbfa] truncate">
                  =SUM(D2:D{ledgerData.length + 1})
                </div>
              </div>

              {/* Excel Spreadsheet Table Grid */}
              <div className="overflow-x-auto bg-[#e1e2e5] p-1">
                <table className="border-collapse bg-white w-full min-w-[700px] border border-neutral-300">
                  <thead>
                    <tr className="bg-[#f3f2f1] select-none text-neutral-500 text-center text-xs">
                      {/* Blank top-left header for row numbers */}
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
                          Nenhum registro encontrado no seu extrato.
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
                            {/* Row Number */}
                            <td className="border border-neutral-300 bg-[#f3f2f1] text-center text-neutral-500 text-[10px] select-none font-bold py-1.5">{rowNum}</td>
                            {/* Col A: Data */}
                            <td className="border border-neutral-200 px-2 py-1.5 text-neutral-600 font-medium">{dateStr}</td>
                            {/* Col B: Tipo */}
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
                            {/* Col C: Detalhes */}
                            <td className="border border-neutral-200 px-2 py-1.5 text-left text-neutral-700 truncate max-w-xs" title={row.detalhes}>
                              {row.detalhes}
                            </td>
                            {/* Col D: Valor */}
                            <td className={`border border-neutral-200 px-2 py-1.5 text-right font-black ${
                              row.valor > 0 
                                ? 'text-rose-600' 
                                : isInitial 
                                ? 'text-neutral-700'
                                : 'text-emerald-600'
                            }`}>
                              {row.valor > 0 ? `+` : ''}{row.valor.toFixed(2)}
                            </td>
                            {/* Col E: Saldo */}
                            <td className="border border-neutral-200 px-2 py-1.5 text-right font-black bg-[#fcfcfa] text-neutral-900">
                              R$ {row.saldo.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* Total Row / Summary (Double underline effect) */}
                    {!ledgerLoading && (
                      <tr className="bg-neutral-50/80 font-bold text-xs">
                        <td className="border border-neutral-300 bg-[#f3f2f1] text-center text-neutral-500 text-[10px] select-none font-bold py-1.5">
                          {ledgerData.length + 2}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5 text-[#107c41] font-bold text-left italic" colSpan="3">
                          Total Atual devedor (=SUM(D2:D{ledgerData.length + 1}))
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5 text-right font-black text-neutral-500">
                          {/* Empty cell */}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1.5 text-right font-black text-[#107c41] bg-[#f3f2f1] border-b-4 border-double border-b-[#107c41]">
                          R$ {currentUser.saldo_devedor.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Excel Footer Sheet Bar */}
              <div className="bg-[#f3f2f1] border-t border-neutral-300 px-3 py-1 flex items-center gap-1.5 text-xs text-neutral-600 select-none">
                <div className="bg-white border-x border-t border-neutral-350 px-3 py-1 text-xs font-bold text-[#107c41] flex items-center gap-1 cursor-pointer">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#107c41]"></div>
                  <span>Extrato_{currentUser.nome.split(' ')[0]}</span>
                </div>
                <div className="px-2 py-1 hover:bg-neutral-200 cursor-pointer text-lg leading-none">+</div>
              </div>
            </div>

            {/* Dica do Excel */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
              <Info className="text-amber-700 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-neutral-700 leading-normal">
                <strong>Entendendo a planilha:</strong> As linhas com <span className="text-rose-600 font-bold">Consumo (Fiado)</span> representam lanches retirados e somam ao saldo devedor. As linhas com <span className="text-emerald-600 font-bold">Pagamento Pix</span> representam pagamentos efetuados e confirmados que abatem (subtraem) a sua dívida. O <span className="font-bold text-neutral-800">Saldo Acumulado</span> mostra sua dívida pendente exata a cada momento.
              </div>
            </div>
          </div>
        )}

      </main>

      {/* -------------------- BARRA DE NAVEGAÇÃO MOBILE (DOCK) -------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-2.5 flex justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'menu' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <ShoppingBag size={20} />
          <span className="text-[10px] font-bold">Reservar</span>
        </button>
        <button
          onClick={() => setActiveTab('pagar')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
            activeTab === 'pagar' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <DollarSign size={20} />
          <span className="text-[10px] font-bold">Pagar Pix</span>
        </button>
        <button
          onClick={() => setActiveTab('extrato')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'extrato' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <FileSpreadsheet size={20} />
          <span className="text-[10px] font-bold">Planilha</span>
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'historico' ? 'text-amber-600 font-black' : 'text-neutral-400'
          }`}
        >
          <History size={20} />
          <span className="text-[10px] font-bold">Histórico</span>
        </button>
      </nav>

      {/* -------------------- MODAL: CHECKOUT / OPÇÃO DE PAGAMENTO -------------------- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white border-neutral-200 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-neutral-900">
                <ShoppingBag className="text-amber-600" size={20} />
                <span>Finalizar sua Reserva</span>
              </h3>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteCheckout} className="flex flex-col gap-4">
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total do Pedido:</div>
                <div className="text-2xl font-black text-amber-600 mt-0.5">R$ {cartTotal.toFixed(2)}</div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-neutral-700">Forma de Retirada/Pagamento</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Opção Reservar (Pagar na Retirada) */}
                  <label className={`border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                    checkoutType === 'RESERVA'
                      ? 'border-amber-500 bg-amber-500/5 text-neutral-900 font-black'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}>
                    <input
                      type="radio"
                      name="checkoutType"
                      value="RESERVA"
                      checked={checkoutType === 'RESERVA'}
                      onChange={() => setCheckoutType('RESERVA')}
                      className="sr-only"
                    />
                    <ShoppingBag size={20} className={checkoutType === 'RESERVA' ? 'text-amber-600' : 'text-neutral-400'} />
                    <span className="text-[11px] font-bold">Apenas Reservar</span>
                  </label>

                  {/* Opção Fiado */}
                  <label className={`border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                    checkoutType === 'FIADO'
                      ? 'border-amber-500 bg-amber-500/5 text-neutral-900 font-black'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}>
                    <input
                      type="radio"
                      name="checkoutType"
                      value="FIADO"
                      checked={checkoutType === 'FIADO'}
                      onChange={() => setCheckoutType('FIADO')}
                      className="sr-only"
                    />
                    <Clock size={20} className={checkoutType === 'FIADO' ? 'text-amber-600' : 'text-neutral-400'} />
                    <span className="text-[11px] font-bold">Marcar no Fiado</span>
                  </label>

                  {/* Opção Pix */}
                  <label className={`border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                    checkoutType === 'PIX'
                      ? 'border-amber-500 bg-amber-500/5 text-neutral-900 font-black'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}>
                    <input
                      type="radio"
                      name="checkoutType"
                      value="PIX"
                      checked={checkoutType === 'PIX'}
                      onChange={() => setCheckoutType('PIX')}
                      className="sr-only"
                    />
                    <DollarSign size={20} className={checkoutType === 'PIX' ? 'text-amber-600' : 'text-neutral-400'} />
                    <span className="text-[11px] font-bold">Pagar com Pix</span>
                  </label>
                </div>
              </div>

              {checkoutType === 'RESERVA' && (
                <p className="text-xs text-neutral-500 leading-normal pl-1">
                  * **Apenas Reservar**: Seu estoque fica garantido. Você fará o pagamento de **R$ {cartTotal.toFixed(2)}** diretamente no caixa ao retirar o lanche na cantina. Não gera dívida no seu saldo.
                </p>
              )}
              {checkoutType === 'FIADO' && (
                <p className="text-xs text-neutral-500 leading-normal pl-1">
                  * **Marcar no Fiado**: O valor de **R$ {cartTotal.toFixed(2)}** será debitado do seu limite fiado e adicionado imediatamente ao seu **saldo devedor** e à sua **planilha de extrato**.
                </p>
              )}
              {checkoutType === 'PIX' && (
                <div className="flex flex-col gap-4 mt-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Chave Pix da Cantina</span>
                    <span className="text-sm font-black text-amber-600 select-all">{config.pixKey}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-neutral-700">Anexar Comprovante do Pix</span>
                    <div className="relative border-2 border-dashed border-neutral-200 hover:border-amber-500/50 rounded-xl bg-white p-4 transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCheckoutFileChange}
                        required={checkoutType === 'PIX'}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {checkoutReceipt ? (
                        <div className="w-full flex items-center justify-between gap-2 px-1">
                          <span className="text-xs font-bold text-neutral-800 truncate flex-1 text-left">{checkoutReceiptName}</span>
                          <span className="text-[10px] text-amber-600 font-extrabold shrink-0">Substituir</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={20} className="text-neutral-400" />
                          <span className="text-xs font-bold text-neutral-600">Escolher Foto do Comprovante</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowCheckoutModal(false)}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  fullWidth
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <span>Confirmar Reserva</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* -------------------- FLOATING CHAT WIDGET -------------------- */}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 md:left-6 transform -translate-x-1/2 md:-translate-x-0 z-40">
        {showChat ? (
          <Card className="w-[calc(100vw-1.25rem)] max-w-sm md:w-80 sm:w-96 h-[75vh] max-h-[520px] bg-white border-neutral-350 shadow-2xl flex flex-col justify-between p-0 overflow-hidden rounded-3xl animate-fade-in">
            {/* Header do Chat */}
            <div className="bg-[#107c41] text-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold text-white border border-white/20">
                  Â
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-none">Falar com a Ângela</h4>
                  <span className="text-[10px] text-emerald-100 font-bold tracking-wider uppercase flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    Cantina Online
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChatHistory(prev => !prev)}
                  className="hidden md:inline-flex items-center gap-2 rounded-2xl border border-white/25 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {showChatHistory ? 'Ocultar conversa' : 'Mostrar conversa'}
                </button>
                <button 
                  onClick={() => setShowChat(false)}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mensagens do Chat */}
            <div className={`${showChatHistory ? 'flex' : 'hidden md:flex'} flex-1 p-4 overflow-y-auto bg-neutral-50 flex-col gap-3`}>
              {messages
                .filter(m => 
                  (m.senderId === currentUser.id && m.recipientId === 'u-admin') ||
                  (m.senderId === 'u-admin' && m.recipientId === currentUser.id)
                )
                .sort((a, b) => new Date(a.data) - new Date(b.data))
                .map(msg => {
                  const isAdmin = msg.senderId === 'u-admin';
                  const dateObj = new Date(msg.data);
                  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${
                        isAdmin ? 'self-start items-start' : 'self-end items-end'
                      }`}
                    >
                      <span className="text-[9px] text-neutral-400 font-bold mb-0.5">{msg.senderName}</span>
                      <div className={`p-3 rounded-2xl border text-[13px] leading-relaxed ${
                        isAdmin 
                          ? 'bg-white border-neutral-200 text-neutral-800 rounded-tl-none' 
                          : 'bg-[#107c41] border-[#0e6b37] text-white rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-neutral-400 mt-0.5">{timeStr}</span>
                    </div>
                  );
                })}
              
              {messages.filter(m => 
                (m.senderId === currentUser.id && m.recipientId === 'u-admin') ||
                (m.senderId === 'u-admin' && m.recipientId === currentUser.id)
              ).length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <MessageCircle size={32} className="text-neutral-300 mb-2" />
                  <p className="text-xs font-bold text-neutral-500">Inicie uma conversa!</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Diga olá ou tire dúvidas com a Ângela sobre lanches ou limites.</p>
                </div>
              )}
            </div>

            <div className={`${showChatHistory ? 'hidden' : 'flex'} md:hidden flex-1 items-center justify-center p-6 bg-neutral-50 text-center rounded-b-2xl border-t border-neutral-200`}>
              <div className="space-y-3">
                <p className="font-bold text-sm text-neutral-900">Conversa oculta</p>
                <p className="text-[11px] text-neutral-500">Toque no botão para abrir o histórico de mensagens.</p>
                <button
                  type="button"
                  onClick={() => setShowChatHistory(true)}
                  className="mt-1 inline-flex items-center justify-center rounded-2xl bg-[#107c41] px-4 py-3 text-sm font-bold text-white hover:bg-[#0b592e] transition-colors"
                >
                  Ver conversa
                </button>
              </div>
            </div>

            {/* Input de Mensagem */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-neutral-200 flex gap-3 flex-wrap items-center justify-between shrink-0">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 min-w-0 px-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-2xl focus:outline-none focus:border-[#107c41] text-sm font-sans"
              />
              <button 
                type="submit"
                className="w-14 h-14 rounded-2xl bg-[#107c41] text-white flex items-center justify-center hover:bg-[#0b592e] transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </Card>
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="w-14 h-14 bg-[#107c41] hover:bg-[#0b592e] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer border border-[#0d6937]"
            title="Falar com Ângela"
          >
            <MessageCircle size={26} />
          </button>
        )}
      </div>

    </div>
  );
};

export default ClientDashboard;
