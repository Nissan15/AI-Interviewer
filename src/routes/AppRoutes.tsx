import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { Login } from '../pages/auth/Login';
import { Signup } from '../pages/auth/Signup';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { TechnicalQuizPage } from '../pages/Technical/TechnicalQuizPage';
import { AptitudePage } from '../pages/Aptitude/AptitudePage';
import { HRRoundPage } from '../pages/HR/HRRoundPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { AdminRoute } from './AdminRoute';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminOverviewPage } from '../pages/Admin/AdminOverviewPage';
import { QuestionBankPage } from '../pages/Admin/QuestionBankPage';
import { TestManagementPage } from '../pages/Admin/TestManagementPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Enterprise SaaS Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/technical" element={<Navigate to="/technical/quiz" replace />} />
          <Route path="/technical/quiz" element={<TechnicalQuizPage />} />
          <Route path="/technical/coding" element={<Navigate to="/technical/quiz" replace />} />
          <Route path="/aptitude" element={<AptitudePage />} />
          <Route path="/hr" element={<HRRoundPage />} />
          <Route path="/hr/history" element={<HRRoundPage defaultTab="history" />} />
          <Route path="/hr/reports" element={<Navigate to="/hr/history" replace />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin Assessment Management System */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="tests" element={<TestManagementPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
