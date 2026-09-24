import React from 'react';
import { FileText, CheckCircle2, Trash2, Award, Briefcase, GraduationCap, Cpu } from 'lucide-react';
import { ParsedResume } from '../../types/resume';
import { Badge } from '../common/Badge/Badge';
import { Button } from '../common/Button/Button';
import './ResumeParsedPreview.css';

interface ResumeParsedPreviewProps {
  resume: ParsedResume;
  onClear: () => void;
}

export const ResumeParsedPreview: React.FC<ResumeParsedPreviewProps> = ({ resume, onClear }) => {
  return (
    <div className="resume-preview-card">
      <div className="preview-header">
        <div className="preview-title-box">
          <div className="file-avatar">
            <FileText size={20} />
          </div>
          <div className="file-info">
            <div className="candidate-name-row">
              <span className="file-name">{resume.fileName}</span>
              <span className="verified-badge">
                <CheckCircle2 size={12} /> Parsed & Ready
              </span>
            </div>
            {resume.candidateName && (
              <span className="candidate-name">Candidate: {resume.candidateName}</span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          onClick={onClear}
        >
          Remove
        </Button>
      </div>

      <div className="preview-grid">
        {/* Skills & Technologies */}
        {(resume.skills.length > 0 || resume.technologies.length > 0) && (
          <div className="preview-section">
            <div className="preview-section-title">
              <Cpu size={14} /> Skills & Technologies
            </div>
            <div className="badges-cloud">
              {resume.skills.map((s, idx) => (
                <Badge key={`sk_${idx}`} variant="primary" size="sm">{s}</Badge>
              ))}
              {resume.technologies.map((t, idx) => (
                <Badge key={`tc_${idx}`} variant="info" size="sm">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="preview-section">
            <div className="preview-section-title">
              <Briefcase size={14} /> Grounded Projects
            </div>
            <div className="preview-items-list">
              {resume.projects.map((p, idx) => (
                <div key={idx} className="preview-item-sub">
                  <span className="item-name">{p.name}</span>
                  {p.technologies && p.technologies.length > 0 && (
                    <span className="item-tech">({p.technologies.join(', ')})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Experience */}
        {(resume.education.length > 0 || resume.experience.length > 0) && (
          <div className="preview-section">
            <div className="preview-section-title">
              <GraduationCap size={14} /> Background
            </div>
            <div className="preview-items-list">
              {resume.education.map((ed, idx) => (
                <div key={`ed_${idx}`} className="preview-item-sub">
                  <span className="item-name">{ed.degree} - {ed.institution}</span>
                </div>
              ))}
              {resume.experience.map((exp, idx) => (
                <div key={`exp_${idx}`} className="preview-item-sub">
                  <span className="item-name">{exp.role} @ {exp.company}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
