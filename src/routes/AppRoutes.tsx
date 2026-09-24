import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { TechnicalLandingPage } from '../pages/Technical/TechnicalLandingPage';
import { TechnicalQuizPage } from '../pages/Technical/TechnicalQuizPage';
import { CodingPage } from '../pages/Technical/CodingPage';
import { AptitudePage } from '../pages/Aptitude/AptitudePage';
import { HRRoundPage } from '../pages/HR/HRRoundPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/technical" element={<TechnicalLandingPage />} />
        <Route path="/technical/quiz" element={<TechnicalQuizPage />} />
        <Route path="/technical/coding" element={<CodingPage />} />
        <Route path="/aptitude" element={<AptitudePage />} />
        <Route path="/hr" element={<HRRoundPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
