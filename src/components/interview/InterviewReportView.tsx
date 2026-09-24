import React from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { InterviewEvaluation } from '../../types/evaluation';
import { ProgressBar } from '../common/ProgressBar/ProgressBar';
import { Button } from '../common/Button/Button';
import './InterviewReportView.css';

interface InterviewReportViewProps {
  evaluation: InterviewEvaluation;
  onRetake: () => void;
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({
  evaluation,
  onRetake,
}) => {
  const metrics = [
    { label: 'Communication', score: evaluation.communicationScore, color: 'primary' as const },
    { label: 'Technical Depth', score: evaluation.technicalScore, color: 'success' as const },
    { label: 'Confidence', score: evaluation.confidenceScore, color: 'warning' as const },
    { label: 'Answer Relevance', score: evaluation.relevanceScore, color: 'primary' as const },
    { label: 'Problem Solving', score: evaluation.problemSolvingScore, color: 'success' as const },
    { label: 'Clarity & Structure', score: evaluation.clarityScore, color: 'info' as const },
  ];

  return (
    <div className="interview-report-view animate-fade-in">
      {/* Header Banner */}
      <div className="report-header-card">
        <div className="report-header-left">
          <div className="report-trophy-icon">
            <Award size={32} />
          </div>
          <div className="report-title-block">
            <span className="report-badge">Verified AI Evaluation</span>
            <h2 className="report-title">Interview Performance Assessment</h2>
            <div className="report-meta-row">
              <span>Duration: {Math.round(evaluation.durationSeconds / 60)} minutes</span>
              <span>•</span>
              <span>Session ID: {evaluation.sessionId}</span>
            </div>
          </div>
        </div>

        <div className="report-overall-score-box">
          <span className="score-label">Overall Readiness</span>
          <span className="score-number">{evaluation.overallScore}</span>
          <span className="score-denom">/ 100</span>
        </div>
      </div>

      {/* Competency Rubric Grid */}
      <div className="rubric-card">
        <h3 className="section-heading">Core Competency Rubric</h3>
        <div className="rubric-bars-grid">
          {metrics.map((m) => (
            <div key={m.label} className="rubric-bar-item">
              <ProgressBar
                value={m.score}
                label={m.label}
                showPercentage
                color={m.color}
                size="md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="feedback-dual-grid">
        <div className="feedback-card strengths-card">
          <div className="feedback-header">
            <CheckCircle2 size={18} className="feedback-icon text-success" />
            <h4 className="feedback-title">Demonstrated Strengths</h4>
          </div>
          <ul className="feedback-bullet-list">
            {evaluation.strengths.map((str, idx) => (
              <li key={idx}>{str}</li>
            ))}
          </ul>
        </div>

        <div className="feedback-card improvements-card">
          <div className="feedback-header">
            <TrendingUp size={18} className="feedback-icon text-warning" />
            <h4 className="feedback-title">Key Areas for Improvement</h4>
          </div>
          <ul className="feedback-bullet-list">
            {evaluation.improvements.map((imp, idx) => (
              <li key={idx}>{imp}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Preparation Areas */}
      {evaluation.recommendedPreparationAreas.length > 0 && (
        <div className="prep-recommendations-card">
          <div className="feedback-header">
            <BookOpen size={18} className="feedback-icon text-accent" />
            <h4 className="feedback-title">Recommended Preparation Focus</h4>
          </div>
          <div className="prep-tags-cluster">
            {evaluation.recommendedPreparationAreas.map((area, idx) => (
              <span key={idx} className="prep-focus-pill">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Turn-by-Turn Question Assessment Breakdown */}
      {evaluation.questionAssessments.length > 0 && (
        <div className="turn-breakdown-card">
          <h3 className="section-heading">Detailed Question & Answer Analysis</h3>
          <div className="turn-cards-list">
            {evaluation.questionAssessments.map((qa, idx) => (
              <div key={idx} className="turn-audit-box">
                <div className="audit-header">
                  <span className="audit-q-num">Question {qa.questionNumber || idx + 1}</span>
                  <span className="audit-score-pill">Score: {qa.score}/100</span>
                </div>

                <div className="audit-content-block">
                  <p className="audit-q-text">"{qa.questionText}"</p>
                  <div className="audit-candidate-reply">
                    <span className="reply-label">Your Response:</span>
                    <p className="reply-text">{qa.userAnswerText || '(No response captured)'}</p>
                  </div>
                </div>

                {qa.sampleModelAnswer && (
                  <div className="model-answer-block">
                    <span className="model-label">Model Exemplar Answer:</span>
                    <p className="model-text">{qa.sampleModelAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="report-bottom-actions">
        <Button
          variant="primary"
          size="lg"
          leftIcon={<RotateCcw size={16} />}
          onClick={onRetake}
        >
          Practice Another Interview
        </Button>
      </div>
    </div>
  );
};
