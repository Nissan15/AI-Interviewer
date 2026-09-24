import React from 'react';
import { Flag, Check } from 'lucide-react';
import { TechnicalQuestion } from '../../../types/technical';
import { Button } from '../../common/Button/Button';
import './QuizQuestionCard.css';

interface QuizQuestionCardProps {
  question: TechnicalQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: number | undefined;
  isMarkedForReview: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onSubmit: () => void;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  isMarkedForReview,
  onSelectOption,
  onToggleReview,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onSubmit,
}) => {
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="quiz-question-card">
      <div className="question-card-top-bar">
        <span className="question-counter">
          Question {questionNumber} of {totalQuestions}
        </span>
        <Button
          variant={isMarkedForReview ? 'secondary' : 'ghost'}
          size="sm"
          className={isMarkedForReview ? 'marked-review-active' : ''}
          leftIcon={<Flag size={14} />}
          onClick={onToggleReview}
        >
          {isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
        </Button>
      </div>

      <div className="question-body">
        <h3 className="question-prompt-text">{question.question}</h3>

        <div className="options-list" role="radiogroup">
          {question.options.map((optText, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`quiz-option-button ${isSelected ? 'option-selected' : ''}`}
                onClick={() => onSelectOption(idx)}
              >
                <div className="option-indicator">
                  {isSelected ? <Check size={14} /> : optionLetters[idx]}
                </div>
                <span className="option-text-content">{optText}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="question-card-nav-row">
        <Button
          variant="secondary"
          size="md"
          disabled={!hasPrevious}
          onClick={onPrevious}
        >
          Previous
        </Button>

        <div className="nav-right-actions">
          {hasNext ? (
            <Button variant="primary" size="md" onClick={onNext}>
              Next Question
            </Button>
          ) : (
            <Button variant="success" size="md" onClick={onSubmit}>
              Submit Assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
