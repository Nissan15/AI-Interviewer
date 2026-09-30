import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import {
  Question,
  CreateQuestionDTO,
  UpdateQuestionDTO,
  QuestionFilters,
  QuestionType,
} from '../../types/admin';
import { DEFAULT_APTITUDE_QUESTIONS, DEFAULT_TECHNICAL_QUESTIONS } from '../../data/questionBanks';

const LOCAL_STORAGE_QUESTIONS_KEY = 'ai_interviewer_admin_questions';

// Build initial seed questions from existing default banks
function getInitialSeedQuestions(): Question[] {
  const seed: Question[] = [];
  const now = new Date().toISOString();

  // Aptitude
  Object.entries(DEFAULT_APTITUDE_QUESTIONS).forEach(([catName, qList]) => {
    qList.forEach((q, index) => {
      const optA = q.options[0] || '';
      const optB = q.options[1] || '';
      const optC = q.options[2] || '';
      const optD = q.options[3] || '';
      const correctText = q.options[q.correctOptionIndex] || optA;

      seed.push({
        id: `seed_apt_${catName.substring(0, 3)}_${index + 1}`,
        type: 'aptitude',
        question: q.question,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        options: [optA, optB, optC, optD],
        correct_answer: correctText,
        explanation: q.explanation || '',
        category: catName,
        topic: catName === 'Quantitative Aptitude' ? 'Percentages' : 'Logical Series',
        technology: undefined,
        difficulty: (q.difficulty as any) || 'medium',
        marks: 1,
        time_limit: 60,
        active: true,
        created_at: now,
        updated_at: now,
      });
    });
  });

  // Technical
  Object.entries(DEFAULT_TECHNICAL_QUESTIONS).forEach(([catName, qList]) => {
    qList.forEach((q, index) => {
      const optA = q.options[0] || '';
      const optB = q.options[1] || '';
      const optC = q.options[2] || '';
      const optD = q.options[3] || '';
      const correctText = q.options[q.correctOptionIndex] || optA;

      let tech = 'Computer Science Fundamentals';
      if (catName.toLowerCase().includes('programming')) tech = 'JavaScript';
      if (catName.toLowerCase().includes('database')) tech = 'SQL';
      if (catName.toLowerCase().includes('web')) tech = 'React';

      seed.push({
        id: `seed_tech_${catName.substring(0, 3)}_${index + 1}`,
        type: 'technical',
        question: q.question,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        options: [optA, optB, optC, optD],
        correct_answer: correctText,
        explanation: q.explanation || '',
        category: tech,
        topic: catName,
        technology: tech,
        difficulty: (q.difficulty as any) || 'medium',
        marks: 1,
        time_limit: 60,
        active: true,
        created_at: now,
        updated_at: now,
      });
    });
  });

  return seed;
}

function getLocalQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read questions from local storage:', e);
  }
  const seed = getInitialSeedQuestions();
  try {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(seed));
  } catch (e) {
    console.warn('Could not save seed questions to local storage:', e);
  }
  return seed;
}

function saveLocalQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.warn('Could not save questions to local storage:', e);
  }
}

