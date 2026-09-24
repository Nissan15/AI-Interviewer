import React from 'react';
import { BarChart3, Award } from 'lucide-react';
import { Card } from '../common/Card/Card';
import { EmptyState } from '../common/EmptyState/EmptyState';
import './PerformanceEmptyState.css';

export const PerformanceEmptyState: React.FC = () => {
  return (
    <Card
      variant="default"
      className="performance-card"
      header={
        <div className="section-header-row">
          <div className="section-title-wrap">
            <Award size={18} className="header-icon" />
            <h3 className="section-title">Performance Analytics</h3>
          </div>
          <span className="analytics-notice">Awaiting Assessment Data</span>
        </div>
      }
    >
      <EmptyState
        icon={<BarChart3 size={28} />}
        title="No performance metrics yet"
        description="Complete your first assessment to see your performance across Technical, Aptitude, and HR domains."
        className="performance-empty"
      />
    </Card>
  );
};
