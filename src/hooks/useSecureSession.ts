import { useEffect } from 'react';
import { initializeSecureSession, setCSRFToken, generateCSRFToken } from '@/utils/security';

export function useSecureSession() {
  useEffect(() => {
    initializeSecureSession();
    const id = setInterval(() => setCSRFToken(generateCSRFToken()), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
}
