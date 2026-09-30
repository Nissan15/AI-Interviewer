import * as XLSX from 'xlsx';
import {
  BulkUploadRow,
  BulkUploadValidationResult,
  CreateQuestionDTO,
  QuestionType,
  QuestionDifficulty,
} from '../../types/admin';
import { questionService } from './questionService';

export const SAMPLE_APTITUDE_TEMPLATE_ROWS = [
  {
    question: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
    option_a: '65 seconds',
    option_b: '89 seconds',
    option_c: '100 seconds',
    option_d: '150 seconds',
    correct_answer: '89 seconds',
    category: 'Quantitative Aptitude',
    topic: 'Time, Speed and Distance',
    difficulty: 'medium',
    explanation: 'Speed = 240 / 24 = 10 m/s. Total distance = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds.',
    marks: 1,
    time_limit: 60,
  },
  {
    question: 'In a certain code, COMPUTER is written as RFUVQNPC. How is MEDICINE written in that code?',
    option_a: 'MFEDJJOE',
    option_b: 'EOJDEJFM',
    option_c: 'MFEJDJOE',
    option_d: 'EOJDJEFM',
    correct_answer: 'EOJDJEFM',
    category: 'Logical Reasoning',
    topic: 'Coding-Decoding',
    difficulty: 'hard',
    explanation: 'Reverse the word and shift each letter by +1, keeping first and last letter unchanged.',
    marks: 1,
    time_limit: 60,
  },
  {
    question: 'Choose the antonym for the word: OBSCURE',
    option_a: 'Explicit',
    option_b: 'Hidden',
    option_c: 'Vague',
    option_d: 'Doubtful',
    correct_answer: 'Explicit',
    category: 'Verbal Ability',
    topic: 'Grammar',
    difficulty: 'easy',
    explanation: 'Obscure means unclear or hard to perceive; explicit means clearly stated and plain.',
    marks: 1,
    time_limit: 45,
  },
];

export const SAMPLE_TECHNICAL_TEMPLATE_ROWS = [
  {
    question: 'What is the time complexity of searching in a balanced Binary Search Tree (AVL Tree)?',
    option_a: 'O(1)',
    option_b: 'O(n)',
    option_c: 'O(log n)',
    option_d: 'O(n log n)',
    correct_answer: 'O(log n)',
    technology: 'Computer Science Fundamentals',
    category: 'Computer Science Fundamentals',
    topic: 'Data Structures',
    difficulty: 'medium',
    explanation: 'A balanced BST guarantees tree height of O(log n), so search is O(log n).',
    marks: 1,
    time_limit: 60,
  },
  {
    question: 'In Python, what is the output of bool([]) and bool([0])?',
    option_a: 'False and False',
    option_b: 'False and True',
    option_c: 'True and False',
    option_d: 'True and True',
    correct_answer: 'False and True',
    technology: 'Python',
    category: 'Python',
    topic: 'Programming Fundamentals',
    difficulty: 'easy',
    explanation: 'Empty collection [] evaluates to False, while non-empty collection [0] evaluates to True in Python.',
    marks: 1,
    time_limit: 45,
  },
  {
    question: 'Which SQL clause is used to filter records after aggregation with GROUP BY?',
    option_a: 'WHERE',
    option_b: 'FILTER BY',
    option_c: 'HAVING',
    option_d: 'ORDER BY',
    correct_answer: 'HAVING',
    technology: 'SQL',
    category: 'SQL',
    topic: 'SQL Queries',
    difficulty: 'easy',
    explanation: 'HAVING filters aggregate result rows after GROUP BY, whereas WHERE filters individual rows before grouping.',
    marks: 1,
    time_limit: 45,
  },
];

