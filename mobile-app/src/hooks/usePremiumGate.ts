import { useAuth } from '@context/AuthContext';

export function usePremiumGate() {
  const { user } = useAuth();
  const role = user?.role || 'free';
  const isPremium = role === 'premium' || role === 'elite' || role === 'admin';
  const isBasicPlus = role !== 'free';
  return { isPremium, isBasicPlus, role };
}
