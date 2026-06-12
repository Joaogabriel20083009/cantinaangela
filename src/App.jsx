import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import ClientDashboard from './views/ClientDashboard';

const AppContent = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginView />;
  }

  if (currentUser.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
