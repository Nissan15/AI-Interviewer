import React from 'react';
import { ArrowRight, Code2, BrainCircuit, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card/Card';
import './PrepOverviewCard.css';

interface PrepCardConfig {
  title: string;
  category: string;
  icon: React.ReactNode;
  attemptCount: number;
  lastScore: number | null;
  linkTo: string;
  actionText: string;
  description: string;
}

export const PrepOverviewCard: React.FC = () => {
  // STRICT ZERO SAMPLE DATA: attempts initially 0, lastScore initially null
  const prepModules: PrepCardConfig[] = [
    {
      title: 'Technical Assessment',
      category: 'Quiz & Coding',
      icon: <Code2 size={24} className="module-icon technical" />,
      attemptCount: 0,
      lastScore: null,
      linkTo: '/technical',
      actionText: 'Start Test',
      description: 'Computer science fundamentals MCQs and algorithm challenge sandbox.',
    },
    {
      title: 'Aptitude Assessment',
      category: 'Logical & Quantitative',
      icon: <BrainCircuit size={24} className="module-icon aptitude" />,
      attemptCount: 0,
      lastScore: null,
      linkTo: '/aptitude',
      actionText: 'Start Test',
      description: 'Placement-grade quantitative ability, verbal logic, and data interpretation.',
    },
    {
      title: 'HR Round Interview',
      category: 'Live Voice & AI',
      icon: <Users size={24} className="module-icon hr" />,
      attemptCount: 0,
      lastScore: null,
      linkTo: '/hr',
      actionText: 'Start Interview',
      description: 'Resume-grounded voice interview simulation with real-time feedback and scoring.',
    },
  ];

  return (
    <div className="prep-overview-grid">
      {prepModules.map((mod) => (
        <Card key={mod.title} variant="interactive" className="prep-module-card">
          <div className="card-top-row">
            <div className="module-icon-box">{mod.icon}</div>
            <span className="module-category-tag">{mod.category}</span>
          </div>

          <h3 className="module-title">{mod.title}</h3>
          <p className="module-desc">{mod.description}</p>

          <div className="module-status-box">
            <span className="status-label-sub">Attempts</span>
            <span className="status-value-text">
              {mod.attemptCount === 0 ? 'No attempts yet' : `${mod.attemptCount} completed`}
            </span>
          </div>

          <div className="card-action-row">
            <Link to={mod.linkTo} className="prep-action-link">
              <span>{mod.actionText}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
};
