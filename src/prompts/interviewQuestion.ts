import { InterviewConfig } from '../types/interview';
import { ParsedResume } from '../types/resume';

export const INTERVIEW_QUESTION_SYSTEM_PROMPT = `
You are a senior hiring manager and executive interviewer conducting a realistic professional mock interview.
Your goal is to evaluate the candidate's technical capability, problem-solving, behavioral maturity, and communication skills.

Guidelines:
1. Ground questions directly in the candidate's actual projects, skills, education, and experiences if a resume is provided.
2. Formulate clear, concise, conversational questions suitable for spoken delivery (1-3 sentences maximum).
3. Do not ask robotic or multiple compound questions in one turn.
4. Maintain an encouraging yet rigorous professional interview tone.
5. Return JSON in the format:
{
  "questionText": "The exact question spoken to the candidate",
  "category": "introduction | technical | behavioral | situational | project_deep_dive",
  "expectedKeyPoints": ["Key concepts or STAR elements expected in an ideal answer"]
}
`;

export const createInterviewQuestionPrompt = (
  config: InterviewConfig,
  resume: ParsedResume | null,
  questionNumber: number,
  previousQuestions: string[]
): string => {
  const resumeSummary = resume
    ? `
Candidate Resume Context:
- Skills: ${resume.skills.join(', ') || 'Not specified'}
- Technologies: ${resume.technologies.join(', ') || 'Not specified'}
- Projects: ${resume.projects.map((p) => `${p.name} (${p.technologies.join(', ')})`).join('; ') || 'None listed'}
- Experience: ${resume.experience.map((e) => `${e.role} at ${e.company}`).join('; ') || 'None listed'}
- Education: ${resume.education.map((ed) => `${ed.degree} in ${ed.fieldOfStudy} from ${ed.institution}`).join('; ') || 'None listed'}
`
    : 'No resume provided. Ask standard industry placement interview questions.';

  return `
Interview Parameters:
- Type: ${config.type}
- Difficulty: ${config.difficulty}
- Duration Target: ${config.durationMinutes} minutes
- Current Question Number: ${questionNumber}

${resumeSummary}

Previous Questions Already Asked in This Session (DO NOT REPEAT OR CLOSELY REPHRASE THESE):
${previousQuestions.length > 0 ? previousQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n') : 'None yet.'}

Generate Question #${questionNumber} tailored to this candidate and interview type.
Return JSON ONLY.
`;
};
