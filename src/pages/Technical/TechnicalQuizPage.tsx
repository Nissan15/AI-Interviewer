import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Filter, CheckCircle2, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { TechnicalQuestion, TechnicalCategory, QuizResult } from '../../types/technical';
import { technicalApi } from '../../services/api/technicalApi';
import { assessmentService } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<TechnicalCategory>('Programming');
  const [questions, setQuestions] = useState<TechnicalQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1200); // 20 mins
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [reportSaved, setReportSaved] = useState<boolean>(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await technicalApi.getQuizQuestions(selectedCategory);
      setQuestions(data);
      setCurrentIndex(0);
      setAnswers({});
      setMarkedForReview([]);
      setQuizSubmitted(false);
      setQuizResult(null);
      setReportSaved(false);
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
      const result = await technicalApi.submitQuiz(
        {
          testId: `quiz_${Date.now()}`,
          category: selectedCategory,
          answers,
          markedForReview,
          timeSpentSeconds: 1200 - timeRemainingSeconds,
        },
        questions
      );

      setQuizResult(result);
      setQuizSubmitted(true);

      // Persist report strictly for current user
      if (user) {
        const breakdown = questions.map((q) => ({
          questionId: q.id,
          selectedAnswer: answers[q.id] !== undefined ? answers[q.id] : -1,
          isCorrect: answers[q.id] === q.correctOptionIndex,
        }));

        await assessmentService.saveAssessmentReport(user.id, {
          assessmentType: 'technical',
          title: `${selectedCategory} Technical Assessment`,
          category: selectedCategory,
          score: result.score,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          incorrectAnswers: result.incorrectAnswers,
          skippedAnswers: result.skippedAnswers,
          accuracy: result.accuracy,
          timeSpentSeconds: result.timeSpentSeconds,
          reportData: {
            category: selectedCategory,
            answers,
            markedForReview,
            completedAt: result.completedAt,
          },
          answersBreakdown: breakdown,
        });

        setReportSaved(true);
      }
    } catch (err) {
      let correct = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correctOptionIndex) correct++;
      });
      const fallbackResult: QuizResult = {
        score: Math.round((correct / (questions.length || 1)) * 100),
        totalQuestions: questions.length,
        correctAnswers: correct,
        incorrectAnswers: Object.keys(answers).length - correct,
        skippedAnswers: questions.length - Object.keys(answers).length,
        accuracy: Math.round((correct / (Object.keys(answers).length || 1)) * 100),
        timeSpentSeconds: 1200 - timeRemainingSeconds,
        category: selectedCategory,
        completedAt: new Date().toISOString(),
      };
      setQuizResult(fallbackResult);
      setQuizSubmitted(true);

      if (user) {
        await assessmentService.saveAssessmentReport(user.id, {
          assessmentType: 'technical',
          title: `${selectedCategory} Technical Assessment`,
          category: selectedCategory,
          score: fallbackResult.score,
          totalQuestions: fallbackResult.totalQuestions,
          correctAnswers: fallbackResult.correctAnswers,
          incorrectAnswers: fallbackResult.incorrectAnswers,
          skippedAnswers: fallbackResult.skippedAnswers,
          accuracy: fallbackResult.accuracy,
          timeSpentSeconds: fallbackResult.timeSpentSeconds,
        });
        setReportSaved(true);
      }
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
          message="Loading technical questions..."
          subMessage="Connecting to question repository"
        />
      ) : questions.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<HelpCircle size={32} />}
          badge="Question Bank"
          title="No questions available yet"
          description={`There are currently no technical questions available for the ${selectedCategory} category.`}
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

          {reportSaved && user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '10px 16px',
              margin: '12px auto 20px',
              maxWidth: '520px',
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
            }}>
              <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>
                Assessment report stored in database &amp; isolated to candidate: <strong>{user.email}</strong>
              </span>
            </div>
          )}

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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <Button variant="secondary" onClick={fetchQuestions}>
              Retake Assessment
            </Button>
            <Button
              variant="primary"
              leftIcon={<LayoutDashboard size={16} />}
              onClick={() => navigate('/dashboard')}
            >
              View on Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* Active Quiz Interface */
        <div className="quiz-active-layout">
          <div className="quiz-main-column">
            <ProgressBar
              value={progressPercentage}
              label={`Answered ${answeredCount} of ${questions.length}`}
              size="md"
            />

            {questions[currentIndex] && (
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
            )}

            <div className="quiz-action-bar">
              <Button
                variant="secondary"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                Previous Question
              </Button>

              <div className="quiz-right-actions">
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit}>
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigation Drawer/Grid */}
          <div className="quiz-sidebar-column">
            <QuestionNavigation
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              answers={answers}
              questionIds={questions.map((q) => q.id)}
              markedForReview={markedForReview}
              onSelectQuestion={(index) => setCurrentIndex(index)}
              onNavigate={(index) => setCurrentIndex(index)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
