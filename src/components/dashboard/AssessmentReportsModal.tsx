import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { AssessmentReport } from '../../types/database';
import { InterviewEvaluation } from '../../types/evaluation';
import { assessmentService } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
import { reconstructEvaluation } from '../interview/InterviewReportsHistory';
import { InterviewReportView } from '../interview/InterviewReportView';
import { Button } from '../common/Button/Button';
import './AssessmentReportsModal.css';

interface AssessmentReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssessmentReportsModal: React.FC<AssessmentReportsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<InterviewEvaluation | null>(null);

  const userId = user ? user.id : 'guest_candidate';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const loadReports = async () => {
      try {
        const { data } = await assessmentService.getUserReports(userId);
        if (isMounted) {
          setReports(data || []);
        }
      } catch (err) {
        console.warn('Failed to load user reports:', err);
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
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // If candidate clicked into full-fidelity interview report
  if (selectedEvaluation) {
    return (
      <div className="reports-modal-overlay" onClick={onClose}>
        <div
          className="reports-modal-container"
          style={{ maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => setSelectedEvaluation(null)}
            >
              Back to All Reports
            </Button>
            <button className="reports-modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <InterviewReportView
              evaluation={selectedEvaluation}
              onRetake={() => {
                setSelectedEvaluation(null);
                onClose();
              }}
              onBack={() => setSelectedEvaluation(null)}
              userEmail={user?.email}
              isSaved={true}
            />
          </div>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'all') return true;
    return r.assessment_type === activeTab;
  });

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'score-high';
    if (score >= 45) return 'score-mid';
    return 'score-low';
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'aptitude':
        return 'type-aptitude';
      case 'technical':
        return 'type-technical';
      case 'coding':
        return 'type-coding';
      case 'interview':
        return 'type-interview';
      default:
        return 'type-technical';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="reports-modal-overlay" onClick={onClose}>
      <div className="reports-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reports-modal-header">
          <div className="reports-modal-title-row">
            <Award size={20} className="text-accent" />
            <h3 className="reports-modal-title">My Assessment Reports</h3>
            {user && (
              <span className="reports-isolation-pill">
                <ShieldCheck size={14} />
                <span>Isolated to: {user.email}</span>
              </span>
            )}
          </div>

          <button className="reports-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="reports-tabs-bar">
          <button
            className={`reports-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Reports ({reports.length})
          </button>
          <button
            className={`reports-tab-btn ${activeTab === 'aptitude' ? 'active' : ''}`}
            onClick={() => setActiveTab('aptitude')}
          >
            Aptitude ({reports.filter((r) => r.assessment_type === 'aptitude').length})
          </button>
          <button
            className={`reports-tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            Technical ({reports.filter((r) => r.assessment_type === 'technical').length})
          </button>
          <button
            className={`reports-tab-btn ${activeTab === 'interview' ? 'active' : ''}`}
            onClick={() => setActiveTab('interview')}
          >
            Interview ({reports.filter((r) => r.assessment_type === 'interview').length})
          </button>
        </div>

        {/* Body */}
        <div className="reports-modal-body">
          {loading ? (
            <div className="reports-empty-box">
              <Sparkles size={28} className="animate-spin text-accent" />
              <p style={{ marginTop: '12px' }}>Querying isolated assessment reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="reports-empty-box">
              <FileText size={36} />
              <h4 style={{ margin: '12px 0 6px', color: 'var(--color-text-primary)' }}>
                No assessment reports in this category
              </h4>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                Complete an aptitude test, technical quiz, or mock interview to have your detailed report stored here.
              </p>
            </div>
          ) : (
            <div className="reports-list-grid">
              {filteredReports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                const data = (report.report_data as any) || {};
                const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={report.id} className="report-item-card">
                    <div className="report-card-top">
                      <div className="report-title-area">
                        <div className="report-badge-row">
                          <span className={`report-type-badge ${getTypeBadgeClass(report.assessment_type)}`}>
                            {report.assessment_type}
                          </span>
                          <span className="report-date-str">{formattedDate}</span>
                        </div>
                        <h4 className="report-card-title">{report.title}</h4>
                      </div>

                      <div className="report-score-box">
                        <span className={`score-badge ${getScoreClass(Number(report.score))}`}>
                          {report.score}%
                        </span>
                      </div>
                    </div>

                    <div className="report-card-metrics">
                      <div className="metric-col">
                        <span className="metric-lbl">Category</span>
                        <span className="metric-val">{report.category}</span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Questions</span>
                        <span className="metric-val">{report.total_questions}</span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Correct / Accuracy</span>
                        <span className="metric-val" style={{ color: '#10b981' }}>
                          {report.accuracy}%
                        </span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Time Spent</span>
                        <span className="metric-val">
                          {Math.round(report.time_spent_seconds / 60)}m {report.time_spent_seconds % 60}s
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {report.assessment_type === 'interview' && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvaluation(reconstructEvaluation(report))}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            color: '#a5b4fc',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          <span>Review Full Q&amp;A Analysis</span>
                          <ExternalLink size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(report.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#818cf8',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Summary</span>
                            <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            <span>View Summary</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="report-details-drawer">
                        <div style={{ marginBottom: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
                          Report ID: <code>{report.id}</code> | Stored In Database: <code>Yes</code>
                        </div>

                        {report.assessment_type === 'interview' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {data.overallFeedback && (
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.5)', padding: '10px 12px', borderRadius: '8px' }}>
                                "{data.overallFeedback}"
                              </p>
                            )}

                            {/* Competency Chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {data.communicationScore !== undefined && (
                                <span style={{ background: '#1e293b', border: '1px solid #334155', padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  Communication: <strong style={{ color: '#818cf8' }}>{data.communicationScore}%</strong>
                                </span>
                              )}
                              {data.technicalScore !== undefined && (
                                <span style={{ background: '#1e293b', border: '1px solid #334155', padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  Technical Depth: <strong style={{ color: '#10b981' }}>{data.technicalScore}%</strong>
                                </span>
                              )}
                              {data.confidenceScore !== undefined && (
                                <span style={{ background: '#1e293b', border: '1px solid #334155', padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  Confidence: <strong style={{ color: '#f59e0b' }}>{data.confidenceScore}%</strong>
                                </span>
                              )}
                              {data.relevanceScore !== undefined && (
                                <span style={{ background: '#1e293b', border: '1px solid #334155', padding: '4px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                  Relevance: <strong style={{ color: '#818cf8' }}>{data.relevanceScore}%</strong>
                                </span>
                              )}
                            </div>

                            {/* Strengths & Improvements */}
                            {data.strengths && (
                              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>
                                  <CheckCircle2 size={13} />
                                  <span>Demonstrated Strengths</span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                  {data.strengths.slice(0, 3).map((s: string, idx: number) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {data.improvements && (
                              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600, marginBottom: '4px' }}>
                                  <TrendingUp size={13} />
                                  <span>Areas for Improvement</span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                  {data.improvements.slice(0, 3).map((imp: string, idx: number) => (
                                    <li key={idx}>{imp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div style={{ marginTop: '8px' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<ExternalLink size={14} />}
                                onClick={() => setSelectedEvaluation(reconstructEvaluation(report))}
                              >
                                Open Complete Interview Report &amp; Transcript
                              </Button>
                            </div>
                          </div>
                        ) : (
                          report.report_data && (
                            <div>
                              <strong style={{ fontSize: '0.82rem', color: '#f8fafc' }}>Session Metadata:</strong>
                              <pre style={{ margin: '6px 0 0', fontSize: '0.78rem', background: '#0f172a', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
                                {JSON.stringify(report.report_data, null, 2)}
                              </pre>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
