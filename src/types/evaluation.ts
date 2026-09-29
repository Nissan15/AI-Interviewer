export interface QuestionFeedback {
  questionNumber: number;
  questionText: string;
  userAnswerText: string;
  score: number; // 0 - 100
  strengths: string[];
  improvements: string[];
  sampleModelAnswer?: string;
  starAdherence?: string;
}

export interface CompetencyEvaluation {
  name: string; // e.g. "Communication", "Confidence", "Clarity", "Relevance", "Self-Awareness", "Problem-Solving", "Teamwork", "Leadership", "Adaptability", "Critical Thinking", "Professionalism", "Answer Depth (STAR)"
  score: number; // 0 - 100
  evidence: string; // Direct quotes or observations from candidate's answers
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export interface ResponseHighlight {
  questionNumber: number;
  questionText: string;
  userAnswerText: string;
  score: number;
  reason: string;
  competency?: string;
  type: 'strongest' | 'weakest';
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

  // Qualitative HR Evaluation Additions
  competencyBreakdown?: CompetencyEvaluation[];
  strongestResponses?: ResponseHighlight[];
  weakestResponses?: ResponseHighlight[];
  suggestedPracticeQuestions?: string[];
  starOverallRating?: string;
  executiveSummary?: string;
}

