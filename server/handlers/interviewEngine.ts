import { generateCompletion } from '../aiService.ts';

export const QUESTION_GENERATOR_SYSTEM_PROMPT = `
You are an executive interviewer and senior hiring manager conducting a live, realistic technical or HR placement interview.
Your goal is to evaluate the candidate thoroughly based on their demonstrated profile, selected round type, and difficulty.

Rules:
1. Ground questions directly in the candidate's actual projects, skills, education, and experiences whenever available.
2. In technical interviews, prioritize topics evident in their profile: Programming, System Architecture, Algorithms, DBMS, APIs, Cloud/Security, and Web Development.
3. In HR interviews, ask behavioral questions connected to their real project challenges, teamwork, deadlines, and growth areas.
4. Keep questions concise and spoken-friendly (1-3 sentences maximum).
5. DO NOT ask multiple compound questions in one turn.
6. Return JSON ONLY:
{
  "questionText": "The spoken interview question",
  "category": "technical | hr | project_deep_dive | behavioral | conceptual",
  "topic": "Specific domain topic (e.g. Flask, Database Indexing, Conflict Resolution)",
  "difficulty": "easy | medium | hard",
  "expectedKeyPoints": ["Key concepts or STAR elements expected in an ideal answer"]
}
`;

export const TURN_PROCESSOR_SYSTEM_PROMPT = `
You are an expert interviewer evaluating a candidate's answer in real-time during a live interview conversation.
Evaluate the candidate's latest response against the current question and conversation history.

Determine:
1. Internal Evaluation:
   - technicalAccuracy: 0-100 (accuracy of facts, principles, and implementation)
   - communication: 0-100 (structure, vocabulary, confidence)
   - clarity: 0-100 (conciseness vs rambling)
   - depth: 0-100 (surface-level repetition vs nuanced architectural grasp)
   - problemSolving: 0-100 (systematic thinking, trade-offs, edge cases)
   - confidence: 0-100 (decisiveness and poise)
2. Next Move (Adaptive Flow):
   - If the answer was weak or incomplete: Ask a clarifying or verification follow-up.
   - If the answer was excellent or showed advanced claims: Ask a deeper architectural or edge-case follow-up.
   - If the answer was sufficient and complete: Transition smoothly to the next progressive topic.
3. Adjust difficulty dynamically based on answer quality.

Output strict JSON:
{
  "isFollowUp": true or false,
  "followUpReason": "Why a follow-up is being asked, or null if transitioning",
  "quickFeedback": "1 sentence brief internal observation of their answer",
  "nextQuestionText": "The spoken next question for the candidate",
  "category": "technical | hr | project_deep_dive | behavioral",
  "topic": "The topic being explored",
  "difficulty": "easy | medium | hard",
  "evaluation": {
    "technicalAccuracy": 85,
    "communication": 80,
    "clarity": 80,
    "depth": 75,
    "problemSolving": 80,
    "confidence": 85
  }
}
`;

export const EVALUATION_REPORT_SYSTEM_PROMPT = `
You are the Executive Placement Evaluation Committee.
Conduct a comprehensive post-interview analysis of the candidate's entire session transcript.

Calculate rigorous scores (0-100 scale):
- overallScore
- technicalScore
- communicationScore
- clarityScore
- depthScore
- problemSolvingScore
- confidenceScore
- relevanceScore

Provide:
- overallFeedback: An executive summary of readiness for industry placement.
- strengths: Demonstrable strengths observed during the session.
- improvements: Specific, actionable areas needing refinement.
- recommendedPreparationAreas: High-priority topics to study before real company interviews.
- questionAssessments: Turn-by-turn breakdown showing what the candidate answered, their strengths, weaknesses, and a high-scoring sampleModelAnswer.
- learningPathSuggestions: Immediate tactical learning topics.

Output strict JSON:
{
  "overallScore": 82,
  "technicalScore": 84,
  "communicationScore": 80,
  "clarityScore": 82,
  "depthScore": 78,
  "problemSolvingScore": 80,
  "confidenceScore": 85,
  "relevanceScore": 86,
  "overallFeedback": "Thorough executive evaluation paragraph...",
  "strengths": ["Clear understanding of REST APIs", "Articulate explanation of database choices"],
  "improvements": ["Needs deeper knowledge of caching strategies and connection pooling"],
  "recommendedPreparationAreas": ["Redis Caching", "Database Indexing", "System Scalability"],
  "questionAssessments": [
    {
      "questionNumber": 1,
      "questionText": "Question string",
      "userAnswerText": "Candidate response",
      "score": 80,
      "strengths": ["Direct and relevant"],
      "improvements": ["Could mention latency metrics"],
      "sampleModelAnswer": "A top-tier model response example..."
    }
  ],
  "learningPathSuggestions": [
    {
      "currentSkill": "Backend Architecture",
      "weakArea": "In-memory caching and Redis",
      "recommendedTopic": "Implementing Redis Cache Aside Pattern",
      "practiceTask": "Build a caching middleware for high-traffic endpoints",
      "mockTestFocus": "Backend System Scalability MCQ",
      "reassessmentCriteria": "Demonstrates sub-10ms response times with cache hits"
    }
  ]
}
`;

