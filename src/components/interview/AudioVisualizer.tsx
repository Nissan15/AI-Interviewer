import React from 'react';
import { Bot, Mic, Volume2 } from 'lucide-react';
import './AudioVisualizer.css';

interface AudioVisualizerProps {
  isAiSpeaking: boolean;
  isCandidateSpeaking: boolean;
  statusText?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isAiSpeaking,
  isCandidateSpeaking,
  statusText,
}) => {
  const isActive = isAiSpeaking || isCandidateSpeaking;

  return (
    <div className={`audio-visualizer-wrap ${isAiSpeaking ? 'ai-active' : ''} ${isCandidateSpeaking ? 'mic-active' : ''}`}>
      {/* Outer ambient glow rings */}
      <div className={`visualizer-aura ${isActive ? 'aura-pulsing' : ''}`} />

      {/* Center avatar circle */}
      <div className="visualizer-center-orb">
        {isAiSpeaking ? (
          <Volume2 size={36} className="orb-icon ai-voice-icon" />
        ) : isCandidateSpeaking ? (
          <Mic size={36} className="orb-icon candidate-mic-icon" />
        ) : (
          <Bot size={36} className="orb-icon bot-idle-icon" />
        )}
      </div>

      {/* Dynamic Sound Waveform Bars */}
      <div className={`waveform-bars-cluster ${isActive ? 'bars-animating' : 'bars-static'}`}>
        <span className="wave-bar bar-1" />
        <span className="wave-bar bar-2" />
        <span className="wave-bar bar-3" />
        <span className="wave-bar bar-4" />
        <span className="wave-bar bar-5" />
        <span className="wave-bar bar-6" />
        <span className="wave-bar bar-7" />
        <span className="wave-bar bar-8" />
      </div>

      {statusText && (
        <div className="visualizer-status-pill">
          <span className={`status-led ${isActive ? 'led-live' : ''}`} />
          <span className="status-label-str">{statusText}</span>
        </div>
      )}
    </div>
  );
};
