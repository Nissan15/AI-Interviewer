import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { CodeExecutionResponse } from '../../../types/coding';
import './OutputConsole.css';

interface OutputConsoleProps {
  result: CodeExecutionResponse | null;
  isRunning: boolean;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({ result, isRunning }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const getStatusBadge = (status: CodeExecutionResponse['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="status-pill status-accepted">
            <CheckCircle2 size={14} /> Accepted
          </span>
        );
      case 'wrong_answer':
        return (
          <span className="status-pill status-failed">
            <XCircle size={14} /> Wrong Answer
          </span>
        );
      case 'compilation_error':
        return (
          <span className="status-pill status-error">
            <AlertTriangle size={14} /> Compilation Error
          </span>
        );
      case 'runtime_error':
        return (
          <span className="status-pill status-error">
            <AlertTriangle size={14} /> Runtime Error
          </span>
        );
      default:
        return (
          <span className="status-pill status-error">
            <Clock size={14} /> Time Limit Exceeded
          </span>
        );
    }
  };

  return (
    <div className="output-console">
      <div className="console-header">
        <span className="console-title">Execution Console</span>
        {result && (
          <div className="console-meta">
            {getStatusBadge(result.status)}
            <span className="execution-time">
              <Clock size={12} /> {result.executionTimeMs} ms
            </span>
            <span className="tests-passed">
              {result.passedTests}/{result.totalTests} Tests Passed
            </span>
          </div>
        )}
      </div>

      <div className="console-body">
        {isRunning ? (
          <div className="console-loading">
            <span className="console-spinner" />
            <span>Executing code in test sandbox...</span>
          </div>
        ) : !result ? (
          <div className="console-empty">
            Run your code or submit your solution to see test case results and diagnostics.
          </div>
        ) : result.error ? (
          <div className="console-error-view">
            <span className="error-badge">Diagnostics Error</span>
            <pre className="error-trace">{result.error}</pre>
          </div>
        ) : (
          <div className="test-cases-viewer">
            {/* Tabs for Test Cases */}
            <div className="test-tabs-bar">
              {result.testCaseResults.map((tc, idx) => (
                <button
                  key={tc.testCaseId || idx}
                  className={`test-tab-btn ${activeTab === idx ? 'tab-active' : ''} ${tc.passed ? 'tab-passed' : 'tab-failed'}`}
                  onClick={() => setActiveTab(idx)}
                >
                  <span className="tab-indicator" />
                  Case {idx + 1}
                </button>
              ))}
            </div>

            {/* Active Test Case Content */}
            {result.testCaseResults[activeTab] && (
              <div className="test-tab-content">
                <div className="io-group">
                  <span className="io-subtitle">Expected Output:</span>
                  <pre className="io-data">
                    {result.testCaseResults[activeTab].expectedOutput}
                  </pre>
                </div>
                <div className="io-group">
                  <span className="io-subtitle">Actual Output:</span>
                  <pre className={`io-data ${result.testCaseResults[activeTab].passed ? 'text-success' : 'text-error'}`}>
                    {result.testCaseResults[activeTab].actualOutput || '(No output)'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
