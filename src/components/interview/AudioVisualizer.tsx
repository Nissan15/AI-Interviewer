import React from 'react';
import { Bot, Mic, Volume2 } from 'lucide-react';
import './AudioVisualizer.css';

interface AudioVisualizerProps {
  isAiSpeaking: boolean;
  isCandidateSpeaking: boolean;
  statusText?: string;
  audioLevel?: number; // 0 - 100
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isAiSpeaking,
  isCandidateSpeaking,
  statusText,
  audioLevel = 0,
}) => {
  const isActive = isAiSpeaking || isCandidateSpeaking || audioLevel > 5;

  // Scale bar heights dynamically based on real-time microphone RMS level
  const getDynamicHeight = (barIndex: number) => {
    if (isAiSpeaking) return undefined; // CSS animation handles AI speech
    if (audioLevel <= 0) return '8px';
    const variance = [0.8, 1.2, 1.5, 1.8, 1.6, 1.3, 0.9, 0.7][barIndex % 8];
    const computedPx = Math.min(48, Math.max(8, Math.round((audioLevel / 100) * 44 * variance)));
    return `${computedPx}px`;
  };

  return (
    <div className={`audio-visualizer-wrap ${isAiSpeaking ? 'ai-active' : ''} ${isCandidateSpeaking ? 'mic-active' : ''}`}>
      {/* Outer ambient glow rings */}
      <div className={`visualizer-aura ${isActive ? 'aura-pulsing' : ''}`} />

      {/* Center avatar circle */}
      <div className="visualizer-center-orb">
        {isAiSpeaking ? (
          <Volume2 size={36} className="orb-icon ai-voice-icon" />
        ) : isCandidateSpeaking || audioLevel > 5 ? (
          <Mic size={36} className="orb-icon candidate-mic-icon" />
        ) : (
          <Bot size={36} className="orb-icon bot-idle-icon" />
        )}
      </div>

      {/* Dynamic Sound Waveform Bars */}
      <div className={`waveform-bars-cluster ${isActive ? 'bars-animating' : 'bars-static'}`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
          <span
            key={idx}
            className={`wave-bar bar-${idx + 1}`}
            style={{
              height: !isAiSpeaking && audioLevel > 0 ? getDynamicHeight(idx) : undefined,
              transition: !isAiSpeaking ? 'height 0.08s ease' : undefined,
            }}
          />
        ))}
      </div>

      {statusText && (
        <div className="visualizer-status-pill">
          <span className={`status-led ${isActive ? 'led-live' : ''}`} />
          <span className="status-label-str">{statusText}</span>
          {audioLevel > 5 && (
            <span style={{ fontSize: '0.72rem', color: '#10b981', marginLeft: '6px', fontWeight: 600 }}>
              {audioLevel}% mic
            </span>
          )}
        </div>
      )}
    </div>
  );
};
