import React, { useState } from "react";
import { Mic, Send, MessageSquare, History, Edit3, Square, Sparkles, Volume2 } from "lucide-react";
import { InterviewExchange } from "../../types/interview";
import { Button } from "../common/Button/Button";
import "./TranscriptView.css";

interface TranscriptViewProps {
  currentTranscript: string;
  isListening: boolean;
  isProcessing: boolean;
  isAiSpeaking: boolean;
  onMicTap: () => void;
  onSubmitAnswer: (customText?: string) => void;
  exchanges: InterviewExchange[];
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  currentTranscript,
  isListening,
  isProcessing,
  isAiSpeaking,
  onMicTap,
  onSubmitAnswer,
  exchanges,
}) => {
  const [manualText, setManualText] = useState<string>("");
  const [isEditingManually, setIsEditingManually] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const activeText = isEditingManually
    ? manualText
    : currentTranscript || manualText;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeText.trim() && !currentTranscript.trim()) return;
    onSubmitAnswer(isEditingManually ? manualText : undefined);
    setManualText("");
    setIsEditingManually(false);
  };

  const handleStartTyping = () => {
    setIsEditingManually(true);
    setManualText(currentTranscript);
  };

  const handleSwitchToVoice = () => {
    setIsEditingManually(false);
  };

  return (
    <div className="transcript-panel">
      <div className="transcript-top-bar">
        <div className="transcript-status">
          <MessageSquare size={16} className="transcript-icon" />
          <span className="transcript-heading">Candidate Answer</span>
          {isProcessing ? (
            <span className="eval-tag">
              <Sparkles size={11} className="animate-spin" /> Analysing Speech
            </span>
          ) : isListening ? (
            <span className="live-mic-tag">
              <span className="live-dot" /> Recording Speech
            </span>
          ) : isAiSpeaking ? (
            <span className="ai-speaking-tag">
              <Volume2 size={11} /> AI Speaking
            </span>
          ) : (
            <span className="ready-tag">
              <Mic size={11} /> Mic Ready
            </span>
          )}
        </div>

        <div className="transcript-toggles">
          {isEditingManually ? (
            <button
              type="button"
              className="toggle-mode-btn"
              onClick={handleSwitchToVoice}
            >
              <Mic size={13} /> Switch to Voice Mode
            </button>
          ) : (
            <button
              type="button"
              className="toggle-mode-btn"
              onClick={handleStartTyping}
            >
              <Edit3 size={13} /> Type / Refine
            </button>
          )}

          {exchanges.length > 0 && (
            <button
              type="button"
              className="toggle-history-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={13} /> History ({exchanges.length})
            </button>
          )}
        </div>
      </div>

      {/* Transcript Input / Display Area */}
      <form onSubmit={handleSubmit} className="transcript-input-form">
        {isEditingManually ? (
          <textarea
            className="transcript-textarea"
            placeholder="Type your response here..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={4}
            autoFocus
          />
        ) : (
          <>
            {/* Hero Tap-to-Talk Mic Controller */}
            <div className="mic-controller-wrap">
              {isProcessing ? (
                <div className="mic-hero-card state-processing">
                  <div className="mic-hero-icon-ring processing">
                    <Sparkles size={24} className="hero-spin-icon" />
                  </div>
                  <div className="mic-hero-details">
                    <span className="mic-hero-title">AI Analysing Speech...</span>
                    <span className="mic-hero-hint">
                      Evaluating your answer and preparing adaptive follow-up
                    </span>
                  </div>
                </div>
              ) : isListening ? (
                <button
                  type="button"
                  className="mic-hero-card state-recording"
                  onClick={onMicTap}
                  title="Tap mic to stop speaking and start AI analysis"
                >
                  <div className="mic-hero-icon-ring recording">
                    <Square size={20} className="hero-stop-icon" />
                    <span className="hero-radar-pulse" />
                  </div>
                  <div className="mic-hero-details">
                    <span className="mic-hero-title recording-title">
                      Tap Mic to Stop &amp; Analyse
                    </span>
                    <span className="mic-hero-hint recording-hint">
                      Microphone is LIVE. Once you tap the mic again, AI will begin analysing.
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  className={`mic-hero-card state-ready ${
                    isAiSpeaking ? "ai-speaking-card" : ""
                  }`}
                  onClick={onMicTap}
                  title={
                    isAiSpeaking
                      ? "Tap to interrupt AI and answer early"
                      : "Tap mic to start speaking"
                  }
                >
                  <div className="mic-hero-icon-ring ready">
                    <Mic size={24} className="hero-mic-icon" />
                  </div>
                  <div className="mic-hero-details">
                    <span className="mic-hero-title">
                      {isAiSpeaking
                        ? "AI is speaking... Tap to answer early"
                        : "Tap Mic to Start Speaking"}
                    </span>
                    <span className="mic-hero-hint">
                      {isAiSpeaking
                        ? "You can listen to the question or tap now to speak"
                        : "Tap once to begin recording your spoken response"}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Live Streaming Transcript Box */}
            <div className={`live-speech-stream-box ${isListening ? "box-recording" : ""}`}>
              {currentTranscript ? (
                <p className="streaming-text">{currentTranscript}</p>
              ) : (
                <p className="speech-placeholder">
                  {isListening
                    ? "🎙️ Listening to your microphone... speak your answer now. When finished, tap the red button above to analyse."
                    : "Microphone is on standby. Tap the mic above to start speaking, or click Type / Refine to write your answer."}
                </p>
              )}
            </div>
          </>
        )}

        <div className="transcript-submit-row">
          <span className="submit-hint">
            {isEditingManually
              ? "Click Submit Answer to send your typed response."
              : isListening
              ? "Tap the mic button above (or press Spacebar) to stop and analyse."
              : "Tap the mic when ready, then tap again when finished speaking."}
          </span>

          {isEditingManually ? (
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isProcessing}
              disabled={!activeText.trim()}
              rightIcon={<Send size={15} />}
            >
              {isProcessing ? "Processing..." : "Submit Typed Answer"}
            </Button>
          ) : isListening ? (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={onMicTap}
              isLoading={isProcessing}
              leftIcon={<Square size={14} />}
            >
              Stop &amp; Analyse
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onMicTap}
              disabled={isProcessing}
              leftIcon={<Mic size={15} />}
            >
              Start Speaking
            </Button>
          )}
        </div>
      </form>

      {/* Collapsible Previous Turn Exchanges History */}
      {showHistory && exchanges.length > 0 && (
        <div className="interview-history-sheet">
          <h4 className="sheet-title">Session Conversation History</h4>
          <div className="history-turns-list">
            {exchanges.map((ex, idx) => (
              <div key={ex.id || idx} className="history-turn-item">
                <div className="turn-q">
                  <span className="turn-label">Q{ex.questionNumber}:</span>
                  <span className="turn-text">{ex.questionText}</span>
                </div>
                <div className="turn-a">
                  <span className="turn-label">You:</span>
                  <span className="turn-text">{ex.userAnswerText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
