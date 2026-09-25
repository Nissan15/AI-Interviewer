import { generateCompletion } from '../aiService.ts';

export const LEARNING_ENGINE_SYSTEM_PROMPT = `
You are an Academic Director and Engineering Career Mentor.
Your mission is to formulate a high-impact, personalized learning path for a candidate by synthesizing their resume analysis, project evaluation, skill gaps, aptitude outcomes, and interview performance.

Design progressive learning modules according to the loop:
Current Skill -> Weak Area -> Recommended Topic -> Practice Task -> Mock Test Focus -> Reassessment Criteria.

Prioritize:
- critical: Fundamental blockers that could lead to immediate placement rejections
- high: Important modern industry expectations
- medium: Polish and architectural optimizations
- low: Nice-to-have supplementary skills

Output strict JSON:
{
  "summary": "Strategic 2-3 sentence overview of candidate's technical upgrade plan",
  "recommendations": [
    {
      "currentSkill": "Backend Development (Node.js)",
      "weakArea": "Database connection pooling and query optimization under load",
      "recommendedTopic": "PostgreSQL Indexing & Connection Pooling with PgBouncer",
      "practiceTask": "Set up an indexing benchmark test in PostgreSQL simulating 1,000 queries per second",
      "mockTestFocus": "Database Indexing & Query Execution Plans MCQ",
      "reassessmentCriteria": "Candidate explains EXPLAIN ANALYZE output and B-Tree vs Hash index trade-offs",
      "priority": "critical"
    },
    {
      "currentSkill": "Frontend (React)",
      "weakArea": "State management architecture and performance profiling",
      "recommendedTopic": "React 19 Hooks, useMemo, and Component Re-render Optimization",
      "practiceTask": "Profile a complex React data table using React DevTools and eliminate unnecessary re-renders",
      "mockTestFocus": "React Virtual DOM & Memoization Technical Test",
      "reassessmentCriteria": "Candidate successfully identifies and fixes cascading re-renders in sandbox",
      "priority": "high"
    }
  ]
}
`;

export async function generateLearningPath(
  candidateProfile: any,
  interviewEvaluations: any[] = [],
  assessmentResults: any[] = []
): Promise<any> {
  const context = {
    candidateSummary: candidateProfile?.summary,
    weakAreas: candidateProfile?.weakAreas || [],
    skillsToImprove: candidateProfile?.skillAnalysis?.skillsToImprove || [],
    recommendedSkills: candidateProfile?.skillAnalysis?.recommendedSkills || [],
    interviewGaps: interviewEvaluations.map((ev) => ({
      overallScore: ev.overallScore,
      improvements: ev.improvements,
      weakQuestions: (ev.questionAssessments || [])
        .filter((q: any) => (q.score || 100) < 70)
        .map((q: any) => ({ q: q.questionText, feedback: q.improvements })),
    })),
    assessmentGaps: assessmentResults.map((ar) => ({
      type: ar.assessment_type,
      score: ar.score,
    })),
  };

  const prompt = `
Candidate Assessment & Performance Context:
${JSON.stringify(context, null, 2)}

Generate the personalized learning recommendations based on the candidate's exact weaknesses and career goals.
Return JSON ONLY.
`;

  const responseJson = await generateCompletion(prompt, LEARNING_ENGINE_SYSTEM_PROMPT, {
    temperature: 0.3,
    jsonMode: true,
  });

  try {
    return JSON.parse(responseJson);
  } catch (err: any) {
    throw new Error(`Failed to parse learning path JSON: ${err.message}`);
  }
}
