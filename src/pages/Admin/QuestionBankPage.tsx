import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Edit2,
  Power,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Layers,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  Question,
  QuestionType,
  QuestionDifficulty,
  CreateQuestionDTO,
} from '../../types/admin';
import { questionService } from '../../services/admin/questionService';
import { categoryService } from '../../services/admin/categoryService';
import { Button } from '../../components/common/Button/Button';
import { QuestionModal } from '../../components/admin/QuestionModal';
import { BulkUploadModal } from '../../components/admin/BulkUploadModal';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import './QuestionBankPage.css';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'aptitude' | 'technical'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | QuestionDifficulty>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Dynamic Categories & Topics for filter dropdowns
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);

  // Modals state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  // Delete/Deactivate Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    question: Question | null;
    isSoftDelete: boolean;
    actionText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    question: null,
    isSoftDelete: true,
    actionText: 'Confirm',
    onConfirm: () => {},
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await questionService.getQuestions();
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Update category options when activeTab changes
  useEffect(() => {
    const updateCategories = async () => {
      if (activeTab === 'all') {
        const [aptCats, techCats] = await Promise.all([
          categoryService.getCategories('aptitude'),
          categoryService.getCategories('technical'),
        ]);
        setCategoryOptions(Array.from(new Set([...aptCats, ...techCats])));
      } else {
        const cats = await categoryService.getCategories(activeTab);
        setCategoryOptions(cats);
      }
      setSelectedCategory('all');
      setSelectedTopic('all');
    };
    updateCategories();
  }, [activeTab]);

  // Update topic options when selectedCategory changes
  useEffect(() => {
    const updateTopics = async () => {
      if (selectedCategory === 'all') {
        setTopicOptions([]);
      } else {
        const targetType = activeTab === 'all' ? 'aptitude' : activeTab;
        const topics = await categoryService.getTopics(selectedCategory, targetType);
        setTopicOptions(topics);
      }
      setSelectedTopic('all');
    };
    updateTopics();
  }, [selectedCategory, activeTab]);

  // Client-side filtering
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Tab filter
      if (activeTab !== 'all' && q.type !== activeTab) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuestion = q.question.toLowerCase().includes(query);
        const matchesCategory = q.category.toLowerCase().includes(query);
        const matchesTopic = q.topic.toLowerCase().includes(query);
        const matchesTech = q.technology && q.technology.toLowerCase().includes(query);
        if (!matchesQuestion && !matchesCategory && !matchesTopic && !matchesTech) {
          return false;
        }
      }

      // 3. Category filter
      if (selectedCategory !== 'all' && q.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // 4. Topic filter
      if (selectedTopic !== 'all' && q.topic.toLowerCase() !== selectedTopic.toLowerCase()) {
        return false;
      }

      // 5. Difficulty filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // 6. Active/Inactive Status filter
      if (selectedStatus === 'active' && !q.active) return false;
      if (selectedStatus === 'inactive' && q.active) return false;

      return true;
    });
  }, [
    questions,
    activeTab,
    searchQuery,
    selectedCategory,
    selectedTopic,
    selectedDifficulty,
    selectedStatus,
  ]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setIsQuestionModalOpen(true);
  };

  const handleToggleActive = (q: Question) => {
    const newStatus = !q.active;
    setConfirmModal({
      isOpen: true,
      title: newStatus ? 'Reactivate Question' : 'Deactivate Question',
      message: newStatus
        ? `Are you sure you want to reactivate this question? It will become available for placement tests.`
        : `Are you sure you want to deactivate this question? It will be hidden from new candidate tests but preserved in repository history.`,
      question: q,
      isSoftDelete: true,
      actionText: newStatus ? 'Reactivate' : 'Deactivate',
      onConfirm: async () => {
        await questionService.toggleQuestionStatus(q.id, newStatus);
        await fetchQuestions();
      },
    });
  };

  const handleDelete = (q: Question) => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanent Question Deletion',
      message:
        'Are you sure you want to permanently delete this question? This cannot be undone.',
      question: q,
      isSoftDelete: false,
      actionText: 'Delete Permanently',
      onConfirm: async () => {
        await questionService.deleteQuestion(q.id, true);
        await fetchQuestions();
      },
    });
  };

  const handleSaveQuestion = async (dto: CreateQuestionDTO, editingId?: string) => {
    if (editingId) {
      await questionService.updateQuestion(editingId, dto);
    } else {
      await questionService.createQuestion(dto);
    }
    await fetchQuestions();
  };

  return (
    <div className="question-bank-container animate-fade-in">
      {/* Top Controls: Type Tabs & Action Buttons */}
      <div className="qb-top-toolbar">
        {/* Tabs: All, Aptitude, Technical */}
        <div className="qb-type-tabs">
          <button
            type="button"
            className={`qb-tab-btn ${activeTab === 'all' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Questions ({questions.length})
          </button>
          <button
            type="button"
            className={`qb-tab-btn ${activeTab === 'aptitude' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('aptitude')}
          >
            Aptitude Round ({questions.filter((q) => q.type === 'aptitude').length})
          </button>
          <button
            type="button"
            className={`qb-tab-btn ${activeTab === 'technical' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('technical')}
          >
            Technical Round ({questions.filter((q) => q.type === 'technical').length})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="qb-action-buttons">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload size={14} />}
            onClick={() => setIsBulkModalOpen(true)}
          >
            Bulk Upload (.csv / .xlsx)
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={handleOpenAdd}
          >
            Add Question
          </Button>
        </div>
      </div>

      {/* Filter Ribbon: Search, Category, Topic, Difficulty, Status */}
      <div className="qb-filters-ribbon">
        {/* Search */}
        <div className="filter-item-search">
          <Search size={14} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search questions by text or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Dropdown */}
        <div className="filter-item-select">
          <label className="filter-dropdown-label">Category:</label>
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Dropdown */}
        {topicOptions.length > 0 && (
          <div className="filter-item-select">
            <label className="filter-dropdown-label">Topic:</label>
            <select
              className="filter-select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">All Topics</option>
              {topicOptions.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty Dropdown */}
        <div className="filter-item-select">
          <label className="filter-dropdown-label">Difficulty:</label>
          <select
            className="filter-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Active/Inactive Status */}
        <div className="filter-item-select">
          <label className="filter-dropdown-label">Status:</label>
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchQuestions}
          title="Refresh question bank"
        >
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
        </button>
      </div>

      {/* Questions Count and Active Filters Bar */}
      <div className="qb-results-bar">
        <span className="results-count-text">
          Showing <strong>{filteredQuestions.length}</strong> of {questions.length} questions
        </span>

        {(searchQuery ||
          selectedCategory !== 'all' ||
          selectedTopic !== 'all' ||
          selectedDifficulty !== 'all' ||
          selectedStatus !== 'all') && (
          <button
            type="button"
            className="clear-filters-link"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedTopic('all');
              setSelectedDifficulty('all');
              setSelectedStatus('all');
            }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Questions Table / List View */}
      {loading ? (
        <div className="qb-loading-state">
          <div className="admin-loading-spinner" />
          <p>Loading questions repository...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="qb-empty-state">
          <HelpCircle size={40} className="text-muted" />
          <h4>No questions match your filter criteria</h4>
          <p>Try clearing filters or author a new question to populate this view.</p>
          <Button variant="secondary" size="sm" onClick={handleOpenAdd}>
            Add First Question
          </Button>
        </div>
      ) : (
        <div className="qb-table-wrapper">
          <table className="qb-questions-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Question</th>
                <th>Type</th>
                <th>Category &amp; Topic</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id} className={!q.active ? 'row-inactive' : ''}>
                  {/* Question Prompt */}
                  <td className="col-question">
                    <div className="question-cell-content">
                      <span className="question-text-title" title={q.question}>
                        {q.question}
                      </span>
                      <div className="question-cell-options">
                        <span className="cell-ans-chip" title={`Correct: ${q.correct_answer}`}>
                          Ans: {q.correct_answer}
                        </span>
                        {q.time_limit && <span className="cell-time-chip">{q.time_limit}s</span>}
                        {q.marks && <span className="cell-time-chip">{q.marks} Mark</span>}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    <span
                      className={`type-badge-pill ${
                        q.type === 'aptitude' ? 'badge-apt' : 'badge-tech'
                      }`}
                    >
                      {q.type}
                    </span>
                  </td>

                  {/* Category & Topic */}
                  <td>
                    <div className="cat-topic-cell">
                      <span className="cat-name">{q.category}</span>
                      <span className="topic-name">{q.topic}</span>
                      {q.technology && q.technology !== q.category && (
                        <span className="tech-name">({q.technology})</span>
                      )}
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td>
                    <span className={`diff-chip diff-${q.difficulty}`}>{q.difficulty}</span>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`status-pill-badge ${
                        q.active ? 'status-pill-active' : 'status-pill-inactive'
                      }`}
                    >
                      {q.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {q.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="col-date">
                    {new Date(q.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="col-actions">
                    <div className="actions-cell-group">
                      <button
                        type="button"
                        className="action-icon-btn btn-edit"
                        onClick={() => handleOpenEdit(q)}
                        title="Edit Question"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        className={`action-icon-btn ${
                          q.active ? 'btn-deactivate' : 'btn-reactivate'
                        }`}
                        onClick={() => handleToggleActive(q)}
                        title={q.active ? 'Deactivate Question' : 'Reactivate Question'}
                      >
                        <Power size={14} />
                      </button>

                      <button
                        type="button"
                        className="action-icon-btn btn-delete"
                        onClick={() => handleDelete(q)}
                        title="Delete Permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        editingQuestion={editingQuestion}
        defaultType={activeTab === 'technical' ? 'technical' : 'aptitude'}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={async () => {
          await fetchQuestions();
        }}
        defaultType={activeTab === 'technical' ? 'technical' : 'aptitude'}
      />

      <DeleteConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        itemName={confirmModal.question?.question}
        isSoftDelete={confirmModal.isSoftDelete}
        actionText={confirmModal.actionText}
        variant={confirmModal.isSoftDelete ? 'warning' : 'danger'}
      />
    </div>
  );
};
