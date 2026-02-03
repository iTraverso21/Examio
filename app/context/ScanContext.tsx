"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Ramo {
  id: number;
  nombre: string;
  archivos: File[];
}

interface ScanContextValue {
  ramos: Ramo[];
  setRamos: React.Dispatch<React.SetStateAction<Ramo[]>>;
  resetRamos: () => void;
}

const defaultRamos: Ramo[] = [{ id: 1, nombre: "", archivos: [] }];

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [ramos, setRamos] = useState<Ramo[]>(defaultRamos);

  const resetRamos = useCallback(() => {
    setRamos([{ id: Date.now(), nombre: "", archivos: [] }]);
  }, []);

  return (
    <ScanContext.Provider value={{ ramos, setRamos, resetRamos }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
}
