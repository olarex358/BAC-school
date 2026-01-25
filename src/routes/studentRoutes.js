import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

import StudentDashboard from '../pages/StudentDashboard';
import StudentResults from '../pages/StudentResults';

export const studentRoutes = [
  {
    path: '/student/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/student/results',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <StudentResults />
      </ProtectedRoute>
    ),
  },
];
