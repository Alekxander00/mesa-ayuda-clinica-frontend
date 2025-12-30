// frontend/src/components/providers/ApiErrorHandler.tsx
'use client';

import { useApiErrorHandler } from '@/middleware/apiErrorHandler';
import { ReactNode } from 'react';

export function ApiErrorHandler({ children }: { children: ReactNode }) {
  useApiErrorHandler();
  
  return <>{children}</>;
}