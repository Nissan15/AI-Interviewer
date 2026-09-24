import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, AlertTriangle, ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useInterview } from '../../context/InterviewContext';
import { useSettings } from '../../context/SettingsContext';
import { InterviewConfig } from '../../types/interview';
import { ResumeUploader } from '../../components/hr/ResumeUploader';
import { ResumeParsedPreview } from '../../components/hr/ResumeParsedPreview';
import { InterviewConfigForm } from '../../components/hr/InterviewConfigForm';
import { LiveInterviewRoom } from '../../components/interview/LiveInterviewRoom';
import { InterviewReportView } from '../../components/interview/InterviewReportView';
import { Button } from '../../components/common/Button/Button';
import './HRRoundPage.css';

export const HRRoundPage: React.FC = () => {
  const { resume, clearResume } = useResume();
  const {
    session,
    status,
    latestEvaluation,
    startInterview,
    clearSession,
  } = useInterview();
  const { isAiConfigured } = useSettings();

  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

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
        <InterviewReportView evaluation={latestEvaluation} onRetake={handleRetake} />
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
            <h2 className="hr-page-title">AI HR Voice Interview</h2>
            <p className="hr-page-subtitle">
              Simulate realistic placement and corporate HR rounds with continuous speech-to-speech interaction.
            </p>
          </div>
        </div>
      </div>

      {/* AI Provider Configuration Warning Banner if unconfigured */}
      {!isAiConfigured && (
        <div className="ai-unconfigured-banner">
          <div className="unconfigured-left">
            <AlertTriangle size={20} className="banner-alert-icon" />
            <div>
              <span className="banner-title">AI Provider Not Configured</span>
              <p className="banner-desc">
                To activate AI resume analysis, voice questions, and evaluation scoring, configure your API key in Settings.
              </p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="secondary" size="sm" leftIcon={<SettingsIcon size={14} />}>
              Configure Provider
            </Button>
          </Link>
        </div>
      )}

      {startError && (
        <div className="start-error-alert">
          <AlertTriangle size={18} />
          <span>{startError}</span>
        </div>
      )}

      {/* Preparation Steps Grid */}
      <div className="hr-steps-layout">
        {/* Step 1: Resume Upload / Preview */}
        <div className="step-column">
          <div className="step-badge-label">Step 1: Candidate Resumé</div>
          {resume ? (
            <ResumeParsedPreview resume={resume} onClear={clearResume} />
          ) : (
            <ResumeUploader />
          )}
        </div>

        {/* Step 2: Interview Configuration */}
        <div className="step-column">
          <InterviewConfigForm
            onStart={handleStartInterview}
            isStarting={isStarting}
            hasResume={Boolean(resume)}
          />
        </div>
      </div>
    </div>
  );
};
