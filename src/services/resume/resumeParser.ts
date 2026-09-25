import { ParsedResume, CandidateAiProfile } from '../../types/resume';
import { validateResumeFile } from './resumeValidator';
import { aiService, ResumeAnalysisOutput } from '../ai/aiService';
import mammoth from 'mammoth';

/**
 * Robust client-side text extractor for TXT, DOCX, and PDF documents.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileExt = file.name.toLowerCase().split('.').pop() || '';

  // 1. Plain text format
  if (fileExt === 'txt' || file.type === 'text/plain') {
    return await file.text();
  }

  // 2. DOCX Word documents (via mammoth)
  if (fileExt === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 20) {
        return result.value.trim();
      }
    } catch (docxErr) {
      console.warn('Mammoth docx parsing failed, attempting fallback:', docxErr);
    }
  }

  // 3. PDF documents
  if (fileExt === 'pdf' || file.type === 'application/pdf') {
    try {
      // Dynamically load pdfjs to minimize initial bundle overhead
      const pdfjsLib = await import('pdfjs-dist');
      // Set worker source to CDN or disable worker if in pure JS mode
      if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;

      let extractedPdfText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        extractedPdfText += pageText + '\n';
      }

      if (extractedPdfText.trim().length > 30) {
        return extractedPdfText.trim();
      }
    } catch (pdfErr) {
      console.warn('PDF.js text parsing failed, using stream fallback:', pdfErr);
    }
  }

  // 4. Fallback Binary ArrayBuffer String Scanner (for DOC, older PDFs, or stream text)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawString = decoder.decode(buffer);

        // Filter printable text runs
        const cleaned = rawString
          .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleaned.length > 50) {
          resolve(cleaned);
        } else {
          resolve(`Candidate Resume Document: ${file.name}\nFile Size: ${file.size} bytes`);
        }
      } catch {
        resolve(`Candidate Resume Document: ${file.name}`);
      }
    };
    reader.onerror = () => resolve(`Candidate Resume Document: ${file.name}`);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses and analyzes a candidate resume file through the centralized AI service.
 * Returns both the structured ParsedResume and the synthesized CandidateAiProfile.
 */
export const parseResumeFile = async (
  file: File
): Promise<ResumeAnalysisOutput> => {
  const validation = validateResumeFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid resume file.');
  }

  const rawText = await extractTextFromFile(file);

  // Call the centralized internal server-side AI pipeline
  return await aiService.analyzeResume(rawText, file.name, file.size);
};
