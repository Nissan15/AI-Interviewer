export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const validateResumeFile = (file: File): FileValidationResult => {
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  // Check mime type (fallback to extension if mime is generic)
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type) || !file.type;

  if (!hasValidExtension && !hasValidMime) {
    return {
      isValid: false,
      error: 'Unsupported file format. Please upload a PDF, DOC, or DOCX document.',
    };
  }

  return { isValid: true };
};
