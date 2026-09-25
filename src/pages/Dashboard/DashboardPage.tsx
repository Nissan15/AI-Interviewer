import React from 'react';
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner';
import { CandidateProfileBanner } from '../../components/dashboard/CandidateProfileBanner';
import { PrepOverviewCard } from '../../components/dashboard/PrepOverviewCard';
import { PerformanceEmptyState } from '../../components/dashboard/PerformanceEmptyState';
import { RecentActivityList } from '../../components/dashboard/RecentActivityList';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page animate-fade-in">
      <WelcomeBanner />

      {/* AI Candidate Profile & Learning Highlights */}
      <section className="dashboard-section">
        <CandidateProfileBanner />
      </section>

      <section className="dashboard-section">
        <div className="section-title-bar">
          <h2 className="dashboard-h2">Preparation Modules</h2>
          <span className="section-hint">Select a module to practice assessments & mock interviews</span>
        </div>
        <PrepOverviewCard />
      </section>

      <section className="dashboard-grid-dual">
        <PerformanceEmptyState />
        <RecentActivityList />
      </section>
    </div>
  );
};
