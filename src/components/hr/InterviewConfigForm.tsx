import React, { useState } from 'react';
import { Settings2, Play, AlertCircle } from 'lucide-react';
import { InterviewType, InterviewDifficulty, InterviewConfig } from '../../types/interview';
import { Button } from '../common/Button/Button';
import './InterviewConfigForm.css';

interface InterviewConfigFormProps {
  onStart: (config: InterviewConfig) => void;
  isStarting: boolean;
  hasResume: boolean;
}

export const InterviewConfigForm: React.FC<InterviewConfigFormProps> = ({
  onStart,
  isStarting,
  hasResume,
}) => {
  const [interviewType, setInterviewType] = useState<InterviewType>(
    hasResume ? 'resume_based' : 'general_hr'
  );
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('intermediate');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [targetRole, setTargetRole] = useState<string>('');

  const types: Array<{ id: InterviewType; label: string; desc: string; requiresResume?: boolean }> = [
    {
      id: 'general_hr',
      label: 'General HR',
      desc: 'Behavioral, situational, culture-fit, and workplace communication questions.',
    },
    {
      id: 'technical_hr',
      label: 'Technical HR',
      desc: 'System design trade-offs, architecture leadership, and engineering ethics.',
    },
    {
      id: 'resume_based',
      label: 'Resume Based',
      desc: 'Direct deep-dive into your specific projects, tech stack, and achievements.',
      requiresResume: true,
    },
    {
      id: 'mixed',
      label: 'Mixed Comprehensive',
      desc: 'Holistic combination of introduction, resume deep dive, and behavioral scenarios.',
    },
  ];

  const difficulties: Array<{ id: InterviewDifficulty; label: string }> = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const durations = [10, 15, 20, 30];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      type: interviewType,
      difficulty,
      durationMinutes,
      roleTarget: targetRole.trim() || undefined,
    });
  };

  return (
    <form className="interview-config-card" onSubmit={handleSubmit}>
      <div className="config-header">
        <div className="config-title-wrap">
          <Settings2 size={18} className="config-icon" />
          <h3 className="config-title">Interview Configuration</h3>
        </div>
        <span className="config-step-tag">Step 2: Customize Session</span>
      </div>

      {/* Interview Type Selector */}
      <div className="config-field">
        <label className="field-label">Interview Type</label>
        <div className="type-options-grid">
          {types.map((t) => {
            const isSelected = interviewType === t.id;
            const isDisabled = t.requiresResume && !hasResume;
            return (
              <button
                key={t.id}
                type="button"
                className={`type-card-btn ${isSelected ? 'type-selected' : ''} ${isDisabled ? 'type-disabled' : ''}`}
                onClick={() => !isDisabled && setInterviewType(t.id)}
                disabled={isDisabled}
              >
                <div className="type-title-row">
                  <span className="type-title">{t.label}</span>
                  {t.requiresResume && !hasResume && (
                    <span className="resume-required-pill">Resume Needed</span>
                  )}
                </div>
                <p className="type-desc">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="config-dual-row">
        {/* Difficulty */}
        <div className="config-field">
          <label className="field-label">Difficulty Level</label>
          <div className="diff-pills-row">
            {difficulties.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`pill-btn ${difficulty === d.id ? 'pill-active' : ''}`}
                onClick={() => setDifficulty(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="config-field">
          <label className="field-label">Interview Duration</label>
          <div className="diff-pills-row">
            {durations.map((dur) => (
              <button
                key={dur}
                type="button"
                className={`pill-btn ${durationMinutes === dur ? 'pill-active' : ''}`}
                onClick={() => setDurationMinutes(dur)}
              >
                {dur} mins
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Role (Optional) */}
      <div className="config-field">
        <label className="field-label">Target Role / Designation (Optional)</label>
        <input
          type="text"
          className="role-input"
          placeholder="e.g. Full Stack Engineer, Cloud Architect, Product Manager"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />
      </div>

      {/* Action Footer */}
      <div className="config-footer-row">
        <div className="footer-notice">
          Live audio & speech recognition will initiate upon launch.
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isStarting}
          leftIcon={<Play size={18} />}
        >
          {isStarting ? 'Preparing Interview...' : 'Start Live Interview'}
        </Button>
      </div>
    </form>
  );
};
