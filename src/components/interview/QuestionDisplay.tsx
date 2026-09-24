import React from 'react';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '../common/Button/Button';
import './QuestionDisplay.css';

interface QuestionDisplayProps {
  questionNumber: number;
  questionText: string;
  isFollowUp?: boolean;
  onRepeatQuestion?: () => void;
  isAiSpeaking?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionNumber,
  questionText,
  isFollowUp = false,
  onRepeatQuestion,
  isAiSpeaking = false,
}) => {
  return (
    <div className="interview-question-display">
      <div className="question-display-top">
        <div className="q-badge-cluster">
          <span className="q-number-pill">Question {questionNumber}</span>
          {isFollowUp && (
            <span className="q-followup-pill">
              <Sparkles size={12} /> Adaptive Follow-up
            </span>
          )}
        </div>

        {onRepeatQuestion && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Volume2 size={14} />}
            disabled={isAiSpeaking}
            onClick={onRepeatQuestion}
          >
            Repeat Question
          </Button>
        )}
      </div>

      <div className="q-speech-box">
        <blockquote className="q-speech-text">
          "{questionText || 'Connecting to AI Interviewer...'}"
        </blockquote>
      </div>
    </div>
  );
};
