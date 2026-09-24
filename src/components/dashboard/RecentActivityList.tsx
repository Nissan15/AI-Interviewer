import React from 'react';
import { History, Sparkles } from 'lucide-react';
import { Card } from '../common/Card/Card';
import { EmptyState } from '../common/EmptyState/EmptyState';
import './PerformanceEmptyState.css';

export const RecentActivityList: React.FC = () => {
  // STRICT ZERO SAMPLE DATA: empty array initially
  const activities: any[] = [];

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
          <span className="analytics-notice">Live Session Log</span>
        </div>
      }
    >
      {activities.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No activity yet"
          description="Your test attempts, coding submissions, and interview sessions will be recorded here once you begin."
          className="activity-empty"
        />
      ) : (
        <div className="activity-list">
          {/* Real activity list item rendering when available */}
        </div>
      )}
    </Card>
  );
};
