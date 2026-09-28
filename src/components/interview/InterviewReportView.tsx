import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  RotateCcw,
  ShieldCheck,
  Download,
  History,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { InterviewEvaluation } from '../../types/evaluation';
import { ProgressBar } from '../common/ProgressBar/ProgressBar';
import { Button } from '../common/Button/Button';
import './InterviewReportView.css';

interface InterviewReportViewProps {
  evaluation: InterviewEvaluation;
  onRetake: () => void;
  onViewHistory?: () => void;
  onBack?: () => void;
  userEmail?: string;
  isSaved?: boolean;
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({
  evaluation,
  onRetake,
  onViewHistory,
  onBack,
  userEmail,
  isSaved = true,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const metrics = [
    { label: 'Communication', score: evaluation.communicationScore, color: 'primary' as const },
    { label: 'Technical Depth', score: evaluation.technicalScore, color: 'success' as const },
    { label: 'Confidence', score: evaluation.confidenceScore, color: 'warning' as const },
    { label: 'Answer Relevance', score: evaluation.relevanceScore, color: 'primary' as const },
    { label: 'Problem Solving', score: evaluation.problemSolvingScore || 75, color: 'success' as const },
    { label: 'Clarity & Structure', score: evaluation.clarityScore, color: 'info' as const },
  ];

  const handleExportText = () => {
    const lines = [
      `==================================================`,
      `AI MOCK INTERVIEW ASSESSMENT REPORT`,
      `==================================================`,
      `Session ID: ${evaluation.sessionId}`,
      `Completed: ${new Date(evaluation.completedAt || Date.now()).toLocaleString()}`,
      `Duration: ${Math.round(evaluation.durationSeconds / 60)} minutes`,
      `Overall Readiness Score: ${evaluation.overallScore} / 100`,
      ``,
      `--- CORE COMPETENCY RUBRIC ---`,
      `Communication: ${evaluation.communicationScore} / 100`,
      `Technical Depth: ${evaluation.technicalScore} / 100`,
      `Confidence: ${evaluation.confidenceScore} / 100`,
      `Answer Relevance: ${evaluation.relevanceScore} / 100`,
      `Problem Solving: ${evaluation.problemSolvingScore || 75} / 100`,
      `Clarity & Structure: ${evaluation.clarityScore} / 100`,
      ``,
      `--- OVERALL FEEDBACK ---`,
      evaluation.overallFeedback || 'Strong overall interview participation.',
      ``,
      `--- DEMONSTRATED STRENGTHS ---`,
      ...evaluation.strengths.map((s, i) => `${i + 1}. ${s}`),
      ``,
      `--- AREAS FOR IMPROVEMENT ---`,
      ...evaluation.improvements.map((imp, i) => `${i + 1}. ${imp}`),
      ``,
      `--- RECOMMENDED PREPARATION FOCUS ---`,
      ...((evaluation.recommendedPreparationAreas || []).map((area, i) => `${i + 1}. ${area}`)),
      ``,
      `--- QUESTION & ANSWER BREAKDOWN ---`,
      ...(evaluation.questionAssessments || []).map((qa, i) => {
        return [
          `\n[Question ${qa.questionNumber || i + 1}] (Score: ${qa.score}/100)`,
          `Q: "${qa.questionText}"`,
          `Your Answer: "${qa.userAnswerText || '(No response captured)'}"`,
          qa.sampleModelAnswer ? `Model Exemplar: "${qa.sampleModelAnswer}"` : '',
        ].filter(Boolean).join('\n');
      }),
      `\n==================================================`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${evaluation.sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summary = `AI Mock Interview Assessment\nOverall Score: ${evaluation.overallScore}/100\nCommunication: ${evaluation.communicationScore}%\nTechnical: ${evaluation.technicalScore}%\nFeedback: ${evaluation.overallFeedback}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="interview-report-view animate-fade-in">
      {/* Optional Top Back Action if reviewing from history */}
      {onBack && (
        <div style={{ marginBottom: '16px' }}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={onBack}
          >
            Back to Reports List
          </Button>
        </div>
      )}

      {/* Storage & Candidate Isolation Confirmation Banner */}
      {isSaved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '20px',
            fontSize: '0.88rem',
            color: 'var(--color-text-primary, #f8fafc)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>
              <strong>Report Stored Successfully:</strong> Saved to candidate records and isolated to your profile. Accessible for review at any time.
              {userEmail && (
                <span style={{ marginLeft: '6px', color: '#a5b4fc', fontSize: '0.82rem' }}>
                  ({userEmail})
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExportText}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Share2 size={14} />}
              onClick={handleCopySummary}
            >
              {copied ? 'Copied!' : 'Copy Summary'}
            </Button>
          </div>
        </div>
      )}

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
              <span>Duration: {Math.max(1, Math.round(evaluation.durationSeconds / 60))} minutes</span>
              <span>•</span>
              <span>Session ID: {evaluation.sessionId}</span>
              {evaluation.completedAt && (
                <>
                  <span>•</span>
                  <span>{new Date(evaluation.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </>
              )}
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
      {evaluation.recommendedPreparationAreas && evaluation.recommendedPreparationAreas.length > 0 && (
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
      {evaluation.questionAssessments && evaluation.questionAssessments.length > 0 && (
        <div className="turn-breakdown-card">
          <h3 className="section-heading">Detailed Question &amp; Answer Analysis</h3>
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

        {onViewHistory && (
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<History size={16} />}
            onClick={onViewHistory}
          >
            View All Stored Reports
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          leftIcon={<Download size={16} />}
          onClick={handleExportText}
        >
          Export Report (.txt)
        </Button>
      </div>
    </div>
  );
};
