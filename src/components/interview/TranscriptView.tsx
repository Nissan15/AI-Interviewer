import React, { useState } from 'react';
import { Mic, Send, MessageSquare, History, Edit3 } from 'lucide-react';
import { InterviewExchange } from '../../types/interview';
import { Button } from '../common/Button/Button';
import './TranscriptView.css';

interface TranscriptViewProps {
  currentTranscript: string;
  isListening: boolean;
  isProcessing: boolean;
  onSubmitAnswer: (customText?: string) => void;
  exchanges: InterviewExchange[];
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  currentTranscript,
  isListening,
  isProcessing,
  onSubmitAnswer,
  exchanges,
}) => {
  const [manualText, setManualText] = useState<string>('');
  const [isEditingManually, setIsEditingManually] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const activeText = isEditingManually ? manualText : currentTranscript || manualText;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeText.trim() && !currentTranscript.trim()) return;
    onSubmitAnswer(isEditingManually ? manualText : undefined);
    setManualText('');
    setIsEditingManually(false);
  };

  const handleStartTyping = () => {
    setIsEditingManually(true);
    setManualText(currentTranscript);
  };

  return (
    <div className="transcript-panel">
      <div className="transcript-top-bar">
        <div className="transcript-status">
          <MessageSquare size={16} className="transcript-icon" />
          <span className="transcript-heading">Candidate Answer</span>
          {isListening && (
            <span className="live-mic-tag">
              <span className="live-dot" /> Capturing Speech
            </span>
          )}
        </div>

        <div className="transcript-toggles">
          <button
            type="button"
            className="toggle-mode-btn"
            onClick={handleStartTyping}
            disabled={isEditingManually}
          >
            <Edit3 size={13} /> {isEditingManually ? 'Typing Mode' : 'Type / Refine'}
          </button>
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
          <div className="live-speech-stream-box">
            {currentTranscript ? (
              <p className="streaming-text">{currentTranscript}</p>
            ) : (
              <p className="speech-placeholder">
                {isListening
                  ? 'Listening to your microphone... speak your answer now.'
                  : 'Microphone is standby. Click Submit or Type to respond.'}
              </p>
            )}
          </div>
        )}

        <div className="transcript-submit-row">
          <span className="submit-hint">
            {isEditingManually
              ? 'Click Submit to send your typed response.'
              : 'Answers are analyzed continuously for adaptive follow-ups.'}
          </span>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isProcessing}
            disabled={!activeText.trim() && !currentTranscript.trim()}
            rightIcon={<Send size={15} />}
          >
            {isProcessing ? 'Processing Answer...' : 'Submit Answer'}
          </Button>
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
