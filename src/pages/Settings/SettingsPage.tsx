import React, { useState, useEffect } from "react";
import {
  Volume2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Bot,
  Sliders,
  ShieldCheck,
  Palette,
  Moon,
  Sun,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { textToSpeechService } from "../../services/speech/textToSpeech";
import { Button } from "../../components/common/Button/Button";
import "./SettingsPage.css";

export const SettingsPage: React.FC = () => {
  const { theme, isDark, setTheme } = useTheme();
  const {
    autoSpeakQuestions,
    speechRate,
    voiceUri,
    updateSettings,
    resetSettings,
  } = useSettings();

  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);

  useEffect(() => {
    textToSpeechService.getVoices().then((voices) => {
      setAvailableVoices(voices);
    });
  }, []);

  const handleTestVoice = () => {
    textToSpeechService.speak(
      "Hello! I am your AI Mock Interviewer. I am ready to conduct your interview.",
      {
        rate: speechRate,
        voiceUri: voiceUri || undefined,
      },
    );
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-header">
        <h2 className="settings-title">Platform Preferences</h2>
        <p className="settings-subtitle">
          Configure appearance theme, speech output, audio rate, and interviewer voice interaction settings.
        </p>
      </div>

      <div className="settings-grid">
        {/* Section 1: Appearance & Theme */}
        <div className="settings-card">
          <div className="card-heading-row">
            <Palette size={20} className="card-icon" />
            <h3 className="card-heading">Appearance & Interface Theme</h3>
          </div>

          <p className="platform-info-desc">
            Customize the platform aesthetic. Select dark mode for reduced eye strain during extended coding sessions or light mode for crisp daylight contrast.
          </p>

          <div className="theme-options-grid">
            <button
              type="button"
              className={`theme-selection-card ${isDark ? 'selected' : ''}`}
              onClick={() => setTheme('dark')}
              aria-label="Switch to Dark Mode"
            >
              <div className="theme-card-icon-wrap dark-icon-wrap">
                <Moon size={20} />
              </div>
              <div className="theme-card-text">
                <span className="theme-card-title">Dark Mode</span>
                <span className="theme-card-desc">Deep graphite & cyan technical glow</span>
              </div>
              {isDark && <span className="theme-active-tag">Active</span>}
            </button>

            <button
              type="button"
              className={`theme-selection-card ${!isDark ? 'selected' : ''}`}
              onClick={() => setTheme('light')}
              aria-label="Switch to Light Mode"
            >
              <div className="theme-card-icon-wrap light-icon-wrap">
                <Sun size={20} />
              </div>
              <div className="theme-card-text">
                <span className="theme-card-title">Light Mode</span>
                <span className="theme-card-desc">Crisp slate & high-contrast daylight clarity</span>
              </div>
              {!isDark && <span className="theme-active-tag">Active</span>}
            </button>
          </div>
        </div>

        {/* Section 2: AI Platform Capability Status */}
        <div className="settings-card">
          <div className="card-heading-row">
            <Bot size={20} className="card-icon" />
            <h3 className="card-heading">Platform Intelligence</h3>
            <span className="status-pill status-connected">
              <CheckCircle2
                size={12}
                style={{ display: "inline", marginRight: 4 }}
              />
              Active System Service
            </span>
          </div>

          <div className="platform-info-box">
            <div className="platform-info-header">
              <Sparkles size={16} className="text-accent" />
              <span className="info-title">
                Centralized Placement Interview Engine
              </span>
            </div>
            <p className="info-text">
              The AI interviewer, resume analyzer, skill evaluator, and learning
              path generator run internally as fully integrated platform
              capabilities. No API key configuration or provider selection is
              required.
            </p>
            <div className="platform-features-list">
              <div className="feature-item">
                <ShieldCheck size={14} className="feature-icon" />
                <span>Zero client-side API key exposure</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={14} className="feature-icon" />
                <span>Dynamic turn-by-turn conversational questioning</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={14} className="feature-icon" />
                <span>Autonomous rubric scoring & adaptive difficulty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Speech & Voice Settings */}
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
              onChange={(e) =>
                updateSettings({ speechRate: parseFloat(e.target.value) })
              }
              className="settings-slider"
            />
          </div>

          <div className="settings-toggle-field">
            <div>
              <span className="toggle-title">Auto-speak Questions</span>
              <p className="toggle-sub">
                Automatically vocalize questions when the AI turn begins.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoSpeakQuestions}
              onChange={(e) =>
                updateSettings({ autoSpeakQuestions: e.target.checked })
              }
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
          Reset Preferences
        </Button>
      </div>
    </div>
  );
};
