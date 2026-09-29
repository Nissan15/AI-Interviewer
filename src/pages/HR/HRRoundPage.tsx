import React, { useState, useEffect } from "react";
import { Users, AlertTriangle, Sparkles, FileText, Mic, History } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useResume } from "../../context/ResumeContext";
import { useInterview } from "../../context/InterviewContext";
import { useAuth } from "../../hooks/useAuth";
import { InterviewConfig } from "../../types/interview";
import { interviewService } from "../../services/interviews/interviewService";
import { ResumeUploader } from "../../components/hr/ResumeUploader";
import { ResumeParsedPreview } from "../../components/hr/ResumeParsedPreview";
import { InterviewConfigForm } from "../../components/hr/InterviewConfigForm";
import { LiveInterviewRoom } from "../../components/interview/LiveInterviewRoom";
import { InterviewReportView } from "../../components/interview/InterviewReportView";
import { InterviewHistoryView } from "../../components/interview/InterviewHistoryView";
import "./HRRoundPage.css";

interface HRRoundPageProps {
  defaultTab?: "new" | "history";
}

export const HRRoundPage: React.FC<HRRoundPageProps> = ({ defaultTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resume, candidateProfile, clearResume } = useResume();
  const { session, status, latestEvaluation, startInterview, clearSession } =
    useInterview();

  // Determine active tab based on defaultTab, URL pathname, or search query
  const isHistoryPath = location.pathname.includes("/history");
  const queryTab = new URLSearchParams(location.search).get("tab");
  const initialTab = defaultTab || (isHistoryPath || queryTab === "history" ? "history" : "new");

  const [activeTab, setActiveTab] = useState<"new" | "history">(initialTab);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Sync tab state when URL changes
  useEffect(() => {
    if (location.pathname.includes("/history")) {
      setActiveTab("history");
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  // Load history count for authenticated candidate (strictly user-isolated)
  useEffect(() => {
    if (!user) {
      setHistoryCount(0);
      return;
    }

    let isMounted = true;
    const fetchHistoryCount = async () => {
      try {
        const { data } = await interviewService.getUserInterviewHistory(user.id);
        if (isMounted && data) {
          setHistoryCount(data.length);
        }
      } catch (err) {
        console.warn("Failed to load interview history count:", err);
      }
    };

    fetchHistoryCount();

    return () => {
      isMounted = false;
    };
  }, [user, latestEvaluation]);

  const handleTabChange = (tab: "new" | "history") => {
    setActiveTab(tab);
    if (tab === "history") {
      navigate("/hr/history", { replace: true });
    } else {
      navigate("/hr", { replace: true });
    }
  };

  const handleStartInterview = async (config: InterviewConfig) => {
    setStartError(null);
    setIsStarting(true);
    try {
      await startInterview(config);
    } catch (err: any) {
      setStartError(err.message || "Failed to start interview.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleRetake = () => {
    clearSession();
    setActiveTab("new");
    navigate("/hr", { replace: true });
  };

  const handleViewAllHistory = () => {
    clearSession();
    setActiveTab("history");
    navigate("/hr/history", { replace: true });
  };

  // If in an active interview session
  if (
    status === "speaking" ||
    status === "listening" ||
    status === "evaluating" ||
    status === "connecting"
  ) {
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
          onBack={handleViewAllHistory}
          backButtonLabel="View All Past Reports"
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
              Interactive placement interviews powered by continuous
              conversational speech, dynamic follow-ups, and adaptive
              difficulty.
            </p>
          </div>
        </div>

        <div className="ai-active-pill">
          <Sparkles size={14} className="text-accent" />
          <span>AI Interview Engine</span>
        </div>
      </div>

      {/* Tab Switcher: Practice Session vs Report History */}
      <div className="hr-tab-switcher">
        <button
          type="button"
          className={`hr-tab-button ${activeTab === "new" ? "active" : ""}`}
          onClick={() => handleTabChange("new")}
        >
          <Mic size={15} />
          <span>Practice Mock Interview</span>
        </button>
        <button
          type="button"
          className={`hr-tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => handleTabChange("history")}
        >
          <History size={15} />
          <span>Interview Report History</span>
          {historyCount > 0 && (
            <span className="hr-tab-count-badge">{historyCount}</span>
          )}
        </button>
      </div>

      {startError && (
        <div className="start-error-alert">
          <AlertTriangle size={18} />
          <span>{startError}</span>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "history" ? (
        <InterviewHistoryView onStartNew={() => handleTabChange("new")} />
      ) : (
        /* Preparation Steps Grid */
        <div className="hr-steps-layout">
          {/* Step 1: Candidate Resumé & AI Profile */}
          <div className="step-column">
            <div className="step-badge-label">
              Step 1: Candidate Profile & Resume
            </div>
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

