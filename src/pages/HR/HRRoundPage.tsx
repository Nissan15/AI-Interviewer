import React, { useState } from 'react';
import { Users, AlertTriangle, Sparkles, BrainCircuit } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { useInterview } from '../../context/InterviewContext';
import { InterviewConfig } from '../../types/interview';
import { ResumeUploader } from '../../components/hr/ResumeUploader';
import { ResumeParsedPreview } from '../../components/hr/ResumeParsedPreview';
import { InterviewConfigForm } from '../../components/hr/InterviewConfigForm';
import { LiveInterviewRoom } from '../../components/interview/LiveInterviewRoom';
import { InterviewReportView } from '../../components/interview/InterviewReportView';
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

      {startError && (
        <div className="start-error-alert">
          <AlertTriangle size={18} />
          <span>{startError}</span>
        </div>
      )}

      {/* Preparation Steps Grid */}
      <div className="hr-steps-layout">
        {/* Step 1: Candidate Resumé & AI Profile */}
        <div className="step-column">
          <div className="step-badge-label">Step 1: Candidate Profile & Resume</div>
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
    </div>
  );
};
