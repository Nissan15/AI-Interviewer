import type { IncomingMessage, ServerResponse } from 'http';
import { getServerAiConfig } from './aiService.ts';
import { analyzeResume } from './handlers/resumeAnalyzer.ts';
import { analyzeSkills } from './handlers/skillAnalyzer.ts';
import { analyzeProjects } from './handlers/projectAnalyzer.ts';
import {
  generateInitialQuestion,
  processInterviewTurn,
  evaluateSession,
} from './handlers/interviewEngine.ts';
import { generateLearningPath } from './handlers/learningEngine.ts';

/**
 * Helper to parse JSON body from incoming Node.js HTTP request stream.
 */
function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Safeguard against oversized payloads (>15MB)
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

/**
 * Helper to write JSON HTTP response.
 */
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

/**
 * Server middleware for /api/ai/* endpoints.
 * Mounts directly into Vite dev server or standalone Node HTTP server.
 */
export async function aiServerMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const url = req.url?.split('?')[0] || '';

  if (!url.startsWith('/api/ai/')) {
    return next();
  }

  // CORS headers if accessed from another local origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // GET /api/ai/status
    if (url === '/api/ai/status' && req.method === 'GET') {
      const config = getServerAiConfig();
      return sendJson(res, 200, {
        status: 'ok',
        configured: Boolean(config.apiKey),
        provider: config.provider,
        model: config.model,
      });
    }

    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const body = await readJsonBody(req);

    // 1. Resume Analysis Pipeline: /api/ai/resume-analyze
    if (url === '/api/ai/resume-analyze') {
      const { rawText, fileName, fileSize } = body;
      if (!rawText) {
        return sendJson(res, 400, { error: 'Missing rawText parameter' });
      }

      // Step 1: Base resume structured extraction
      const extracted = await analyzeResume(rawText);

      // Collect all extracted skills deduplicated
      const allExtractedSkills = Array.from(
        new Set([
          ...Object.values(extracted.categorizedSkills || {}).flat().filter((s): s is string => typeof s === 'string' && s.length > 0),
          ...(Array.isArray(extracted.skills) ? extracted.skills : []),
          ...(extracted.projects || []).flatMap((p: any) => (Array.isArray(p.technologies) ? p.technologies : [])),
        ])
      );

      // Step 2: Skill audit against projects & experience
      let skillAnalysis = null;
      try {
        skillAnalysis = await analyzeSkills(
          extracted.categorizedSkills || extracted.skills || {},
          extracted.projects || [],
          extracted.experience || []
        );
      } catch (err: any) {
        console.warn('Skill analysis warning:', err.message);
      }

      // If skillAnalysis is empty, synthesize directly from candidate projects and skills
      if (!skillAnalysis || (!skillAnalysis.strongSkills?.length && !skillAnalysis.intermediateSkills?.length)) {
        const strong: any[] = [];
        const intermediate: any[] = [];
        const beginner: any[] = [];
        const projects = extracted.projects || [];

        for (const skill of allExtractedSkills.slice(0, 30)) {
          const matchingProjects = projects.filter((p: any) => {
            const techList = p.technologies || [];
            const text = `${p.name || ''} ${p.problemSolved || ''} ${techList.join(' ')}`.toLowerCase();
            return text.includes(skill.toLowerCase());
          });
          if (matchingProjects.length >= 2) {
            strong.push({
              skill,
              category: 'Demonstrated Skill',
              evidence: `Demonstrated across multiple projects including "${matchingProjects[0]?.name}".`,
              projectCount: matchingProjects.length,
            });
          } else if (matchingProjects.length === 1) {
            intermediate.push({
              skill,
              category: 'Demonstrated Skill',
              evidence: `Implemented directly in "${matchingProjects[0]?.name}".`,
              projectCount: 1,
            });
          } else {
            beginner.push({
              skill,
              category: 'Foundational Skill',
              evidence: 'Documented in candidate technical skills profile.',
              projectCount: 0,
            });
          }
        }

        skillAnalysis = {
          strongSkills: strong.slice(0, 8),
          intermediateSkills: intermediate.slice(0, 8),
          beginnerSkills: beginner.slice(0, 6),
          skillsToImprove: skillAnalysis?.skillsToImprove || [
            {
              skill: 'System Scalability & Caching',
              reason: 'Projects currently rely on direct database queries without caching layers.',
              recommendedAction: 'Implement Redis cache-aside strategies and connection pooling.',
            },
          ],
          recommendedSkills: skillAnalysis?.recommendedSkills || [
            {
              skill: 'Automated CI/CD & Testing',
              relevance: 'Essential for production software reliability in senior placement interviews.',
              industryDemand: 'Very High',
            },
          ],
        };
      }

      // Step 3: Deep project analysis & question generation
      let projectAnalyses = [];
      try {
        if (extracted.projects && extracted.projects.length > 0) {
          const projResult = await analyzeProjects(extracted.projects);
          projectAnalyses = projResult.projectAnalyses || [];
        }
      } catch (err: any) {
        console.warn('Project analysis warning:', err.message);
      }

      if (!projectAnalyses.length && extracted.projects?.length) {
        projectAnalyses = extracted.projects.map((p: any) => ({
          projectName: p.name,
          technicalComplexity: p.technicalComplexity || 'intermediate',
          technologiesUsed: p.technologies || [],
          architectureUnderstanding: p.architecture || 'Client-server architecture with REST endpoints.',
          backendUnderstanding: p.backend ? `Backend built with ${p.backend}.` : 'API endpoints and business logic.',
          frontendUnderstanding: p.frontend ? `Frontend implemented using ${p.frontend}.` : 'Component design and user interface.',
          databaseUnderstanding: p.database ? `Data persistence in ${p.database}.` : 'Data storage and retrieval.',
          aiMlUnderstanding: p.aiMlUsage || 'Algorithmic data processing.',
          deploymentKnowledge: p.deployment || 'Deployment and configuration.',
          problemSolvingDemonstrated: p.problemSolved || 'Delivered key system requirements.',
          potentialQuestions: p.potentialInterviewQuestions || [
            `What architecture trade-offs did you evaluate while designing ${p.name}?`,
            `How did you handle error boundary management in ${p.name}?`,
          ],
        }));
      }

      // Synthesize unified Candidate AI Profile
      const candidateProfile = {
        candidateName: extracted.personalInfo?.name || extracted.candidateName || 'Candidate',
        headline: extracted.summary,
        summary: extracted.summary,
        personalInfo: extracted.personalInfo,
        education: extracted.education || [],
        skills: extracted.categorizedSkills || {},
        skillAnalysis,
        projects: extracted.projects || [],
        projectAnalyses,
        experience: extracted.experience || [],
        certifications: extracted.certifications || [],
        technicalStrengths: extracted.technicalStrengths || [],
        weakAreas: extracted.weakAreas || [],
        potentialInterviewTopics: extracted.potentialInterviewTopics || [],
      };

      const parsedResume = {
        id: `res_${Date.now()}`,
        fileName: fileName || 'Uploaded_Resume.pdf',
        fileSize: fileSize || 0,
        uploadedAt: new Date().toISOString(),
        personalInfo: extracted.personalInfo,
        candidateName: extracted.personalInfo?.name || extracted.candidateName,
        email: extracted.personalInfo?.email || extracted.email,
        phone: extracted.personalInfo?.phone || extracted.phone,
        summary: extracted.summary,
        skills: allExtractedSkills,
        technologies: (extracted.projects || []).flatMap((p: any) => (Array.isArray(p.technologies) ? p.technologies : [])),
        categorizedSkills: extracted.categorizedSkills,
        education: extracted.education || [],
        projects: extracted.projects || [],
        experience: extracted.experience || [],
        certifications: extracted.certifications || [],
        technicalStrengths: extracted.technicalStrengths || [],
        weakAreas: extracted.weakAreas || [],
        potentialInterviewTopics: extracted.potentialInterviewTopics || [],
        rawText,
      };

      return sendJson(res, 200, {
        success: true,
        data: {
          parsedResume,
          candidateProfile,
        },
      });
    }

    // 2. Skill Analysis: /api/ai/skill-analyze
    if (url === '/api/ai/skill-analyze') {
      const { skills, projects, experience } = body;
      const result = await analyzeSkills(skills, projects || [], experience || []);
      return sendJson(res, 200, { success: true, data: result });
    }

    // 3. Project Analysis: /api/ai/project-analyze
    if (url === '/api/ai/project-analyze') {
      const { projects } = body;
      const result = await analyzeProjects(projects || []);
      return sendJson(res, 200, { success: true, data: result });
    }

    // 4. Initial/Progressive Interview Question: /api/ai/interview-question
    if (url === '/api/ai/interview-question') {
      const { config, candidateProfile, questionNumber, previousQuestions } = body;
      const question = await generateInitialQuestion(
        config || { type: 'technical', difficulty: 'medium', durationMinutes: 15 },
        candidateProfile,
        questionNumber || 1,
        previousQuestions || []
      );
      return sendJson(res, 200, { success: true, data: question });
    }

    // 5. Dynamic Interview Turn: /api/ai/interview-turn
    if (url === '/api/ai/interview-turn') {
      const currentQuestion = body.currentQuestion || '';
      const candidateAnswer = body.candidateAnswer || body.userAnswer || '';
      const conversationHistory = body.conversationHistory || body.history || [];
      const candidateProfile = body.candidateProfile || null;
      const roundType = body.roundType || 'technical';

      const turnResult = await processInterviewTurn(
        currentQuestion,
        candidateAnswer,
        conversationHistory,
        candidateProfile,
        roundType
      );
      return sendJson(res, 200, { success: true, data: turnResult });
    }

    // 6. Comprehensive Session Evaluation: /api/ai/interview-evaluate
    if (url === '/api/ai/interview-evaluate') {
      const { sessionId, durationSeconds, exchanges, candidateProfile } = body;
      const evaluation = await evaluateSession(
        sessionId || `session_${Date.now()}`,
        durationSeconds || 300,
        exchanges || [],
        candidateProfile
      );
      return sendJson(res, 200, { success: true, data: evaluation });
    }

    // 7. Personalized Learning Path: /api/ai/learning-path
    if (url === '/api/ai/learning-path') {
      const { candidateProfile, interviewEvaluations, assessmentResults } = body;
      const learningPath = await generateLearningPath(
        candidateProfile,
        interviewEvaluations || [],
        assessmentResults || []
      );
      return sendJson(res, 200, { success: true, data: learningPath });
    }

    return sendJson(res, 404, { error: 'Unknown AI endpoint' });
  } catch (err: any) {
    console.error('AI Middleware Error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'Internal AI service error occurred',
    });
  }
}
