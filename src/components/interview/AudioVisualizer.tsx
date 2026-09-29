import React from "react";
import { Bot, Mic, Volume2, Sparkles } from "lucide-react";
import "./AudioVisualizer.css";

interface AudioVisualizerProps {
  isAiSpeaking: boolean;
  isCandidateSpeaking: boolean;
  isListening?: boolean;
  isProcessing?: boolean;
  statusText?: string;
  onMicTap?: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isAiSpeaking,
  isCandidateSpeaking,
  isListening = false,
  isProcessing = false,
  statusText,
  onMicTap,
}) => {
  const isCandidateActive = isCandidateSpeaking || isListening;
  const isActive = isAiSpeaking || isCandidateActive || isProcessing;

  const getOrbAriaLabel = () => {
    if (isProcessing) return "AI Analysing speech";
    if (isAiSpeaking) return "AI Interviewer speaking (tap to answer early)";
    if (isListening) return "Listening to your answer (tap to finish & analyse)";
    return "Tap mic to start speaking";
  };

  return (
    <div
      className={`audio-visualizer-wrap ${isAiSpeaking ? "ai-active" : ""} ${
        isCandidateActive ? "mic-active" : ""
      } ${isProcessing ? "processing-active" : ""} ${
        !isAiSpeaking && !isListening && !isProcessing ? "ready-active" : ""
      }`}
    >
      {/* Outer ambient glow rings */}
      <div className={`visualizer-aura ${isActive ? "aura-pulsing" : "aura-breathing"}`} />

      {/* Center avatar/mic interactive circle */}
      <button
        type="button"
        className={`visualizer-center-orb ${onMicTap ? "orb-interactive" : ""}`}
        onClick={onMicTap}
        aria-label={getOrbAriaLabel()}
        title={getOrbAriaLabel()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Sparkles size={34} className="orb-icon processing-icon" />
        ) : isAiSpeaking ? (
          <Volume2 size={34} className="orb-icon ai-voice-icon" />
        ) : isListening ? (
          <Mic size={34} className="orb-icon candidate-mic-icon" />
        ) : (
          <Mic size={34} className="orb-icon ready-mic-icon" />
        )}

        {/* Small live recording dot on orb */}
        {isListening && (
          <span className="orb-rec-badge" title="Recording">
            <span className="orb-rec-dot" />
          </span>
        )}
      </button>

      {/* Dynamic Sound Waveform Bars */}
      <div
        className={`waveform-bars-cluster ${
          isActive ? "bars-animating" : "bars-static"
        }`}
      >
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
          <span
            className={`status-led ${isActive ? "led-live" : ""} ${
              isProcessing ? "led-processing" : ""
            }`}
          />
          <span className="status-label-str">{statusText}</span>
        </div>
      )}
    </div>
  );
};
