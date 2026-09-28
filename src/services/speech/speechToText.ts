import { ISpeechToTextService, SpeechToTextCallbacks, SpeechRecognitionOptions } from './speechTypes';
import { enhanceSpeechText, AudioLevelMeter } from './speechEnhancer';

// Extend window typing for SpeechRecognition
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class WebSpeechRecognitionService implements ISpeechToTextService {
  private recognition: any = null;
  private listening: boolean = false;
  private shouldBeListening: boolean = false;
  private callbacks: SpeechToTextCallbacks | null = null;
  private options: SpeechRecognitionOptions = {
    lang: 'en-US',
    continuous: true,
    interimResults: true,
    enhanceVocabulary: true,
  };

  private accumulatedFinal: string = '';
  private currentInterim: string = '';
  private audioMeter: AudioLevelMeter = new AudioLevelMeter();
  private lastStartTime: number = 0;
  private restartTimeout: any = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindowWithSpeech;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechClass) {
      try {
        this.recognition = new SpeechClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        this.recognition.lang = this.options.lang || 'en-US';

        this.setupListeners();
      } catch (err) {
        console.warn('[WebSpeechRecognitionService] Init error:', err);
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
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcriptChunk = result[0]?.transcript || '';

        if (result.isFinal) {
          const formatted = this.options.enhanceVocabulary !== false
            ? enhanceSpeechText(transcriptChunk)
            : transcriptChunk.trim();

          if (formatted) {
            if (this.accumulatedFinal) {
              this.accumulatedFinal += ' ' + formatted;
            } else {
              this.accumulatedFinal = formatted;
            }
          }
        } else {
          interim += ' ' + transcriptChunk;
        }
      }

      this.currentInterim = interim.trim();

      const combinedRaw = (this.accumulatedFinal + (this.currentInterim ? ' ' + this.currentInterim : '')).trim();
      const finalClean = this.options.enhanceVocabulary !== false
        ? enhanceSpeechText(combinedRaw)
        : combinedRaw;

      if (finalClean) {
        this.callbacks?.onResult(finalClean, Boolean(!this.currentInterim && this.accumulatedFinal));
      }
    };

    this.recognition.onerror = (event: any) => {
      // Ignore routine abort/no-speech events during ongoing continuous sessions
      if (event.error === 'no-speech') {
        // Routine silence, auto-recovery will handle if needed
        return;
      }

      if (event.error === 'aborted' && this.shouldBeListening) {
        return;
      }

      let friendlyError = 'Speech recognition encountered an issue.';
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        friendlyError = 'Microphone permission denied. Please allow microphone access in your browser.';
        this.shouldBeListening = false;
      } else if (event.error === 'network') {
        friendlyError = 'Network error during speech recognition. Checking connection...';
      }

      this.callbacks?.onError(friendlyError);
    };

    this.recognition.onend = () => {
      this.listening = false;

      // Resilient auto-restart if candidate turn is still active
      if (this.shouldBeListening) {
        const timeSinceStart = Date.now() - this.lastStartTime;
        const delay = timeSinceStart < 500 ? 400 : 80;

        if (this.restartTimeout) clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
          if (this.shouldBeListening && !this.listening) {
            try {
              this.lastStartTime = Date.now();
              this.recognition?.start();
              this.listening = true;
            } catch (err: any) {
              if (err.name !== 'InvalidStateError') {
                console.warn('[WebSpeechRecognitionService] Auto-restart warning:', err);
              }
            }
          }
        }, delay);
      } else {
        this.audioMeter.stop();
        this.callbacks?.onEnd();
      }
    };
  }

  isSupported(): boolean {
    return Boolean(this.recognition);
  }

  startListening(callbacks: SpeechToTextCallbacks, options?: SpeechRecognitionOptions): void {
    if (!this.recognition) {
      callbacks.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or a Web Speech compatible browser.');
      return;
    }

    if (options) {
      this.options = { ...this.options, ...options };
      if (options.lang && this.recognition.lang !== options.lang) {
        this.recognition.lang = options.lang;
      }
    }

    this.callbacks = callbacks;
    this.shouldBeListening = true;

    // Reset accumulator for new turn
    this.accumulatedFinal = '';
    this.currentInterim = '';

    // Initiate audio level meter if callback provided
    const onAudioLevel = options?.onAudioLevel || callbacks.onAudioLevel;
    if (onAudioLevel) {
      this.audioMeter.start(onAudioLevel).catch((err) => {
        console.warn('[WebSpeechRecognitionService] Audio meter error:', err);
      });
    }

    try {
      this.lastStartTime = Date.now();
      this.recognition.start();
      this.listening = true;
    } catch (e: any) {
      // If already started or in state, restart cleanly
      if (e.name === 'InvalidStateError') {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
        setTimeout(() => {
          if (this.shouldBeListening) {
            try {
              this.recognition.start();
              this.listening = true;
            } catch {
              // ignore
            }
          }
        }, 150);
      } else {
        callbacks.onError(e.message || 'Failed to start speech recognition');
      }
    }
  }

  stopListening(): void {
    this.shouldBeListening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.audioMeter.stop();

    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('[WebSpeechRecognitionService] Stop error:', e);
      }
      this.listening = false;
    }
  }

  isListening(): boolean {
    return this.listening;
  }

  setLanguage(lang: string): void {
    this.options.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
      if (this.listening) {
        // Restart with new language locale
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }
    }
  }

  resetTranscript(): void {
    this.accumulatedFinal = '';
    this.currentInterim = '';
  }

  getCurrentTranscript(): string {
    const combined = (this.accumulatedFinal + (this.currentInterim ? ' ' + this.currentInterim : '')).trim();
    return this.options.enhanceVocabulary !== false ? enhanceSpeechText(combined) : combined;
  }
}

export const speechToTextService: ISpeechToTextService = new WebSpeechRecognitionService();