export async function generateInitialQuestion(
  config: { type: string; difficulty: string; durationMinutes: number },
  candidateProfile: any,
  questionNumber: number = 1,
  previousQuestions: string[] = []
): Promise<any> {
  const profileSummary = candidateProfile
    ? `
Candidate Profile:
- Name: ${candidateProfile.candidateName || 'Candidate'}
- Top Strengths: ${JSON.stringify(candidateProfile.technicalStrengths || [])}
- Key Projects: ${JSON.stringify(
        (candidateProfile.projects || []).map((p: any) => ({
          name: p.name,
          tech: p.technologies,
          problem: p.problemSolved,
        }))
      )}
- Categorized Skills: ${JSON.stringify(candidateProfile.skills || candidateProfile.categorizedSkills || {})}
- Potential Topics: ${JSON.stringify(candidateProfile.potentialInterviewTopics || [])}
`
    : 'No candidate profile attached. Conduct a standard interview.';

  const prompt = `
Interview Round: ${config.type}
Target Difficulty: ${config.difficulty}
Session Target Duration: ${config.durationMinutes} minutes
Question Number: ${questionNumber}

${profileSummary}

Previous Questions in this Session (DO NOT REPEAT):
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') : 'None yet.'}

Formulate Question #${questionNumber}.
Return JSON ONLY.
`;

  const responseJson = await generateCompletion(prompt, QUESTION_GENERATOR_SYSTEM_PROMPT, {
    temperature: 0.4,
    jsonMode: true,
  });

  try {
    return JSON.parse(responseJson);
  } catch (err: any) {
    throw new Error(`Failed to parse question JSON: ${err.message}`);
  }
}

export async function processInterviewTurn(
  currentQuestion: string,
  candidateAnswer: string,
  conversationHistory: Array<{ question: string; answer: string }>,
  candidateProfile: any,
  roundType: string = 'technical'
): Promise<any> {
  const historyText = conversationHistory
    .slice(-4)
    .map((turn, i) => `Turn ${i + 1}:\nInterviewer: ${turn.question}\nCandidate: ${turn.answer}`)
    .join('\n\n');

  const profileExcerpt = candidateProfile
    ? `Candidate Background: Skills=${JSON.stringify(
        candidateProfile.skills || candidateProfile.categorizedSkills || {}
      )}, Projects=${JSON.stringify(
        (candidateProfile.projects || []).map((p: any) => p.name)
      )}`
    : 'General Candidate';

  const prompt = `
Round Type: ${roundType}
${profileExcerpt}

Recent Conversation History:
${historyText || 'No prior turns.'}

Current Question Asked: "${currentQuestion}"
Candidate Answer: "${candidateAnswer || '(Candidate remained silent or gave no answer)'}"

Analyze this answer, evaluate technical and communication metrics, and determine the next dynamic question or follow-up.
Return JSON ONLY.
`;

  const responseJson = await generateCompletion(prompt, TURN_PROCESSOR_SYSTEM_PROMPT, {
    temperature: 0.3,
    jsonMode: true,
  });

  try {
    return JSON.parse(responseJson);
  } catch (err: any) {
    throw new Error(`Failed to parse interview turn JSON: ${err.message}`);
  }
}

export async function evaluateSession(
  sessionId: string,
  durationSeconds: number,
  exchanges: any[],
  candidateProfile: any
): Promise<any> {
  const transcriptText = exchanges
    .map(
      (e, idx) =>
        `[Q${idx + 1}] (${e.isFollowUp ? 'Follow-up' : 'Topic: ' + (e.category || 'General')}): ${e.questionText}\n[Answer]: ${e.userAnswerText || '(No answer provided)'}`
    )
    .join('\n\n');

  const prompt = `
Session ID: ${sessionId}
Total Duration: ${Math.round(durationSeconds / 60)} minutes (${durationSeconds} seconds)
Candidate Profile: ${JSON.stringify(candidateProfile ? candidateProfile.candidateName : 'Candidate')}

Full Session Transcript:
${transcriptText}

Generate the comprehensive rubric evaluation report.
Return JSON ONLY.
`;

  const responseJson = await generateCompletion(prompt, EVALUATION_REPORT_SYSTEM_PROMPT, {
    temperature: 0.3,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(responseJson);
    parsed.sessionId = sessionId;
    parsed.durationSeconds = durationSeconds;
    parsed.completedAt = new Date().toISOString();
    return parsed;
  } catch (err: any) {
    throw new Error(`Failed to parse final evaluation JSON: ${err.message}`);
  }
}
