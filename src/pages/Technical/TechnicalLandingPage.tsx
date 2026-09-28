import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code2, ArrowRight, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { Card } from '../../components/common/Card/Card';
import { Button } from '../../components/common/Button/Button';
import './TechnicalLandingPage.css';

export const TechnicalLandingPage: React.FC = () => {
  return (
    <div className="technical-landing animate-fade-in">
      <div className="tech-header">
        <h2 className="tech-title">Technical Assessment Hub</h2>
        <p className="tech-subtitle">
          Master computer science fundamentals and technical assessments with real-time evaluation.
        </p>
      </div>

      <div className="tech-options-grid single-option">
        {/* Technical Quiz */}
        <Card variant="interactive" className="tech-card">
          <div className="tech-card-icon-box quiz-theme">
            <BookOpen size={28} />
          </div>
          <div className="tech-card-content">
            <span className="tech-card-tag">Technical Assessment</span>
            <h3 className="tech-card-title">Technical Quiz</h3>
            <p className="tech-card-description">
              Timed multiple-choice assessments across Data Structures, Algorithms, DBMS, Operating Systems, Computer Networks, OOP, and AI/ML.
            </p>

            <ul className="tech-feature-list">
              <li>
                <CheckCircle2 size={16} className="feature-icon" />
                <span>Custom category selection & timed assessments</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feature-icon" />
                <span>Mark for review & interactive question navigation</span>
              </li>
              <li>
                <CheckCircle2 size={16} className="feature-icon" />
                <span>Comprehensive accuracy & time analytics</span>
              </li>
            </ul>

            <div className="tech-card-footer-action">
              <Link to="/technical/quiz">
                <Button variant="primary" rightIcon={<ArrowRight size={16} />}>
                  Enter Technical Quiz
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="tech-status-banner">
        <ShieldCheck size={20} className="status-banner-icon" />
        <div className="status-banner-text">
          <span className="banner-bold">Zero Hardcoded Sample Data Architecture</span>
          <span className="banner-sub">
            All assessments are wired to live backend contracts at <code>/api/technical/questions</code>.
          </span>
        </div>
      </div>
    </div>
  );
};
