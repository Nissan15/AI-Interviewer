import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal/Modal';
import { Button } from '../common/Button/Button';
import {
  QuestionType,
  BulkUploadRow,
  BulkUploadValidationResult,
} from '../../types/admin';
import { bulkUploadService } from '../../services/admin/bulkUploadService';
import './BulkUploadModal.css';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  defaultType?: QuestionType;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'aptitude',
}) => {
  const [type, setType] = useState<QuestionType>(defaultType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<BulkUploadValidationResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setGeneralError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setGeneralError(null);
    setIsValidating(true);

    try {
      const result = await bulkUploadService.parseAndValidateFile(file, type);
      setValidationResult(result);
    } catch (err: any) {
      setValidationResult(null);
      setGeneralError(err.message || 'Failed to process file.');
    } finally {
      setIsValidating(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    setIsImporting(true);
    setGeneralError(null);

    try {
      const res = await bulkUploadService.importValidQuestions(validationResult.validRows, type);
      if (res.error) {
        setGeneralError(res.error);
      } else {
        onSuccess(res.importedCount);
        onClose();
        handleReset();
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to import questions');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Bulk Question Import"
      description="Upload CSV or Excel (.xlsx) files to import questions in batches"
      maxWidth="xl"
      footer={
        <div className="bulk-modal-footer">
          <Button
            variant="secondary"
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={isImporting}
          >
            Cancel
          </Button>

          {validationResult && (
            <Button
              variant="primary"
              leftIcon={<Upload size={16} />}
              disabled={isImporting || !validationResult.canImport}
              onClick={handleConfirmImport}
            >
              {isImporting
                ? 'Importing...'
                : `Confirm & Import ${validationResult.validRows.length} Questions`}
            </Button>
          )}
        </div>
      }
    >
      <div className="bulk-upload-content">
        {/* Step 1: Select Type & Download Template */}
        <div className="bulk-header-row">
          <div className="bulk-type-select-wrap">
            <span className="bulk-label">Target Round:</span>
            <div className="bulk-type-buttons">
              <button
                type="button"
                className={`bulk-type-pill ${type === 'aptitude' ? 'pill-active' : ''}`}
                onClick={() => {
                  setType('aptitude');
                  handleReset();
                }}
              >
                Aptitude Round
              </button>
              <button
                type="button"
                className={`bulk-type-pill ${type === 'technical' ? 'pill-active' : ''}`}
                onClick={() => {
                  setType('technical');
                  handleReset();
                }}
              >
                Technical Round
              </button>
            </div>
          </div>

          <div className="bulk-templates-wrap">
            <span className="bulk-label">Sample Templates:</span>
            <div className="template-btn-group">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileText size={14} />}
                onClick={() => bulkUploadService.downloadSampleCSV(type)}
              >
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileSpreadsheet size={14} />}
                onClick={() => bulkUploadService.downloadSampleExcel(type)}
              >
                Download Excel (.xlsx)
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Upload Zone */}
        {!validationResult && (
          <div
            className={`bulk-dropzone ${isDragging ? 'dropzone-active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, .xlsx, .xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="dropzone-icon">
              {isValidating ? (
                <RefreshCw size={36} className="spin-icon text-accent" />
              ) : (
                <Upload size={36} className="text-secondary" />
              )}
            </div>
            <div className="dropzone-text">
              <h4 className="dropzone-title">
                {isValidating ? 'Validating spreadsheet data...' : 'Drag & Drop CSV or Excel file here'}
              </h4>
              <p className="dropzone-sub">
                Supports .csv, .xlsx, .xls &bull; Maximum 500 questions per batch
              </p>
            </div>
            <Button variant="secondary" size="sm" type="button" disabled={isValidating}>
              Browse File
            </Button>
          </div>
        )}

        {/* Error notification */}
        {generalError && (
          <div className="bulk-error-alert">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="error-alert-content">
              <strong>Upload validation failed:</strong>
              <p>{generalError}</p>
            </div>
          </div>
        )}

        {/* Step 3: Validation Preview */}
        {validationResult && (
          <div className="bulk-preview-section">
            <div className="preview-summary-card">
              <div className="summary-file-info">
                <FileSpreadsheet size={20} className="text-accent" />
                <span className="file-name">{selectedFile?.name}</span>
                <span className="file-size">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                </span>
                <button
                  type="button"
                  className="re-upload-btn"
                  onClick={handleReset}
                  title="Upload a different file"
                >
                  Change File
                </button>
              </div>

              <div className="summary-metrics">
                <div className="metric-badge metric-total">
                  <span className="badge-count">{validationResult.totalRows}</span>
                  <span className="badge-label">Total Rows</span>
                </div>
                <div className="metric-badge metric-valid">
                  <CheckCircle2 size={16} />
                  <span className="badge-count">{validationResult.validRows.length}</span>
                  <span className="badge-label">Valid Ready</span>
                </div>
                <div className="metric-badge metric-invalid">
                  <XCircle size={16} />
                  <span className="badge-count">{validationResult.invalidRows.length}</span>
                  <span className="badge-label">Invalid Rows</span>
                </div>
              </div>
            </div>

            {validationResult.invalidRows.length > 0 && (
              <div className="invalid-rows-warning">
                <Info size={16} />
                <span>
                  <strong>{validationResult.invalidRows.length} invalid rows</strong> were detected
                  and will be skipped. Only valid rows will be imported into Supabase.
                </span>
              </div>
            )}

            {/* Validation Table Preview */}
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>Question</th>
                    <th>Correct Answer</th>
                    <th>Category / Topic</th>
                    <th>Difficulty</th>
                    <th>Errors / Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Invalid Rows First */}
                  {validationResult.invalidRows.map((row) => (
                    <tr key={`inv_${row.rowNumber}`} className="row-invalid">
                      <td>#{row.rowNumber}</td>
                      <td>
                        <span className="status-chip chip-error">
                          <XCircle size={12} /> Invalid
                        </span>
                      </td>
                      <td className="cell-question" title={row.question}>
                        {row.question || <em className="text-muted">[Missing question text]</em>}
                      </td>
                      <td>{row.correct_answer || '-'}</td>
                      <td>
                        {row.category} &bull; {row.topic}
                      </td>
                      <td>
                        <span className="chip-diff">{row.difficulty || '-'}</span>
                      </td>
                      <td className="cell-errors">
                        <ul className="row-errors-list">
                          {row.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}

                  {/* Valid Rows */}
                  {validationResult.validRows.slice(0, 50).map((row) => (
                    <tr key={`val_${row.rowNumber}`} className="row-valid">
                      <td>#{row.rowNumber}</td>
                      <td>
                        <span className="status-chip chip-success">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      </td>
                      <td className="cell-question" title={row.question}>
                        {row.question}
                      </td>
                      <td className="text-accent">{row.correct_answer}</td>
                      <td>
                        {row.category} / {row.topic}
                      </td>
                      <td>
                        <span className={`chip-diff chip-${row.difficulty}`}>
                          {row.difficulty}
                        </span>
                      </td>
                      <td className="text-success text-sm">Ready to insert</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validationResult.validRows.length > 50 && (
                <div className="table-overflow-hint">
                  Showing first 50 rows. All {validationResult.validRows.length} valid rows will be
                  imported.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
