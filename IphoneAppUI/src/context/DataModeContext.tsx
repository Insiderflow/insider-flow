import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DataMode = "politician" | "insider";

const STORAGE_KEY = "insider-flow-data-mode";

function readStoredMode(): DataMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "politician" || v === "insider") return v;
  } catch {
    /* ignore */
  }
  return "politician";
}

interface DataModeContextValue {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  isPolitician: boolean;
  isInsider: boolean;
}

const DataModeContext = createContext<DataModeContextValue | null>(null);

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>(readStoredMode);

  const setMode = useCallback((next: DataMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isPolitician: mode === "politician",
      isInsider: mode === "insider",
    }),
    [mode, setMode]
  );

  return (
    <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>
  );
}

export function useDataMode() {
  const ctx = useContext(DataModeContext);
  if (!ctx) throw new Error("useDataMode must be used within DataModeProvider");
  return ctx;
}
