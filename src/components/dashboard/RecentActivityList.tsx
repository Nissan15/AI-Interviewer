import React, { useState, useEffect } from 'react';
import { History, Sparkles, Brain, Code2, Users, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card/Card';
import { EmptyState } from '../common/EmptyState/EmptyState';
import { UserActivity } from '../../types/database';
import { activityService } from '../../services/activity/activityService';
import { useAuth } from '../../hooks/useAuth';
import './PerformanceEmptyState.css';

export const RecentActivityList: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchActivities = async () => {
      try {
        const { data } = await activityService.getUserActivities(user.id, 15);
        if (isMounted) {
          setActivities(data || []);
        }
      } catch (err) {
        console.warn('Failed to load user activities:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActivities();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment_completed':
        return <Brain size={16} />;
      case 'quiz_completed':
        return <CheckCircle2 size={16} />;
      case 'coding_submitted':
        return <Code2 size={16} />;
      case 'interview_completed':
      case 'interview_started':
        return <Users size={16} />;
      case 'resume_uploaded':
        return <FileText size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  const getBubbleClass = (type: string) => {
    switch (type) {
      case 'assessment_completed':
      case 'quiz_completed':
        return 'icon-bubble-assessment';
      case 'coding_submitted':
        return 'icon-bubble-coding';
      case 'interview_completed':
      case 'interview_started':
        return 'icon-bubble-interview';
      case 'resume_uploaded':
        return 'icon-bubble-resume';
      default:
        return 'icon-bubble-general';
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      variant="default"
      className="activity-card"
      header={
        <div className="section-header-row">
          <div className="section-title-wrap">
            <History size={18} className="header-icon" />
            <h3 className="section-title">Recent Activity</h3>
          </div>
          <span className="analytics-notice">
            {user ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                <ShieldCheck size={13} />
                <span>Isolated: {user.email?.split('@')[0]}</span>
              </span>
            ) : (
              'Live Session Log'
            )}
          </span>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Sparkles size={24} className="animate-spin text-accent" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.85rem' }}>Loading activity history...</p>
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No activity yet"
          description="Your test attempts, quiz submissions, and interview sessions will be recorded here once you begin."
          className="activity-empty"
        />
      ) : (
        <div className="activity-list-container">
          {activities.map((act) => (
            <div key={act.id} className="activity-item">
              <div className={`activity-icon-bubble ${getBubbleClass(act.activity_type)}`}>
                {getActivityIcon(act.activity_type)}
              </div>
              <div className="activity-body">
                <div className="activity-top-line">
                  <h4 className="activity-title">{act.title}</h4>
                  <span className="activity-time">{formatTimeAgo(act.created_at)}</span>
                </div>
                <p className="activity-desc">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
