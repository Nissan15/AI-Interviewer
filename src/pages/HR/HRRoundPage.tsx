import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Sparkles, History, Bot } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useInterview } from '../../context/InterviewContext';
import { useAuth } from '../../hooks/useAuth';
import { InterviewConfig } from '../../types/interview';
import { ResumeUploader } from '../../components/hr/ResumeUploader';
import { ResumeParsedPreview } from '../../components/hr/ResumeParsedPreview';
import { InterviewConfigForm } from '../../components/hr/InterviewConfigForm';
import { LiveInterviewRoom } from '../../components/interview/LiveInterviewRoom';
import { InterviewReportView } from '../../components/interview/InterviewReportView';
import { InterviewReportsHistory } from '../../components/interview/InterviewReportsHistory';
import { assessmentService } from '../../services/assessments/assessmentService';
import './HRRoundPage.css';

export const HRRoundPage: React.FC = () => {
  const { resume, candidateProfile, clearResume } = useResume();
  const {
    session,
    status,
    latestEvaluation,
    startInterview,
    clearSession,
  } = useInterview();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'interview' | 'history'>('interview');
  const [storedReportsCount, setStoredReportsCount] = useState<number>(0);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  const userId = user ? user.id : 'guest_candidate';

  // Load count of past stored interview reports
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const { data } = await assessmentService.getUserReports(userId, 'interview');
        if (isMounted && data) {
          setStoredReportsCount(data.length);
        }
      } catch (err) {
        console.warn('Could not query interview reports count:', err);
      }
    };

    fetchCount();

    return () => {
      isMounted = false;
    };
  }, [userId, latestEvaluation]);

  const handleStartInterview = async (config: InterviewConfig) => {
    setStartError(null);
    setIsStarting(true);
    try {
      await startInterview(config);
    } catch (err: any) {
      setStartError(err.message || 'Failed to start interview.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRetake = () => {
    clearSession();
    setActiveTab('interview');
  };

  // If in an active interview session
  if (status === 'speaking' || status === 'listening' || status === 'evaluating' || status === 'connecting') {
    return (
      <div className="hr-round-page active-session-view">
        <LiveInterviewRoom onFinish={() => {}} />
      </div>
    );
  }

  // If session finished and report is ready
  if (latestEvaluation) {
    return (
      <div className="hr-round-page report-view">
        <InterviewReportView
          evaluation={latestEvaluation}
          onRetake={handleRetake}
          onViewHistory={() => {
            clearSession();
            setActiveTab('history');
          }}
          userEmail={user?.email}
          isSaved={true}
        />
      </div>
    );
  }

  return (
    <div className="hr-round-page animate-fade-in">
      <div className="hr-header-block">
        <div className="hr-header-title-row">
          <div className="hr-icon-badge">
            <Users size={24} />
          </div>
          <div>
            <h2 className="hr-page-title">AI Mock Interview Room</h2>
            <p className="hr-page-subtitle">
              Interactive placement interviews powered by continuous conversational speech, dynamic follow-ups, and adaptive difficulty.
            </p>
          </div>
        </div>

        <div className="ai-active-pill">
          <Sparkles size={14} className="text-accent" />
          <span>Internal AI Interview Engine Ready</span>
        </div>
      </div>

      {/* Mode Navigation Tabs: Conduct Interview vs Past Reports */}
      <div className="hr-mode-nav-tabs">
        <button
          type="button"
          className={`hr-nav-tab-btn ${activeTab === 'interview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('interview')}
        >
          <Bot size={16} />
          <span>Conduct AI Interview</span>
        </button>

        <button
          type="button"
          className={`hr-nav-tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>Past Reports &amp; History</span>
          {storedReportsCount > 0 && (
            <span className="tab-count-badge">{storedReportsCount}</span>
          )}
        </button>
      </div>

      {startError && (
        <div className="start-error-alert">
          <AlertTriangle size={18} />
          <span>{startError}</span>
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'history' ? (
        <InterviewReportsHistory onStartNewInterview={() => setActiveTab('interview')} />
      ) : (
        /* Preparation Steps Grid */
        <div className="hr-steps-layout">
          {/* Step 1: Candidate Resumé & AI Profile */}
          <div className="step-column">
            <div className="step-badge-label">Step 1: Candidate Profile &amp; Resume</div>
            {resume ? (
              <ResumeParsedPreview resume={resume} onClear={clearResume} />
            ) : (
              <ResumeUploader />
            )}
          </div>

          {/* Step 2: Interview Configuration */}
          <div className="step-column">
            <div className="step-badge-label">Step 2: Session Parameters</div>
            <InterviewConfigForm
              onStart={handleStartInterview}
              isStarting={isStarting}
              hasResume={Boolean(resume || candidateProfile)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
