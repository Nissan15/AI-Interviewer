import React from 'react';
import {
  FileText,
  CheckCircle2,
  Trash2,
  Briefcase,
  GraduationCap,
  Cpu,
  Sparkles,
  ExternalLink,
  Target,
} from 'lucide-react';
import { ParsedResume } from '../../types/resume';
import { useResume } from '../../context/ResumeContext';
import { Badge } from '../common/Badge/Badge';
import { Button } from '../common/Button/Button';
import './ResumeParsedPreview.css';

interface ResumeParsedPreviewProps {
  resume: ParsedResume;
  onClear: () => void;
}

export const ResumeParsedPreview: React.FC<ResumeParsedPreviewProps> = ({ resume, onClear }) => {
  const { candidateProfile } = useResume();

  const strongSkills = candidateProfile?.skillAnalysis?.strongSkills || [];
  const intermediateSkills = candidateProfile?.skillAnalysis?.intermediateSkills || [];
  const skillsToImprove = candidateProfile?.skillAnalysis?.skillsToImprove || [];

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
                <CheckCircle2 size={12} /> AI Analyzed & Profile Ready
              </span>
            </div>
            {resume.candidateName && (
              <span className="candidate-name">Candidate: {resume.candidateName}</span>
            )}
            {resume.personalInfo && (
              <div className="contact-links-row">
                {resume.personalInfo.email && <span className="contact-link">{resume.personalInfo.email}</span>}
                {resume.personalInfo.linkedIn && (
                  <span className="contact-link">
                    <ExternalLink size={10} /> {resume.personalInfo.linkedIn}
                  </span>
                )}
                {resume.personalInfo.gitHub && (
                  <span className="contact-link">
                    <ExternalLink size={10} /> {resume.personalInfo.gitHub}
                  </span>
                )}
              </div>
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
        {/* Demonstrated Skill Profile */}
        {(strongSkills.length > 0 || intermediateSkills.length > 0 || resume.skills.length > 0) && (
          <div className="preview-section">
            <div className="preview-section-title">
              <Cpu size={14} /> Demonstrated Skill Profile
            </div>

            {strongSkills.length > 0 && (
              <div className="skill-evidence-block">
                <span className="skill-level-tag strong-tag">Strong Project Evidence</span>
                <div className="badges-cloud">
                  {strongSkills.map((s, idx) => (
                    <span key={`st_${idx}`} title={s.evidence}>
                      <Badge variant="success" size="sm">
                        {s.skill}
                      </Badge>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {intermediateSkills.length > 0 && (
              <div className="skill-evidence-block">
                <span className="skill-level-tag intermediate-tag">Intermediate Evidence</span>
                <div className="badges-cloud">
                  {intermediateSkills.map((s, idx) => (
                    <span key={`it_${idx}`} title={s.evidence}>
                      <Badge variant="primary" size="sm">
                        {s.skill}
                      </Badge>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skillsToImprove.length > 0 && (
              <div className="skill-evidence-block">
                <span className="skill-level-tag" style={{ color: '#f59e0b' }}>Growth Focus</span>
                <div className="badges-cloud">
                  {skillsToImprove.map((s, idx) => (
                    <span key={`imp_${idx}`} title={s.reason}>
                      <Badge variant="warning" size="sm">
                        {s.skill}
                      </Badge>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {strongSkills.length === 0 && intermediateSkills.length === 0 && (
              <div className="badges-cloud">
                {resume.skills.slice(0, 15).map((s, idx) => (
                  <Badge key={`sk_${idx}`} variant="primary" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detailed Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="preview-section">
            <div className="preview-section-title">
              <Briefcase size={14} /> Grounded Projects ({resume.projects.length})
            </div>
            <div className="preview-items-list">
              {resume.projects.map((p, idx) => (
                <div key={idx} className="preview-item-sub">
                  <div className="item-title-row">
                    <span className="item-name">{p.name}</span>
                    {p.technicalComplexity && (
                      <span className={`complexity-badge ${p.technicalComplexity}`}>
                        {p.technicalComplexity}
                      </span>
                    )}
                  </div>
                  {p.problemSolved && (
                    <p className="item-problem-desc">{p.problemSolved}</p>
                  )}
                  {p.technologies && p.technologies.length > 0 && (
                    <span className="item-tech">Stack: {p.technologies.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential Interview Topics & Technical Strengths */}
        {((candidateProfile?.technicalStrengths && candidateProfile.technicalStrengths.length > 0) ||
          (candidateProfile?.potentialInterviewTopics && candidateProfile.potentialInterviewTopics.length > 0)) && (
          <div className="preview-section">
            <div className="preview-section-title">
              <Target size={14} /> Targeted Interview Focus
            </div>
            <div className="preview-items-list">
              {candidateProfile.technicalStrengths?.slice(0, 3).map((st, idx) => (
                <div key={`st_${idx}`} className="focus-pill strength-pill">
                  <Sparkles size={12} className="text-accent" />
                  <span>{st}</span>
                </div>
              ))}
              {candidateProfile.potentialInterviewTopics?.slice(0, 3).map((top, idx) => (
                <div key={`top_${idx}`} className="focus-pill topic-pill">
                  <Target size={12} />
                  <span>{top}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Experience */}
        {(resume.education.length > 0 || resume.experience.length > 0) && (
          <div className="preview-section">
            <div className="preview-section-title">
              <GraduationCap size={14} /> Academic & Professional History
            </div>
            <div className="preview-items-list">
              {resume.education.map((ed, idx) => (
                <div key={`ed_${idx}`} className="preview-item-sub">
                  <span className="item-name">{ed.degree} - {ed.institution}</span>
                </div>
              ))}
              {resume.experience.map((exp, idx) => (
                <div key={`exp_${idx}`} className="preview-item-sub">
                  <span className="item-name">{exp.role} @ {exp.organization || (exp as any).company}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
