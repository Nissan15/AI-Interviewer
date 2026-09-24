import React from 'react';
import { SupportedLanguage } from '../../../types/coding';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  language: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  disabled?: boolean;
}

const LANGUAGES: Array<{ id: SupportedLanguage; label: string }> = [
  { id: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python 3' },
  { id: 'java', label: 'Java 17' },
  { id: 'cpp', label: 'C++ 20' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="language-selector-wrap">
      <select
        value={language}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        disabled={disabled}
        className="language-select"
        aria-label="Select programming language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
