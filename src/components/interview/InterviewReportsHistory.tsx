import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { AssessmentReport } from '../../types/database';
import { InterviewEvaluation } from '../../types/evaluation';
import { assessmentService } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
import { InterviewReportView } from './InterviewReportView';
import { Button } from '../common/Button/Button';
import './InterviewReportsHistory.css';

interface InterviewReportsHistoryProps {
  onStartNewInterview?: () => void;
}

export function reconstructEvaluation(report: AssessmentReport): InterviewEvaluation {
  const data = (report.report_data as any) || {};

  return {
    id: report.id,
    sessionId: data.sessionId || report.id,
    completedAt: data.completedAt || report.created_at,
    durationSeconds: data.durationSeconds || report.time_spent_seconds || 900,
    overallScore: Number(report.score) || data.overallScore || 0,
    communicationScore: data.communicationScore ?? Number(report.score) ?? 75,
    technicalScore: data.technicalScore ?? Number(report.score) ?? 70,
    confidenceScore: data.confidenceScore ?? 75,
    relevanceScore: data.relevanceScore ?? 80,
    problemSolvingScore: data.problemSolvingScore ?? 75,
    clarityScore: data.clarityScore ?? 75,
    overallFeedback:
      data.overallFeedback ||
      'Candidate completed the mock interview assessment. Detailed competency rubric and breakdown stored below.',
    strengths:
      data.strengths && data.strengths.length > 0
        ? data.strengths
        : ['Structured responses well', 'Maintained good professional pacing'],
    improvements:
      data.improvements && data.improvements.length > 0
        ? data.improvements
        : ['Elaborate with specific measurable outcomes (STAR method)'],
    recommendedPreparationAreas:
      data.recommendedPreparationAreas || ['System Trade-offs', 'Behavioral STAR Scenarios'],
    questionAssessments:
      data.questionAssessments && data.questionAssessments.length > 0
        ? data.questionAssessments
        : data.exchanges
        ? data.exchanges.map((ex: any, idx: number) => ({
            questionNumber: ex.questionNumber || idx + 1,
            questionText: ex.questionText || `Interview Question ${idx + 1}`,
            userAnswerText: ex.userAnswerText || '(No response captured)',
            score: Math.round(Number(report.score)) || 75,
            strengths: ['Provided clear direct response'],
            improvements: ['Can include more technical examples'],
            sampleModelAnswer: ex.sampleModelAnswer || undefined,
          }))
        : [],
  };
}

