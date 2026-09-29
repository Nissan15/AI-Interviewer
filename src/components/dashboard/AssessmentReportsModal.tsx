import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShieldCheck,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { AssessmentReport } from "../../types/database";
import { assessmentService } from "../../services/assessments/assessmentService";
import { useAuth } from "../../hooks/useAuth";
import "./AssessmentReportsModal.css";

interface AssessmentReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssessmentReportsModal: React.FC<AssessmentReportsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    setLoading(true);

    const loadReports = async () => {
      try {
        const { data } = await assessmentService.getUserReports(user.id);
        if (isMounted) {
          setReports(data || []);
        }
      } catch (err) {
        console.warn("Failed to load user reports:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

  const filteredReports = reports.filter((r) => {
    if (activeTab === "all") return true;
    return r.assessment_type === activeTab;
  });

  const getScoreClass = (score: number) => {
    if (score >= 70) return "score-high";
    if (score >= 45) return "score-mid";
    return "score-low";
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "aptitude":
        return "type-aptitude";
      case "technical":
        return "type-technical";
      case "coding":
        return "type-coding";
      case "interview":
        return "type-interview";
      default:
        return "type-technical";
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReportId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="reports-modal-overlay" onClick={onClose}>
      <div
        className="reports-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="reports-modal-header">
          <div className="reports-modal-title-row">
            <Award size={20} className="text-accent" />
            <h3 className="reports-modal-title">My Assessment Reports</h3>
          </div>

          <button
            className="reports-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="reports-tabs-bar">
          <button
            className={`reports-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Reports ({reports.length})
          </button>
          <button
            className={`reports-tab-btn ${activeTab === "aptitude" ? "active" : ""}`}
            onClick={() => setActiveTab("aptitude")}
          >
            Aptitude (
            {reports.filter((r) => r.assessment_type === "aptitude").length})
          </button>
          <button
            className={`reports-tab-btn ${activeTab === "technical" ? "active" : ""}`}
            onClick={() => setActiveTab("technical")}
          >
            Technical (
            {reports.filter((r) => r.assessment_type === "technical").length})
          </button>
          <button
            className={`reports-tab-btn ${activeTab === "interview" ? "active" : ""}`}
            onClick={() => setActiveTab("interview")}
          >
            Interview (
            {reports.filter((r) => r.assessment_type === "interview").length})
          </button>
        </div>

        {/* Body */}
        <div className="reports-modal-body">
          {loading ? (
            <div className="reports-empty-box">
              <Sparkles size={28} className="animate-spin text-accent" />
              <p style={{ marginTop: "12px" }}>
                Querying isolated assessment reports...
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="reports-empty-box">
              <FileText size={36} />
              <h4
                style={{
                  margin: "12px 0 6px",
                  color: "var(--color-text-primary)",
                }}
              >
                No assessment reports in this category
              </h4>
              <p style={{ fontSize: "0.85rem", maxWidth: "380px" }}>
                Complete an aptitude test, technical quiz, or mock interview to
                have your detailed report stored here.
              </p>
            </div>
          ) : (
            <div className="reports-list-grid">
              {filteredReports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                const formattedDate = new Date(
                  report.created_at,
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={report.id} className="report-item-card">
                    <div className="report-card-top">
                      <div className="report-title-area">
                        <div className="report-badge-row">
                          <span
                            className={`report-type-badge ${getTypeBadgeClass(report.assessment_type)}`}
                          >
                            {report.assessment_type}
                          </span>
                          <span className="report-date-str">
                            {formattedDate}
                          </span>
                        </div>
                        <h4 className="report-card-title">{report.title}</h4>
                      </div>

                      <div className="report-score-box">
                        <span
                          className={`score-badge ${getScoreClass(Number(report.score))}`}
                        >
                          {report.score}%
                        </span>
                      </div>
                    </div>

                    <div className="report-card-metrics">
                      <div className="metric-col">
                        <span className="metric-lbl">Category</span>
                        <span className="metric-val">{report.category}</span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Questions</span>
                        <span className="metric-val">
                          {report.total_questions}
                        </span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Correct</span>
                        <span
                          className="metric-val"
                          style={{ color: "#10b981" }}
                        >
                          {report.correct_answers}
                        </span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Accuracy</span>
                        <span
                          className="metric-val"
                          style={{ color: "#818cf8" }}
                        >
                          {report.accuracy}%
                        </span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-lbl">Time Spent</span>
                        <span className="metric-val">
                          {Math.round(report.time_spent_seconds / 60)}m{" "}
                          {report.time_spent_seconds % 60}s
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => toggleExpand(report.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#818cf8",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details</span>
                            <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            <span>View Breakdown &amp; Details</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="report-details-drawer">
                        <div
                          style={{
                            marginBottom: "8px",
                            fontSize: "0.78rem",
                            color: "#94a3b8",
                          }}
                        >
                          Report ID: <code>{report.id}</code> | Stored For:{" "}
                          <code>{user?.email}</code>
                        </div>

                        {report.report_data && (
                          report.assessment_type === "interview" ? (
                            <div className="interview-modal-preview">
                              <div className="modal-rubric-mini-grid">
                                <div className="rubric-mini-pill">
                                  <span>Communication:</span>
                                  <strong>{((report.report_data as any).communicationScore ?? report.score)}%</strong>
                                </div>
                                <div className="rubric-mini-pill">
                                  <span>Technical Depth:</span>
                                  <strong>{((report.report_data as any).technicalScore ?? report.score)}%</strong>
                                </div>
                                <div className="rubric-mini-pill">
                                  <span>Confidence:</span>
                                  <strong>{((report.report_data as any).confidenceScore ?? 75)}%</strong>
                                </div>
                                <div className="rubric-mini-pill">
                                  <span>Problem Solving:</span>
                                  <strong>{((report.report_data as any).problemSolvingScore ?? 75)}%</strong>
                                </div>
                              </div>

                              {(report.report_data as any).overallFeedback && (
                                <p className="modal-feedback-quote">
                                  "{(report.report_data as any).overallFeedback}"
                                </p>
                              )}

                              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                                <button
                                  type="button"
                                  className="modal-view-full-btn"
                                  onClick={() => {
                                    onClose();
                                    navigate("/hr/history");
                                  }}
                                >
                                  Open in Interview History &amp; Full Report &rarr;
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <strong
                                style={{ fontSize: "0.82rem", color: "#f8fafc" }}
                              >
                                Detailed Session Data:
                              </strong>
                              <pre>
                                {JSON.stringify(report.report_data, null, 2)}
                              </pre>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
