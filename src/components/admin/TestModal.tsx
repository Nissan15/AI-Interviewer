import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ListFilter,
  Check,
  Search,
  AlertCircle,
  FileCheck,
  Plus,
  HelpCircle,
  Clock,
  Award,
} from 'lucide-react';
import { Modal } from '../common/Modal/Modal';
import { Button } from '../common/Button/Button';
import {
  Test,
  CreateTestDTO,
  QuestionType,
  TestStatus,
  Question,
  TestDifficultyDistribution,
} from '../../types/admin';
import { questionService } from '../../services/admin/questionService';
import { testManagementService } from '../../services/admin/testManagementService';
import { categoryService } from '../../services/admin/categoryService';
import './TestModal.css';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testData: CreateTestDTO, testId?: string) => Promise<void>;
  editingTest?: Test | null;
  defaultType?: QuestionType;
}

export const TestModal: React.FC<TestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTest,
  defaultType = 'aptitude',
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<QuestionType>(defaultType);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [status, setStatus] = useState<TestStatus>('draft');

  // Generation / Selection mode: 'auto' | 'manual'
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');

  // Difficulty distribution for auto generation
  const [distribution, setDistribution] = useState<TestDifficultyDistribution>({
    easy: 4,
    medium: 4,
    hard: 2,
  });

  // Selected categories/topics
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Manual questions pool and selected question IDs
  const [questionsPool, setQuestionsPool] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate state
  useEffect(() => {
    if (editingTest) {
      setTitle(editingTest.title);
      setDescription(editingTest.description || '');
      setType(editingTest.type);
      setDurationMinutes(editingTest.duration_minutes || 20);
      setStatus(editingTest.status);
      setDistribution(editingTest.difficulty_distribution || { easy: 4, medium: 4, hard: 2 });
      setSelectedCategories(editingTest.categories || []);
      setSelectionMode('manual');
    } else {
      setTitle('');
      setDescription('');
      setType(defaultType);
      setDurationMinutes(20);
      setStatus('draft');
      setDistribution({ easy: 4, medium: 4, hard: 2 });
      setSelectedCategories([]);
      setSelectedQuestionIds([]);
      setSelectionMode('auto');
    }
    setStep(1);
    setErrors({});
  }, [editingTest, defaultType, isOpen]);

  // Load available categories when type changes
  useEffect(() => {
    const loadCats = async () => {
      const cats = await categoryService.getCategories(type);
      setAvailableCategories(cats);
    };
    loadCats();
  }, [type]);

  // Load questions pool for selection
  useEffect(() => {
    const loadPool = async () => {
      const { data } = await questionService.getQuestions({
        type,
        active: 'active',
      });
      setQuestionsPool(data);
    };
    if (isOpen) {
      loadPool();
    }
  }, [type, isOpen]);

  const targetQuestionCount = distribution.easy + distribution.medium + distribution.hard;

  const toggleCategorySelection = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleAutoGenerate = async () => {
    const questions = await testManagementService.autoGenerateTestQuestions({
      type,
      totalQuestions: targetQuestionCount,
      difficultyDistribution: distribution,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
    setSelectedQuestionIds(questions.map((q) => q.id));
  };

  const handleNextStep = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Test title is required';
    if (durationMinutes <= 0) errs.duration = 'Duration must be greater than 0';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (selectionMode === 'auto' && selectedQuestionIds.length === 0) {
      await handleAutoGenerate();
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (selectedQuestionIds.length === 0) {
      setErrors({ step2: 'Please select or generate at least 1 question for this test.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: CreateTestDTO = {
        title: title.trim(),
        description: description.trim(),
        type,
        duration_minutes: durationMinutes,
        total_questions: selectedQuestionIds.length,
        total_marks: selectedQuestionIds.length,
        difficulty_distribution: distribution,
        categories: selectedCategories,
        topics: [],
        status,
        question_ids: selectedQuestionIds,
      };

      await onSave(dto, editingTest?.id);
      onClose();
    } catch (err: any) {
      setErrors({ step2: err.message || 'Failed to save test' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter pool for manual questions browsing
  const filteredPool = questionsPool.filter((q) => {
    const matchesSearch =
      !searchQuery.trim() ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesCat =
      selectedCategories.length === 0 ||
      selectedCategories.some((c) => c.toLowerCase() === q.category.toLowerCase());
    return matchesSearch && matchesDiff && matchesCat;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTest ? 'Edit Assessment Test' : 'Create Assessment Test'}
      description="Bundle questions from the repository into standardized placement assessments"
      maxWidth="xl"
      footer={
        <div className="test-modal-footer">
          {step === 2 && (
            <Button variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
              Back to Configuration
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button variant="primary" onClick={handleNextStep}>
              Next: Select Questions &rarr;
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<FileCheck size={16} />}
              onClick={handleFinalSubmit}
              disabled={isSubmitting || selectedQuestionIds.length === 0}
            >
              {isSubmitting
                ? 'Saving Test...'
                : editingTest
                ? 'Update Test'
                : `Save & Author Test (${selectedQuestionIds.length} Qs)`}
            </Button>
          )}
        </div>
      }
    >
      <div className="test-modal-content">
        {/* Step Indicator */}
        <div className="test-step-indicator">
          <div className={`step-item ${step === 1 ? 'step-active' : 'step-completed'}`}>
            <span className="step-num">1</span>
            <span className="step-title">Test Details &amp; Distribution</span>
          </div>
          <div className="step-line" />
          <div className={`step-item ${step === 2 ? 'step-active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-title">Question Selection &amp; Review</span>
          </div>
        </div>

        {/* STEP 1: Basic Config & Distribution */}
        {step === 1 && (
          <div className="test-step-pane">
            <div className="form-group">
              <label className="form-label" htmlFor="test-title">
                Test Name <span className="req-star">*</span>
              </label>
              <input
                id="test-title"
                type="text"
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                placeholder="e.g., Aptitude Placement Screening - Basic"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="test-desc">
                Description &amp; Candidate Instructions
              </label>
              <textarea
                id="test-desc"
                className="form-textarea"
                rows={2}
                placeholder="Brief description of skills tested, evaluation criteria, and guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-grid-3">
              {/* Type */}
              <div className="form-group">
                <label className="form-label">Round Type</label>
                <div className="test-type-toggle">
                  <button
                    type="button"
                    className={`test-type-btn ${type === 'aptitude' ? 'type-btn-active' : ''}`}
                    onClick={() => {
                      setType('aptitude');
                      setSelectedCategories([]);
                      setSelectedQuestionIds([]);
                    }}
                    disabled={Boolean(editingTest)}
                  >
                    Aptitude
                  </button>
                  <button
                    type="button"
                    className={`test-type-btn ${type === 'technical' ? 'type-btn-active' : ''}`}
                    onClick={() => {
                      setType('technical');
                      setSelectedCategories([]);
                      setSelectedQuestionIds([]);
                    }}
                    disabled={Boolean(editingTest)}
                  >
                    Technical
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div className="form-group">
                <label className="form-label" htmlFor="test-duration">
                  Duration (Minutes) <span className="req-star">*</span>
                </label>
                <input
                  id="test-duration"
                  type="number"
                  min={5}
                  max={180}
                  className={`form-input ${errors.duration ? 'input-error' : ''}`}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="test-status">
                  Initial Status
                </label>
                <select
                  id="test-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TestStatus)}
                >
                  <option value="draft">Draft (Admin Only)</option>
                  <option value="published">Published (Visible to Candidates)</option>
                  <option value="unpublished">Unpublished (Archived)</option>
                </select>
              </div>
            </div>

            {/* Category Filter Selection */}
            <div className="form-group">
              <label className="form-label">
                Target Categories (Leave empty to allow all categories)
              </label>
              <div className="category-chips-list">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-chip ${isSelected ? 'cat-chip-selected' : ''}`}
                      onClick={() => toggleCategorySelection(cat)}
                    >
                      {cat}
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Selection Method */}
            <div className="selection-mode-card">
              <label className="form-label">Question Generation Strategy</label>
              <div className="mode-options-grid">
                <div
                  className={`mode-option-box ${selectionMode === 'auto' ? 'mode-box-selected' : ''}`}
                  onClick={() => setSelectionMode('auto')}
                >
                  <div className="mode-header">
                    <Sparkles size={18} className="text-accent" />
                    <strong>Automatic Filter Generation</strong>
                  </div>
                  <p className="mode-desc">
                    Auto-select active non-duplicate questions matching your difficulty distribution and category filters.
                  </p>
                </div>

                <div
                  className={`mode-option-box ${selectionMode === 'manual' ? 'mode-box-selected' : ''}`}
                  onClick={() => setSelectionMode('manual')}
                >
                  <div className="mode-header">
                    <ListFilter size={18} className="text-accent" />
                    <strong>Manual Selection</strong>
                  </div>
                  <p className="mode-desc">
                    Browse the Question Bank, search by keyword, and pick specific questions.
                  </p>
                </div>
              </div>

              {/* Difficulty distribution controls if auto */}
              {selectionMode === 'auto' && (
                <div className="difficulty-dist-controls">
                  <span className="dist-label">Difficulty Distribution:</span>
                  <div className="dist-inputs-row">
                    <div className="dist-input-group">
                      <span className="dist-tag tag-easy">Easy:</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="form-input dist-field"
                        value={distribution.easy}
                        onChange={(e) =>
                          setDistribution((prev) => ({ ...prev, easy: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="dist-input-group">
                      <span className="dist-tag tag-medium">Medium:</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="form-input dist-field"
                        value={distribution.medium}
                        onChange={(e) =>
                          setDistribution((prev) => ({ ...prev, medium: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="dist-input-group">
                      <span className="dist-tag tag-hard">Hard:</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="form-input dist-field"
                        value={distribution.hard}
                        onChange={(e) =>
                          setDistribution((prev) => ({ ...prev, hard: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="dist-total">
                      Total: <strong>{targetQuestionCount} questions</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Question Selection & Confirmation */}
        {step === 2 && (
          <div className="test-step-pane">
            {errors.step2 && (
              <div className="form-error-banner">
                <AlertCircle size={16} />
                <span>{errors.step2}</span>
              </div>
            )}

            <div className="selection-toolbar">
              <div className="selected-summary-bar">
                <span className="selected-count-badge">
                  {selectedQuestionIds.length} Questions Selected
                </span>
                <span className="duration-tag">
                  <Clock size={14} /> {durationMinutes} Mins
                </span>
                <span className="marks-tag">
                  <Award size={14} /> {selectedQuestionIds.length} Total Marks
                </span>

                {selectionMode === 'auto' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Sparkles size={14} />}
                    onClick={handleAutoGenerate}
                  >
                    Re-roll Questions
                  </Button>
                )}
              </div>

              {/* Search & filter row */}
              <div className="selection-filter-row">
                <div className="search-field-wrap">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="form-input search-input"
                    placeholder="Search available questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="form-select filter-diff-select"
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="hard">Hard Only</option>
                </select>
              </div>
            </div>

            {/* Questions Selection List */}
            <div className="questions-selection-scroll">
              {filteredPool.length === 0 ? (
                <div className="empty-pool-message">
                  No active questions found matching the selected criteria.
                </div>
              ) : (
                filteredPool.map((q, idx) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`question-select-row ${isChecked ? 'row-selected' : ''}`}
                      onClick={() => toggleQuestionSelection(q.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by row onClick
                        className="select-checkbox"
                      />
                      <div className="q-preview-info">
                        <span className="q-num-tag">#{idx + 1}</span>
                        <p className="q-preview-text">{q.question}</p>
                        <div className="q-meta-tags">
                          <span className="meta-pill">{q.category}</span>
                          <span className="meta-pill">{q.topic}</span>
                          <span className={`diff-tag diff-${q.difficulty}`}>{q.difficulty}</span>
                          <span className="answer-tag">Answer: {q.correct_answer}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
