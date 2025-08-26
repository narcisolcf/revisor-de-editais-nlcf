import { useEffect } from 'react';
import { monitoringService } from '@/services/monitoringService';

export function ConsoleInterceptor() {
  useEffect(() => {
    // Initialize console interception when component mounts
    monitoringService.initializeConsoleInterceptor();
  }, []);

  // This component doesn't render anything
  return null;
}