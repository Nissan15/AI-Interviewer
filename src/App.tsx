import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ResumeProvider } from './context/ResumeContext';
import { InterviewProvider } from './context/InterviewContext';
import { AppRoutes } from './routes/AppRoutes';
import './index.css';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
};

export default App;
