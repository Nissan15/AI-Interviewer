import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { AptitudeCategory, AptitudeQuestion, AptitudeResult } from '../../types/aptitude';
import { APTITUDE_CATEGORIES } from '../../constants/aptitudeCategories';
import { aptitudeApi } from '../../services/api/aptitudeApi';
import { assessmentService } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingState } from '../../components/common/LoadingState/LoadingState';
import { Timer } from '../../components/common/Timer/Timer';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Button } from '../../components/common/Button/Button';
import './AptitudePage.css';

export const AptitudePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<AptitudeCategory>('Quantitative Aptitude');
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(900); // 15 mins
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<AptitudeResult | null>(null);
  const [reportSaved, setReportSaved] = useState<boolean>(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await aptitudeApi.getQuestions(selectedCategory);
      setQuestions(data);
      setCurrentIndex(0);
      setAnswers({});
      setMarkedForReview([]);
      setTestSubmitted(false);
      setResult(null);
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

  const handleSelectOption = (optIdx: number) => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
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
      const res = await aptitudeApi.submitTest(
        {
          testId: `apt_${Date.now()}`,
          category: selectedCategory,
          answers,
          markedForReview,
          timeSpentSeconds: 900 - timeRemainingSeconds,
        },
        questions
      );

      setResult(res);
      setTestSubmitted(true);

      // Persist assessment report partitioned strictly for current user
      if (user) {
        const breakdown = questions.map((q) => ({
          questionId: q.id,
          selectedAnswer: answers[q.id] !== undefined ? answers[q.id] : -1,
          isCorrect: answers[q.id] === q.correctOptionIndex,
        }));

        await assessmentService.saveAssessmentReport(user.id, {
          assessmentType: 'aptitude',
          title: `${selectedCategory} Assessment`,
          category: selectedCategory,
          score: res.score,
          totalQuestions: res.totalQuestions,
          correctAnswers: res.correctAnswers,
          incorrectAnswers: res.incorrectAnswers,
          skippedAnswers: res.totalQuestions - Object.keys(answers).length,
          accuracy: res.accuracy,
          timeSpentSeconds: res.timeSpentSeconds,
          reportData: {
            category: selectedCategory,
            answers,
            markedForReview,
            completedAt: res.completedAt,
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
      const fallbackResult: AptitudeResult = {
        score: Math.round((correct / (questions.length || 1)) * 100),
        totalQuestions: questions.length,
        correctAnswers: correct,
        incorrectAnswers: Object.keys(answers).length - correct,
        accuracy: Math.round((correct / (Object.keys(answers).length || 1)) * 100),
        timeSpentSeconds: 900 - timeRemainingSeconds,
        category: selectedCategory,
        completedAt: new Date().toISOString(),
      };
      setResult(fallbackResult);
      setTestSubmitted(true);

      if (user) {
        await assessmentService.saveAssessmentReport(user.id, {
          assessmentType: 'aptitude',
          title: `${selectedCategory} Assessment`,
          category: selectedCategory,
          score: fallbackResult.score,
          totalQuestions: fallbackResult.totalQuestions,
          correctAnswers: fallbackResult.correctAnswers,
          incorrectAnswers: fallbackResult.incorrectAnswers,
          accuracy: fallbackResult.accuracy,
          timeSpentSeconds: fallbackResult.timeSpentSeconds,
        });
        setReportSaved(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="aptitude-page animate-fade-in">
      <div className="aptitude-header">
        <h2 className="aptitude-title">Aptitude & Reasoning Assessment</h2>
        <p className="aptitude-subtitle">
          Practice company placement tests across quantitative aptitude, logical reasoning, and verbal analysis.
        </p>
      </div>

      {/* Category Selection Tabs */}
      <div className="aptitude-category-nav">
        {APTITUDE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`aptitude-cat-pill ${selectedCategory === cat ? 'cat-active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState
          message="Loading aptitude test questions..."
          subMessage="Fetching placement test items"
        />
      ) : questions.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Brain size={32} />}
          badge="Aptitude Bank Ready"
          title="No aptitude questions available yet"
          description={`There are currently no aptitude questions uploaded for ${selectedCategory}. Connect your placement question database to begin practice.`}
          actionText="Refresh Bank"
          onAction={fetchQuestions}
        />
      ) : testSubmitted && result ? (
        /* Results View */
        <div className="aptitude-result-card">
          <CheckCircle2 size={48} className="result-success-icon" />
          <h3 className="result-title">Aptitude Assessment Completed</h3>
          <p className="result-subtitle">Category: {result.category}</p>

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
              <span className="stat-num">{result.totalQuestions}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Correct</span>
              <span className="stat-num text-success">{result.correctAnswers}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Accuracy</span>
              <span className="stat-num text-accent">{result.accuracy}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Time Spent</span>
              <span className="stat-num">{Math.round(result.timeSpentSeconds / 60)}m</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <Button variant="secondary" onClick={fetchQuestions}>
              Retake Test
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
        /* Active Test Engine */
        <div className="aptitude-test-layout">
          <div className="aptitude-left-pane">
            <div className="test-meta-row">
              <span className="question-index-label">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <Timer seconds={timeRemainingSeconds} label="Time Left" />
            </div>

            <ProgressBar
              value={((currentIndex + 1) / questions.length) * 100}
              size="sm"
            />

            <div className="aptitude-question-card">
              <div className="aptitude-question-prompt">
                <span className="q-badge">Q{currentIndex + 1}</span>
                <p className="q-text">{currentQ?.question}</p>
              </div>

              <div className="aptitude-options-list">
                {currentQ?.options?.map((optText, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      className={`aptitude-opt-btn ${isSelected ? 'opt-selected' : ''}`}
                      onClick={() => handleSelectOption(optIdx)}
                    >
                      <span className="opt-letter">{optionLetters[optIdx]}</span>
                      <span className="opt-text">{optText}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="aptitude-bottom-actions">
              <button
                className={`review-flag-btn ${markedForReview.includes(currentQ?.id) ? 'flagged' : ''}`}
                onClick={handleToggleReview}
              >
                {markedForReview.includes(currentQ?.id) ? 'Marked for Review' : 'Mark for Review'}
              </button>

              <div className="nav-buttons-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                >
                  Previous
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleSubmit}>
                    Submit Assessment
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Question Palette */}
          <div className="aptitude-palette-pane">
            <h4 className="palette-title">Question Palette</h4>
            <div className="palette-grid">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = markedForReview.includes(q.id);
                const isCurrent = idx === currentIndex;
                let statusClass = '';
                if (isCurrent) statusClass = 'palette-current';
                else if (isFlagged) statusClass = 'palette-flagged';
                else if (isAnswered) statusClass = 'palette-answered';

                return (
                  <button
                    key={q.id}
                    className={`palette-item ${statusClass}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="palette-legend">
              <div className="legend-row">
                <span className="legend-dot dot-answered"></span>
                <span>Answered</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot dot-flagged"></span>
                <span>Flagged</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot dot-unanswered"></span>
                <span>Unanswered</span>
              </div>
            </div>

            <div className="palette-submit-wrap">
              <Button variant="primary" fullWidth onClick={handleSubmit}>
                Finish &amp; Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
