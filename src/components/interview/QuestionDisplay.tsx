import React from 'react';
import { Volume2, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '../common/Button/Button';
import './QuestionDisplay.css';

interface QuestionDisplayProps {
  questionNumber: number;
  questionText: string;
  isFollowUp?: boolean;
  category?: string;
  competency?: string;
  onRepeatQuestion?: () => void;
  isAiSpeaking?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionNumber,
  questionText,
  isFollowUp = false,
  category,
  competency,
  onRepeatQuestion,
  isAiSpeaking = false,
}) => {
  const formatCategory = (cat?: string) => {
    if (!cat) return null;
    if (cat.includes('situational')) return 'Workplace Scenario';
    if (cat.includes('behavioral')) return 'Behavioral';
    if (cat.includes('self_awareness')) return 'Self-Awareness';
    if (cat.includes('pressure_decision')) return 'Pressure & Decision Making';
    if (cat.includes('career_growth')) return 'Career Vision';
    if (cat.includes('project_grounded') || cat.includes('resume')) return 'Resume Grounded';
    return cat.replace('_', ' ').toUpperCase();
  };

  const formattedCat = formatCategory(category);

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
          {formattedCat && !isFollowUp && (
            <span className="q-category-pill">
              {formattedCat}
            </span>
          )}
          {competency && (
            <span className="q-competency-pill">
              {competency}
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
