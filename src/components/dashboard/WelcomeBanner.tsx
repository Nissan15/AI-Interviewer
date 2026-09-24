import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button/Button';
import './WelcomeBanner.css';

export const WelcomeBanner: React.FC = () => {
  return (
    <div className="welcome-banner">
      <div className="welcome-banner-glow" />
      <div className="welcome-content">
        <div className="welcome-tag">
          <Sparkles size={14} />
          <span>Next-Gen Placement Preparation</span>
        </div>
        <h2 className="welcome-title">Welcome to AI Mock Interviewer</h2>
        <p className="welcome-subtitle">
          Practice technical quiz assessments, interactive coding challenges, aptitude tests, and
          live AI-driven HR voice interviews in a realistic enterprise environment.
        </p>
        <div className="welcome-actions">
          <Link to="/hr">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight size={16} />}
            >
              Start AI HR Interview
            </Button>
          </Link>
          <Link to="/technical">
            <Button variant="secondary" size="md">
              Explore Technical Tests
            </Button>
          </Link>
        </div>
      </div>
      <div className="welcome-badge-col">
        <div className="banner-metric-pill">
          <ShieldCheck size={18} className="pill-icon" />
          <div className="pill-text">
            <span className="pill-title">Zero Sample Data Guarantee</span>
            <span className="pill-desc">Real APIs & Speech Pipeline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
