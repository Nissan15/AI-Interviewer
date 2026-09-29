import { ISpeechToTextService, SpeechToTextCallbacks } from './speechTypes';

// Extend window typing for SpeechRecognition
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class WebSpeechRecognitionService implements ISpeechToTextService {
  private recognition: any = null;
  private listening: boolean = false;
  private isDesiredListening: boolean = false;
  private callbacks: SpeechToTextCallbacks | null = null;
  private accumulatedFinalTranscript: string = '';
  private currentSessionFinalTranscript: string = '';

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
      let sessionFinal = '';
      let sessionInterim = '';

      for (let i = 0; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          sessionFinal += result[0].transcript + ' ';
        } else {
          sessionInterim += result[0].transcript;
        }
      }

      this.currentSessionFinalTranscript = sessionFinal;
      const combined = (this.accumulatedFinalTranscript + ' ' + sessionFinal + ' ' + sessionInterim)
        .replace(/\s+/g, ' ')
        .trim();

      if (combined) {
        this.callbacks?.onResult(combined, Boolean(sessionFinal));
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Normal pause from speaker; do not terminate or treat as fatal failure
        return;
      }
      if (event.error === 'aborted') {
        // Recognition was aborted on stop
        return;
      }

      let friendlyError = 'Speech recognition encountered an issue.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        friendlyError = 'Microphone permission denied. Please allow microphone access in your browser.';
      } else if (event.error === 'network') {
        friendlyError = 'Network error during speech recognition.';
      }
      this.callbacks?.onError(friendlyError);
    };

    this.recognition.onend = () => {
      this.listening = false;
      if (this.isDesiredListening) {
        // Candidate is still speaking (has not tapped mic to stop). Chrome ended due to a pause.
        // Save current session text so far and restart listening seamlessly.
        this.accumulatedFinalTranscript = (this.accumulatedFinalTranscript + ' ' + this.currentSessionFinalTranscript)
          .replace(/\s+/g, ' ')
          .trim();
        this.currentSessionFinalTranscript = '';

        try {
          this.recognition.start();
          return;
        } catch {
          this.isDesiredListening = false;
        }
      }
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
    this.isDesiredListening = true;
    this.accumulatedFinalTranscript = '';
    this.currentSessionFinalTranscript = '';

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
    this.isDesiredListening = false;
    if (this.recognition) {
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
