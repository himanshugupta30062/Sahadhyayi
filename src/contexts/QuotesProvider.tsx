
import React, { createContext, useContext } from 'react';

interface QuotesContextType {
  // Add any quotes-related functionality here if needed
}

const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

export const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QuotesContext.Provider value={{}}>
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuotesContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
};
