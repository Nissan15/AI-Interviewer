import React, { useState, useEffect } from 'react';
import { Play, Send, Code, RefreshCw } from 'lucide-react';
import { CodingProblem, SupportedLanguage, CodeExecutionResponse } from '../../types/coding';
import { technicalApi } from '../../services/api/technicalApi';
import { ProblemStatement } from '../../components/technical/coding/ProblemStatement';
import { CodeEditor } from '../../components/technical/coding/CodeEditor';
import { LanguageSelector } from '../../components/technical/coding/LanguageSelector';
import { OutputConsole } from '../../components/technical/coding/OutputConsole';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingState } from '../../components/common/LoadingState/LoadingState';
import { Button } from '../../components/common/Button/Button';
import './CodingPage.css';

export const CodingPage: React.FC = () => {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      // ZERO SAMPLE DATA GUARANTEE: returns empty array [] initially
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

  const handleRunCode = async () => {
    if (!problems[currentProblemIndex]) return;
    setIsRunning(true);
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
        error: err.message || 'Sandbox execution error. Sandbox backend not reachable.',
        testCaseResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="coding-page animate-fade-in">
      {loading ? (
        <LoadingState
          message="Loading coding challenges..."
          subMessage="Connecting to /api/technical/coding"
        />
      ) : problems.length === 0 ? (
        /* Zero Sample Data Empty State */
        <EmptyState
          icon={<Code size={32} />}
          badge="Sandbox Ready"
          title="No coding problems available"
          description="There are currently no coding challenges available in the assessment repository. Connect your execution backend or question repository to practice algorithm problems."
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
                disabled={isRunning}
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
                  isLoading={isRunning}
                  onClick={handleRunCode}
                >
                  Submit
                </Button>
              </div>
            </div>

            <div className="editor-view-container">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={selectedLanguage}
                minHeight="380px"
              />
            </div>

            <div className="editor-console-container">
              <OutputConsole result={executionResult} isRunning={isRunning} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
