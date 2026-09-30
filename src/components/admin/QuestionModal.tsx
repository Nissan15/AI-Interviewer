import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal/Modal';
import { Button } from '../common/Button/Button';
import {
  Question,
  CreateQuestionDTO,
  QuestionType,
  QuestionDifficulty,
} from '../../types/admin';
import {
  categoryService,
  DEFAULT_APTITUDE_CATEGORIES,
  DEFAULT_APTITUDE_TOPICS,
  DEFAULT_TECHNICAL_CATEGORIES,
  DEFAULT_TECHNICAL_TOPICS,
} from '../../services/admin/categoryService';
import './QuestionModal.css';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateQuestionDTO, editingId?: string) => Promise<void>;
  editingQuestion?: Question | null;
  defaultType?: QuestionType;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingQuestion,
  defaultType = 'aptitude',
}) => {
  const [type, setType] = useState<QuestionType>(defaultType);
  const [question, setQuestion] = useState<string>('');
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [optionC, setOptionC] = useState<string>('');
  const [optionD, setOptionD] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [category, setCategory] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [technology, setTechnology] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [marks, setMarks] = useState<number>(1);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [explanation, setExplanation] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);

  // Available categories & topics options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate fields whenever modal opens or editingQuestion changes
  useEffect(() => {
    if (editingQuestion) {
      setType(editingQuestion.type);
      setQuestion(editingQuestion.question);
      setOptionA(editingQuestion.option_a || editingQuestion.options[0] || '');
      setOptionB(editingQuestion.option_b || editingQuestion.options[1] || '');
      setOptionC(editingQuestion.option_c || editingQuestion.options[2] || '');
      setOptionD(editingQuestion.option_d || editingQuestion.options[3] || '');

      // Determine correct option letter
      const opts = [
        editingQuestion.option_a || editingQuestion.options[0],
        editingQuestion.option_b || editingQuestion.options[1],
        editingQuestion.option_c || editingQuestion.options[2],
        editingQuestion.option_d || editingQuestion.options[3],
      ];
      const matchIndex = opts.findIndex(
        (o) => o?.trim().toLowerCase() === editingQuestion.correct_answer.trim().toLowerCase()
      );
      if (matchIndex === 1) setCorrectOption('B');
      else if (matchIndex === 2) setCorrectOption('C');
      else if (matchIndex === 3) setCorrectOption('D');
      else setCorrectOption('A');

      setCategory(editingQuestion.category);
      setTopic(editingQuestion.topic);
      setTechnology(editingQuestion.technology || editingQuestion.category);
      setDifficulty(editingQuestion.difficulty);
      setMarks(editingQuestion.marks || 1);
      setTimeLimit(editingQuestion.time_limit || 60);
      setExplanation(editingQuestion.explanation || '');
      setActive(editingQuestion.active ?? true);
    } else {
      setType(defaultType);
      setQuestion('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectOption('A');
      setCategory(
        defaultType === 'aptitude' ? DEFAULT_APTITUDE_CATEGORIES[0] : DEFAULT_TECHNICAL_CATEGORIES[0]
      );
      setTopic('');
      setTechnology(defaultType === 'technical' ? DEFAULT_TECHNICAL_CATEGORIES[0] : '');
      setDifficulty('medium');
      setMarks(1);
      setTimeLimit(60);
      setExplanation('');
      setActive(true);
    }
    setErrors({});
  }, [editingQuestion, defaultType, isOpen]);

  // Load categories when type changes
  useEffect(() => {
    const loadCats = async () => {
      const cats = await categoryService.getCategories(type);
      setAvailableCategories(cats);
      if (!editingQuestion && (!category || !cats.includes(category))) {
        setCategory(cats[0] || '');
      }
    };
    loadCats();
  }, [type]);

  // Load topics when category changes
  useEffect(() => {
    const loadTopics = async () => {
      const currentCat = type === 'technical' ? (technology || category) : category;
      if (currentCat) {
        const topics = await categoryService.getTopics(currentCat, type);
        setAvailableTopics(topics);
        if (!editingQuestion && (!topic || !topics.includes(topic))) {
          setTopic(topics[0] || '');
        }
      }
    };
    loadTopics();
  }, [category, technology, type]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!question.trim()) errs.question = 'Question prompt text is required.';
    if (!optionA.trim()) errs.optionA = 'Option A is required.';
    if (!optionB.trim()) errs.optionB = 'Option B is required.';
    if (!optionC.trim()) errs.optionC = 'Option C is required.';
    if (!optionD.trim()) errs.optionD = 'Option D is required.';
    if (!category.trim()) errs.category = 'Category is required.';
    if (!topic.trim()) errs.topic = 'Topic is required.';
    if (type === 'technical' && !technology.trim()) {
      errs.technology = 'Technology is required.';
    }
    if (marks <= 0) errs.marks = 'Marks must be at least 1.';
    if (timeLimit <= 0) errs.timeLimit = 'Time limit must be at least 5 seconds.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Resolve correct answer string
    let resolvedAnswer = optionA.trim();
    if (correctOption === 'B') resolvedAnswer = optionB.trim();
    if (correctOption === 'C') resolvedAnswer = optionC.trim();
    if (correctOption === 'D') resolvedAnswer = optionD.trim();

    const dto: CreateQuestionDTO = {
      type,
      question: question.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_answer: resolvedAnswer,
      explanation: explanation.trim(),
      category: category.trim(),
      topic: topic.trim(),
      technology: type === 'technical' ? technology.trim() : undefined,
      difficulty,
      marks: Number(marks) || 1,
      time_limit: Number(timeLimit) || 60,
      active,
    };

    setIsSubmitting(true);
    try {
      await onSave(dto, editingQuestion?.id);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save question' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingQuestion ? 'Edit Question' : 'Author New Question'}
      description="Create or modify placement and technical assessment questions"
      maxWidth="lg"
      footer={
        <div className="question-modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Save size={16} />}
            onClick={handleFormSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="question-form-layout">
        {errors.form && (
          <div className="form-error-banner">
            <AlertCircle size={16} />
            <span>{errors.form}</span>
          </div>
        )}

        {/* 1. Question Type Selector (Aptitude vs Technical) */}
        <div className="form-type-row">
          <span className="type-row-label">Question Type:</span>
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn ${type === 'aptitude' ? 'type-btn-active' : ''}`}
              onClick={() => {
                setType('aptitude');
                setCategory(DEFAULT_APTITUDE_CATEGORIES[0]);
              }}
              disabled={Boolean(editingQuestion)}
            >
              Aptitude Round
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${type === 'technical' ? 'type-btn-active' : ''}`}
              onClick={() => {
                setType('technical');
                setCategory(DEFAULT_TECHNICAL_CATEGORIES[0]);
                setTechnology(DEFAULT_TECHNICAL_CATEGORIES[0]);
              }}
              disabled={Boolean(editingQuestion)}
            >
              Technical Round
            </button>
          </div>
          {editingQuestion && (
            <span className="type-locked-notice">(Type cannot be changed when editing)</span>
          )}
        </div>

        {/* 2. Question Text */}
        <div className="form-group">
          <label className="form-label" htmlFor="question-text">
            Question Text <span className="req-star">*</span>
          </label>
          <textarea
            id="question-text"
            className={`form-textarea ${errors.question ? 'input-error' : ''}`}
            rows={3}
            placeholder={
              type === 'aptitude'
                ? 'e.g., A car travels 180 km in 3 hours. How long will it take to travel 300 km at the same speed?'
                : 'e.g., Explain the difference between process and thread in modern Operating Systems.'
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          {errors.question && <span className="error-text">{errors.question}</span>}
        </div>

        {/* 3. Four Multiple Choice Options & Radio Selector for Correct Answer */}
        <div className="options-section">
          <div className="options-section-header">
            <label className="form-label">
              Answer Options &amp; Correct Answer Key <span className="req-star">*</span>
            </label>
            <span className="options-hint">Select the radio button next to the correct answer</span>
          </div>

          <div className="options-grid">
            {/* Option A */}
            <div className={`option-input-card ${correctOption === 'A' ? 'option-card-correct' : ''}`}>
              <div className="option-lead">
                <input
                  type="radio"
                  id="opt-radio-a"
                  name="correct_option"
                  checked={correctOption === 'A'}
                  onChange={() => setCorrectOption('A')}
                  className="correct-radio"
                />
                <label htmlFor="opt-radio-a" className="option-letter-badge">
                  A
                </label>
              </div>
              <input
                type="text"
                className={`form-input option-text-input ${errors.optionA ? 'input-error' : ''}`}
                placeholder="Option A text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
              />
            </div>

            {/* Option B */}
            <div className={`option-input-card ${correctOption === 'B' ? 'option-card-correct' : ''}`}>
              <div className="option-lead">
                <input
                  type="radio"
                  id="opt-radio-b"
                  name="correct_option"
                  checked={correctOption === 'B'}
                  onChange={() => setCorrectOption('B')}
                  className="correct-radio"
                />
                <label htmlFor="opt-radio-b" className="option-letter-badge">
                  B
                </label>
              </div>
              <input
                type="text"
                className={`form-input option-text-input ${errors.optionB ? 'input-error' : ''}`}
                placeholder="Option B text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
              />
            </div>

            {/* Option C */}
            <div className={`option-input-card ${correctOption === 'C' ? 'option-card-correct' : ''}`}>
              <div className="option-lead">
                <input
                  type="radio"
                  id="opt-radio-c"
                  name="correct_option"
                  checked={correctOption === 'C'}
                  onChange={() => setCorrectOption('C')}
                  className="correct-radio"
                />
                <label htmlFor="opt-radio-c" className="option-letter-badge">
                  C
                </label>
              </div>
              <input
                type="text"
                className={`form-input option-text-input ${errors.optionC ? 'input-error' : ''}`}
                placeholder="Option C text"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
              />
            </div>

            {/* Option D */}
            <div className={`option-input-card ${correctOption === 'D' ? 'option-card-correct' : ''}`}>
              <div className="option-lead">
                <input
                  type="radio"
                  id="opt-radio-d"
                  name="correct_option"
                  checked={correctOption === 'D'}
                  onChange={() => setCorrectOption('D')}
                  className="correct-radio"
                />
                <label htmlFor="opt-radio-d" className="option-letter-badge">
                  D
                </label>
              </div>
              <input
                type="text"
                className={`form-input option-text-input ${errors.optionD ? 'input-error' : ''}`}
                placeholder="Option D text"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
              />
            </div>
          </div>
          {(errors.optionA || errors.optionB || errors.optionC || errors.optionD) && (
            <span className="error-text">Please provide valid text for all 4 options.</span>
          )}
        </div>

        {/* 4. Taxonomy & Categorization Row */}
        <div className="form-grid-3">
          {type === 'technical' ? (
            /* Technology Selector for Technical questions */
            <div className="form-group">
              <label className="form-label" htmlFor="tech-select">
                Technology / Domain <span className="req-star">*</span>
              </label>
              <select
                id="tech-select"
                className={`form-select ${errors.technology ? 'input-error' : ''}`}
                value={technology}
                onChange={(e) => {
                  setTechnology(e.target.value);
                  setCategory(e.target.value);
                }}
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.technology && <span className="error-text">{errors.technology}</span>}
            </div>
          ) : (
            /* Category Selector for Aptitude questions */
            <div className="form-group">
              <label className="form-label" htmlFor="cat-select">
                Category <span className="req-star">*</span>
              </label>
              <select
                id="cat-select"
                className={`form-select ${errors.category ? 'input-error' : ''}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>
          )}

          {/* Topic Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="topic-input">
              Topic <span className="req-star">*</span>
            </label>
            <input
              id="topic-input"
              list="topic-options"
              type="text"
              className={`form-input ${errors.topic ? 'input-error' : ''}`}
              placeholder="e.g. Percentages, OOP, DBMS"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <datalist id="topic-options">
              {availableTopics.map((top) => (
                <option key={top} value={top} />
              ))}
            </datalist>
            {errors.topic && <span className="error-text">{errors.topic}</span>}
          </div>

          {/* Difficulty Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="difficulty-select">
              Difficulty <span className="req-star">*</span>
            </label>
            <select
              id="difficulty-select"
              className="form-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* 5. Metrics Row: Marks, Time Limit, Active Status */}
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label" htmlFor="marks-input">
              Marks per Question
            </label>
            <input
              id="marks-input"
              type="number"
              min={1}
              max={100}
              className={`form-input ${errors.marks ? 'input-error' : ''}`}
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
            />
            {errors.marks && <span className="error-text">{errors.marks}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="time-limit-input">
              Time Limit (Seconds)
            </label>
            <input
              id="time-limit-input"
              type="number"
              min={10}
              max={600}
              step={5}
              className={`form-input ${errors.timeLimit ? 'input-error' : ''}`}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
            />
            {errors.timeLimit && <span className="error-text">{errors.timeLimit}</span>}
          </div>

          <div className="form-group status-toggle-group">
            <label className="form-label">Question Availability</label>
            <label className="active-switch-label">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-slider" />
              <span className={`status-badge-text ${active ? 'status-active' : 'status-inactive'}`}>
                {active ? 'Active (Eligible for tests)' : 'Inactive (Draft/Hidden)'}
              </span>
            </label>
          </div>
        </div>

        {/* 6. Explanation */}
        <div className="form-group">
          <label className="form-label" htmlFor="explanation-text">
            Solution &amp; Explanation (Displayed to candidates after submission)
          </label>
          <textarea
            id="explanation-text"
            className="form-textarea"
            rows={2}
            placeholder="Provide step-by-step reasoning, mathematical breakdown, or conceptual explanation..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
