import { AptitudeQuestion, AptitudeSubmission, AptitudeResult, AptitudeCategory } from '../../types/aptitude';
import { questionService } from '../admin/questionService';
import { DEFAULT_APTITUDE_QUESTIONS } from '../../data/questionBanks';

export const aptitudeApi = {
  /**
   * Fetch active aptitude questions from Supabase repository
   */
  getQuestions: async (category?: string): Promise<AptitudeQuestion[]> => {
    try {
      const { data } = await questionService.getQuestions({
        type: 'aptitude',
        active: 'active',
        category: category && category !== 'all' ? category : undefined,
      });

      if (data && data.length > 0) {
        return data.map((q) => {
          const opts = Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : [q.option_a, q.option_b, q.option_c, q.option_d];

          // Determine correct answer index
          let correctIdx = opts.findIndex(
            (o) => o?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase()
          );
          if (correctIdx === -1) {
            // Check if correct_answer was saved as "A", "Option A", etc.
            const lower = q.correct_answer?.trim().toLowerCase() || '';
            if (lower === 'a' || lower === 'option a') correctIdx = 0;
            else if (lower === 'b' || lower === 'option b') correctIdx = 1;
            else if (lower === 'c' || lower === 'option c') correctIdx = 2;
            else if (lower === 'd' || lower === 'option d') correctIdx = 3;
            else correctIdx = 0;
          }

          return {
            id: q.id,
            category: q.category as AptitudeCategory,
            question: q.question,
            options: opts,
            correctOptionIndex: correctIdx,
            explanation: q.explanation || '',
            difficulty: (q.difficulty as any) || 'medium',
          };
        });
      }
    } catch (err) {
      console.warn('Aptitude dynamic repository note, using curated fallback:', err);
    }

    // Curated category fallback
    const catKey = (category as AptitudeCategory) || 'Quantitative Aptitude';
    return DEFAULT_APTITUDE_QUESTIONS[catKey] || [];
  },

  /**
   * Submit completed aptitude assessment and calculate score
   */
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
