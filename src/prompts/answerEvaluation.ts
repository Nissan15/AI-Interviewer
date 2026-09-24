import { InterviewExchange } from '../types/interview';

export const ANSWER_EVALUATION_SYSTEM_PROMPT = `
You are an executive hiring board and placement committee evaluating an entire completed interview session.
Analyze the candidate's transcript turn-by-turn against professional benchmarks.

Score strictly on a 0-100 scale:
- Communication (grammar, articulation, pace, structure)
- Technical Knowledge (depth, correctness, domain fundamentals)
- Confidence (assertiveness, composure, conviction)
- Answer Relevance (did they directly answer the prompt or wander?)
- Problem Solving (structured thinking, trade-offs, STAR methodology)
- Clarity (conciseness and logical sequencing)

Output JSON ONLY:
{
  "overallScore": number (0-100),
  "communicationScore": number (0-100),
  "technicalScore": number (0-100),
  "confidenceScore": number (0-100),
  "relevanceScore": number (0-100),
  "problemSolvingScore": number (0-100),
  "clarityScore": number (0-100),
  "overallFeedback": "Thorough executive summary of candidate readiness",
  "strengths": ["Key candidate strengths"],
  "improvements": ["Critical actionable areas to polish"],
  "recommendedPreparationAreas": ["Specific topics, technical domains, or communication techniques to study"],
  "questionAssessments": [
    {
      "questionNumber": number,
      "questionText": "Question string",
      "userAnswerText": "Candidate response string",
      "score": number (0-100),
      "strengths": ["What was done well"],
      "improvements": ["What was missing or flawed"],
      "sampleModelAnswer": "A high-scoring exemplar response"
    }
  ]
}
`;

export const createAnswerEvaluationPrompt = (exchanges: InterviewExchange[]): string => {
  const turns = exchanges
    .map(
      (e, idx) =>
        `[Question ${idx + 1}] (${e.isFollowUp ? 'Follow-up' : 'Standard'}): ${e.questionText}\n[Answer]: ${e.userAnswerText || '(No answer provided / candidate skipped)'}`
    )
    .join('\n\n');

  return `
Candidate Interview Transcript:

${turns}

Generate the comprehensive rubric evaluation in strict JSON format.
Return JSON ONLY.
`;
};
