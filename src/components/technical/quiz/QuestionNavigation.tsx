import React from 'react';
import './QuestionNavigation.css';

interface QuestionNavigationProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, number>;
  questionIds: string[];
  markedForReview: string[];
  onSelectQuestion: (index: number) => void;
}

export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  questionIds,
  markedForReview,
  onSelectQuestion,
}) => {
  return (
    <div className="quiz-nav-sidebar">
      <div className="quiz-nav-header">
        <h4 className="quiz-nav-title">Question Navigation</h4>
      </div>

      <div className="quiz-legend-row">
        <div className="legend-item">
          <span className="legend-dot current" />
          <span>Current</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot answered" />
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot review" />
          <span>Review</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot unanswered" />
          <span>Pending</span>
        </div>
      </div>

      <div className="question-grid">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx];
          const isCurrent = idx === currentIndex;
          const isAnswered = answers[qId] !== undefined;
          const isReview = markedForReview.includes(qId);

          let statusClass = 'unanswered';
          if (isCurrent) statusClass = 'current';
          else if (isReview) statusClass = 'review';
          else if (isAnswered) statusClass = 'answered';

          return (
            <button
              key={idx}
              type="button"
              className={`grid-num-btn btn-${statusClass}`}
              onClick={() => onSelectQuestion(idx)}
              aria-label={`Jump to question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
