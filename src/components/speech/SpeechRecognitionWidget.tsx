import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Globe,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { speechToTextService } from '../../services/speech/speechToText';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../common/Button/Button';
import './SpeechRecognitionWidget.css';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (United States)', flag: '🇺🇸' },
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { code: 'en-GB', label: 'English (United Kingdom)', flag: '🇬🇧' },
  { code: 'en-AU', label: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-CA', label: 'English (Canada)', flag: '🇨🇦' },
];

export const SpeechRecognitionWidget: React.FC = () => {
  const {
    speechLanguage,
    technicalTermCorrection,
    continuousListening,
    updateSettings,
  } = useSettings();

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testTranscript, setTestTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'listening' | 'error' | 'calibrated'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);

  const isTestingRef = useRef<boolean>(false);

  useEffect(() => {
    isTestingRef.current = isTesting;
  }, [isTesting]);

  useEffect(() => {
    return () => {
      if (isTestingRef.current) {
        speechToTextService.stopListening();
      }
    };
  }, []);

  const handleToggleTest = () => {
    if (isTesting) {
      speechToTextService.stopListening();
      setIsTesting(false);
      setMicStatus('calibrated');
      setAudioLevel(0);
    } else {
      setErrorMessage(null);
      setTestTranscript('');
      setWordCount(0);
      setIsTesting(true);
      setMicStatus('listening');

      speechToTextService.startListening(
        {
          onStart: () => {
            setMicStatus('listening');
          },
          onResult: (text) => {
            setTestTranscript(text);
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            setWordCount(words);
          },
          onError: (err) => {
            setErrorMessage(err);
            setMicStatus('error');
            setIsTesting(false);
            setAudioLevel(0);
          },
          onEnd: () => {
            if (!isTestingRef.current) {
              setMicStatus('calibrated');
              setAudioLevel(0);
            }
          },
          onAudioLevel: (level) => {
            setAudioLevel(level);
          },
        },
        {
          lang: speechLanguage,
          continuous: continuousListening,
          enhanceVocabulary: technicalTermCorrection,
          onAudioLevel: (level) => {
            setAudioLevel(level);
          },
        }
      );
    }
  };

  const handleLanguageChange = (newLang: string) => {
    updateSettings({ speechLanguage: newLang });
    speechToTextService.setLanguage(newLang);
  };

  const handleClearTranscript = () => {
    setTestTranscript('');
    setWordCount(0);
    speechToTextService.resetTranscript();
  };

  const isSupported = speechToTextService.isSupported();

  return (
    <div className="speech-calibration-card">
      <div className="speech-calib-header">
        <div className="calib-title-wrap">
          <div className={`calib-icon-badge ${isTesting ? 'badge-pulse' : ''}`}>
            <Mic size={20} />
          </div>
          <div>
            <h3 className="calib-card-title">Speech Recognition Engine</h3>
            <p className="calib-card-sub">
              High-accuracy speech-to-text with real-time tech dictionary & continuous stream recovery.
            </p>
          </div>
        </div>

        <div className="calib-header-pills">
          {isSupported ? (
            <span className="calib-status-pill pill-online">
              <CheckCircle2 size={13} />
              <span>Web Speech Engine Active</span>
            </span>
          ) : (
            <span className="calib-status-pill pill-offline">
              <AlertCircle size={13} />
              <span>Browser Speech API Missing</span>
            </span>
          )}
        </div>
      </div>

      {/* Control Bar: Language, Auto-Correction & Continuous Toggles */}
      <div className="calib-controls-grid">
        <div className="calib-field">
          <label className="calib-field-label">
            <Globe size={14} />
            <span>Accent &amp; Recognition Language</span>
          </label>
          <select
            className="calib-select"
            value={speechLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="calib-field-actions">
          <div className="engine-feature-pills">
            <button
              type="button"
              className={`feature-toggle-pill ${technicalTermCorrection ? 'feat-active' : ''}`}
              onClick={() => updateSettings({ technicalTermCorrection: !technicalTermCorrection })}
              title="Automatically maps spoken phrases like 'no sequel' to 'NoSQL', 'post gres' to 'PostgreSQL', etc."
            >
              <Cpu size={13} />
              <span>Tech Dictionary Auto-Correction: {technicalTermCorrection ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              className={`feature-toggle-pill ${continuousListening ? 'feat-active' : ''}`}
              onClick={() => updateSettings({ continuousListening: !continuousListening })}
              title="Prevents browser silence timeouts from terminating speech recognition prematurely."
            >
              <RefreshCw size={13} />
              <span>Continuous Reconnect: {continuousListening ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Microphone Test Arena */}
      <div className={`calib-arena ${isTesting ? 'arena-active' : ''}`}>
        <div className="arena-top-row">
          <div className="mic-meter-box">
            <div className="mic-meter-label-row">
              <span className="meter-label">
                <Volume2 size={14} /> Mic Input Volume
              </span>
              <span className="meter-val">{audioLevel}%</span>
            </div>
            <div className="meter-track">
              <div
                className={`meter-bar ${audioLevel > 60 ? 'bar-high' : audioLevel > 20 ? 'bar-med' : 'bar-low'}`}
                style={{ width: `${Math.max(4, audioLevel)}%` }}
              />
            </div>
          </div>

          <div className="arena-btn-wrap">
            <Button
              variant={isTesting ? 'danger' : 'primary'}
              size="md"
              leftIcon={isTesting ? <MicOff size={16} /> : <Mic size={16} />}
              onClick={handleToggleTest}
            >
              {isTesting ? 'Stop Mic Test' : 'Test Speech Recognition'}
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="calib-error-banner">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Audio & Transcript Preview Box */}
        <div className="calib-transcript-box">
          <div className="calib-box-header">
            <span className="calib-box-title">
              {isTesting ? (
                <span className="stream-live-tag">
                  <span className="pulse-dot" /> Live Speech Stream
                </span>
              ) : (
                'Speech Transcription Output'
              )}
            </span>
            <div className="calib-meta-counts">
              {wordCount > 0 && <span>{wordCount} words detected</span>}
              {testTranscript && (
                <button type="button" className="calib-clear-btn" onClick={handleClearTranscript}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="calib-text-area">
            {testTranscript ? (
              <p className="calib-live-text">{testTranscript}</p>
            ) : (
              <p className="calib-placeholder-text">
                {isTesting
                  ? 'Listening... Try saying: "I designed a scalable microservices architecture using React, Node.js, and PostgreSQL."'
                  : 'Click "Test Speech Recognition" to calibrate microphone sensitivity and test technical term transcription.'}
              </p>
            )}
          </div>

          {testTranscript && technicalTermCorrection && (
            <div className="calib-enhancement-notice">
              <Sparkles size={13} className="text-accent" />
              <span>
                Domain normalizer active: Technical acronyms, framework names, and case conventions are standardized automatically.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
