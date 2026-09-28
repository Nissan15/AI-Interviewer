import React, { useState, useEffect } from 'react';
import { BarChart3, Award, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card/Card';
import { EmptyState } from '../common/EmptyState/EmptyState';
import { Button } from '../common/Button/Button';
import { assessmentService, UserPerformanceSummary } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
import { AssessmentReportsModal } from './AssessmentReportsModal';
import './PerformanceEmptyState.css';

export const PerformanceEmptyState: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<UserPerformanceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchSummary = async () => {
      try {
        const data = await assessmentService.getUserPerformanceSummary(user.id);
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        console.warn('Failed to load performance summary:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const hasData = summary && summary.totalAssessments > 0;

  return (
    <>
      <Card
        variant="default"
        className="performance-card"
        header={
          <div className="section-header-row">
            <div className="section-title-wrap">
              <Award size={18} className="header-icon" />
              <h3 className="section-title">Performance Analytics</h3>
            </div>
            <span className="analytics-notice">
              {hasData ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                  <ShieldCheck size={13} />
                  <span>{summary.totalAssessments} Reports Stored</span>
                </span>
              ) : (
                'Awaiting Assessment Data'
              )}
            </span>
          </div>
        }
      >
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '0.85rem' }}>Loading candidate analytics...</p>
          </div>
        ) : !hasData ? (
          <EmptyState
            icon={<BarChart3 size={28} />}
            title="No performance metrics yet"
            description="Complete your first assessment to see your performance across Technical, Aptitude, and HR domains."
            className="performance-empty"
          />
        ) : (
          <div className="performance-live-container">
            {/* Quick Metrics Grid */}
            <div className="perf-stats-grid">
              <div className="perf-stat-box">
                <span className="perf-stat-label">Assessments</span>
                <span className="perf-stat-num">{summary.totalAssessments}</span>
              </div>
              <div className="perf-stat-box">
                <span className="perf-stat-label">Avg Score</span>
                <span className="perf-stat-num" style={{ color: '#818cf8' }}>
                  {summary.averageScore}%
                </span>
              </div>
              <div className="perf-stat-box">
                <span className="perf-stat-label">Best Score</span>
                <span className="perf-stat-num" style={{ color: '#10b981' }}>
                  {summary.highestScore}%
                </span>
              </div>
              <div className="perf-stat-box">
                <span className="perf-stat-label">Time Spent</span>
                <span className="perf-stat-num">{summary.totalTimeSpentMinutes}m</span>
              </div>
            </div>

            {/* Domains Breakdown */}
            <div className="perf-domains-list">
              <div className="domain-bar-row">
                <div className="domain-bar-header">
                  <span className="domain-name">Quantitative &amp; Aptitude</span>
                  <span className="domain-score">{summary.aptitudeAverage || 0}%</span>
                </div>
                <div className="domain-bar-track">
                  <div
                    className="domain-bar-fill fill-aptitude"
                    style={{ width: `${Math.min(100, summary.aptitudeAverage || 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="domain-bar-row">
                <div className="domain-bar-header">
                  <span className="domain-name">Technical Questions</span>
                  <span className="domain-score">{summary.technicalAverage || 0}%</span>
                </div>
                <div className="domain-bar-track">
                  <div
                    className="domain-bar-fill fill-technical"
                    style={{ width: `${Math.min(100, summary.technicalAverage || 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="domain-bar-row">
                <div className="domain-bar-header">
                  <span className="domain-name">AI Mock Interview</span>
                  <span className="domain-score">{summary.interviewAverage || 0}%</span>
                </div>
                <div className="domain-bar-track">
                  <div
                    className="domain-bar-fill fill-interview"
                    style={{ width: `${Math.min(100, summary.interviewAverage || 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Footer with Report Modal Trigger and Isolation Safeguard */}
            <div className="perf-card-footer">
              <span className="isolation-verified-text">
                <ShieldCheck size={14} />
                <span>Zero cross-user data mingling</span>
              </span>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileSpreadsheet size={15} />}
                onClick={() => setIsReportsModalOpen(true)}
              >
                View Assessment Reports ({summary.totalAssessments})
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AssessmentReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </>
  );
};
