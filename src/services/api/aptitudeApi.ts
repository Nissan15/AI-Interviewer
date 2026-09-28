import { AptitudeQuestion, AptitudeSubmission, AptitudeResult, AptitudeCategory } from '../../types/aptitude';
import { assessmentService } from '../assessments/assessmentService';
import { DEFAULT_APTITUDE_QUESTIONS } from '../../data/questionBanks';

export const aptitudeApi = {
  getQuestions: async (category?: string): Promise<AptitudeQuestion[]> => {
    try {
      // 1. Check Supabase database first
      const { data } = await assessmentService.getAptitudeQuestions(category);
      if (data && data.length > 0) {
        return data.map((q) => {
          let opts: string[] = [];
          if (Array.isArray(q.options)) {
            opts = q.options as string[];
          } else if (typeof q.options === 'string') {
            try {
              opts = JSON.parse(q.options);
            } catch {
              opts = [q.options];
            }
          }
          const correctIdx = opts.indexOf(q.correct_answer);
          return {
            id: q.id,
            category: q.category as AptitudeCategory,
            question: q.question,
            options: opts,
            correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
            explanation: q.explanation || '',
            difficulty: (q.difficulty as any) || 'medium',
          };
        });
      }
    } catch {
      // Fallback
    }

    // 2. Return curated category bank
    const catKey = (category as AptitudeCategory) || 'Quantitative Aptitude';
    return DEFAULT_APTITUDE_QUESTIONS[catKey] || [];
  },

  submitTest: async (
    submission: AptitudeSubmission,
    questionsList?: AptitudeQuestion[]
  ): Promise<AptitudeResult> => {
    const questions = questionsList || (DEFAULT_APTITUDE_QUESTIONS[submission.category] || []);
    let correct = 0;
    const answeredCount = Object.keys(submission.answers).length;

    questions.forEach((q) => {
      if (submission.answers[q.id] === q.correctOptionIndex) {
        correct++;
      }
    });

    const totalQuestions = questions.length || answeredCount || 1;
    const score = Math.round((correct / totalQuestions) * 100);
    const accuracy = Math.round((correct / (answeredCount || 1)) * 100);

    return {
      score,
      totalQuestions,
      correctAnswers: correct,
      incorrectAnswers: answeredCount - correct,
      accuracy,
      timeSpentSeconds: submission.timeSpentSeconds,
      category: submission.category,
      completedAt: new Date().toISOString(),
    };
  },
};
