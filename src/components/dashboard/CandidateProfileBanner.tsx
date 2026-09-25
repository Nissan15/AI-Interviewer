import React from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Cpu,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useResume } from '../../context/ResumeContext';
import { Button } from '../common/Button/Button';
import { Badge } from '../common/Badge/Badge';
import './CandidateProfileBanner.css';

export const CandidateProfileBanner: React.FC = () => {
  const { resume, candidateProfile, learningPath } = useResume();

  if (!resume && !candidateProfile) {
    return (
      <div className="candidate-profile-banner empty-state-profile">
        <div className="profile-banner-left">
          <div className="profile-banner-icon">
            <FileText size={24} />
          </div>
          <div>
            <div className="profile-badge-row">
              <span className="profile-tag">Step 1: Onboarding</span>
            </div>
            <h3 className="profile-banner-title">Upload Resume to Activate AI Personalization</h3>
            <p className="profile-banner-desc">
              Our central AI engine analyzes your projects, audits your skills, and builds an internal candidate profile to customize your technical and HR interviews.
            </p>
          </div>
        </div>

        <div className="profile-banner-actions">
          <Link to="/hr">
            <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
              Upload & Analyze Resume
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const strongSkills = candidateProfile?.skillAnalysis?.strongSkills || [];
  const projects = candidateProfile?.projects || resume?.projects || [];
  const candidateName = candidateProfile?.candidateName || resume?.candidateName || 'Candidate';

  return (
    <div className="candidate-profile-banner active-profile">
      <div className="profile-banner-top">
        <div className="profile-banner-left">
          <div className="profile-banner-icon active">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="profile-badge-row">
              <span className="profile-tag verified">
                <CheckCircle2 size={12} /> AI Profile Active
              </span>
              <span className="profile-projects-count">
                <Briefcase size={12} /> {projects.length} Grounded Projects
              </span>
            </div>
            <h3 className="profile-banner-title">{candidateName}'s Interview Profile</h3>
            <p className="profile-banner-desc">
              {candidateProfile?.summary || resume?.summary || 'Profile synthesized from verified resume analysis and project evidence.'}
            </p>
          </div>
        </div>

        <div className="profile-banner-actions">
          <Link to="/hr">
            <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
              Start AI Mock Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* Demonstrable Strengths & Skills */}
      <div className="profile-banner-footer">
        <div className="profile-skills-preview">
          <span className="skills-preview-label">
            <Cpu size={14} /> Demonstrated Skills:
          </span>
          <div className="skills-badges-wrap">
            {strongSkills.length > 0
              ? strongSkills.slice(0, 5).map((s, idx) => (
                  <Badge key={idx} variant="success" size="sm">
                    {s.skill}
                  </Badge>
                ))
              : resume?.skills.slice(0, 6).map((s, idx) => (
                  <Badge key={idx} variant="primary" size="sm">
                    {s}
                  </Badge>
                ))}
          </div>
        </div>

        {candidateProfile?.potentialInterviewTopics && candidateProfile.potentialInterviewTopics.length > 0 && (
          <div className="profile-topics-preview">
            <span className="skills-preview-label">Target Topics:</span>
            <span className="topics-preview-text">
              {candidateProfile.potentialInterviewTopics.slice(0, 3).join(' • ')}
            </span>
          </div>
        )}
      </div>

      {/* Personalized Learning Path Highlights (if generated) */}
      {learningPath && learningPath.length > 0 && (
        <div className="profile-learning-section">
          <div className="learning-header">
            <BookOpen size={15} className="text-accent" />
            <span className="learning-title">Personalized Learning Focus</span>
          </div>
          <div className="learning-cards-row">
            {learningPath.slice(0, 3).map((item, idx) => (
              <div key={idx} className="learning-mini-card">
                <span className={`priority-tag ${item.priority}`}>{item.priority}</span>
                <h5 className="learning-topic-name">{item.recommendedTopic}</h5>
                <p className="learning-task-snippet">{item.practiceTask}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
