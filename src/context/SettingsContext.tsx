import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SettingsState {
  autoSpeakQuestions: boolean;
  speechRate: number; // 0.7 - 1.3
  voiceUri: string;
}

interface SettingsContextValue extends SettingsState {
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'ai_mock_interviewer_user_preferences';

const defaultSettings: SettingsState = {
  autoSpeakQuestions: true,
  speechRate: 1.0,
  voiceUri: '',
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultSettings,
          autoSpeakQuestions: parsed.autoSpeakQuestions ?? defaultSettings.autoSpeakQuestions,
          speechRate: parsed.speechRate ?? defaultSettings.speechRate,
          voiceUri: parsed.voiceUri ?? defaultSettings.voiceUri,
        };
      }
    } catch (e) {
      console.warn('Failed to read user preferences from storage', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save user preferences to storage', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset user preferences in storage', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
