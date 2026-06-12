import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AppContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [config, setConfig] = useState({ pixKey: '12.345.678/0001-99', beneficiario: 'Cantina da Angela Ltda.' });

  const [currentUser, setCurrentUser] = useState(() => {
    const data = localStorage.getItem('cantina_current_user');
    return data ? JSON.parse(data) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('cantina_token') || null;
  });

  useEffect(() => {
    if (currentUser) localStorage.setItem('cantina_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('cantina_current_user');
    if (token) localStorage.setItem('cantina_token', token);
    else localStorage.removeItem('cantina_token');
  }, [currentUser, token]);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const fetchData = async () => {
    try {
      const [u, p, o, pa, m, cfg] = await Promise.all([
        fetch(`${API_URL}/users`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/products`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/orders/daily`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/payments`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/messages`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/config`, { headers }).then(r => r.json())
      ]);
      
      if (!tokenRef.current) return;

      setUsers(Array.isArray(u) ? u : []);
      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
      setPayments(Array.isArray(pa) ? pa : []);
      setMessages(Array.isArray(m) ? m : []);
      if (cfg && cfg.pixKey) {
        setConfig(cfg);
      }

      if (currentUser && Array.isArray(u)) {
        const freshUser = u.find(usr => usr.id === currentUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, token]);

  const login = async (identifierInput, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifierInput, senha: password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setUsers([]);
    setProducts([]);
    setOrders([]);
    setPayments([]);
    setMessages([]);
  };

  const registerUser = async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data.user;
  };

  const addProduct = async (productData) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const updateProduct = async (productId, productData) => {
    const res = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const deleteProduct = async (productId) => {
    const res = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const addDebt = async (userId, items) => {
    const res = await fetch(`${API_URL}/orders/debt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, items })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data.order;
  };

  const createReserveOrder = async (userId, items, tipoPagamento, comprovanteBase64 = null) => {
    const status = tipoPagamento === 'FIADO' ? 'ENTREGUE' : 'PENDENTE';
    const res = await fetch(`${API_URL}/orders/reserve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, items, status, tipoPagamento })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (tipoPagamento === 'PIX' && comprovanteBase64) {
      const total = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
      await fetch(`${API_URL}/payments/upload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, valor: total, comprovanteBase64, orderId: data.order.id })
      });
    }

    fetchData();
    return data.order;
  };

  const updateOrderStatus = async (orderId, status) => {
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const uploadPayment = async (userId, valor, comprovanteBase64) => {
    const res = await fetch(`${API_URL}/payments/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, valor, comprovanteBase64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data.payment;
  };

  const approvePayment = async (paymentId) => {
    const res = await fetch(`${API_URL}/payments/${paymentId}/approve`, {
      method: 'PUT',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const rejectPayment = async (paymentId) => {
    const res = await fetch(`${API_URL}/payments/${paymentId}/reject`, {
      method: 'PUT',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const sendMessage = async (senderId, recipientId, text) => {
    const res = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ senderId, recipientId, text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data;
  };

  const getClientLedger = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/ledger`, { headers });
      const data = await res.json();
      if (!res.ok) return [];
      return data;
    } catch {
      return [];
    }
  };

  const updateConfig = async (newConfig) => {
    const res = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(newConfig)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    fetchData();
    return data.config;
  };

  return (
    <AppContext.Provider value={{
      users,
      products,
      orders,
      payments,
      messages,
      currentUser,
      config,
      login,
      logout,
      registerUser,
      addProduct,
      updateProduct,
      deleteProduct,
      addDebt,
      createReserveOrder,
      updateOrderStatus,
      uploadPayment,
      approvePayment,
      rejectPayment,
      getClientLedger,
      updateConfig,
      sendMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de um AppProvider');
  return context;
};
