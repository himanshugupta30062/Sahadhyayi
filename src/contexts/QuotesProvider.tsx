
import React, { createContext, useContext } from 'react';

// Placeholder type for future quote-related values
type QuotesContextType = Record<string, never>;

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
