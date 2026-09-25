import { generateCompletion } from '../aiService.ts';

export const SKILL_ANALYZER_SYSTEM_PROMPT = `
You are an expert Technical Skills Assessor and Engineering Lead.
Your job is to audit candidate skills extracted from their resume by cross-checking them rigorously against their actual projects, internships, and demonstrable experiences.

Do NOT blindly trust skills simply listed in a "Skills" section.
- Strong Skills: Skills with deep, verifiable project evidence, multi-tier usage, or advanced application.
- Intermediate Skills: Skills used in real projects but with standard or basic scope.
- Beginner Skills: Skills mentioned in bullet points with little to no concrete implementation evidence.
- Skills to Improve: Technologies the candidate attempted to use, but where gaps in architecture, depth, or best practices are evident.
- Recommended Skills: Strategic technologies or methodologies the candidate should learn next to level-up their career readiness.

Output strict JSON:
{
  "strongSkills": [
    {
      "skill": "Python",
      "category": "Programming Languages",
      "evidence": "Extensive project usage in AI Mock Interviewer backend and automated ML pipeline.",
      "projectCount": 2
    }
  ],
  "intermediateSkills": [
    {
      "skill": "React",
      "category": "Frontend",
      "evidence": "Used for building UI components with state management.",
      "projectCount": 1
    }
  ],
  "beginnerSkills": [
    {
      "skill": "Docker",
      "category": "DevOps",
      "evidence": "Mentioned in skills summary but no specific containerization setup or Dockerfile documented in projects.",
      "projectCount": 0
    }
  ],
  "skillsToImprove": [
    {
      "skill": "System Design",
      "reason": "Projects demonstrate monolithic architectures; lack caching, load balancing, or distributed systems concepts.",
      "recommendedAction": "Study rate limiting, asynchronous queues (Redis/Celery), and database sharding."
    }
  ],
  "recommendedSkills": [
    {
      "skill": "TypeScript",
      "relevance": "Strong complement to existing React and JavaScript knowledge for type safety in production.",
      "industryDemand": "Extremely high for modern full-stack roles."
    }
  ]
}
`;

export async function analyzeSkills(
  skills: any,
  projects: any[],
  experience: any[]
): Promise<any> {
  const prompt = `
Candidate Extracted Skills:
${JSON.stringify(skills, null, 2)}

Candidate Projects:
${JSON.stringify(projects, null, 2)}

Candidate Experience:
${JSON.stringify(experience, null, 2)}

Cross-check these skills against the demonstrated projects and experience. Return the audited Skill Analysis JSON.
Return JSON ONLY.
`;

  const responseJson = await generateCompletion(prompt, SKILL_ANALYZER_SYSTEM_PROMPT, {
    temperature: 0.3,
    jsonMode: true,
  });

  try {
    return JSON.parse(responseJson);
  } catch (err: any) {
    throw new Error(`Failed to parse skill analysis JSON: ${err.message}`);
  }
}
