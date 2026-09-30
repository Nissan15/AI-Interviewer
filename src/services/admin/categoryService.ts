import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Category, Topic, QuestionType } from '../../types/admin';

export const DEFAULT_APTITUDE_CATEGORIES: string[] = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
];

export const DEFAULT_APTITUDE_TOPICS: Record<string, string[]> = {
  'Quantitative Aptitude': [
    'Percentages',
    'Profit and Loss',
    'Time and Work',
    'Time, Speed and Distance',
    'Probability',
    'Ratio and Proportion',
    'Number System',
    'Averages',
    'Permutations and Combinations',
  ],
  'Logical Reasoning': [
    'Logical Series',
    'Coding-Decoding',
    'Blood Relations',
    'Syllogisms',
    'Direction Sense',
    'Analogy',
  ],
  'Verbal Ability': [
    'Reading Comprehension',
    'Grammar',
    'Vocabulary',
    'Sentence Correction',
    'Para Jumbles',
  ],
  'Data Interpretation': [
    'Bar Charts',
    'Pie Charts',
    'Data Tables',
    'Line Graphs',
  ],
};

export const DEFAULT_TECHNICAL_CATEGORIES: string[] = [
  'Python',
  'Java',
  'JavaScript',
  'SQL',
  'React',
  'Computer Science Fundamentals',
];

export const DEFAULT_TECHNICAL_TOPICS: Record<string, string[]> = {
  'Python': ['Programming Fundamentals', 'OOP in Python', 'Data Structures in Python', 'Built-in Modules'],
  'Java': ['Core Java', 'OOP', 'Collections Framework', 'Multithreading', 'Exception Handling'],
  'JavaScript': ['ES6+ Features', 'Async/Await & Promises', 'Closures & Scopes', 'DOM & Events', 'Web Development'],
  'SQL': ['SQL Queries', 'Joins & Subqueries', 'Indexes & Constraints', 'Normalization', 'Aggregations'],
  'React': ['Components & Props', 'Hooks (useState, useEffect)', 'State Management', 'Virtual DOM', 'Frontend Architecture'],
  'Computer Science Fundamentals': [
    'OOP',
    'DBMS',
    'Operating Systems',
    'Computer Networks',
    'Data Structures',
    'Algorithms',
    'Software Engineering',
  ],
};

export const categoryService = {
  /**
   * Get all categories for a given question type ('aptitude' | 'technical')
   */
  async getCategories(type: QuestionType): Promise<string[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .eq('type', type)
          .order('name');

        if (!error && data && data.length > 0) {
          const names = Array.from(new Set(data.map((c) => c.name)));
          return names;
        }
      } catch (err) {
        console.warn('Falling back to default categories:', err);
      }
    }

    return type === 'aptitude' ? DEFAULT_APTITUDE_CATEGORIES : DEFAULT_TECHNICAL_CATEGORIES;
  },

  /**
   * Get topics for a specific category and question type
   */
  async getTopics(categoryName: string, type: QuestionType): Promise<string[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('name')
          .eq('type', type)
          .eq('category_name', categoryName)
          .order('name');

        if (!error && data && data.length > 0) {
          const names = Array.from(new Set(data.map((t) => t.name)));
          return names;
        }
      } catch (err) {
        console.warn('Falling back to default topics:', err);
      }
    }

    const topicMap = type === 'aptitude' ? DEFAULT_APTITUDE_TOPICS : DEFAULT_TECHNICAL_TOPICS;
    if (topicMap[categoryName]) {
      return topicMap[categoryName];
    }

    // Default CS fundamentals topics if category is not mapped
    if (type === 'technical') {
      return DEFAULT_TECHNICAL_TOPICS['Computer Science Fundamentals'];
    }

    return DEFAULT_APTITUDE_TOPICS['Quantitative Aptitude'];
  },

  /**
   * Create category in Supabase
   */
  async createCategory(name: string, type: QuestionType): Promise<{ success: boolean; error: string | null }> {
    if (!name.trim()) return { success: false, error: 'Category name is required' };
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({ name: name.trim(), type });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create category' };
    }
  },

  /**
   * Create topic in Supabase
   */
  async createTopic(
    name: string,
    categoryName: string,
    type: QuestionType
  ): Promise<{ success: boolean; error: string | null }> {
    if (!name.trim() || !categoryName.trim()) {
      return { success: false, error: 'Topic and category names are required' };
    }
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('topics')
        .insert({ name: name.trim(), category_name: categoryName.trim(), type });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create topic' };
    }
  },
};
