import React, { useEffect, useState } from 'react';
import { offlineApi } from '../services/offlineApi';

const DebugOffline = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testOfflineApi = async () => {
      try {
        console.log('🔍 Testing offlineApi.get()...');
        const result = await offlineApi.get('schoolPortalStudents');
        console.log('🔍 Result type:', typeof result);
        console.log('🔍 Result:', result);
        console.log('🔍 Is array?', Array.isArray(result));
        console.log('🔍 Is object?', result && typeof result === 'object');
        console.log('🔍 Keys:', result && Object.keys(result));
        
        setData(result);
      } catch (error) {
        console.error('🔍 Error:', error);
      } finally {
        setLoading(false);
      }
    };

    testOfflineApi();
  }, []);

  if (loading) return <div>Loading debug info...</div>;

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', border: '1px solid #ccc' }}>
      <h3>🔍 Offline API Debug</h3>
      <p><strong>Type:</strong> {typeof data}</p>
      <p><strong>Is Array:</strong> {Array.isArray(data).toString()}</p>
      <p><strong>Is Object:</strong> {(data && typeof data === 'object').toString()}</p>
      <p><strong>Value:</strong></p>
      <pre style={{ background: '#fff', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default DebugOffline;