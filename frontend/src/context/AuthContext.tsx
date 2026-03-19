import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SELLER';
  organizationId: number | null;
  branchId?: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('wms_token');
    const savedUser = localStorage.getItem('wms_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');

    setToken(data.data.token);
    setUser(data.data.user);
    localStorage.setItem('wms_token', data.data.token);
    localStorage.setItem('wms_user', JSON.stringify(data.data.user));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        isSeller: user?.role === 'SELLER',
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
