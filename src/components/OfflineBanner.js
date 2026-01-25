import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineApi } from '../services/offlineApi';

const OfflineBanner = () => {
  const { showOfflineBanner, isOnline, setShowOfflineBanner, effectiveType } = useNetworkStatus();
  const [queuedItems, setQueuedItems] = useState(0);
  const [isVisible, setIsVisible] = useState(showOfflineBanner);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    setIsVisible(showOfflineBanner);
  }, [showOfflineBanner]);

  useEffect(() => {
    const updateQueuedItems = async () => {
      const status = await offlineApi.getSyncStatus();
      setQueuedItems(status.total);
    };

    // Update queued items periodically
    const interval = setInterval(updateQueuedItems, 5000);
    updateQueuedItems(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      await offlineApi.syncPendingOperations();
      const status = await offlineApi.getSyncStatus();
      setQueuedItems(status.total);
      setLastSync(new Date().toLocaleTimeString());
      
      // Show success message
      setTimeout(() => {
        if (status.total === 0) {
          setIsVisible(false);
          setShowOfflineBanner(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setShowOfflineBanner(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: isOnline ? '#FFA000' : '#f44336',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      zIndex: 1001,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>
          {isOnline ? '⚠️' : '📴'}
        </span>
        <div style={{ textAlign: 'left' }}>
          <strong>
            {isOnline 
              ? `Online (${effectiveType || 'Good connection'})` 
              : 'You are offline'}
          </strong>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {isOnline 
              ? queuedItems > 0 
                ? `${queuedItems} change(s) queued for sync`
                : 'All changes synced'
              : 'Changes will be saved locally and synced when you reconnect.'}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {isOnline && queuedItems > 0 && (
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              opacity: isSyncing ? 0.6 : 1
            }}
          >
            {isSyncing ? (
              <>
                <span className="spinner" style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Syncing...
              </>
            ) : (
              `Sync Now (${queuedItems})`
            )}
          </button>
        )}
        
        <button 
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 10px',
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.8}
          aria-label="Close banner"
        >
          ✕
        </button>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default OfflineBanner;