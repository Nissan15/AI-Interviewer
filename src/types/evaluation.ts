export interface QuestionFeedback {
  questionNumber: number;
  questionText: string;
  userAnswerText: string;
  score: number; // 0 - 100
  strengths: string[];
  improvements: string[];
  sampleModelAnswer?: string;
}

export interface InterviewEvaluation {
  id: string;
  sessionId: string;
  completedAt: string;
  durationSeconds: number;
  overallScore: number; // 0 - 100
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  relevanceScore: number;
  problemSolvingScore: number;
  clarityScore: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  recommendedPreparationAreas: string[];
  questionAssessments: QuestionFeedback[];
}
