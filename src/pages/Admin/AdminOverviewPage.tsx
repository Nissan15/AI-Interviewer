import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Code2,
  CheckCircle2,
  FileCheck,
  FileText,
  Plus,
  Upload,
  ArrowRight,
  Database,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { AdminDashboardStats, Question, Test } from '../../types/admin';
import { adminStatsService } from '../../services/admin/adminStatsService';
import { questionService } from '../../services/admin/questionService';
import { testManagementService } from '../../services/admin/testManagementService';
import { Button } from '../../components/common/Button/Button';
import { QuestionModal } from '../../components/admin/QuestionModal';
import { BulkUploadModal } from '../../components/admin/BulkUploadModal';
import { TestModal } from '../../components/admin/TestModal';
import './AdminOverviewPage.css';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalAptitudeQuestions: 0,
    totalTechnicalQuestions: 0,
    activeQuestions: 0,
    publishedTests: 0,
    draftTests: 0,
    totalQuestions: 0,
    totalTests: 0,
  });

  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [recentTests, setRecentTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, qData, testsData] = await Promise.all([
        adminStatsService.getDashboardStats(),
        questionService.getQuestions(),
        testManagementService.getTests('all', 'all'),
      ]);

      setStats(statsData);
      setRecentQuestions(qData.data.slice(0, 5));
      setRecentTests(testsData.data.slice(0, 4));
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopySqlHint = () => {
    const hint = `-- Migration 010 SQL is stored in supabase/migrations/010_admin_question_management.sql`;
    navigator.clipboard.writeText(hint);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="admin-overview-container animate-fade-in">
      {/* 1. Primary Metrics Grid */}
      <div className="admin-metrics-grid">
        {/* Metric 1: Aptitude Questions */}
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Aptitude Questions</span>
            <div className="stat-icon-wrapper apt-icon">
              <Brain size={18} />
            </div>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.totalAptitudeQuestions}</div>
          <div className="stat-card-meta">
            Quantitative, Logical, Verbal &amp; Data Interpretation
          </div>
        </div>

        {/* Metric 2: Technical Questions */}
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Technical Questions</span>
            <div className="stat-icon-wrapper tech-icon">
              <Code2 size={18} />
            </div>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.totalTechnicalQuestions}</div>
          <div className="stat-card-meta">
            Python, Java, JS, SQL, React &amp; CS Core
          </div>
        </div>

        {/* Metric 3: Active Questions */}
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active Questions</span>
            <div className="stat-icon-wrapper active-icon">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-card-value text-success">
            {loading ? '...' : stats.activeQuestions}
          </div>
          <div className="stat-card-meta">
            Eligible for candidate tests &amp; practice
          </div>
        </div>

        {/* Metric 4: Published Tests */}
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Published Tests</span>
            <div className="stat-icon-wrapper pub-icon">
              <FileCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value text-accent">
            {loading ? '...' : stats.publishedTests}
          </div>
          <div className="stat-card-meta">
            Live and accessible to student accounts
          </div>
        </div>

        {/* Metric 5: Draft Tests */}
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Draft Tests</span>
            <div className="stat-icon-wrapper draft-icon">
              <FileText size={18} />
            </div>
          </div>
          <div className="stat-card-value text-muted">
            {loading ? '...' : stats.draftTests}
          </div>
          <div className="stat-card-meta">
            In creation &bull; Hidden from students
          </div>
        </div>
      </div>

      {/* 2. Quick Action Command Center */}
      <div className="admin-actions-bar">
        <div className="actions-bar-intro">
          <Sparkles size={16} className="text-accent" />
          <span className="actions-bar-title">Quick Administrative Actions:</span>
        </div>
        <div className="actions-bar-buttons">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsQuestionModalOpen(true)}
          >
            Add Question
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload size={14} />}
            onClick={() => setIsBulkModalOpen(true)}
          >
            Bulk Upload CSV / Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileCheck size={14} />}
            onClick={() => setIsTestModalOpen(true)}
          >
            Create New Test
          </Button>
        </div>
      </div>

      {/* 3. Split Two-Column Layout: Recent Questions & Recent Tests */}
      <div className="admin-split-grid">
        {/* Left: Recent Question Bank Activity */}
        <div className="admin-card-section">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Question Repository Overview</h3>
              <p className="section-card-subtitle">
                Recently author-managed questions across Aptitude and Technical disciplines
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/admin/questions')}
            >
              View Full Bank
            </Button>
          </div>

          <div className="recent-questions-list">
            {recentQuestions.length === 0 ? (
              <div className="empty-overview-hint">No questions in repository yet.</div>
            ) : (
              recentQuestions.map((q) => (
                <div key={q.id} className="recent-q-item">
                  <div className="recent-q-lead">
                    <span className={`q-type-badge ${q.type === 'aptitude' ? 'badge-apt' : 'badge-tech'}`}>
                      {q.type}
                    </span>
                    <span className={`q-diff-badge diff-${q.difficulty}`}>{q.difficulty}</span>
                    <span className={`q-status-badge ${q.active ? 'status-live' : 'status-hidden'}`}>
                      {q.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="recent-q-text">{q.question}</p>
                  <div className="recent-q-footer">
                    <span className="q-tag">{q.category}</span>
                    <span className="q-tag">{q.topic}</span>
                    <span className="q-ans-hint">Ans: {q.correct_answer}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Tests Management Overview */}
        <div className="admin-card-section">
          <div className="section-card-header">
            <div>
              <h3 className="section-card-title">Curated Placement Tests</h3>
              <p className="section-card-subtitle">
                Multi-question assessments packaged for student skill evaluations
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/admin/tests')}
            >
              Manage Tests
            </Button>
          </div>

          <div className="recent-tests-list">
            {recentTests.length === 0 ? (
              <div className="empty-overview-hint">No placement tests authored yet.</div>
            ) : (
              recentTests.map((t) => (
                <div key={t.id} className="recent-test-item">
                  <div className="recent-test-header">
                    <h4 className="recent-test-title">{t.title}</h4>
                    <span className={`test-status-pill status-${t.status}`}>{t.status}</span>
                  </div>
                  <p className="recent-test-desc">
                    {t.description || 'Standard timed placement assessment.'}
                  </p>
                  <div className="recent-test-meta">
                    <span className="test-meta-pill">
                      {t.type === 'aptitude' ? 'Aptitude' : 'Technical'}
                    </span>
                    <span className="test-meta-pill">{t.total_questions} Questions</span>
                    <span className="test-meta-pill">{t.duration_minutes} Mins</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Supabase Database & Security Status Card */}
      <div className="db-integration-card">
        <div className="db-card-icon">
          <Database size={22} className="text-accent" />
        </div>
        <div className="db-card-content">
          <h4 className="db-card-title">Database &amp; Row Level Security (RLS) Status</h4>
          <p className="db-card-desc">
            The platform enforces strict Supabase Row Level Security. Students can only query active
            questions and published assessments. Admin capabilities are protected at both the
            client routing level and PostgreSQL database policies.
          </p>
          <div className="db-migration-reference">
            <code>supabase/migrations/010_admin_question_management.sql</code>
            <button
              type="button"
              className="copy-sql-btn"
              onClick={handleCopySqlHint}
              title="Copy migration file reference"
            >
              {copiedSql ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copiedSql ? 'Copied' : 'Copy Path'}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSave={async (dto) => {
          await questionService.createQuestion(dto);
          await fetchDashboardData();
        }}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={async () => {
          await fetchDashboardData();
        }}
      />

      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSave={async (dto) => {
          await testManagementService.createTest(dto);
          await fetchDashboardData();
        }}
      />
    </div>
  );
};
