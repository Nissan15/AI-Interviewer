import React from 'react';
import { Bot, Sparkles, BrainCircuit, Target, TrendingUp, ShieldCheck } from 'lucide-react';
import './AuthBrandingPanel.css';

export const AuthBrandingPanel: React.FC = () => {
  return (
    <div className="auth-branding-panel">
      {/* Decorative ambient gradient backdrop */}
      <div className="branding-ambient-glow" />

      {/* Brand Header */}
      <div className="branding-header">
        <div className="branding-logo-box">
          <Bot size={24} className="branding-bot-icon" />
        </div>
        <div className="branding-title-group">
          <span className="branding-app-name">AI Mock Interviewer</span>
          <span className="branding-edition-tag">Enterprise SaaS</span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="branding-hero-content">
        <div className="branding-kicker">
          <Sparkles size={14} className="kicker-icon" />
          <span>Next-Generation Placement Prep</span>
        </div>
        <h1 className="branding-main-heading">
          Prepare Smarter.
          <br />
          <span className="gradient-text">Interview Better.</span>
        </h1>
        <p className="branding-description">
          Practice technical, aptitude, and HR interviews with an AI-powered platform designed to
          help you build confidence and become interview-ready.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="branding-features-list">
        <div className="branding-feature-item">
          <div className="feature-icon-wrapper">
            <BrainCircuit size={20} />
          </div>
          <div className="feature-text">
            <h3 className="feature-title">AI-Powered Interviews</h3>
            <p className="feature-desc">Experience realistic AI-driven interview conversations.</p>
          </div>
        </div>

        <div className="branding-feature-item">
          <div className="feature-icon-wrapper">
            <Target size={20} />
          </div>
          <div className="feature-text">
            <h3 className="feature-title">Smart Assessments</h3>
            <p className="feature-desc">
              Practice technical and aptitude questions in a structured environment.
            </p>
          </div>
        </div>

        <div className="branding-feature-item">
          <div className="feature-icon-wrapper">
            <TrendingUp size={20} />
          </div>
          <div className="feature-text">
            <h3 className="feature-title">Personalized Feedback</h3>
            <p className="feature-desc">
              Understand your strengths and improve your interview performance.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Security / Architecture Note */}
      <div className="branding-footer-badge">
        <ShieldCheck size={16} className="badge-shield-icon" />
        <span>Strict Zero Sample Data Guarantee & Encrypted Sessions</span>
      </div>
    </div>
  );
};
