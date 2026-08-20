import React, { createContext, useContext } from 'react';
import { useDevConsole } from '../components/DeveloperConsole/useDevConsole';

type DevConsoleContextType = ReturnType<typeof useDevConsole>;

const DevConsoleContext = createContext<DevConsoleContextType | null>(null);

export const DevConsoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dev = useDevConsole();
  return (
    <DevConsoleContext.Provider value={dev}>
      {children}
    </DevConsoleContext.Provider>
  );
};

export const useDevConsoleContext = () => {
  const context = useContext(DevConsoleContext);
  if (!context) {
    throw new Error('useDevConsoleContext must be used within DevConsoleProvider');
  }
  return context;
};
