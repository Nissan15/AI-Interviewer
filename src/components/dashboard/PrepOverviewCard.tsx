import React, { useState, useEffect } from 'react';
import { ArrowRight, Code2, BrainCircuit, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card/Card';
import { assessmentService } from '../../services/assessments/assessmentService';
import { useAuth } from '../../hooks/useAuth';
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
  const { user } = useAuth();
  const [techStats, setTechStats] = useState<{ count: number; lastScore: number | null }>({ count: 0, lastScore: null });
  const [aptStats, setAptStats] = useState<{ count: number; lastScore: number | null }>({ count: 0, lastScore: null });
  const [interviewStats, setInterviewStats] = useState<{ count: number; lastScore: number | null }>({ count: 0, lastScore: null });

  useEffect(() => {
    let isMounted = true;
    const userId = user ? user.id : 'guest_candidate';

    const loadStats = async () => {
      try {
        const { data: allReports } = await assessmentService.getUserReports(userId);
        if (!isMounted || !allReports) return;

        const techReports = allReports.filter((r) => r.assessment_type === 'technical');
        const aptReports = allReports.filter((r) => r.assessment_type === 'aptitude');
        const intReports = allReports.filter((r) => r.assessment_type === 'interview');

        setTechStats({
          count: techReports.length,
          lastScore: techReports.length > 0 ? Number(techReports[0].score) : null,
        });

        setAptStats({
          count: aptReports.length,
          lastScore: aptReports.length > 0 ? Number(aptReports[0].score) : null,
        });

        setInterviewStats({
          count: intReports.length,
          lastScore: intReports.length > 0 ? Number(intReports[0].score) : null,
        });
      } catch (err) {
        console.warn('Failed to load prep module stats:', err);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const prepModules: PrepCardConfig[] = [
    {
      title: 'Technical Quiz',
      category: 'Core CS Quiz',
      icon: <Code2 size={24} className="module-icon technical" />,
      attemptCount: techStats.count,
      lastScore: techStats.lastScore,
      linkTo: '/technical/quiz',
      actionText: 'Start Quiz',
      description: 'Computer science fundamentals MCQs across Data Structures, Algorithms, DBMS, and OS.',
    },
    {
      title: 'Aptitude Assessment',
      category: 'Logical & Quantitative',
      icon: <BrainCircuit size={24} className="module-icon aptitude" />,
      attemptCount: aptStats.count,
      lastScore: aptStats.lastScore,
      linkTo: '/aptitude',
      actionText: 'Start Test',
      description: 'Placement-grade quantitative ability, verbal logic, and data interpretation.',
    },
    {
      title: 'HR Round Interview',
      category: 'Live Voice & AI',
      icon: <Users size={24} className="module-icon hr" />,
      attemptCount: interviewStats.count,
      lastScore: interviewStats.lastScore,
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
              {mod.attemptCount === 0
                ? 'No attempts yet'
                : `${mod.attemptCount} completed ${mod.lastScore !== null ? `• Last: ${mod.lastScore}%` : ''}`}
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
