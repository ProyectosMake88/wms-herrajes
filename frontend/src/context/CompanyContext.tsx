import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { companyApi } from '../services/api';
import { useAuth } from './AuthContext';

interface Company {
  id: number;
  name: string;
  nit: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
}

interface CompanyContextType {
  company: Company | null;
  reload: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (token) loadCompany();
  }, [token]);

  async function loadCompany() {
    try {
      const res = await companyApi.getProfile();
      setCompany(res.data);
    } catch {
      // silently fail
    }
  }

  return (
    <CompanyContext.Provider value={{ company, reload: loadCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}
