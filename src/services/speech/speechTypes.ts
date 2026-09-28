export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  enhanceVocabulary?: boolean;
  onAudioLevel?: (level: number) => void;
}

export interface SpeechToTextCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onAudioLevel?: (level: number) => void;
}

export interface ISpeechToTextService {
  isSupported: () => boolean;
  startListening: (callbacks: SpeechToTextCallbacks, options?: SpeechRecognitionOptions) => void;
  stopListening: () => void;
  isListening: () => boolean;
  setLanguage: (lang: string) => void;
  resetTranscript: () => void;
  getCurrentTranscript: () => string;
}

export interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  voiceUri?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface ITextToSpeechService {
  isSupported: () => boolean;
  speak: (text: string, options?: TextToSpeechOptions) => void;
  cancel: () => void;
  isSpeaking: () => boolean;
  getVoices: () => Promise<SpeechSynthesisVoice[]>;
}
