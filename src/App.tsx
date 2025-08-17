import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './component/dashboard';
import ProposalList from './pages/proposals';
import Profile from './pages/profile';
import ValidateRank from './pages/validateRank';
import Events from './pages/events';
import ProposalOwnerWrapper from './component/collaboration/proposalOwnerWrapper';
import Sidebar from './component/sidebar';
import Navbar from './component/navbar';
import forgeWhiteLogo from './assets/img/forge-white.jpg';
import './App.css';

interface User {
  id: string;
  username: string;
  bio: string;
  walletAddress?: string;
  githubId: string;
  createdAt: string;
  rank?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/current_user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          isAuthenticated: true,
          user: userData,
          loading: false
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  const handleWalletClick = () => {
    // TODO: Implement wallet functionality
    console.log('Wallet clicked');
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-[#191818] flex items-center justify-center" style={{fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
        <div className="text-center">
          <div className="mb-8">
            <img 
              src={forgeWhiteLogo} 
              alt="Forge" 
              className="h-16 w-16 rounded-lg mx-auto"
              style={{
                animation: 'logo-pulse 2s ease-in-out infinite'
              }}
            />
          </div>
          <p className="text-gray-400 text-sm">Loading ForgeDAO...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App bg-[#191818] min-h-screen">
        <Routes>
          <Route 
            path="/login" 
            element={authState.isAuthenticated ? 
              <Navigate to="/proposals" /> : 
              <Login />} 
          />
          <Route 
            path="/dashboard" 
            element={authState.isAuthenticated && authState.user ? 
              <div className="flex h-screen">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <Navbar user={authState.user} onLogout={handleLogout} onWalletClick={handleWalletClick} />
                  <main className="flex-1 bg-[#191818]">
                    <Dashboard user={authState.user} onLogout={handleLogout} />
                  </main>
                </div>
              </div> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/proposals" 
            element={authState.isAuthenticated && authState.user ? 
              <div className="flex h-screen">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <Navbar user={authState.user} onLogout={handleLogout} onWalletClick={handleWalletClick} />
                  <main className="flex-1 bg-[#191818] overflow-auto">
                    <ProposalList 
                      currentUser={authState.user} 
                      onLogout={handleLogout} 
                      onWalletClick={handleWalletClick} 
                    />
                  </main>
                </div>
              </div> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={authState.isAuthenticated && authState.user ? 
              <div className="flex h-screen">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <Navbar user={authState.user} onLogout={handleLogout} onWalletClick={handleWalletClick} />
                  <main className="flex-1 bg-[#191818] overflow-auto">
                    <Profile 
                      currentUser={authState.user} 
                      onLogout={handleLogout} 
                      onWalletClick={handleWalletClick} 
                    />
                  </main>
                </div>
              </div> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/events" 
            element={authState.isAuthenticated && authState.user ? 
              <div className="flex h-screen">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <Navbar user={authState.user} onLogout={handleLogout} onWalletClick={handleWalletClick} />
                  <main className="flex-1 bg-[#191818] overflow-auto">
                    <Events currentUser={authState.user} />
                  </main>
                </div>
              </div> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/rank" 
            element={authState.isAuthenticated && authState.user ? 
              <div className="flex h-screen">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <Navbar user={authState.user} onLogout={handleLogout} onWalletClick={handleWalletClick} />
                  <main className="flex-1 bg-[#191818] overflow-auto">
                    <ValidateRank />
                  </main>
                </div>
              </div> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/proposal/:id/manage" 
            element={authState.isAuthenticated && authState.user ? 
              <div className="flex h-screen">
                <Sidebar onLogout={handleLogout} />
                <div className="flex-1 flex flex-col">
                  <Navbar user={authState.user} onLogout={handleLogout} onWalletClick={handleWalletClick} />
                  <main className="flex-1 bg-[#191818] overflow-auto">
                    <ProposalOwnerWrapper currentUser={authState.user} />
                  </main>
                </div>
              </div> : 
              <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={
              authState.isAuthenticated ? 
                <Navigate to="/proposals" /> : 
                <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;