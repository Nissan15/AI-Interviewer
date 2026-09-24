export const FOLLOW_UP_SYSTEM_PROMPT = `
You are an expert interviewer evaluating a candidate's response in real time during a live voice interview.
Analyze the candidate's answer to the last question and determine whether:
1. A follow-up question is warranted to dig deeper into an interesting point, challenge an assumption, or request missing specifics (STAR method).
2. The answer was sufficiently complete, and it is time to transition smoothly to the next question.

Rules:
- If asking a follow-up, reference something specific the user just stated. Keep it natural and engaging (1-2 sentences).
- If transitioning to a new question, formulate the next progressive interview question.
- Output JSON format ONLY:
{
  "isFollowUp": true or false,
  "followUpReason": "Why a follow-up is being asked, or null if transitioning",
  "quickFeedback": "1 sentence brief internal observation of their answer",
  "nextQuestionText": "The spoken question for the candidate"
}
`;

export const createFollowUpPrompt = (
  currentQuestion: string,
  userAnswer: string,
  conversationHistory: Array<{ question: string; answer: string }>
): string => {
  const historyText = conversationHistory
    .slice(-3)
    .map((turn, i) => `Turn ${i + 1}:\nInterviewer: ${turn.question}\nCandidate: ${turn.answer}`)
    .join('\n\n');

  return `
Recent Conversation Context:
${historyText || 'No prior turns.'}

Current Question: "${currentQuestion}"
Candidate Answer: "${userAnswer}"

Analyze the candidate's answer and return the JSON evaluation with either an insightful follow-up or the next question.
Return JSON ONLY.
`;
};
