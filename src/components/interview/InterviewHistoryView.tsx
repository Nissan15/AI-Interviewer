import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Sparkles,
  Search,
  ArrowRight,
  RotateCcw,
  Calendar,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { interviewService } from "../../services/interviews/interviewService";
import { InterviewHistoryItem } from "../../types/interview";
import { InterviewEvaluation } from "../../types/evaluation";
import { InterviewReportView } from "./InterviewReportView";
import { Button } from "../common/Button/Button";
import "./InterviewHistoryView.css";

interface InterviewHistoryViewProps {
  onStartNew?: () => void;
}

export const InterviewHistoryView: React.FC<InterviewHistoryViewProps> = ({
  onStartNew,
}) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<InterviewHistoryItem | null>(
    null,
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">(
    "newest",
  );

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadHistory = async () => {
      try {
        const { data } = await interviewService.getUserInterviewHistory(
          user.id,
        );
        if (isMounted) {
          // Strict user isolation guarantee: double-filter by authenticated user.id
          const isolated = (data || []).filter(
            (item) => item.userId === user.id,
          );
          setHistory(isolated);
        }
      } catch (err) {
        console.warn("Failed to load candidate interview history:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Aggregate Metrics computed exclusively for this authenticated user
  const metrics = useMemo(() => {
    if (history.length === 0) {
      return { total: 0, avgScore: 0, highestScore: 0, totalMinutes: 0 };
    }
    const total = history.length;
    const totalScore = history.reduce(
      (acc, h) => acc + (Number(h.overallScore) || 0),
      0,
    );
    const avgScore = Math.round(totalScore / total);
    const highestScore = Math.max(
      ...history.map((h) => Number(h.overallScore) || 0),
    );
    const totalSeconds = history.reduce(
      (acc, h) => acc + (Number(h.durationSeconds) || 0),
      0,
    );
    const totalMinutes = Math.round(totalSeconds / 60);

    return { total, avgScore, highestScore, totalMinutes };
  }, [history]);

  // Filter & Sort
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        // Track filter
        if (trackFilter !== "all") {
          const type = (item.interviewType || "").toLowerCase();
          if (!type.includes(trackFilter.toLowerCase())) return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (item.interviewType || "")
            .toLowerCase()
            .includes(q);
          const matchRole = (item.roleTarget || "").toLowerCase().includes(q);
          const matchFeedback = (item.overallFeedback || "")
            .toLowerCase()
            .includes(q);
          const matchDiff = (item.difficulty || "").toLowerCase().includes(q);
          if (!matchTitle && !matchRole && !matchFeedback && !matchDiff)
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "highest") {
          return (Number(b.overallScore) || 0) - (Number(a.overallScore) || 0);
        }
        if (sortBy === "lowest") {
          return (Number(a.overallScore) || 0) - (Number(b.overallScore) || 0);
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [history, trackFilter, searchQuery, sortBy]);

  // Map an InterviewHistoryItem to the rich InterviewEvaluation object for the detailed view
  const mapItemToEvaluation = (
    item: InterviewHistoryItem,
  ): InterviewEvaluation => {
    const rd = item.reportData || {};
    return {
      id: item.id,
      sessionId: item.sessionId || item.id,
      completedAt: item.createdAt,
      durationSeconds: item.durationSeconds,
      overallScore: item.overallScore,
      communicationScore: item.communicationScore,
      technicalScore: item.technicalScore,
      confidenceScore: item.confidenceScore,
      relevanceScore: item.relevanceScore,
      problemSolvingScore: item.problemSolvingScore,
      clarityScore: item.clarityScore,
      overallFeedback: item.overallFeedback,
      strengths:
        item.strengths?.length > 0
          ? item.strengths
          : ["Clear articulation and professional engagement"],
      improvements:
        item.improvements?.length > 0
          ? item.improvements
          : ["Provide concrete metrics and examples in technical explanations"],
      recommendedPreparationAreas:
        item.recommendedPreparationAreas ||
        rd.recommendedPreparationAreas ||
        [],
      questionAssessments:
        item.questionAssessments || rd.questionAssessments || [],
    };
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return "score-excellent";
    if (score >= 65) return "score-good";
    if (score >= 45) return "score-average";
    return "score-needs-work";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 85) return "Strong Hire";
    if (score >= 70) return "Hire / Solid";
    if (score >= 50) return "Borderline";
    return "Needs Preparation";
  };

  // If viewing a single full report drill-down
  if (selectedItem) {
    const evaluation = mapItemToEvaluation(selectedItem);
    return (
      <div className="interview-history-view-drilldown animate-fade-in">
        <InterviewReportView
          evaluation={evaluation}
          onRetake={() => {
            setSelectedItem(null);
            if (onStartNew) onStartNew();
          }}
          onBack={() => setSelectedItem(null)}
          backButtonLabel="Back to All Interview Reports"
        />
      </div>
    );
  }

  return (
    <div className="interview-history-view">
      {/* Aggregate Metrics Strip */}
      <div className="history-metrics-strip">
        <div className="metric-stat-card">
          <span className="metric-stat-label">Interviews Completed</span>
          <span className="metric-stat-value">{metrics.total}</span>
        </div>
        <div className="metric-stat-card">
          <span className="metric-stat-label">Average Readiness</span>
          <span className="metric-stat-value val-score">
            {metrics.avgScore}%
          </span>
        </div>
        <div className="metric-stat-card">
          <span className="metric-stat-label">Best Assessment</span>
          <span className="metric-stat-value val-high">
            {metrics.highestScore}%
          </span>
        </div>
        <div className="metric-stat-card">
          <span className="metric-stat-label">Practice Time</span>
          <span className="metric-stat-value">{metrics.totalMinutes}m</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="history-controls-bar">
        <div className="history-search-wrap">
          <Search size={16} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search by track, role target, or feedback keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="history-filter-group">
          <select
            className="history-select"
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
          >
            <option value="all">All Tracks &amp; Modules</option>
            <option value="technical">Technical HR</option>
            <option value="behavioral">Behavioral HR</option>
            <option value="general">General HR</option>
            <option value="resume">Resume-Based</option>
            <option value="mixed">Mixed Assessment</option>
          </select>

          <select
            className="history-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="highest">Sort: Highest Score</option>
            <option value="lowest">Sort: Lowest Score</option>
          </select>

          {onStartNew && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={onStartNew}
            >
              Start New Mock Interview
            </Button>
          )}
        </div>
      </div>

      {/* Cards List / Loading / Empty */}
      {loading ? (
        <div className="history-loading-box">
          <Sparkles size={28} className="animate-spin text-accent" />
          <p>Loading your private interview report history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="history-empty-box">
          <Users size={40} className="text-muted" />
          <h3 className="history-empty-title">
            {history.length === 0
              ? "No interview reports yet"
              : "No reports matched your filters"}
          </h3>
          <p className="history-empty-desc">
            {history.length === 0
              ? "Complete your first live AI mock interview to receive an in-depth readiness report, competency rubric scores, and tailored feedback."
              : "Try clearing your search query or switching your track filter to view your completed reports."}
          </p>
          {onStartNew && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles size={16} />}
              onClick={onStartNew}
              style={{ marginTop: "8px" }}
            >
              Start Your First Mock Interview
            </Button>
          )}
        </div>
      ) : (
        <div className="history-cards-container">
          {filteredHistory.map((item) => {
            const formattedDate = new Date(item.createdAt).toLocaleDateString(
              undefined,
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            const scoreClass = getScoreClass(item.overallScore);
            const durationMins = Math.round(item.durationSeconds / 60) || 15;
            const qCount =
              item.questionAssessments?.length ||
              item.exchanges?.length ||
              Number(item.reportData?.totalQuestions) ||
              "Multiple";

            return (
              <div key={item.id} className="history-item-card">
                {/* Top Row: Track & Score */}
                <div className="history-card-top">
                  <div className="history-card-title-group">
                    <div className="history-tags-row">
                      <span className="tag-badge badge-track">
                        {(item.interviewType || "General HR")
                          .toUpperCase()
                          .replace("_", " ")}
                      </span>
                      <span className="tag-badge badge-diff">
                        {(item.difficulty || "Intermediate").toUpperCase()}
                      </span>
                      <span className="history-date-text">
                        <Calendar size={12} />
                        {formattedDate}
                      </span>
                    </div>

                    <h4 className="history-interview-title">
                      AI Mock Interview:{" "}
                      {item.roleTarget ||
                        (item.interviewType || "General HR")
                          .replace("_", " ")
                          .toUpperCase()}
                    </h4>
                  </div>

                  <div className="history-score-display">
                    <div className={`score-circle-pill ${scoreClass}`}>
                      {item.overallScore}%
                    </div>
                    <span className="score-grade-caption">
                      {getScoreGrade(item.overallScore)}
                    </span>
                  </div>
                </div>

                {/* Rubric Breakdown Chips */}
                <div className="history-rubric-row">
                  <div className="rubric-chip">
                    <span className="chip-name">Communication:</span>
                    <span className="chip-score">
                      {item.communicationScore}%
                    </span>
                  </div>
                  <div className="rubric-chip">
                    <span className="chip-name">Technical Depth:</span>
                    <span className="chip-score">{item.technicalScore}%</span>
                  </div>
                  <div className="rubric-chip">
                    <span className="chip-name">Confidence:</span>
                    <span className="chip-score">{item.confidenceScore}%</span>
                  </div>
                  <div className="rubric-chip">
                    <span className="chip-name">Relevance:</span>
                    <span className="chip-score">{item.relevanceScore}%</span>
                  </div>
                  <div className="rubric-chip">
                    <span className="chip-name">Problem Solving:</span>
                    <span className="chip-score">
                      {item.problemSolvingScore}%
                    </span>
                  </div>
                </div>

                {/* Overall Feedback Snippet */}
                {item.overallFeedback && (
                  <p className="history-feedback-snippet">
                    "{item.overallFeedback}"
                  </p>
                )}

                {/* Card Footer with Meta and CTA */}
                <div className="history-card-footer">
                  <div className="history-card-meta-chips">
                    <span className="meta-chip-item">
                      <Clock size={13} />
                      {durationMins} minutes
                    </span>
                    <span>•</span>
                    <span className="meta-chip-item">
                      <CheckCircle2 size={13} />
                      {qCount} Questions Evaluated
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight size={14} />}
                    onClick={() => setSelectedItem(item)}
                  >
                    View Full Assessment Report
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
