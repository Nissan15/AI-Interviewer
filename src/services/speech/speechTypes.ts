export interface SpeechToTextCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export interface ISpeechToTextService {
  isSupported: () => boolean;
  startListening: (callbacks: SpeechToTextCallbacks) => void;
  stopListening: () => void;
  isListening: () => boolean;
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
