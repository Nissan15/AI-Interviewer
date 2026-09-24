import React from 'react';
import { CodingProblem } from '../../../types/coding';
import { Badge } from '../../common/Badge/Badge';
import './ProblemStatement.css';

interface ProblemStatementProps {
  problem: CodingProblem;
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="success" size="sm">Easy</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case 'hard':
        return <Badge variant="error" size="sm">Hard</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{difficulty}</Badge>;
    }
  };

  return (
    <div className="problem-statement-pane">
      <div className="problem-header">
        <div className="problem-title-row">
          <h2 className="problem-title">{problem.title}</h2>
          {getDifficultyBadge(problem.difficulty)}
        </div>
        <span className="problem-category-badge">{problem.category}</span>
      </div>

      <div className="problem-section">
        <h4 className="section-label">Description</h4>
        <p className="problem-desc-text">{problem.description}</p>
      </div>

      <div className="problem-section">
        <h4 className="section-label">Input Format</h4>
        <p className="io-text">{problem.inputFormat}</p>
      </div>

      <div className="problem-section">
        <h4 className="section-label">Output Format</h4>
        <p className="io-text">{problem.outputFormat}</p>
      </div>

      {problem.constraints && problem.constraints.length > 0 && (
        <div className="problem-section">
          <h4 className="section-label">Constraints</h4>
          <ul className="constraints-list">
            {problem.constraints.map((c, idx) => (
              <li key={idx}><code>{c}</code></li>
            ))}
          </ul>
        </div>
      )}

      {problem.examples && problem.examples.length > 0 && (
        <div className="problem-section">
          <h4 className="section-label">Examples</h4>
          <div className="examples-container">
            {problem.examples.map((ex, idx) => (
              <div key={idx} className="example-box">
                <div className="example-num">Example {idx + 1}</div>
                <div className="io-block">
                  <span className="io-title">Input:</span>
                  <pre className="io-code">{ex.input}</pre>
                </div>
                <div className="io-block">
                  <span className="io-title">Output:</span>
                  <pre className="io-code">{ex.output}</pre>
                </div>
                {ex.explanation && (
                  <div className="io-block">
                    <span className="io-title">Explanation:</span>
                    <p className="io-explain">{ex.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
