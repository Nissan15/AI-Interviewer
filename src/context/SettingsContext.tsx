import React, { createContext, useContext, useState, useEffect } from 'react';

export type AiProvider = 'gemini' | 'openai' | 'custom_backend';

export interface SettingsState {
  aiProvider: AiProvider;
  apiKey: string;
  customApiUrl: string;
  selectedModel: string;
  autoSpeakQuestions: boolean;
  speechRate: number; // 0.8 - 1.2
  voiceUri: string;
  isAiConfigured: boolean;
}

interface SettingsContextValue extends SettingsState {
  updateSettings: (settings: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'ai_mock_interviewer_settings';

const defaultSettings: SettingsState = {
  aiProvider: 'gemini',
  apiKey: '',
  customApiUrl: 'http://localhost:5000/api',
  selectedModel: 'gemini-1.5-flash',
  autoSpeakQuestions: true,
  speechRate: 1.0,
  voiceUri: '',
  isAiConfigured: false,
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
          ...parsed,
          isAiConfigured: Boolean(parsed.apiKey || parsed.customApiUrl),
        };
      }
    } catch (e) {
      console.warn('Failed to read settings from storage', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to storage', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      updated.isAiConfigured = Boolean(updated.apiKey.trim() || (updated.aiProvider === 'custom_backend' && updated.customApiUrl.trim()));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset settings in storage', e);
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
