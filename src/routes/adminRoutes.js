import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

import Dashboard from '../pages/Dashboard';
import StudentManagement from '../pages/StudentManagement';

export const adminRoutes = [
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/students',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
        <StudentManagement />
      </ProtectedRoute>
    ),
  },
];
