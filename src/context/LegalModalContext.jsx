import { createContext, useContext, useMemo, useState } from 'react';

const LegalModalContext = createContext(null);

export function LegalModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);

  const value = useMemo(() => ({
    activeModal,
    openTerms: () => setActiveModal('terms'),
    openPrivacy: () => setActiveModal('privacy'),
    closeModal: () => setActiveModal(null),
  }), [activeModal]);

  return (
    <LegalModalContext.Provider value={value}>
      {children}
    </LegalModalContext.Provider>
  );
}

export function useLegalModal() {
  const context = useContext(LegalModalContext);
  if (!context) {
    throw new Error('useLegalModal must be used within a <LegalModalProvider>');
  }
  return context;
}
