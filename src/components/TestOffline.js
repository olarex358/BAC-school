// src/components/TestOffline.js
import React, { useEffect } from 'react';
import { offlineApi } from '../services/offlineApi';

const TestOffline = () => {
  useEffect(() => {
    const testOffline = async () => {
      console.log('Testing offline capabilities...');
      
      // Test getting students
      const students = await offlineApi.get('schoolPortalStudents');
      console.log('Students loaded:', students);
      
      // Test getting staff
      const staff = await offlineApi.get('schoolPortalStaff');
      console.log('Staff loaded:', staff);
    };
    
    testOffline();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Offline Test</h2>
      <p>Check console for offline loading results.</p>
      <p>Try disconnecting your network and refreshing the page!</p>
    </div>
  );
};

export default TestOffline;