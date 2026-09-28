import { ISpeechToTextService, SpeechToTextCallbacks } from './speechTypes';

// Extend window typing for SpeechRecognition
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class WebSpeechRecognitionService implements ISpeechToTextService {
  private recognition: any = null;
  private listening: boolean = false;
  private callbacks: SpeechToTextCallbacks | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindowWithSpeech;
      const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechClass) {
        this.recognition = new SpeechClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.setupListeners();
      }
    }
  }

  private setupListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.listening = true;
      this.callbacks?.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      if (activeText.trim()) {
        this.callbacks?.onResult(activeText.trim(), Boolean(finalTranscript));
      }
    };

    this.recognition.onerror = (event: any) => {
      let friendlyError = 'Speech recognition encountered an issue.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        friendlyError = 'Microphone permission denied. Please allow microphone access in your browser.';
      } else if (event.error === 'no-speech') {
        friendlyError = 'No speech detected. Please speak into your microphone.';
      } else if (event.error === 'network') {
        friendlyError = 'Network error during speech recognition.';
      }
      this.callbacks?.onError(friendlyError);
    };

    this.recognition.onend = () => {
      this.listening = false;
      this.callbacks?.onEnd();
    };
  }

  isSupported(): boolean {
    return Boolean(this.recognition);
  }

  startListening(callbacks: SpeechToTextCallbacks): void {
    if (!this.recognition) {
      callbacks.onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    this.callbacks = callbacks;
    try {
      this.recognition.start();
    } catch (e: any) {
      // If already started, ignore or restart
      if (e.name !== 'InvalidStateError') {
        callbacks.onError(e.message || 'Failed to start speech recognition');
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition', e);
      }
      this.listening = false;
    }
  }

  isListening(): boolean {
    return this.listening;
  }
}

export const speechToTextService: ISpeechToTextService = new WebSpeechRecognitionService();
