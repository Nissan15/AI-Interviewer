import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Clock,
  Award,
  Layers,
  Edit2,
  Trash2,
  Globe,
  Archive,
  RefreshCw,
  HelpCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Test, QuestionType, TestStatus, CreateTestDTO } from '../../types/admin';
import { testManagementService } from '../../services/admin/testManagementService';
import { Button } from '../../components/common/Button/Button';
import { TestModal } from '../../components/admin/TestModal';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import './TestManagementPage.css';

export const TestManagementPage: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'aptitude' | 'technical'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TestStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Delete/Unpublish Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    test: Test | null;
    actionText: string;
    variant: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    test: null,
    actionText: 'Confirm',
    variant: 'danger',
    onConfirm: () => {},
  });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data } = await testManagementService.getTests();
      setTests(data);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Filtered tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (activeTypeTab !== 'all' && t.type !== activeTypeTab) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [tests, activeTypeTab, statusFilter, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingTest(null);
    setIsTestModalOpen(true);
  };

  const handleOpenEdit = (t: Test) => {
    setEditingTest(t);
    setIsTestModalOpen(true);
  };

  const handleTogglePublish = (t: Test) => {
    const isCurrentlyPublished = t.status === 'published';
    const newStatus: TestStatus = isCurrentlyPublished ? 'unpublished' : 'published';

    setConfirmModal({
      isOpen: true,
      title: isCurrentlyPublished ? 'Unpublish Assessment Test' : 'Publish Assessment Test',
      message: isCurrentlyPublished
        ? `Are you sure you want to unpublish "${t.title}"? It will no longer be visible or attemptable by students.`
        : `Are you sure you want to publish "${t.title}"? It will immediately become available to all authenticated candidates.`,
      test: t,
      actionText: isCurrentlyPublished ? 'Unpublish' : 'Publish Test',
      variant: isCurrentlyPublished ? 'warning' : 'warning',
      onConfirm: async () => {
        await testManagementService.updateTestStatus(t.id, newStatus);
        await fetchTests();
      },
    });
  };

  const handleDelete = (t: Test) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Assessment Test',
      message: `Are you sure you want to permanently delete "${t.title}"? Associated question records in the Question Bank will NOT be affected.`,
      test: t,
      actionText: 'Delete Test',
      variant: 'danger',
      onConfirm: async () => {
        await testManagementService.deleteTest(t.id);
        await fetchTests();
      },
    });
  };

  const handleSaveTest = async (dto: CreateTestDTO, editingId?: string) => {
    if (editingId) {
      await testManagementService.updateTest(editingId, dto);
    } else {
      await testManagementService.createTest(dto);
    }
    await fetchTests();
  };

  return (
    <div className="test-management-container animate-fade-in">
      {/* Top Toolbar */}
      <div className="tm-top-toolbar">
        {/* Type Tabs */}
        <div className="tm-type-tabs">
          <button
            type="button"
            className={`tm-tab-btn ${activeTypeTab === 'all' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTypeTab('all')}
          >
            All Tests ({tests.length})
          </button>
          <button
            type="button"
            className={`tm-tab-btn ${activeTypeTab === 'aptitude' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTypeTab('aptitude')}
          >
            Aptitude ({tests.filter((t) => t.type === 'aptitude').length})
          </button>
          <button
            type="button"
            className={`tm-tab-btn ${activeTypeTab === 'technical' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTypeTab('technical')}
          >
            Technical ({tests.filter((t) => t.type === 'technical').length})
          </button>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={handleOpenAdd}
        >
          Create Assessment Test
        </Button>
      </div>

      {/* Filter Ribbon: Search & Status Dropdown */}
      <div className="tm-filters-ribbon">
        <div className="filter-search-box">
          <Search size={14} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search tests by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-status-select-wrap">
          <label className="filter-label">Status:</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published (Candidate Accessible)</option>
            <option value="draft">Draft (Admin Authoring)</option>
            <option value="unpublished">Unpublished (Archived)</option>
          </select>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchTests}
          title="Refresh test assessments"
        >
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
        </button>
      </div>

      {/* Results Header */}
      <div className="tm-results-header">
        <span className="results-count">
          Showing <strong>{filteredTests.length}</strong> authored assessments
        </span>
        {(searchQuery || statusFilter !== 'all') && (
          <button
            type="button"
            className="clear-filters-link"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="tm-loading-state">
          <div className="admin-loading-spinner" />
          <p>Loading assessment tests...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="tm-empty-state">
          <HelpCircle size={40} className="text-muted" />
          <h4>No placement tests authored yet</h4>
          <p>Create a test by packaging questions from your Question Bank.</p>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            Create First Test
          </Button>
        </div>
      ) : (
        <div className="tm-tests-grid">
          {filteredTests.map((test) => {
            const isPublished = test.status === 'published';
            const isDraft = test.status === 'draft';

            return (
              <div key={test.id} className="test-card-box">
                {/* Header: Title & Status */}
                <div className="test-card-top">
                  <div className="test-title-group">
                    <span
                      className={`test-type-pill ${
                        test.type === 'aptitude' ? 'pill-apt' : 'pill-tech'
                      }`}
                    >
                      {test.type} Round
                    </span>
                    <h3 className="test-box-title" title={test.title}>
                      {test.title}
                    </h3>
                  </div>

                  <span className={`status-pill status-${test.status}`}>
                    {test.status === 'published' && <Globe size={11} />}
                    {test.status}
                  </span>
                </div>

                {/* Description */}
                <p className="test-box-desc">
                  {test.description || 'Standard timed placement assessment.'}
                </p>

                {/* Meta details */}
                <div className="test-metrics-row">
                  <div className="test-metric-item">
                    <Layers size={14} className="text-accent" />
                    <span>
                      <strong>{test.total_questions}</strong> Questions
                    </span>
                  </div>
                  <div className="test-metric-item">
                    <Clock size={14} className="text-muted" />
                    <span>
                      <strong>{test.duration_minutes}</strong> Mins
                    </span>
                  </div>
                  <div className="test-metric-item">
                    <Award size={14} className="text-warning" />
                    <span>
                      <strong>{test.total_marks}</strong> Marks
                    </span>
                  </div>
                </div>

                {/* Categories tags */}
                {test.categories && test.categories.length > 0 && (
                  <div className="test-categories-chips">
                    {test.categories.map((c, idx) => (
                      <span key={idx} className="category-tag-pill">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="test-card-footer">
                  <button
                    type="button"
                    className={`publish-toggle-btn ${
                      isPublished ? 'btn-unpublish' : 'btn-publish'
                    }`}
                    onClick={() => handleTogglePublish(test)}
                  >
                    {isPublished ? (
                      <>
                        <Archive size={13} />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Globe size={13} />
                        Publish
                      </>
                    )}
                  </button>

                  <div className="footer-right-actions">
                    <button
                      type="button"
                      className="card-action-icon-btn"
                      onClick={() => handleOpenEdit(test)}
                      title="Edit Test Configuration"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      className="card-action-icon-btn btn-delete"
                      onClick={() => handleDelete(test)}
                      title="Delete Test"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setEditingTest(null);
        }}
        onSave={handleSaveTest}
        editingTest={editingTest}
        defaultType={activeTypeTab === 'technical' ? 'technical' : 'aptitude'}
      />

      <DeleteConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        itemName={confirmModal.test?.title}
        isSoftDelete={confirmModal.variant === 'warning'}
        actionText={confirmModal.actionText}
        variant={confirmModal.variant}
      />
    </div>
  );
};
