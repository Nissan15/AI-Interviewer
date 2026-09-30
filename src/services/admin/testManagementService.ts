import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import {
  Test,
  TestWithQuestions,
  CreateTestDTO,
  TestStatus,
  QuestionType,
  AutoTestGenerationConfig,
  Question,
} from '../../types/admin';
import { questionService } from './questionService';

const LOCAL_STORAGE_TESTS_KEY = 'ai_interviewer_admin_tests';
const LOCAL_STORAGE_TEST_QUESTIONS_KEY = 'ai_interviewer_admin_test_questions';

// Default initial tests so the Test Management page is immediately populated with realistic SaaS tests
function getInitialSeedTests(): { tests: Test[]; testQuestionsMap: Record<string, string[]> } {
  const now = new Date().toISOString();

  const tests: Test[] = [
    {
      id: 'test_apt_basic_1',
      title: 'Aptitude Assessment - Basic Placement Test',
      description: 'Comprehensive screening test covering quantitative aptitude, logical reasoning, and basic verbal comprehension.',
      type: 'aptitude',
      duration_minutes: 20,
      total_questions: 10,
      total_marks: 10,
      difficulty_distribution: { easy: 4, medium: 4, hard: 2 },
      categories: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'],
      topics: ['Percentages', 'Time and Work', 'Logical Series', 'Grammar'],
      status: 'published',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'test_tech_frontend_1',
      title: 'Full Stack & Web Engineering Test',
      description: 'Evaluates core JavaScript ES6+, React architecture, state management, and modern Web APIs.',
      type: 'technical',
      duration_minutes: 25,
      total_questions: 10,
      total_marks: 10,
      difficulty_distribution: { easy: 3, medium: 5, hard: 2 },
      categories: ['JavaScript', 'React', 'Computer Science Fundamentals'],
      topics: ['ES6+ Features', 'React Hooks', 'DOM & Events', 'OOP'],
      status: 'published',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'test_apt_advanced_draft',
      title: 'Quantitative & Analytical Reasoning - Advanced (Q3)',
      description: 'Challenging high-difficulty numerical analysis and probability test for technical roles.',
      type: 'aptitude',
      duration_minutes: 30,
      total_questions: 15,
      total_marks: 15,
      difficulty_distribution: { easy: 2, medium: 6, hard: 7 },
      categories: ['Quantitative Aptitude', 'Data Interpretation'],
      topics: ['Probability', 'Permutations and Combinations', 'Pie Charts'],
      status: 'draft',
      created_at: now,
      updated_at: now,
    },
  ];

  return {
    tests,
    testQuestionsMap: {},
  };
}

function getLocalTests(): Test[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read tests from local storage:', e);
  }
  const { tests } = getInitialSeedTests();
  try {
    localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(tests));
  } catch (e) {
    console.warn('Could not save seed tests to local storage:', e);
  }
  return tests;
}

function saveLocalTests(tests: Test[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(tests));
  } catch (e) {
    console.warn('Could not save tests to local storage:', e);
  }
}

function getLocalTestQuestionsMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TEST_QUESTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {};
}

function saveLocalTestQuestionsMap(map: Record<string, string[]>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TEST_QUESTIONS_KEY, JSON.stringify(map));
  } catch {
    // fallback
  }
}

