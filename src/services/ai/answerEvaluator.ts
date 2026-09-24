import { InterviewExchange } from '../../types/interview';
import { InterviewEvaluation } from '../../types/evaluation';
import { callLlmApi } from './aiConfig';
import {
  ANSWER_EVALUATION_SYSTEM_PROMPT,
  createAnswerEvaluationPrompt,
} from '../../prompts/answerEvaluation';

export const evaluateInterviewSession = async (
  sessionId: string,
  durationSeconds: number,
  exchanges: InterviewExchange[]
): Promise<InterviewEvaluation> => {
  const prompt = createAnswerEvaluationPrompt(exchanges);
  const jsonResponse = await callLlmApi(prompt, ANSWER_EVALUATION_SYSTEM_PROMPT);

  try {
    const parsed = JSON.parse(jsonResponse);

    return {
      id: `eval_${Date.now()}`,
      sessionId,
      completedAt: new Date().toISOString(),
      durationSeconds,
      overallScore: Number(parsed.overallScore) || 75,
      communicationScore: Number(parsed.communicationScore) || 75,
      technicalScore: Number(parsed.technicalScore) || 75,
      confidenceScore: Number(parsed.confidenceScore) || 75,
      relevanceScore: Number(parsed.relevanceScore) || 75,
      problemSolvingScore: Number(parsed.problemSolvingScore) || 75,
      clarityScore: Number(parsed.clarityScore) || 75,
      overallFeedback: parsed.overallFeedback || 'Assessment completed successfully.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      recommendedPreparationAreas: Array.isArray(parsed.recommendedPreparationAreas)
        ? parsed.recommendedPreparationAreas
        : [],
      questionAssessments: Array.isArray(parsed.questionAssessments)
        ? parsed.questionAssessments.map((qa: any, idx: number) => ({
            questionNumber: Number(qa.questionNumber) || idx + 1,
            questionText: qa.questionText || exchanges[idx]?.questionText || '',
            userAnswerText: qa.userAnswerText || exchanges[idx]?.userAnswerText || '',
            score: Number(qa.score) || 70,
            strengths: Array.isArray(qa.strengths) ? qa.strengths : [],
            improvements: Array.isArray(qa.improvements) ? qa.improvements : [],
            sampleModelAnswer: qa.sampleModelAnswer || undefined,
          }))
        : [],
    };
  } catch (err: any) {
    throw new Error('Failed to parse final interview evaluation JSON: ' + err.message);
  }
};