export const questionService = {
  /**
   * Fetch questions with search, category, topic, difficulty, and active status filters
   */
  async getQuestions(filters?: QuestionFilters): Promise<{ data: Question[]; total: number; error: string | null }> {
    let questions: Question[] = [];

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('questions').select('*').order('created_at', { ascending: false });

        if (filters?.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        if (filters?.topic) {
          query = query.eq('topic', filters.topic);
        }
        if (filters?.difficulty && filters.difficulty !== 'all') {
          query = query.eq('difficulty', filters.difficulty);
        }
        if (filters?.active && filters.active !== 'all') {
          query = query.eq('active', filters.active === 'active');
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          questions = data.map((q: any) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            options: Array.isArray(q.options)
              ? q.options
              : [q.option_a, q.option_b, q.option_c, q.option_d],
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            category: q.category,
            topic: q.topic,
            technology: q.technology || undefined,
            difficulty: q.difficulty,
            marks: q.marks || 1,
            time_limit: q.time_limit || 60,
            active: q.active ?? true,
            created_by: q.created_by,
            created_at: q.created_at,
            updated_at: q.updated_at,
          }));
        } else if (error) {
          console.warn('Supabase questions fetch note:', error.message);
          questions = getLocalQuestions();
        } else {
          // If remote table has 0 rows, use local / seed data
          questions = getLocalQuestions();
        }
      } catch (err: any) {
        console.warn('Falling back to local questions:', err);
        questions = getLocalQuestions();
      }
    } else {
      questions = getLocalQuestions();
    }

    // Apply client-side filters if needed (e.g. search query or if falling back to local)
    let filtered = questions;

    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter((q) => q.type === filters.type);
    }
    if (filters?.category) {
      filtered = filtered.filter((q) => q.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.topic) {
      filtered = filtered.filter((q) => q.topic.toLowerCase() === filters.topic!.toLowerCase());
    }
    if (filters?.difficulty && filters.difficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === filters.difficulty);
    }
    if (filters?.active && filters.active !== 'all') {
      filtered = filtered.filter((q) => (filters.active === 'active' ? q.active : !q.active));
    }
    if (filters?.search && filters.search.trim()) {
      const s = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(s) ||
          q.category.toLowerCase().includes(s) ||
          q.topic.toLowerCase().includes(s) ||
          (q.technology && q.technology.toLowerCase().includes(s))
      );
    }

    return { data: filtered, total: filtered.length, error: null };
  },

  /**
   * Get single question by ID
   */
  async getQuestionById(id: string): Promise<{ data: Question | null; error: string | null }> {
    const { data } = await this.getQuestions();
    const found = data.find((q) => q.id === id);
    return { data: found || null, error: found ? null : 'Question not found' };
  },

  /**
   * Create a new question (Aptitude or Technical)
   */
  async createQuestion(dto: CreateQuestionDTO): Promise<{ data: Question | null; error: string | null }> {
    // Validation
    if (!dto.question?.trim()) return { data: null, error: 'Question text is required' };
    if (!dto.option_a?.trim() || !dto.option_b?.trim() || !dto.option_c?.trim() || !dto.option_d?.trim()) {
      return { data: null, error: 'All 4 options (A, B, C, D) are required' };
    }
    if (!dto.correct_answer?.trim()) return { data: null, error: 'Correct answer is required' };
    if (!dto.category?.trim()) return { data: null, error: 'Category is required' };
    if (!dto.topic?.trim()) return { data: null, error: 'Topic is required' };
    if (!dto.difficulty) return { data: null, error: 'Difficulty is required' };

    const now = new Date().toISOString();
    const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optionsArray = [dto.option_a.trim(), dto.option_b.trim(), dto.option_c.trim(), dto.option_d.trim()];

    const newQuestion: Question = {
      id,
      type: dto.type,
      question: dto.question.trim(),
      option_a: dto.option_a.trim(),
      option_b: dto.option_b.trim(),
      option_c: dto.option_c.trim(),
      option_d: dto.option_d.trim(),
      options: optionsArray,
      correct_answer: dto.correct_answer.trim(),
      explanation: dto.explanation?.trim() || '',
      category: dto.category.trim(),
      topic: dto.topic.trim(),
      technology: dto.technology?.trim() || undefined,
      difficulty: dto.difficulty,
      marks: Number(dto.marks) || 1,
      time_limit: Number(dto.time_limit) || 60,
      active: dto.active ?? true,
      created_at: now,
      updated_at: now,
    };

    // 1. Save to local storage cache immediately
    const local = getLocalQuestions();
    saveLocalQuestions([newQuestion, ...local]);

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: dbData, error } = await supabase
          .from('questions')
          .insert({
            type: newQuestion.type,
            question: newQuestion.question,
            option_a: newQuestion.option_a,
            option_b: newQuestion.option_b,
            option_c: newQuestion.option_c,
            option_d: newQuestion.option_d,
            options: optionsArray,
            correct_answer: newQuestion.correct_answer,
            explanation: newQuestion.explanation,
            category: newQuestion.category,
            topic: newQuestion.topic,
            technology: newQuestion.technology || null,
            difficulty: newQuestion.difficulty,
            marks: newQuestion.marks,
            time_limit: newQuestion.time_limit,
            active: newQuestion.active,
          })
          .select()
          .single();

        if (!error && dbData) {
          newQuestion.id = dbData.id;
          // Update local cache with assigned DB id
          const updated = getLocalQuestions().map((q) => (q.id === id ? newQuestion : q));
          saveLocalQuestions(updated);
        } else if (error) {
          console.warn('Supabase question insert note:', error.message);
        }
      } catch (err: any) {
        console.warn('Could not insert question to remote database:', err);
      }
    }

    return { data: newQuestion, error: null };
  },

  /**
   * Update an existing question
   */
  async updateQuestion(id: string, updates: UpdateQuestionDTO): Promise<{ data: Question | null; error: string | null }> {
    const local = getLocalQuestions();
    const existingIndex = local.findIndex((q) => q.id === id);
    if (existingIndex === -1) {
      return { data: null, error: 'Question not found' };
    }

    const current = local[existingIndex];
    const now = new Date().toISOString();

    const optA = updates.option_a !== undefined ? updates.option_a.trim() : current.option_a;
    const optB = updates.option_b !== undefined ? updates.option_b.trim() : current.option_b;
    const optC = updates.option_c !== undefined ? updates.option_c.trim() : current.option_c;
    const optD = updates.option_d !== undefined ? updates.option_d.trim() : current.option_d;

    const updatedQuestion: Question = {
      ...current,
      type: updates.type || current.type,
      question: updates.question !== undefined ? updates.question.trim() : current.question,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      options: [optA, optB, optC, optD],
      correct_answer: updates.correct_answer !== undefined ? updates.correct_answer.trim() : current.correct_answer,
      explanation: updates.explanation !== undefined ? updates.explanation.trim() : current.explanation,
      category: updates.category !== undefined ? updates.category.trim() : current.category,
      topic: updates.topic !== undefined ? updates.topic.trim() : current.topic,
      technology: updates.technology !== undefined ? updates.technology?.trim() : current.technology,
      difficulty: updates.difficulty || current.difficulty,
      marks: updates.marks !== undefined ? Number(updates.marks) : current.marks,
      time_limit: updates.time_limit !== undefined ? Number(updates.time_limit) : current.time_limit,
      active: updates.active !== undefined ? updates.active : current.active,
      updated_at: now,
    };

    local[existingIndex] = updatedQuestion;
    saveLocalQuestions(local);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('questions')
          .update({
            type: updatedQuestion.type,
            question: updatedQuestion.question,
            option_a: updatedQuestion.option_a,
            option_b: updatedQuestion.option_b,
            option_c: updatedQuestion.option_c,
            option_d: updatedQuestion.option_d,
            options: updatedQuestion.options,
            correct_answer: updatedQuestion.correct_answer,
            explanation: updatedQuestion.explanation,
            category: updatedQuestion.category,
            topic: updatedQuestion.topic,
            technology: updatedQuestion.technology || null,
            difficulty: updatedQuestion.difficulty,
            marks: updatedQuestion.marks,
            time_limit: updatedQuestion.time_limit,
            active: updatedQuestion.active,
            updated_at: now,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase question update note:', err);
      }
    }

    return { data: updatedQuestion, error: null };
  },

  /**
   * Toggle question active/inactive status (Soft delete / reactivate)
   */
  async toggleQuestionStatus(id: string, active: boolean): Promise<{ success: boolean; error: string | null }> {
    const res = await this.updateQuestion(id, { active });
    return { success: Boolean(res.data), error: res.error };
  },

  /**
   * Delete question (soft delete by default, or hard delete if hard = true)
   */
  async deleteQuestion(id: string, hard: boolean = false): Promise<{ success: boolean; error: string | null }> {
    if (!hard) {
      // Soft deletion / deactivation
      return this.toggleQuestionStatus(id, false);
    }

    // Hard deletion
    const local = getLocalQuestions();
    const filtered = local.filter((q) => q.id !== id);
    saveLocalQuestions(filtered);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to delete question' };
      }
    }

    return { success: true, error: null };
  },

  /**
   * Bulk insert questions into database
   */
  async bulkCreateQuestions(questions: CreateQuestionDTO[]): Promise<{ count: number; error: string | null }> {
    let successCount = 0;
    for (const q of questions) {
      const res = await this.createQuestion(q);
      if (res.data) successCount++;
    }
    return { count: successCount, error: null };
  },

  /**
   * Get overall question bank statistics
   */
  async getQuestionStats(): Promise<{
    totalAptitude: number;
    totalTechnical: number;
    totalActive: number;
    totalInactive: number;
  }> {
    const { data } = await this.getQuestions();
    const totalAptitude = data.filter((q) => q.type === 'aptitude').length;
    const totalTechnical = data.filter((q) => q.type === 'technical').length;
    const totalActive = data.filter((q) => q.active).length;
    const totalInactive = data.filter((q) => !q.active).length;

    return {
      totalAptitude,
      totalTechnical,
      totalActive,
      totalInactive,
    };
  },
};
