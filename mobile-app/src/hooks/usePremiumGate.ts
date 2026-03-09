import { useAuth } from '@context/AuthContext';
import { useCallback } from 'react';

export function usePremiumGate() {
  const { user, refreshUser } = useAuth();
  const role = user?.role || 'free';
  const isPremium = role === 'premium' || role === 'elite' || role === 'admin';
  const isBasicPlus = role !== 'free';
  const refresh = useCallback(() => refreshUser(), [refreshUser]);
  return { isPremium, isBasicPlus, role, refresh };
}
