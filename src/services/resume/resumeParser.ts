import { ParsedResume, CandidateAiProfile } from '../../types/resume';
import { validateResumeFile } from './resumeValidator';
import { aiService, ResumeAnalysisOutput } from '../ai/aiService';
import mammoth from 'mammoth';

/**
 * Robust client-side text extractor for TXT, DOCX, and PDF documents.
 * Preserves structural line breaks, headings, and bullet points to enable
 * accurate downstream AI and algorithmic information retrieval.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileExt = file.name.toLowerCase().split('.').pop() || '';

  // 1. Plain text format
  if (fileExt === 'txt' || file.type === 'text/plain') {
    const text = await file.text();
    if (text && text.trim().length > 10) {
      return text.trim();
    }
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

  // 3. PDF documents (using pdfjs-dist with structural layout preservation)
  if (fileExt === 'pdf' || file.type === 'application/pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist');

      if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        try {
          const workerUrl = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        } catch {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;

      let extractedPdfText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY: number | null = null;
        let pageText = '';

        for (const item of textContent.items as any[]) {
          if (!item.str && !item.hasEOL) continue;
          const str = (item.str || '').trim();
          const currentY = item.transform ? item.transform[5] : null;

          // Significant vertical shift -> new line
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
            pageText += '\n';
          } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n') && str) {
            pageText += ' ';
          }

          if (str) {
            pageText += str;
          }
          if (item.hasEOL) {
            pageText += '\n';
          }
          if (currentY !== null) {
            lastY = currentY;
          }
        }

        if (pageText.trim()) {
          extractedPdfText += pageText.trim() + '\n\n';
        }
      }

      if (extractedPdfText.trim().length > 30) {
        return extractedPdfText.trim();
      }
    } catch (pdfErr) {
      console.warn('PDF.js text parsing failed, checking uncompressed text stream:', pdfErr);
    }
  }

  // 4. Fallback text stream scanner (only inspects printable text without binary garbage)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawString = decoder.decode(buffer);

        // For non-PDF or plaintext streams, extract clean printable paragraphs
        const cleanLines = rawString
          .split(/[\r\n]+/)
          .map((line) => line.replace(/[^\x20-\x7E\t]/g, ' ').replace(/\s+/g, ' ').trim())
          .filter((line) => line.length > 3 && !line.startsWith('%PDF') && !line.includes('/Filter'));

        const cleaned = cleanLines.join('\n');
        if (cleaned.length > 50) {
          resolve(cleaned);
        } else {
          reject(
            new Error(
              'Could not extract readable text from this document. Please ensure your resume contains selectable text (not a scanned image) or upload a DOCX/TXT file.'
            )
          );
        }
      } catch (err: any) {
        reject(
          new Error(
            err.message ||
              'Could not extract readable text from document. Please upload a PDF with selectable text or DOCX format.'
          )
        );
      }
    };
    reader.onerror = () =>
      reject(new Error('Failed to read the uploaded resume file.'));
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
