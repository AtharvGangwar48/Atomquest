import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentCycle } from '../api';
import type { CycleWindow, Quarter } from '../types';

const QUARTER_ORDER: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

interface CycleCtx {
  cycle: CycleWindow | null;
  isQuarterWritable: (q: Quarter) => boolean;
  isPastQuarter: (q: Quarter) => boolean;
}

const CycleContext = createContext<CycleCtx>({ cycle: null, isQuarterWritable: () => false, isPastQuarter: () => false });

export function CycleProvider({ children }: { children: ReactNode }) {
  const { data: cycle = null } = useQuery({
    queryKey: ['cycle'],
    queryFn: () => getCurrentCycle(),
    staleTime: 5 * 60_000,
    retry: false,                  // don't retry on 401
    throwOnError: false,           // never crash the tree
  });

  const isQuarterWritable = (q: Quarter) => cycle?.writableQuarter === q;

  const isPastQuarter = (q: Quarter) => {
    if (!cycle?.writableQuarter) return false;
    return QUARTER_ORDER.indexOf(q) < QUARTER_ORDER.indexOf(cycle.writableQuarter);
  };

  return <CycleContext.Provider value={{ cycle, isQuarterWritable, isPastQuarter }}>{children}</CycleContext.Provider>;
}

export const useCycle = () => useContext(CycleContext);
