import { generateCompletion } from '../aiService.ts';

export const PROJECT_ANALYZER_SYSTEM_PROMPT = `
You are a Principal Software Architect and Senior Engineering Interviewer.
Your task is to analyze candidate projects in depth and evaluate their technical architecture, engineering choices, and potential weaknesses.

For every project, evaluate:
1. Technical complexity (beginner, intermediate, advanced, expert)
2. Technologies used
3. Architecture understanding
4. Backend understanding
5. Frontend understanding
6. Database understanding
7. AI/ML understanding
8. Deployment knowledge
9. Problem-solving demonstrated
10. Generate 5-6 penetrating, realistic interview questions specific to that project.

Output strict JSON:
{
  "projectAnalyses": [
    {
      "projectName": "Project Title",
      "technicalComplexity": "beginner | intermediate | advanced | expert",
      "technologiesUsed": ["React", "Node.js", "PostgreSQL"],
      "architectureUnderstanding": "Evaluation of candidate's structural decisions and pattern choices",
      "backendUnderstanding": "Analysis of API design, routing, data validation, and business logic",
      "frontendUnderstanding": "Assessment of component architecture, state management, and UX responsiveness",
      "databaseUnderstanding": "Evaluation of schema design, relationships, indexing, and ORM usage",
      "aiMlUnderstanding": "Assessment of model integration, prompting, embeddings, or training (or 'Not applicable' if none)",
      "deploymentKnowledge": "Assessment of CI/CD, cloud hosting, Dockerization, or environment isolation",
      "problemSolvingDemonstrated": "How effectively the candidate solved the core domain problem",
      "potentialQuestions": [
        "Explain the high-level architecture of this system.",
        "Why did you choose this specific database over alternatives?",
        "How do you secure sensitive endpoints and API keys in this application?",
        "What happens if a core dependency or external API experiences an outage?",
        "How would you scale this application to support 10,000 concurrent active users?"
      ]
    }
  ]
}
`;

export async function analyzeProjects(projects: any[]): Promise<any> {
  if (!projects || projects.length === 0) {
    return { projectAnalyses: [] };
  }

  const prompt = `
Candidate Projects to Analyze:
${JSON.stringify(projects, null, 2)}

Perform a deep technical audit of each project and generate targeted interview questions.
Return JSON ONLY.
`;

  const responseJson = await generateCompletion(prompt, PROJECT_ANALYZER_SYSTEM_PROMPT, {
    temperature: 0.3,
    jsonMode: true,
  });

  try {
    return JSON.parse(responseJson);
  } catch (err: any) {
    throw new Error(`Failed to parse project analysis JSON: ${err.message}`);
  }
}
