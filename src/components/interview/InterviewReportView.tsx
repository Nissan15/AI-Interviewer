import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  RotateCcw,
  ArrowLeft,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Target,
  FileText,
} from "lucide-react";
import { InterviewEvaluation, CompetencyEvaluation } from "../../types/evaluation";
import { ProgressBar } from "../common/ProgressBar/ProgressBar";
import { Button } from "../common/Button/Button";
import "./InterviewReportView.css";

interface InterviewReportViewProps {
  evaluation: InterviewEvaluation;
  onRetake: () => void;
  onBack?: () => void;
  backButtonLabel?: string;
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({
  evaluation,
  onRetake,
  onBack,
  backButtonLabel,
}) => {
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
  const [showAllCompetencies, setShowAllCompetencies] = useState<boolean>(false);

  const fallbackMetrics = [
    {
      label: "Communication",
      score: evaluation.communicationScore,
      color: "primary" as const,
    },
    {
      label: "Technical Depth",
      score: evaluation.technicalScore,
      color: "success" as const,
    },
    {
      label: "Confidence",
      score: evaluation.confidenceScore,
      color: "warning" as const,
    },
    {
      label: "Answer Relevance",
      score: evaluation.relevanceScore,
      color: "primary" as const,
    },
    {
      label: "Problem Solving",
      score: evaluation.problemSolvingScore,
      color: "success" as const,
    },
    {
      label: "Clarity & Structure",
      score: evaluation.clarityScore,
      color: "info" as const,
    },
  ];

  const toggleCompetency = (name: string) => {
    setExpandedCompetency((prev) => (prev === name ? null : name));
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 85) return "score-pill-excellent";
    if (score >= 70) return "score-pill-good";
    if (score >= 50) return "score-pill-average";
    return "score-pill-low";
  };

  const hasCompetencyBreakdown =
    evaluation.competencyBreakdown && evaluation.competencyBreakdown.length > 0;
  const hasStrongest =
    evaluation.strongestResponses && evaluation.strongestResponses.length > 0;
  const hasWeakest =
    evaluation.weakestResponses && evaluation.weakestResponses.length > 0;
  const hasPracticeQuestions =
    evaluation.suggestedPracticeQuestions &&
    evaluation.suggestedPracticeQuestions.length > 0;

