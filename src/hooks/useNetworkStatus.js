import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(!navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Network: Online');
      setIsOnline(true);
      setShowOfflineBanner(false);
      
      // Update connection info if available
      if (navigator.connection) {
        setConnectionType(navigator.connection.type);
        setEffectiveType(navigator.connection.effectiveType);
      }
    };

    const handleOffline = () => {
      console.log('❌ Network: Offline');
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    const handleConnectionChange = () => {
      if (navigator.connection) {
        setConnectionType(navigator.connection.type);
        setEffectiveType(navigator.connection.effectiveType);
        console.log('📡 Connection changed:', {
          type: navigator.connection.type,
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Monitor connection quality
    if (navigator.connection) {
      setConnectionType(navigator.connection.type);
      setEffectiveType(navigator.connection.effectiveType);
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const connectionSpeed = () => {
    if (!navigator.connection) return 'unknown';
    
    if (effectiveType === 'slow-2g') return 'very-slow';
    if (effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    if (effectiveType === '4g') return 'fast';
    return 'unknown';
  };

  return { 
    isOnline, 
    showOfflineBanner, 
    setShowOfflineBanner,
    connectionType,
    effectiveType,
    connectionSpeed: connectionSpeed()
  };
};

// Custom hook for sync status
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSync: null,
    queuedItems: 0,
    lastError: null
  });

  const updateSyncStatus = async (offlineApi) => {
    try {
      const status = await offlineApi.getSyncStatus();
      setSyncStatus(prev => ({
        ...prev,
        queuedItems: status.total,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  };

  return { syncStatus, updateSyncStatus };
};