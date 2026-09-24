import React, { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, Filter, CheckCircle2 } from 'lucide-react';
import { TechnicalQuestion, TechnicalCategory, QuizResult } from '../../types/technical';
import { technicalApi } from '../../services/api/technicalApi';
import { TECHNICAL_CATEGORIES } from '../../constants/technicalCategories';
import { QuizQuestionCard } from '../../components/technical/quiz/QuizQuestionCard';
import { QuestionNavigation } from '../../components/technical/quiz/QuestionNavigation';
import { Timer } from '../../components/common/Timer/Timer';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingState } from '../../components/common/LoadingState/LoadingState';
import { Button } from '../../components/common/Button/Button';
import './TechnicalQuizPage.css';

export const TechnicalQuizPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<TechnicalCategory>('Programming');
  const [questions, setQuestions] = useState<TechnicalQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1200); // 20 mins
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await technicalApi.getQuizQuestions(selectedCategory);
      // Data is initially empty [] (Zero sample data guarantee!)
      setQuestions(data);
      setCurrentIndex(0);
      setAnswers({});
      setMarkedForReview([]);
      setQuizSubmitted(false);
      setQuizResult(null);
    } catch (err) {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory]);

  const handleSelectOption = (optionIndex: number) => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const handleToggleReview = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setMarkedForReview((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await technicalApi.submitQuiz({
        testId: `quiz_${Date.now()}`,
        category: selectedCategory,
        answers,
        markedForReview,
        timeSpentSeconds: 1200 - timeRemainingSeconds,
      });
      setQuizResult(result);
      setQuizSubmitted(true);
    } catch (err) {
      // In case backend is offline, calculate score from active questions
      let correct = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correctOptionIndex) correct++;
      });
      setQuizResult({
        score: Math.round((correct / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers: correct,
        incorrectAnswers: Object.keys(answers).length - correct,
        skippedAnswers: questions.length - Object.keys(answers).length,
        accuracy: Math.round((correct / (Object.keys(answers).length || 1)) * 100),
        timeSpentSeconds: 1200 - timeRemainingSeconds,
        category: selectedCategory,
        completedAt: new Date().toISOString(),
      });
      setQuizSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="technical-quiz-page animate-fade-in">
      {/* Category Selection Bar */}
      <div className="quiz-top-controls">
        <div className="category-select-wrapper">
          <Filter size={16} className="filter-icon" />
          <label htmlFor="quiz-category-select" className="filter-label">
            Category:
          </label>
          <select
            id="quiz-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TechnicalCategory)}
            className="category-dropdown"
          >
            {TECHNICAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {questions.length > 0 && !quizSubmitted && (
          <div className="quiz-timer-wrap">
            <Timer seconds={timeRemainingSeconds} label="Quiz Timer" />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState
          message="Querying technical question bank..."
          subMessage="Connecting to /api/technical/questions"
        />
      ) : questions.length === 0 ? (
        /* Zero Sample Data Empty State */
        <EmptyState
          icon={<HelpCircle size={32} />}
          badge="Empty Question Bank"
          title="No questions available yet"
          description={`There are currently no technical questions available for the ${selectedCategory} category. Connect your backend API at /api/technical/questions to fetch real assessment items.`}
          actionText="Refresh Question Bank"
          onAction={fetchQuestions}
        />
      ) : quizSubmitted && quizResult ? (
        /* Quiz Result View */
        <div className="quiz-result-card">
          <CheckCircle2 size={48} className="result-success-icon" />
          <h3 className="result-title">Assessment Submitted</h3>
          <p className="result-subtitle">
            Category: {quizResult.category} | Accuracy: {quizResult.accuracy}%
          </p>
          <div className="result-stats-grid">
            <div className="stat-box">
              <span className="stat-label">Total Questions</span>
              <span className="stat-num">{quizResult.totalQuestions}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Correct</span>
              <span className="stat-num text-success">{quizResult.correctAnswers}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Incorrect</span>
              <span className="stat-num text-error">{quizResult.incorrectAnswers}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Score</span>
              <span className="stat-num text-accent">{quizResult.score}%</span>
            </div>
          </div>
          <Button variant="primary" onClick={fetchQuestions}>
            Retake Assessment
          </Button>
        </div>
      ) : (
        /* Active Quiz Interface */
        <div className="quiz-active-layout">
          <div className="quiz-main-column">
            <ProgressBar
              value={progressPercentage}
              label={`Progress (${answeredCount}/${questions.length} Answered)`}
              showPercentage
            />

            <QuizQuestionCard
              question={questions[currentIndex]}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              selectedOption={answers[questions[currentIndex].id]}
              isMarkedForReview={markedForReview.includes(questions[currentIndex].id)}
              onSelectOption={handleSelectOption}
              onToggleReview={handleToggleReview}
              onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              hasPrevious={currentIndex > 0}
              hasNext={currentIndex < questions.length - 1}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="quiz-side-column">
            <QuestionNavigation
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              answers={answers}
              questionIds={questions.map((q) => q.id)}
              markedForReview={markedForReview}
              onSelectQuestion={(idx) => setCurrentIndex(idx)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
