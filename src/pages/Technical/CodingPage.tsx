import React, { useState, useEffect } from 'react';
import { Play, Send, Code, ShieldCheck } from 'lucide-react';
import { CodingProblem, SupportedLanguage, CodeExecutionResponse } from '../../types/coding';
import { technicalApi } from '../../services/api/technicalApi';
import { assessmentService } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
import { ProblemStatement } from '../../components/technical/coding/ProblemStatement';
import { CodeEditor } from '../../components/technical/coding/CodeEditor';
import { LanguageSelector } from '../../components/technical/coding/LanguageSelector';
import { OutputConsole } from '../../components/technical/coding/OutputConsole';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingState } from '../../components/common/LoadingState/LoadingState';
import { Button } from '../../components/common/Button/Button';
import './CodingPage.css';

export const CodingPage: React.FC = () => {
  const { user } = useAuth();

  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);
  const [reportSaved, setReportSaved] = useState<boolean>(false);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const data = await technicalApi.getCodingProblems();
      setProblems(data);
      if (data.length > 0) {
        setCurrentProblemIndex(0);
        setCode(data[0].starterCode[selectedLanguage] || '');
      }
    } catch (err) {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    if (problems[currentProblemIndex]) {
      setCode(problems[currentProblemIndex].starterCode[lang] || '');
    }
  };

  const handleSelectProblem = (index: number) => {
    setCurrentProblemIndex(index);
    setExecutionResult(null);
    setReportSaved(false);
    if (problems[index]) {
      setCode(problems[index].starterCode[selectedLanguage] || '');
    }
  };

  const handleRunCode = async () => {
    if (!problems[currentProblemIndex]) return;
    setIsRunning(true);
    setReportSaved(false);
    try {
      const res = await technicalApi.runCode(
        problems[currentProblemIndex].id,
        selectedLanguage,
        code
      );
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({
        status: 'compilation_error',
        totalTests: problems[currentProblemIndex].testCases.length,
        passedTests: 0,
        executionTimeMs: 0,
        error: err.message || 'Execution error in sandbox.',
        testCaseResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    const curProb = problems[currentProblemIndex];
    if (!curProb) return;

    setIsSubmitting(true);
    setReportSaved(false);

    try {
      const res = await technicalApi.runCode(
        curProb.id,
        selectedLanguage,
        code
      );
      setExecutionResult(res);

      if (user) {
        const total = res.totalTests || 1;
        const passed = res.passedTests || 0;
        const score = Math.round((passed / total) * 100);

        await assessmentService.saveAssessmentReport(user.id, {
          assessmentType: 'coding',
          title: `Coding Challenge: ${curProb.title}`,
          category: curProb.category || 'Algorithms',
          score,
          totalQuestions: total,
          correctAnswers: passed,
          incorrectAnswers: total - passed,
          accuracy: score,
          timeSpentSeconds: Math.round(res.executionTimeMs / 1000) || 45,
          reportData: {
            problemId: curProb.id,
            problemTitle: curProb.title,
            language: selectedLanguage,
            code,
            status: res.status,
            passedTests: passed,
            totalTests: total,
            completedAt: new Date().toISOString(),
          },
        });
        setReportSaved(true);
      }
    } catch (err: any) {
      setExecutionResult({
        status: 'runtime_error',
        totalTests: curProb.testCases.length,
        passedTests: 0,
        executionTimeMs: 0,
        error: err.message || 'Sandbox error',
        testCaseResults: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="coding-page animate-fade-in">
      {/* Problem Selection Navigation */}
      {problems.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}>
          {problems.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => handleSelectProblem(idx)}
              style={{
                background: idx === currentProblemIndex ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: idx === currentProblemIndex ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: idx === currentProblemIndex ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingState
          message="Loading coding challenges..."
          subMessage="Connecting to code sandbox"
        />
      ) : problems.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Code size={32} />}
          badge="Sandbox Ready"
          title="No coding problems available"
          description="There are currently no coding challenges available in the assessment repository."
          actionText="Refresh Challenges"
          onAction={fetchProblems}
        />
      ) : (
        /* Active Dual-Pane Coding Sandbox */
        <div className="coding-sandbox-split">
          {/* Left Pane: Problem Description */}
          <div className="problem-pane-col">
            <ProblemStatement problem={currentProblem} />
          </div>

          {/* Right Pane: Code Editor & Execution Output */}
          <div className="editor-pane-col">
            <div className="editor-top-bar">
              <LanguageSelector
                language={selectedLanguage}
                onChange={handleLanguageChange}
                disabled={isRunning || isSubmitting}
              />

              <div className="editor-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  isLoading={isRunning}
                  onClick={handleRunCode}
                >
                  Run Code
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Send size={14} />}
                  isLoading={isSubmitting}
                  onClick={handleSubmitCode}
                >
                  Submit
                </Button>
              </div>
            </div>

            {reportSaved && user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '10px',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
              }}>
                <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>
                  Coding report stored in database for: <strong>{user.email}</strong>
                </span>
              </div>
            )}

            <div className="editor-view-container">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={selectedLanguage}
                minHeight="380px"
              />
            </div>

            <div className="editor-console-container">
              <OutputConsole result={executionResult} isRunning={isRunning || isSubmitting} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