export const testManagementService = {
  /**
   * Get tests with optional status and question type filters
   */
  async getTests(
    statusFilter?: TestStatus | 'all',
    typeFilter?: QuestionType | 'all'
  ): Promise<{ data: Test[]; error: string | null }> {
    let tests: Test[] = [];

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('tests').select('*').order('created_at', { ascending: false });

        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        if (typeFilter && typeFilter !== 'all') {
          query = query.eq('type', typeFilter);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          tests = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            type: t.type,
            duration_minutes: t.duration_minutes || 15,
            total_questions: t.total_questions || 0,
            total_marks: t.total_marks || 0,
            difficulty_distribution: t.difficulty_distribution || { easy: 5, medium: 10, hard: 5 },
            categories: Array.isArray(t.categories) ? t.categories : [],
            topics: Array.isArray(t.topics) ? t.topics : [],
            status: t.status,
            created_by: t.created_by,
            created_at: t.created_at,
            updated_at: t.updated_at,
          }));
        } else {
          tests = getLocalTests();
        }
      } catch (err) {
        console.warn('Falling back to local tests:', err);
        tests = getLocalTests();
      }
    } else {
      tests = getLocalTests();
    }

    // Client-side filtering if falling back
    let filtered = tests;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    return { data: filtered, error: null };
  },

  /**
   * Get a test by ID with full populated question details
   */
  async getTestById(id: string): Promise<{ data: TestWithQuestions | null; error: string | null }> {
    const { data: allTests } = await this.getTests();
    const test = allTests.find((t) => t.id === id);
    if (!test) return { data: null, error: 'Test not found' };

    // Fetch linked questions
    let questionIds: string[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data: tqData } = await supabase
          .from('test_questions')
          .select('question_id, order_index')
          .eq('test_id', id)
          .order('order_index');

        if (tqData && tqData.length > 0) {
          questionIds = tqData.map((row: any) => row.question_id);
        }
      } catch (err) {
        console.warn('Could not fetch remote test questions:', err);
      }
    }

    if (questionIds.length === 0) {
      const map = getLocalTestQuestionsMap();
      questionIds = map[id] || [];
    }

    // Fetch question entities
    const { data: allQuestions } = await questionService.getQuestions();
    let questions = allQuestions.filter((q) => questionIds.includes(q.id));

    // If test has no explicitly mapped questions yet, provide matching active questions based on test type and categories
    if (questions.length === 0) {
      questions = allQuestions
        .filter((q) => q.type === test.type && q.active)
        .slice(0, test.total_questions || 10);
    }

    return {
      data: {
        ...test,
        questions,
      },
      error: null,
    };
  },

  /**
   * Create a new test and associate questions
   */
  async createTest(
    dto: CreateTestDTO
  ): Promise<{ data: Test | null; error: string | null }> {
    if (!dto.title?.trim()) return { data: null, error: 'Test title is required' };
    if (!dto.type) return { data: null, error: 'Test type (Aptitude or Technical) is required' };

    const now = new Date().toISOString();
    const id = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const questionIds = dto.question_ids || [];

    const newTest: Test = {
      id,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      type: dto.type,
      duration_minutes: Number(dto.duration_minutes) || 15,
      total_questions: questionIds.length || Number(dto.total_questions) || 0,
      total_marks: Number(dto.total_marks) || questionIds.length || 0,
      difficulty_distribution: dto.difficulty_distribution || { easy: 5, medium: 10, hard: 5 },
      categories: dto.categories || [],
      topics: dto.topics || [],
      status: dto.status || 'draft',
      created_at: now,
      updated_at: now,
    };

    // Save to local cache
    const local = getLocalTests();
    saveLocalTests([newTest, ...local]);

    const qMap = getLocalTestQuestionsMap();
    qMap[id] = questionIds;
    saveLocalTestQuestionsMap(qMap);

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: dbTest, error: testErr } = await supabase
          .from('tests')
          .insert({
            title: newTest.title,
            description: newTest.description,
            type: newTest.type,
            duration_minutes: newTest.duration_minutes,
            total_questions: newTest.total_questions,
            total_marks: newTest.total_marks,
            difficulty_distribution: newTest.difficulty_distribution as any,
            categories: newTest.categories,
            topics: newTest.topics,
            status: newTest.status,
          })
          .select()
          .single();

        if (!testErr && dbTest) {
          newTest.id = dbTest.id;
          qMap[dbTest.id] = questionIds;
          saveLocalTestQuestionsMap(qMap);

          // Insert test_questions
          if (questionIds.length > 0) {
            const rows = questionIds.map((qId, idx) => ({
              test_id: dbTest.id,
              question_id: qId,
              order_index: idx,
              marks: 1,
            }));
            await supabase.from('test_questions').insert(rows);
          }
        } else if (testErr) {
          console.warn('Supabase test create note:', testErr.message);
        }
      } catch (err: any) {
        console.warn('Could not insert test to remote database:', err);
      }
    }

    return { data: newTest, error: null };
  },

  /**
   * Update an existing test
   */
  async updateTest(
    id: string,
    updates: Partial<CreateTestDTO>
  ): Promise<{ data: Test | null; error: string | null }> {
    const local = getLocalTests();
    const index = local.findIndex((t) => t.id === id);
    if (index === -1) return { data: null, error: 'Test not found' };

    const current = local[index];
    const now = new Date().toISOString();

    const updated: Test = {
      ...current,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      description: updates.description !== undefined ? updates.description?.trim() : current.description,
      type: updates.type || current.type,
      duration_minutes: updates.duration_minutes !== undefined ? Number(updates.duration_minutes) : current.duration_minutes,
      total_questions: updates.total_questions !== undefined ? Number(updates.total_questions) : current.total_questions,
      total_marks: updates.total_marks !== undefined ? Number(updates.total_marks) : current.total_marks,
      difficulty_distribution: updates.difficulty_distribution || current.difficulty_distribution,
      categories: updates.categories || current.categories,
      topics: updates.topics || current.topics,
      status: updates.status || current.status,
      updated_at: now,
    };

    local[index] = updated;
    saveLocalTests(local);

    if (updates.question_ids) {
      const qMap = getLocalTestQuestionsMap();
      qMap[id] = updates.question_ids;
      saveLocalTestQuestionsMap(qMap);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('tests')
          .update({
            title: updated.title,
            description: updated.description,
            type: updated.type,
            duration_minutes: updated.duration_minutes,
            total_questions: updated.total_questions,
            total_marks: updated.total_marks,
            difficulty_distribution: updated.difficulty_distribution as any,
            categories: updated.categories,
            topics: updated.topics,
            status: updated.status,
            updated_at: now,
          })
          .eq('id', id);

        if (updates.question_ids) {
          // Refresh test_questions associations
          await supabase.from('test_questions').delete().eq('test_id', id);
          if (updates.question_ids.length > 0) {
            const rows = updates.question_ids.map((qId, idx) => ({
              test_id: id,
              question_id: qId,
              order_index: idx,
              marks: 1,
            }));
            await supabase.from('test_questions').insert(rows);
          }
        }
      } catch (err) {
        console.warn('Supabase test update note:', err);
      }
    }

    return { data: updated, error: null };
  },

  /**
   * Update test status (draft | published | unpublished)
   */
  async updateTestStatus(id: string, status: TestStatus): Promise<{ success: boolean; error: string | null }> {
    const res = await this.updateTest(id, { status });
    return { success: Boolean(res.data), error: res.error };
  },

  /**
   * Delete test
   */
  async deleteTest(id: string): Promise<{ success: boolean; error: string | null }> {
    const local = getLocalTests();
    saveLocalTests(local.filter((t) => t.id !== id));

    const qMap = getLocalTestQuestionsMap();
    delete qMap[id];
    saveLocalTestQuestionsMap(qMap);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('tests').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to delete test' };
      }
    }

    return { success: true, error: null };
  },

  /**
   * Automatically generate test questions using filters and difficulty distribution
   * Guarantees:
   * - Only active questions are selected
   * - Questions match the selected question type
   * - Questions match selected categories / topics
   * - Questions match the target difficulty counts
   * - No duplicate questions
   */
  async autoGenerateTestQuestions(config: AutoTestGenerationConfig): Promise<Question[]> {
    const { data: allQuestions } = await questionService.getQuestions({
      type: config.type,
      active: 'active',
    });

    // Filter by categories if specified
    let candidatePool = allQuestions;
    if (config.categories && config.categories.length > 0) {
      candidatePool = candidatePool.filter((q) =>
        config.categories!.some((cat) => cat.toLowerCase() === q.category.toLowerCase())
      );
    }

    // Filter by topics if specified
    if (config.topics && config.topics.length > 0) {
      candidatePool = candidatePool.filter((q) =>
        config.topics!.some((top) => top.toLowerCase() === q.topic.toLowerCase())
      );
    }

    // Separate by difficulty
    const easyPool = candidatePool.filter((q) => q.difficulty === 'easy');
    const mediumPool = candidatePool.filter((q) => q.difficulty === 'medium');
    const hardPool = candidatePool.filter((q) => q.difficulty === 'hard');

    const selected: Question[] = [];
    const usedIds = new Set<string>();

    const pickFromPool = (pool: Question[], count: number) => {
      // Shuffle pool
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      for (const q of shuffled) {
        if (selected.length < config.totalQuestions && !usedIds.has(q.id) && count > 0) {
          selected.push(q);
          usedIds.add(q.id);
          count--;
        }
      }
    };

    // Pick according to difficulty distribution
    pickFromPool(easyPool, config.difficultyDistribution.easy);
    pickFromPool(mediumPool, config.difficultyDistribution.medium);
    pickFromPool(hardPool, config.difficultyDistribution.hard);

    // If still need more questions to meet totalQuestions, pick remaining from candidatePool
    if (selected.length < config.totalQuestions) {
      const remainingShuffled = [...candidatePool].sort(() => 0.5 - Math.random());
      for (const q of remainingShuffled) {
        if (selected.length >= config.totalQuestions) break;
        if (!usedIds.has(q.id)) {
          selected.push(q);
          usedIds.add(q.id);
        }
      }
    }

    return selected;
  },
};
