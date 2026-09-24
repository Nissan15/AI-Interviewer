import { ITextToSpeechService, TextToSpeechOptions } from './speechTypes';

class WebSpeechTextToSpeechService implements ITextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  isSupported(): boolean {
    return Boolean(this.synth);
  }

  getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve([]);
        return;
      }
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }
      this.synth.onvoiceschanged = () => {
        resolve(this.synth?.getVoices() || []);
      };
    });
  }

  speak(text: string, options: TextToSpeechOptions = {}): void {
    if (!this.synth) {
      options.onError?.('Text-to-speech is not supported in this browser.');
      return;
    }

    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    if (options.voiceUri) {
      const voices = this.synth.getVoices();
      const selected = voices.find((v) => v.voiceURI === options.voiceUri);
      if (selected) utterance.voice = selected;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      options.onError?.(e.error || 'TTS audio playback error');
    };

    this.synth.speak(utterance);
  }

  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return Boolean(this.synth && this.synth.speaking);
  }
}

export const textToSpeechService: ITextToSpeechService = new WebSpeechTextToSpeechService();
