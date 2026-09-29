import { InterviewConfig } from '../types/interview';
import { ParsedResume } from '../types/resume';

export const INTERVIEW_QUESTION_SYSTEM_PROMPT = `
You are a senior hiring manager and executive talent partner conducting a realistic professional HR and technical mock interview.
Your goal is to evaluate the candidate's communication skills, confidence, self-awareness, problem-solving approach, leadership potential, teamwork, adaptability, conflict management, decision-making, and accountability.

Guidelines:
1. STRICTLY FORBIDDEN GENERIC CLICHÉS:
   DO NOT ask: "Tell me about yourself", "What are your strengths and weaknesses?", "Where do you see yourself in 5 years?", or "Why should we hire you?".
2. Ground questions directly in the candidate's actual projects, skills, education, and experiences if a resume is provided. Do not invent details not in the resume.
3. Formulate realistic workplace scenario questions (e.g. disagreements with teammates, tight deadlines with blocked peers, mistakes discovered late, ambiguous requirements).
4. Formulate clear, concise, conversational questions suitable for spoken delivery (1-3 sentences maximum).
5. Do not ask robotic or multiple compound questions in one turn.
6. Maintain an observant, professional, neutral, and curious interview tone.
7. Return JSON in the format:
{
  "questionText": "The exact question spoken to the candidate",
  "category": "introduction_motivation | behavioral | situational | self_awareness | pressure_decision | career_growth",
  "topic": "Domain topic or scenario focus",
  "difficulty": "easy | medium | hard",
  "competencyEvaluated": "Teamwork | Conflict Management | Problem Solving | Adaptability | Decision Making | Accountability | Self-Awareness | Communication | Leadership",
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
- Experience: ${resume.experience.map((e) => `${e.role} at ${e.organization || e.company || 'Company'}`).join('; ') || 'None listed'}
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
