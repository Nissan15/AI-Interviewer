import React, { useState, useEffect } from 'react';
import { Brain, Filter, CheckCircle2, Clock, Check, Flag } from 'lucide-react';
import { AptitudeCategory, AptitudeQuestion, AptitudeResult } from '../../types/aptitude';
import { APTITUDE_CATEGORIES } from '../../constants/aptitudeCategories';
import { aptitudeApi } from '../../services/api/aptitudeApi';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingState } from '../../components/common/LoadingState/LoadingState';
import { Timer } from '../../components/common/Timer/Timer';
import { ProgressBar } from '../../components/common/ProgressBar/ProgressBar';
import { Button } from '../../components/common/Button/Button';
import './AptitudePage.css';

export const AptitudePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<AptitudeCategory>('Quantitative Aptitude');
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(900); // 15 mins
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<AptitudeResult | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // ZERO SAMPLE DATA GUARANTEE: returns empty array [] initially
      const data = await aptitudeApi.getQuestions(selectedCategory);
      setQuestions(data);
      setCurrentIndex(0);
      setAnswers({});
      setMarkedForReview([]);
      setTestSubmitted(false);
      setResult(null);
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
      const res = await aptitudeApi.submitTest({
        testId: `apt_${Date.now()}`,
        category: selectedCategory,
        answers,
        markedForReview,
        timeSpentSeconds: 900 - timeRemainingSeconds,
      });
      setResult(res);
      setTestSubmitted(true);
    } catch (err) {
      let correct = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correctOptionIndex) correct++;
      });
      setResult({
        score: Math.round((correct / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers: correct,
        incorrectAnswers: Object.keys(answers).length - correct,
        accuracy: Math.round((correct / (Object.keys(answers).length || 1)) * 100),
        timeSpentSeconds: 900 - timeRemainingSeconds,
        category: selectedCategory,
        completedAt: new Date().toISOString(),
      });
      setTestSubmitted(true);
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
          subMessage="Querying /api/aptitude/questions"
        />
      ) : questions.length === 0 ? (
        /* Zero Sample Data Empty State */
        <EmptyState
          icon={<Brain size={32} />}
          badge="Aptitude Bank Ready"
          title="No aptitude questions available yet"
          description={`There are currently no aptitude questions uploaded for ${selectedCategory}. Connect your placement question database or API endpoint to begin practice.`}
          actionText="Refresh Bank"
          onAction={fetchQuestions}
        />
      ) : testSubmitted && result ? (
        /* Results View */
        <div className="aptitude-result-card">
          <CheckCircle2 size={48} className="result-success-icon" />
          <h3 className="result-title">Aptitude Assessment Completed</h3>
          <p className="result-subtitle">Category: {result.category}</p>

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

          <Button variant="primary" onClick={fetchQuestions}>
            Retake Test
          </Button>
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
                {currentQ.question}
              </div>

              <div className="aptitude-options-list">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      className={`aptitude-option-btn ${isSelected ? 'opt-selected' : ''}`}
                      onClick={() => handleSelectOption(idx)}
                    >
                      <span className="opt-letter">
                        {isSelected ? <Check size={14} /> : optionLetters[idx]}
                      </span>
                      <span className="opt-content">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="aptitude-card-nav">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>

                <Button
                  variant={markedForReview.includes(currentQ.id) ? 'secondary' : 'ghost'}
                  size="sm"
                  leftIcon={<Flag size={14} />}
                  onClick={handleToggleReview}
                >
                  {markedForReview.includes(currentQ.id) ? 'Marked' : 'Mark for Review'}
                </Button>

                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIndex((p) => p + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button variant="success" size="sm" onClick={handleSubmit}>
                    Submit Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