  return (
    <div className="interview-report-view animate-fade-in">
      {onBack && (
        <div>
          <button
            type="button"
            className="report-back-btn"
            onClick={onBack}
            aria-label="Back to previous screen"
          >
            <ArrowLeft size={14} />
            <span>{backButtonLabel || "Back to Report History"}</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="report-header-card">
        <div className="report-header-left">
          <div className="report-trophy-icon">
            <Award size={32} />
          </div>
          <div className="report-title-block">
            <div className="report-badge-row">
              <span className="report-badge">Verified Qualitative HR Evaluation</span>
              {evaluation.starOverallRating && (
                <span className="star-rating-pill">
                  <Star size={11} className="fill-amber-400" />
                  {evaluation.starOverallRating}
                </span>
              )}
            </div>
            <h2 className="report-title">Interview Performance Assessment</h2>
            <div className="report-meta-row">
              <span>
                Duration: {Math.round(evaluation.durationSeconds / 60)} minutes
              </span>
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

      {/* Executive Summary Card */}
      {evaluation.overallFeedback && (
        <div className="exec-summary-card">
          <div className="feedback-header">
            <Sparkles size={18} className="feedback-icon text-accent" />
            <h3 className="feedback-title">Executive Hiring Board Summary</h3>
          </div>
          <p className="exec-summary-text">{evaluation.overallFeedback}</p>
        </div>
      )}

      {/* 12 Core Competencies Rubric */}
      <div className="rubric-card">
        <div className="rubric-header-row">
          <div>
            <h3 className="section-heading">Qualitative Competency Rubric</h3>
            <p className="section-subheading">
              Grounded evaluation of communication, behavioral maturity, and problem-solving depth.
            </p>
          </div>
          {hasCompetencyBreakdown && (
            <button
              type="button"
              className="toggle-all-btn"
              onClick={() => setShowAllCompetencies(!showAllCompetencies)}
            >
              {showAllCompetencies ? "Collapse All Details" : "Expand All Details"}
            </button>
          )}
        </div>

        {hasCompetencyBreakdown ? (
          <div className="competency-cards-grid">
            {evaluation.competencyBreakdown!.map((comp: CompetencyEvaluation) => {
              const isExpanded = showAllCompetencies || expandedCompetency === comp.name;
              return (
                <div
                  key={comp.name}
                  className={`competency-item-card ${isExpanded ? "expanded" : ""}`}
                >
                  <div
                    className="comp-card-top"
                    onClick={() => toggleCompetency(comp.name)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="comp-info">
                      <span className="comp-name">{comp.name}</span>
                      <span className={`comp-score-badge ${getScoreBadgeClass(comp.score)}`}>
                        {comp.score}/100
                      </span>
                    </div>

                    <div className="comp-bar-wrapper">
                      <div className="comp-mini-bar-bg">
                        <div
                          className="comp-mini-bar-fill"
                          style={{
                            width: `${comp.score}%`,
                            backgroundColor:
                              comp.score >= 85
                                ? "var(--success)"
                                : comp.score >= 70
                                ? "var(--accent)"
                                : "var(--warning)",
                          }}
                        />
                      </div>
                      <span className="comp-expand-icon">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Evidence quote always visible */}
                  {comp.evidence && (
                    <div className="comp-evidence-box">
                      <span className="evidence-label">Observed Evidence:</span>
                      <p className="evidence-quote">"{comp.evidence}"</p>
                    </div>
                  )}

                  {/* Expanded Drill-down: Strengths, Improvements, Recommendations */}
                  {isExpanded && (
                    <div className="comp-details-drawer animate-fade-in">
                      {comp.strengths && comp.strengths.length > 0 && (
                        <div className="comp-detail-subblock">
                          <span className="detail-subhead text-success">
                            <CheckCircle2 size={13} /> Strengths
                          </span>
                          <ul className="comp-bullet-list">
                            {comp.strengths.map((str, sIdx) => (
                              <li key={sIdx}>{str}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {comp.improvements && comp.improvements.length > 0 && (
                        <div className="comp-detail-subblock">
                          <span className="detail-subhead text-warning">
                            <TrendingUp size={13} /> Areas to Elevate
                          </span>
                          <ul className="comp-bullet-list">
                            {comp.improvements.map((imp, iIdx) => (
                              <li key={iIdx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {comp.recommendations && comp.recommendations.length > 0 && (
                        <div className="comp-detail-subblock">
                          <span className="detail-subhead text-accent">
                            <Target size={13} /> Actionable Recommendation
                          </span>
                          <ul className="comp-bullet-list">
                            {comp.recommendations.map((rec, rIdx) => (
                              <li key={rIdx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rubric-bars-grid">
            {fallbackMetrics.map((m) => (
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
        )}
      </div>

      {/* Strengths & Improvements Dual Grid */}
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

      {/* Qualitative Highlights: Strongest & Weakest Responses */}
      {(hasStrongest || hasWeakest) && (
        <div className="highlights-dual-grid">
          {hasStrongest && (
            <div className="highlight-card strongest-card">
              <div className="feedback-header">
                <ThumbsUp size={18} className="feedback-icon text-success" />
                <h4 className="feedback-title">Strongest Interview Responses</h4>
              </div>
              <div className="highlight-items-list">
                {evaluation.strongestResponses!.map((resp, idx) => (
                  <div key={idx} className="highlight-box">
                    <div className="highlight-box-top">
                      <span className="hl-q-pill">Question {resp.questionNumber}</span>
                      <span className="hl-score-pill success">{resp.score}/100</span>
                    </div>
                    <p className="hl-q-text">"{resp.questionText}"</p>
                    <blockquote className="hl-user-quote">
                      "{resp.userAnswerText}"
                    </blockquote>
                    <div className="hl-reason-box success">
                      <span className="reason-label">Why It Stood Out:</span>
                      <p className="reason-text">{resp.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasWeakest && (
            <div className="highlight-card weakest-card">
              <div className="feedback-header">
                <AlertCircle size={18} className="feedback-icon text-warning" />
                <h4 className="feedback-title">Key Growth Opportunities</h4>
              </div>
              <div className="highlight-items-list">
                {evaluation.weakestResponses!.map((resp, idx) => (
                  <div key={idx} className="highlight-box">
                    <div className="highlight-box-top">
                      <span className="hl-q-pill">Question {resp.questionNumber}</span>
                      <span className="hl-score-pill warning">{resp.score}/100</span>
                    </div>
                    <p className="hl-q-text">"{resp.questionText}"</p>
                    <blockquote className="hl-user-quote">
                      "{resp.userAnswerText}"
                    </blockquote>
                    <div className="hl-reason-box warning">
                      <span className="reason-label">What Was Missing & How to Elevate:</span>
                      <p className="reason-text">{resp.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested Practice Questions */}
      {hasPracticeQuestions && (
        <div className="practice-questions-card">
          <div className="feedback-header">
            <HelpCircle size={18} className="feedback-icon text-accent" />
            <div>
              <h4 className="feedback-title">Suggested Practice Questions</h4>
              <p className="practice-subtext">
                Targeted workplace scenarios to practice for upcoming company HR rounds.
              </p>
            </div>
          </div>
          <div className="practice-questions-list">
            {evaluation.suggestedPracticeQuestions!.map((q, idx) => (
              <div key={idx} className="practice-question-item">
                <span className="pq-number">{idx + 1}</span>
                <p className="pq-text">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <span className="audit-q-num">
                    Question {qa.questionNumber || idx + 1}
                  </span>
                  <span className="audit-score-pill">Score: {qa.score}/100</span>
                </div>

                <div className="audit-content-block">
                  <p className="audit-q-text">"{qa.questionText}"</p>
                  <div className="audit-candidate-reply">
                    <span className="reply-label">Your Response:</span>
                    <p className="reply-text">
                      {qa.userAnswerText || "(No response captured)"}
                    </p>
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
        {onBack && (
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<ArrowLeft size={16} />}
            onClick={onBack}
          >
            {backButtonLabel || "Back to Report History"}
          </Button>
        )}
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
