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

      // Synthesize unified Candidate AI Profile
      const candidateProfile = {
        candidateName: extracted.personalInfo?.name || extracted.candidateName || 'Candidate',
        headline: extracted.summary,
        summary: extracted.summary,
        personalInfo: extracted.personalInfo,
        education: extracted.education || [],
        skills: extracted.categorizedSkills || {},
        skillAnalysis: skillAnalysis || {
          strongSkills: [],
          intermediateSkills: [],
          beginnerSkills: [],
          skillsToImprove: [],
          recommendedSkills: [],
        },
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
        skills: Object.values(extracted.categorizedSkills || {}).flat() as string[],
        technologies: (extracted.projects || []).flatMap((p: any) => p.technologies || []),
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
