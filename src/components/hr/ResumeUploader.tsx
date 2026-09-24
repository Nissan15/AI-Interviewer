import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useResume } from '../../context/ResumeContext';
import { parseResumeFile } from '../../services/resume/resumeParser';
import { validateResumeFile } from '../../services/resume/resumeValidator';
import { Button } from '../common/Button/Button';
import './ResumeUploader.css';

interface ResumeUploaderProps {
  onSuccess?: () => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onSuccess }) => {
  const {
    resume,
    isUploading,
    isAnalyzing,
    error,
    setUploadedFile,
    setResume,
    setIsUploading,
    setIsAnalyzing,
    setError,
  } = useResume();

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setError(null);
    const validation = validateResumeFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file format or size.');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    try {
      setIsAnalyzing(true);
      const parsed = await parseResumeFile(file);
      setResume(parsed);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to process and analyze resume.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="resume-uploader-container">
      <div
        className={`resume-drop-zone ${isDragOver ? 'drag-over' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div className="drop-zone-icon-box">
          {isAnalyzing ? (
            <div className="upload-spinner" />
          ) : resume ? (
            <CheckCircle2 size={36} className="text-success" />
          ) : (
            <UploadCloud size={36} className="upload-cloud-icon" />
          )}
        </div>

        <div className="drop-zone-text-block">
          <h4 className="drop-title">
            {isAnalyzing
              ? 'Analyzing resume with AI...'
              : isUploading
              ? 'Uploading resume...'
              : 'Upload your resume'}
          </h4>

          <p className="drop-description">
            {isAnalyzing
              ? 'Extracting skills, projects, technologies, and experience for interview personalization.'
              : 'Drag & drop your resume here, or click to browse'}
          </p>

          <div className="drop-formats">
            <span>Supported formats:</span>
            <span className="format-tag">PDF</span>
            <span className="format-tag">DOC</span>
            <span className="format-tag">DOCX</span>
            <span className="file-size-limit">(Max 5MB)</span>
          </div>
        </div>

        {!isAnalyzing && !isUploading && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Choose File
          </Button>
        )}
      </div>

      {error && (
        <div className="upload-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
