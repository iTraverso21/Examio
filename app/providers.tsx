"use client";

import { ScanProvider } from "./context/ScanContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ScanProvider>{children}</ScanProvider>;
}
