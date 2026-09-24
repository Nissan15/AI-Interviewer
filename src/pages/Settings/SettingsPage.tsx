import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Cpu,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useSettings, AiProvider } from '../../context/SettingsContext';
import { textToSpeechService } from '../../services/speech/textToSpeech';
import { callLlmApi } from '../../services/ai/aiConfig';
import { Button } from '../../components/common/Button/Button';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const {
    aiProvider,
    apiKey,
    customApiUrl,
    selectedModel,
    autoSpeakQuestions,
    speechRate,
    voiceUri,
    isAiConfigured,
    updateSettings,
    resetSettings,
  } = useSettings();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testingAi, setTestingAi] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    textToSpeechService.getVoices().then((voices) => {
      setAvailableVoices(voices);
    });
  }, []);

  const handleTestConnection = async () => {
    setTestingAi(true);
    setTestResult(null);
    try {
      const response = await callLlmApi(
        'Respond in JSON: {"status": "ok", "message": "AI connection verified successfully"}',
        'You are an AI diagnostic bot.'
      );
      setTestResult({
        success: true,
        message: 'Connection verified! Your AI provider is responsive and operational.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed. Please check your credentials.',
      });
    } finally {
      setTestingAi(false);
    }
  };

  const handleTestVoice = () => {
    textToSpeechService.speak('Hello! I am your AI Mock Interviewer. I am ready to conduct your interview.', {
      rate: speechRate,
      voiceUri: voiceUri || undefined,
    });
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-header">
        <h2 className="settings-title">Platform & Provider Settings</h2>
        <p className="settings-subtitle">
          Configure external AI LLMs, speech engines, and backend connectivity options.
        </p>
      </div>

      <div className="settings-grid">
        {/* Section 1: AI Provider Configuration */}
        <div className="settings-card">
          <div className="card-heading-row">
            <Cpu size={20} className="card-icon" />
            <h3 className="card-heading">AI Provider Configuration</h3>
            <span className={`status-pill ${isAiConfigured ? 'status-connected' : 'status-unconfigured'}`}>
              {isAiConfigured ? 'Configured' : 'Missing Key'}
            </span>
          </div>

          <div className="settings-field">
            <label className="field-label">AI Engine Provider</label>
            <div className="provider-select-row">
              <button
                type="button"
                className={`provider-btn ${aiProvider === 'gemini' ? 'provider-active' : ''}`}
                onClick={() => updateSettings({ aiProvider: 'gemini', selectedModel: 'gemini-1.5-flash' })}
              >
                Google Gemini
              </button>
              <button
                type="button"
                className={`provider-btn ${aiProvider === 'openai' ? 'provider-active' : ''}`}
                onClick={() => updateSettings({ aiProvider: 'openai', selectedModel: 'gpt-4o-mini' })}
              >
                OpenAI
              </button>
              <button
                type="button"
                className={`provider-btn ${aiProvider === 'custom_backend' ? 'provider-active' : ''}`}
                onClick={() => updateSettings({ aiProvider: 'custom_backend' })}
              >
                Custom Backend API
              </button>
            </div>
          </div>

          {aiProvider !== 'custom_backend' ? (
            <>
              <div className="settings-field">
                <label className="field-label">API Key</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input
                    type="password"
                    className="settings-input"
                    placeholder={`Enter your ${aiProvider === 'gemini' ? 'Google AI Studio' : 'OpenAI'} API key`}
                    value={apiKey}
                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                  />
                </div>
                <span className="field-hint">
                  Your key is stored securely in your browser's local memory and is never transmitted to third parties.
                </span>
              </div>

              <div className="settings-field">
                <label className="field-label">Model</label>
                <input
                  type="text"
                  className="settings-input"
                  value={selectedModel}
                  onChange={(e) => updateSettings({ selectedModel: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="settings-field">
              <label className="field-label">Backend API URL</label>
              <input
                type="text"
                className="settings-input"
                placeholder="http://localhost:5000/api"
                value={customApiUrl}
                onChange={(e) => updateSettings({ customApiUrl: e.target.value })}
              />
              <span className="field-hint">Base URL for your backend server.</span>
            </div>
          )}

          <div className="card-action-bar">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              isLoading={testingAi}
              disabled={!isAiConfigured}
              onClick={handleTestConnection}
            >
              Test AI Connection
            </Button>
          </div>

          {testResult && (
            <div className={`test-result-box ${testResult.success ? 'result-ok' : 'result-fail'}`}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Section 2: Speech & Voice Settings */}
        <div className="settings-card">
          <div className="card-heading-row">
            <Volume2 size={20} className="card-icon" />
            <h3 className="card-heading">Speech & Audio Settings</h3>
          </div>

          <div className="settings-field">
            <label className="field-label">Preferred Voice</label>
            <select
              className="settings-select"
              value={voiceUri}
              onChange={(e) => updateSettings({ voiceUri: e.target.value })}
            >
              <option value="">Default Browser Voice</option>
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label className="field-label">Speech Rate ({speechRate}x)</label>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={speechRate}
              onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
              className="settings-slider"
            />
          </div>

          <div className="settings-toggle-field">
            <div>
              <span className="toggle-title">Auto-speak Questions</span>
              <p className="toggle-sub">Automatically vocalize questions when AI turn begins.</p>
            </div>
            <input
              type="checkbox"
              checked={autoSpeakQuestions}
              onChange={(e) => updateSettings({ autoSpeakQuestions: e.target.checked })}
              className="toggle-checkbox"
            />
          </div>

          <div className="card-action-bar">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Volume2 size={14} />}
              onClick={handleTestVoice}
            >
              Test Voice Output
            </Button>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw size={14} />}
          onClick={resetSettings}
        >
          Reset All Settings
        </Button>
      </div>
    </div>
  );
};