export const InterviewReportsHistory: React.FC<InterviewReportsHistoryProps> = ({
  onStartNewInterview,
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);

  const userId = user ? user.id : 'guest_candidate';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadReports = async () => {
      try {
        const { data } = await assessmentService.getUserReports(userId, 'interview');
        if (isMounted) {
          setReports(data || []);
        }
      } catch (err) {
        console.warn('Failed to load past interview reports:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // If a report is selected for in-depth review
  if (selectedReport) {
    const evaluation = reconstructEvaluation(selectedReport);
    return (
      <div className="interview-history-view animate-fade-in">
        <InterviewReportView
          evaluation={evaluation}
          onRetake={onStartNewInterview || (() => setSelectedReport(null))}
          onBack={() => setSelectedReport(null)}
          userEmail={user?.email}
          isSaved={true}
        />
      </div>
    );
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
  };

  const totalReports = reports.length;
  const avgScore =
    totalReports > 0
      ? Math.round(reports.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / totalReports)
      : 0;
  const bestScore =
    totalReports > 0 ? Math.max(...reports.map((r) => Number(r.score) || 0)) : 0;
  const totalMins =
    totalReports > 0
      ? Math.round(reports.reduce((acc, r) => acc + (Number(r.time_spent_seconds) || 0), 0) / 60)
      : 0;

  return (
    <div className="interview-history-container animate-fade-in">
      {/* Top Banner */}
      <div className="history-header-card">
        <div className="history-header-left">
          <div className="history-icon-badge">
            <Award size={24} />
          </div>
          <div>
            <h3 className="history-title">Stored HR Interview Reports</h3>
            <p className="history-sub">
              Review your complete interview evaluations, competency rubrics, and turn-by-turn question analyses anytime.
            </p>
          </div>
        </div>

        {user && (
          <div className="history-user-pill">
            <ShieldCheck size={14} />
            <span>Partitioned: {user.email}</span>
          </div>
        )}
      </div>

      {/* Aggregate Metrics Bar */}
      {totalReports > 0 && (
        <div className="history-stats-bar">
          <div className="stat-pill-box">
            <span className="stat-pill-label">Total Interviews</span>
            <span className="stat-pill-val">{totalReports}</span>
          </div>
          <div className="stat-pill-box">
            <span className="stat-pill-label">Average Score</span>
            <span className="stat-pill-val text-accent">{avgScore}%</span>
          </div>
          <div className="stat-pill-box">
            <span className="stat-pill-label">Best Performance</span>
            <span className="stat-pill-val text-success">{bestScore}%</span>
          </div>
          <div className="stat-pill-box">
            <span className="stat-pill-label">Practice Time</span>
            <span className="stat-pill-val">{totalMins} mins</span>
          </div>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="history-loading-box">
          <Sparkles size={28} className="animate-spin text-accent" />
          <p style={{ marginTop: '12px', color: 'var(--color-text-muted)' }}>
            Retrieving candidate interview records...
          </p>
        </div>
      ) : totalReports === 0 ? (
        <div className="history-empty-card">
          <FileText size={48} className="empty-icon" />
          <h4 className="empty-title">No Stored Interview Reports Yet</h4>
          <p className="empty-desc">
            Complete your first AI mock interview session. Your speech responses, scoring rubrics, and detailed feedback will be permanently saved here for review at any time.
          </p>
          {onStartNewInterview && (
            <div style={{ marginTop: '20px' }}>
              <Button
                variant="primary"
                size="md"
                leftIcon={<RotateCcw size={16} />}
                onClick={onStartNewInterview}
              >
                Launch Your First Interview
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="history-cards-grid">
          {reports.map((report) => {
            const data = (report.report_data as any) || {};
            const dateStr = new Date(report.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const minutes = Math.max(1, Math.round((report.time_spent_seconds || 900) / 60));

            return (
              <div key={report.id} className="history-report-card">
                <div className="report-card-header">
                  <div className="header-meta">
                    <span className="interview-type-tag">
                      {report.category || 'HR Round'}
                    </span>
                    <span className="report-date-tag">
                      <Calendar size={12} /> {dateStr}
                    </span>
                  </div>

                  <div className={`score-badge ${getScoreBadgeClass(Number(report.score))}`}>
                    {report.score}%
                  </div>
                </div>

                <h4 className="report-card-heading">{report.title}</h4>

                {data.roleTarget && (
                  <div className="role-target-chip">
                    <span>Target Role: <strong>{data.roleTarget}</strong></span>
                  </div>
                )}

                <div className="report-metrics-row">
                  <div className="m-item">
                    <Clock size={13} />
                    <span>{minutes} mins</span>
                  </div>
                  <div className="m-item">
                    <CheckCircle2 size={13} />
                    <span>{report.total_questions || data.questionAssessments?.length || 1} questions</span>
                  </div>
                  {data.communicationScore && (
                    <div className="m-item">
                      <TrendingUp size={13} />
                      <span>Comm: {data.communicationScore}%</span>
                    </div>
                  )}
                  {data.technicalScore && (
                    <div className="m-item">
                      <Sparkles size={13} />
                      <span>Tech: {data.technicalScore}%</span>
                    </div>
                  )}
                </div>

                {data.overallFeedback && (
                  <p className="report-quick-feedback">
                    "{data.overallFeedback.length > 130 ? data.overallFeedback.substring(0, 130) + '...' : data.overallFeedback}"
                  </p>
                )}

                <div className="card-footer-action">
                  <span className="report-stored-tag">
                    <ShieldCheck size={12} /> Stored in DB
                  </span>

                  <button
                    type="button"
                    className="review-btn"
                    onClick={() => setSelectedReport(report)}
                  >
                    <span>Review Full Report</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
