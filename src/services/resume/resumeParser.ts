import { ParsedResume } from '../../types/resume';
import { validateResumeFile } from './resumeValidator';
import { analyzeResumeTextWithAi } from '../ai/resumeAnalysis';
import { getEffectiveAiConfig } from '../ai/aiConfig';

export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If plain text
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
      return;
    }

    // For PDF / Word files in client-side environment:
    // Read ArrayBuffer and extract readable UTF-8 strings
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawString = decoder.decode(buffer);

        // Filter printable ascii and common text sequences
        const cleaned = rawString
          .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleaned.length < 30) {
          // If binary document text isn't directly extractable via raw stream
          resolve(`Candidate Resume Document: ${file.name}\nFile Size: ${file.size} bytes`);
        } else {
          resolve(cleaned);
        }
      } catch (err) {
        resolve(`Candidate Resume Document: ${file.name}`);
      }
    };
    reader.onerror = () => reject(new Error('Error reading resume document.'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseResumeFile = async (file: File): Promise<ParsedResume> => {
  const validation = validateResumeFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid resume file.');
  }

  const rawText = await extractTextFromFile(file);
  const aiConfig = getEffectiveAiConfig();

  // If AI is configured, use AI analysis
  if (aiConfig.isConfigured) {
    return await analyzeResumeTextWithAi(rawText, file.name, file.size);
  }

  // If backend endpoint is configured
  if (aiConfig.provider === 'custom_backend') {
    const formData = new FormData();
    formData.append('resume', file);
    const resp = await fetch(`${aiConfig.endpoint}/resume/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!resp.ok) {
      throw new Error(`Resume analysis backend returned status ${resp.status}`);
    }
    const data = await resp.json();
    return data;
  }

  // If neither AI provider nor backend is configured, notify user clearly
  throw new Error(
    'AI service is not configured. Please configure your API key in Settings to extract and analyze your resume.'
  );
};