export const bulkUploadService = {
  /**
   * Generate downloadable sample CSV template
   */
  downloadSampleCSV(type: QuestionType): void {
    const rows = type === 'aptitude' ? SAMPLE_APTITUDE_TEMPLATE_ROWS : SAMPLE_TECHNICAL_TEMPLATE_ROWS;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_questions_sample_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Generate downloadable sample Excel (.xlsx) template
   */
  downloadSampleExcel(type: QuestionType): void {
    const rows = type === 'aptitude' ? SAMPLE_APTITUDE_TEMPLATE_ROWS : SAMPLE_TECHNICAL_TEMPLATE_ROWS;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    XLSX.writeFile(workbook, `${type}_questions_sample_template.xlsx`);
  },

  /**
   * Parse and validate file (CSV or Excel)
   */
  async parseAndValidateFile(
    file: File,
    type: QuestionType
  ): Promise<BulkUploadValidationResult> {
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCsv && !isExcel) {
      throw new Error('Unsupported file format. Please upload a .csv or .xlsx file.');
    }

    const dataBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(dataBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('The uploaded spreadsheet contains no sheets.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new Error('The uploaded file is empty. Please add questions before uploading.');
    }

    // Required columns
    const requiredKeys = [
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct_answer',
      'category',
      'topic',
      'difficulty',
    ];

    // Check header of the first row
    const firstRowKeys = Object.keys(rawRows[0]).map((k) => k.trim().toLowerCase());
    const missingKeys = requiredKeys.filter((req) => !firstRowKeys.includes(req));

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required columns: ${missingKeys.join(', ')}. Please use the downloadable sample template.`
      );
    }

    // Validate each row
    const validRows: BulkUploadRow[] = [];
    const invalidRows: BulkUploadRow[] = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // header is row 1
      const normalized: Record<string, string> = {};
      Object.keys(row).forEach((k) => {
        normalized[k.trim().toLowerCase()] = String(row[k] ?? '').trim();
      });

      const question = normalized['question'] || '';
      const optionA = normalized['option_a'] || '';
      const optionB = normalized['option_b'] || '';
      const optionC = normalized['option_c'] || '';
      const optionD = normalized['option_d'] || '';
      const correctAnswer = normalized['correct_answer'] || '';
      const category = normalized['category'] || '';
      const topic = normalized['topic'] || '';
      const difficultyRaw = (normalized['difficulty'] || '').toLowerCase();
      const explanation = normalized['explanation'] || '';
      const marks = normalized['marks'] || '1';
      const timeLimit = normalized['time_limit'] || '60';
      const technology = normalized['technology'] || normalized['category'] || undefined;

      const errors: string[] = [];

      // Validations
      if (!question) errors.push('Question text is missing.');
      if (!optionA) errors.push('Option A is missing.');
      if (!optionB) errors.push('Option B is missing.');
      if (!optionC) errors.push('Option C is missing.');
      if (!optionD) errors.push('Option D is missing.');
      if (!category) errors.push('Category is missing.');
      if (!topic) errors.push('Topic is missing.');

      // Difficulty validation
      const validDifficulties: QuestionDifficulty[] = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(difficultyRaw as QuestionDifficulty)) {
        errors.push(`Difficulty "${difficultyRaw}" is invalid. Must be easy, medium, or hard.`);
      }

      // Correct answer validation
      if (!correctAnswer) {
        errors.push('Correct answer is missing.');
      } else {
        const matchFound =
          correctAnswer.toLowerCase() === optionA.toLowerCase() ||
          correctAnswer.toLowerCase() === optionB.toLowerCase() ||
          correctAnswer.toLowerCase() === optionC.toLowerCase() ||
          correctAnswer.toLowerCase() === optionD.toLowerCase() ||
          ['a', 'b', 'c', 'd', 'option a', 'option b', 'option c', 'option d'].includes(correctAnswer.toLowerCase());

        if (!matchFound) {
          errors.push(
            `Correct answer "${correctAnswer}" must match one of Option A, B, C, D text or letter.`
          );
        }
      }

      // Resolve final correct answer string (if given as "A", "Option A", etc.)
      let resolvedCorrectAnswer = correctAnswer;
      const lowerAns = correctAnswer.toLowerCase();
      if (lowerAns === 'a' || lowerAns === 'option a') resolvedCorrectAnswer = optionA;
      else if (lowerAns === 'b' || lowerAns === 'option b') resolvedCorrectAnswer = optionB;
      else if (lowerAns === 'c' || lowerAns === 'option c') resolvedCorrectAnswer = optionC;
      else if (lowerAns === 'd' || lowerAns === 'option d') resolvedCorrectAnswer = optionD;

      const uploadRow: BulkUploadRow = {
        rowNumber,
        question,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: resolvedCorrectAnswer,
        category,
        topic,
        difficulty: validDifficulties.includes(difficultyRaw as QuestionDifficulty) ? difficultyRaw : 'medium',
        explanation,
        marks,
        time_limit: timeLimit,
        technology: type === 'technical' ? technology : undefined,
        isValid: errors.length === 0,
        errors,
      };

      if (uploadRow.isValid) {
        validRows.push(uploadRow);
      } else {
        invalidRows.push(uploadRow);
      }
    });

    return {
      totalRows: rawRows.length,
      validRows,
      invalidRows,
      canImport: validRows.length > 0,
    };
  },

  /**
   * Import validated rows into Question Bank
   */
  async importValidQuestions(
    validRows: BulkUploadRow[],
    type: QuestionType
  ): Promise<{ importedCount: number; error: string | null }> {
    const dtoList: CreateQuestionDTO[] = validRows.map((r) => ({
      type,
      question: r.question,
      option_a: r.option_a,
      option_b: r.option_b,
      option_c: r.option_c,
      option_d: r.option_d,
      correct_answer: r.correct_answer,
      category: r.category,
      topic: r.topic,
      difficulty: r.difficulty as QuestionDifficulty,
      explanation: r.explanation,
      marks: Number(r.marks) || 1,
      time_limit: Number(r.time_limit) || 60,
      technology: r.technology,
      active: true,
    }));

    const result = await questionService.bulkCreateQuestions(dtoList);
    return {
      importedCount: result.count,
      error: result.error,
    };
  },
};
