import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ResumeProvider } from './context/ResumeContext';
import { InterviewProvider } from './context/InterviewContext';
import { AppRoutes } from './routes/AppRoutes';
import './index.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ResumeProvider>
            <InterviewProvider>
              <AppRoutes />
            </InterviewProvider>
          </ResumeProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
