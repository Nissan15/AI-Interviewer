import React, { useState } from 'react';
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
  Mail,
  Phone,
  Layers,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Database,
  Server,
  Layout,
  Cloud,
  Terminal,
  Code2,
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

type TabType = 'all' | 'skills' | 'projects' | 'education' | 'experience' | 'overview';

export const ResumeParsedPreview: React.FC<ResumeParsedPreviewProps> = ({ resume, onClear }) => {
  const { candidateProfile } = useResume();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});

  const toggleProjectExpand = (idx: number) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Harmonize data between candidateProfile and parsedResume
  const candidateName = candidateProfile?.candidateName || resume.candidateName || resume.personalInfo?.name || 'Candidate';
  const summary = candidateProfile?.summary || resume.summary || '';
  const email = candidateProfile?.personalInfo?.email || resume.personalInfo?.email || resume.email;
  const phone = candidateProfile?.personalInfo?.phone || resume.personalInfo?.phone || resume.phone;
  const linkedIn = candidateProfile?.personalInfo?.linkedIn || resume.personalInfo?.linkedIn;
  const gitHub = candidateProfile?.personalInfo?.gitHub || resume.personalInfo?.gitHub;
  const portfolio = candidateProfile?.personalInfo?.portfolio || resume.personalInfo?.portfolio;

  const categorizedSkills = candidateProfile?.skills || resume.categorizedSkills || {
    programmingLanguages: [],
    frontend: [],
    backend: [],
    databases: [],
    cloud: [],
    aiMl: [],
    frameworks: [],
    tools: [],
    otherTechnologies: [],
  };

  const skillsList = resume.skills?.length > 0 ? resume.skills : Object.values(categorizedSkills).flat();
  const projects = candidateProfile?.projects?.length ? candidateProfile.projects : resume.projects || [];
  const education = candidateProfile?.education?.length ? candidateProfile.education : resume.education || [];
  const experience = candidateProfile?.experience?.length ? candidateProfile.experience : resume.experience || [];
  const certifications = candidateProfile?.certifications?.length ? candidateProfile.certifications : resume.certifications || [];

  const strongSkills = candidateProfile?.skillAnalysis?.strongSkills || [];
  const intermediateSkills = candidateProfile?.skillAnalysis?.intermediateSkills || [];
  const skillsToImprove = candidateProfile?.skillAnalysis?.skillsToImprove || [];
  const recommendedSkills = candidateProfile?.skillAnalysis?.recommendedSkills || [];

  const technicalStrengths = candidateProfile?.technicalStrengths || resume.technicalStrengths || [];
  const weakAreas = candidateProfile?.weakAreas || resume.weakAreas || [];
  const potentialTopics = candidateProfile?.potentialInterviewTopics || resume.potentialInterviewTopics || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="resume-dossier-card">
      {/* 1. Header Banner */}
      <div className="dossier-header">
        <div className="dossier-profile-row">
          <div className="candidate-avatar-badge">
            {getInitials(candidateName) || <FileText size={20} />}
          </div>

          <div className="dossier-title-meta">
            <div className="title-verified-line">
              <h3 className="dossier-candidate-name">{candidateName}</h3>
              <span className="verified-status-tag">
                <CheckCircle2 size={12} /> AI Analyzed & Verified
              </span>
            </div>

            <div className="dossier-meta-subtitle">
              <span className="file-origin-badge">
                <FileText size={11} /> {resume.fileName}
              </span>
              <span className="meta-separator">•</span>
              <span className="file-date">
                {new Date(resume.uploadedAt || Date.now()).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Contact Pills */}
            <div className="contact-pills-bar">
              {email && (
                <a href={`mailto:${email}`} className="contact-pill-link" title="Send Email">
                  <Mail size={12} />
                  <span>{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="contact-pill-link" title="Call">
                  <Phone size={12} />
                  <span>{phone}</span>
                </a>
              )}
              {linkedIn && (
                <a
                  href={linkedIn.startsWith('http') ? linkedIn : `https://${linkedIn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-pill-link"
                >
                  <ExternalLink size={11} />
                  <span>LinkedIn</span>
                </a>
              )}
              {gitHub && (
                <a
                  href={gitHub.startsWith('http') ? gitHub : `https://${gitHub}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-pill-link"
                >
                  <ExternalLink size={11} />
                  <span>GitHub</span>
                </a>
              )}
              {portfolio && (
                <a
                  href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="contact-pill-link"
                >
                  <ExternalLink size={11} />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="dossier-header-actions">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={13} />}
            onClick={onClear}
            className="remove-resume-btn"
          >
            Clear & Re-upload
          </Button>
        </div>
      </div>

      {/* 2. Executive Summary Quote */}
      {summary && (
        <div className="dossier-summary-box">
          <p className="dossier-summary-text">{summary}</p>
        </div>
      )}

      {/* 3. Metrics Quick Bar */}
      <div className="dossier-stats-strip">
        <div className="stat-chip" onClick={() => setActiveTab('skills')}>
          <Cpu size={14} className="text-accent" />
          <span className="stat-value">{skillsList.length}</span>
          <span className="stat-label">Skills Extracted</span>
        </div>
        <div className="stat-chip" onClick={() => setActiveTab('projects')}>
          <Briefcase size={14} className="text-success" />
          <span className="stat-value">{projects.length}</span>
          <span className="stat-label">Grounded Projects</span>
        </div>
        <div className="stat-chip" onClick={() => setActiveTab('education')}>
          <GraduationCap size={14} className="text-warning" />
          <span className="stat-value">{education.length}</span>
          <span className="stat-label">Education</span>
        </div>
        <div className="stat-chip" onClick={() => setActiveTab('experience')}>
          <Layers size={14} className="text-info" />
          <span className="stat-value">{experience.length}</span>
          <span className="stat-label">Experience</span>
        </div>
        {certifications.length > 0 && (
          <div className="stat-chip" onClick={() => setActiveTab('all')}>
            <Award size={14} className="text-accent" />
            <span className="stat-value">{certifications.length}</span>
            <span className="stat-label">Certifications</span>
          </div>
        )}
      </div>

      {/* 4. Navigation Tabs */}
      <div className="dossier-tabs-nav">
        <button
          className={`dossier-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Layers size={13} /> Complete Dossier
        </button>
        <button
          className={`dossier-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Cpu size={13} /> Skills ({skillsList.length})
        </button>
        <button
          className={`dossier-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Briefcase size={13} /> Projects ({projects.length})
        </button>
        <button
          className={`dossier-tab-btn ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={13} /> Education ({education.length})
        </button>
        <button
          className={`dossier-tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          <Layers size={13} /> Experience ({experience.length})
        </button>
        <button
          className={`dossier-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Target size={13} /> Interview Focus
        </button>
      </div>

      {/* 5. Content Body */}
      <div className="dossier-content-body">
        {/* SKILLS SECTION */}
        {(activeTab === 'all' || activeTab === 'skills') && (
          <div className="dossier-card-section">
            <div className="section-head-title">
              <Cpu size={16} className="text-accent" />
              <span>Categorized Technical Skills</span>
              <span className="count-pill">{skillsList.length}</span>
            </div>

            {/* Categorized Skills Grid */}
            <div className="categorized-skills-grid">
              {categorizedSkills.programmingLanguages?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Code2 size={13} /> Programming Languages
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.programmingLanguages.map((s, idx) => (
                      <Badge key={idx} variant="primary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.frontend?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Layout size={13} /> Frontend & UI
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.frontend.map((s, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.backend?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Server size={13} /> Backend & APIs
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.backend.map((s, idx) => (
                      <Badge key={idx} variant="primary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.databases?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Database size={13} /> Databases & Storage
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.databases.map((s, idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.cloud?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Cloud size={13} /> Cloud, DevOps & Linux
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.cloud.map((s, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.aiMl?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Sparkles size={13} /> AI & Machine Learning
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.aiMl.map((s, idx) => (
                      <Badge key={idx} variant="success" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.tools?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Terminal size={13} /> Developer Tools
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.tools.map((s, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {categorizedSkills.otherTechnologies?.length > 0 && (
                <div className="skill-category-group">
                  <div className="category-group-header">
                    <Layers size={13} /> Methodologies & Architecture
                  </div>
                  <div className="skill-badges-flow">
                    {categorizedSkills.otherTechnologies.map((s, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skill Evidence Audit */}
            {(strongSkills.length > 0 || intermediateSkills.length > 0) && (
              <div className="skill-audit-block">
                <h5 className="audit-subtitle">Cross-Referenced Skill Evidence</h5>

                <div className="audit-level-row">
                  {strongSkills.length > 0 && (
                    <div className="audit-box strong-box">
                      <span className="audit-badge-label strong">
                        <CheckCircle2 size={12} /> Strong Project Evidence
                      </span>
                      <div className="audit-chips-wrap">
                        {strongSkills.map((s, idx) => (
                          <div key={idx} className="evidence-chip" title={s.evidence}>
                            <span className="chip-name">{s.skill}</span>
                            {s.projectCount > 0 && (
                              <span className="chip-count">{s.projectCount} proj</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {intermediateSkills.length > 0 && (
                    <div className="audit-box intermediate-box">
                      <span className="audit-badge-label intermediate">
                        <Cpu size={12} /> Intermediate Application
                      </span>
                      <div className="audit-chips-wrap">
                        {intermediateSkills.map((s, idx) => (
                          <div key={idx} className="evidence-chip" title={s.evidence}>
                            <span className="chip-name">{s.skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {skillsToImprove.length > 0 && (
                  <div className="growth-recommendations-row">
                    <div className="recommendation-column">
                      <span className="rec-title">Key Areas for Technical Depth:</span>
                      <ul className="rec-list">
                        {skillsToImprove.map((item, idx) => (
                          <li key={idx} className="rec-item">
                            <strong>{item.skill}:</strong> {item.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROJECTS SECTION */}
        {(activeTab === 'all' || activeTab === 'projects') && (
          <div className="dossier-card-section">
            <div className="section-head-title">
              <Briefcase size={16} className="text-success" />
              <span>Grounded Projects</span>
              <span className="count-pill">{projects.length}</span>
            </div>

            {projects.length === 0 ? (
              <p className="empty-sub-notice">No individual projects detected in resume.</p>
            ) : (
              <div className="projects-dossier-list">
                {projects.map((proj, idx) => {
                  const isExpanded = Boolean(expandedProjects[idx]);
                  const questions = proj.potentialInterviewQuestions || [];
                  const features = proj.features || [];

                  return (
                    <div key={idx} className="project-dossier-item">
                      <div className="project-item-header">
                        <div className="proj-title-group">
                          <h4 className="project-title-text">{proj.name}</h4>
                          {proj.technicalComplexity && (
                            <span className={`complexity-tag ${proj.technicalComplexity}`}>
                              {proj.technicalComplexity}
                            </span>
                          )}
                        </div>

                        {questions.length > 0 && (
                          <button
                            className="expand-questions-btn"
                            onClick={() => toggleProjectExpand(idx)}
                          >
                            <HelpCircle size={12} />
                            <span>{questions.length} AI Questions</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </div>

                      {/* Problem Statement */}
                      {proj.problemSolved && (
                        <p className="project-desc-line">{proj.problemSolved}</p>
                      )}

                      {/* Features bullets */}
                      {features.length > 0 && (
                        <ul className="project-features-list">
                          {features.map((feat, fIdx) => (
                            <li key={fIdx} className="feature-bullet">
                              {feat}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Technologies Pills */}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="project-tech-pills">
                          <span className="stack-label">Stack:</span>
                          {proj.technologies.map((tech, tIdx) => (
                            <span key={tIdx} className="tech-sub-pill">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Technical Architecture Notes */}
                      {(proj.architecture || proj.database || proj.backend || proj.frontend) && (
                        <div className="project-tech-meta-row">
                          {proj.architecture && (
                            <span className="meta-spec">
                              <strong>Arch:</strong> {proj.architecture}
                            </span>
                          )}
                          {proj.database && (
                            <span className="meta-spec">
                              <strong>DB:</strong> {proj.database}
                            </span>
                          )}
                          {proj.backend && (
                            <span className="meta-spec">
                              <strong>Backend:</strong> {proj.backend}
                            </span>
                          )}
                          {proj.frontend && (
                            <span className="meta-spec">
                              <strong>Frontend:</strong> {proj.frontend}
                            </span>
                          )}
                        </div>
                      )}

                      {/* AI Interview Questions Accordion */}
                      {isExpanded && questions.length > 0 && (
                        <div className="project-questions-box animate-fade-in">
                          <span className="questions-box-title">
                            <Sparkles size={12} className="text-accent" />
                            Targeted Project Interview Questions:
                          </span>
                          <ol className="questions-numbered-list">
                            {questions.map((q, qIdx) => (
                              <li key={qIdx} className="question-item">
                                {q}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EDUCATION SECTION */}
        {(activeTab === 'all' || activeTab === 'education') && (
          <div className="dossier-card-section">
            <div className="section-head-title">
              <GraduationCap size={16} className="text-warning" />
              <span>Academic & Education History</span>
              <span className="count-pill">{education.length}</span>
            </div>

            {education.length === 0 ? (
              <p className="empty-sub-notice">No formal education entries detected.</p>
            ) : (
              <div className="education-dossier-list">
                {education.map((edu, idx) => (
                  <div key={idx} className="education-dossier-card">
                    <div className="edu-card-top">
                      <div>
                        <h4 className="edu-degree-title">{edu.degree}</h4>
                        <div className="edu-institution-line">
                          <GraduationCap size={14} className="text-muted" />
                          <span className="edu-institution-name">{edu.institution}</span>
                          {edu.fieldOfStudy && (
                            <span className="edu-field-name">({edu.fieldOfStudy})</span>
                          )}
                        </div>
                      </div>

                      <div className="edu-meta-badges">
                        {edu.graduationYear && (
                          <span className="edu-year-badge">{edu.graduationYear}</span>
                        )}
                        {edu.gpa && (
                          <span className="edu-gpa-badge">
                            Score / GPA: <strong>{edu.gpa}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                      <div className="edu-coursework-wrap">
                        <span className="coursework-label">Coursework:</span>
                        <div className="coursework-chips">
                          {edu.relevantCoursework.map((course, cIdx) => (
                            <span key={cIdx} className="coursework-pill">
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE SECTION */}
        {(activeTab === 'all' || activeTab === 'experience') && (
          <div className="dossier-card-section">
            <div className="section-head-title">
              <Layers size={16} className="text-info" />
              <span>Professional Experience & Internships</span>
              <span className="count-pill">{experience.length}</span>
            </div>

            {experience.length === 0 ? (
              <p className="empty-sub-notice">No professional employment/internship history detected.</p>
            ) : (
              <div className="experience-dossier-list">
                {experience.map((exp, idx) => (
                  <div key={idx} className="experience-dossier-card">
                    <div className="exp-card-header">
                      <div>
                        <h4 className="exp-role-title">{exp.role}</h4>
                        <span className="exp-org-name">{exp.organization || (exp as any).company}</span>
                      </div>
                      {exp.duration && <span className="exp-duration-tag">{exp.duration}</span>}
                    </div>

                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="exp-bullets-list">
                        {exp.responsibilities.map((resp, rIdx) => (
                          <li key={rIdx}>{resp}</li>
                        ))}
                      </ul>
                    )}

                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="exp-tech-stack-row">
                        <span className="exp-tech-label">Stack:</span>
                        {exp.technologies.map((t, tIdx) => (
                          <span key={tIdx} className="tech-sub-pill">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {exp.achievements && exp.achievements.length > 0 && (
                      <div className="exp-achievements-row">
                        <CheckCircle2 size={13} className="text-success" />
                        <span>Key Achievement: {exp.achievements.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATIONS SECTION */}
        {certifications.length > 0 && (activeTab === 'all' || activeTab === 'overview') && (
          <div className="dossier-card-section">
            <div className="section-head-title">
              <Award size={16} className="text-accent" />
              <span>Certifications & Honors</span>
              <span className="count-pill">{certifications.length}</span>
            </div>
            <div className="certifications-badges-row">
              {certifications.map((cert, idx) => (
                <div key={idx} className="cert-pill-badge">
                  <Award size={13} />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERVIEW FOCUS & STRENGTHS (OVERVIEW TAB) */}
        {(activeTab === 'all' || activeTab === 'overview') && (
          <div className="dossier-card-section interview-focus-section">
            <div className="section-head-title">
              <Target size={16} className="text-accent" />
              <span>AI Interview Customization & Focus</span>
            </div>

            <div className="focus-grid-cols">
              {/* Strengths */}
              {technicalStrengths.length > 0 && (
                <div className="focus-col-card strengths-card">
                  <div className="focus-col-header">
                    <Sparkles size={14} className="text-success" />
                    <span>Prominent Technical Strengths</span>
                  </div>
                  <ul className="focus-items-list">
                    {technicalStrengths.map((str, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weak Areas */}
              {weakAreas.length > 0 && (
                <div className="focus-col-card weaknesses-card">
                  <div className="focus-col-header">
                    <Target size={14} className="text-warning" />
                    <span>Target Verification & Growth Areas</span>
                  </div>
                  <ul className="focus-items-list">
                    {weakAreas.map((wk, idx) => (
                      <li key={idx}>
                        <span className="growth-bullet-dot" />
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Targeted Interview Topics */}
            {potentialTopics.length > 0 && (
              <div className="topics-cloud-row">
                <span className="topics-label">Target Round Topics:</span>
                <div className="topics-badges">
                  {potentialTopics.map((top, idx) => (
                    <span key={idx} className="topic-target-tag">
                      <Target size={11} /> {top}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
