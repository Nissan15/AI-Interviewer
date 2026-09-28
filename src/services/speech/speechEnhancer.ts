/**
 * Domain-specific speech recognition enhancer for technical and HR interviews.
 * Performs real-time phonetic normalisation, technical vocabulary correction,
 * stutter elimination, and Web Audio RMS level metering.
 */

// Common spoken phonetic variants mapped to accurate technical / HR terms
const TECHNICAL_TERMS_MAP: Array<{ pattern: RegExp; replacement: string }> = [
  // Programming Languages & Frameworks
  { pattern: /\b(no sequel|no sequel database|nosql database)\b/gi, replacement: 'NoSQL' },
  { pattern: /\b(post gres|post grease|postgres sql|postgresql)\b/gi, replacement: 'PostgreSQL' },
  { pattern: /\b(sequel server|ms sequel|ms-sql)\b/gi, replacement: 'SQL Server' },
  { pattern: /\b(sequel)\b/gi, replacement: 'SQL' },
  { pattern: /\b(type script|typescript)\b/gi, replacement: 'TypeScript' },
  { pattern: /\b(java script|javascript)\b/gi, replacement: 'JavaScript' },
  { pattern: /\b(react js|reactjs)\b/gi, replacement: 'React' },
  { pattern: /\b(react native)\b/gi, replacement: 'React Native' },
  { pattern: /\b(node js|nodejs)\b/gi, replacement: 'Node.js' },
  { pattern: /\b(next js|nextjs)\b/gi, replacement: 'Next.js' },
  { pattern: /\b(vue js|vuejs)\b/gi, replacement: 'Vue.js' },
  { pattern: /\b(angular js|angularjs)\b/gi, replacement: 'Angular' },
  { pattern: /\b(c plus plus|c\+\+)\b/gi, replacement: 'C++' },
  { pattern: /\b(c sharp|c\#)\b/gi, replacement: 'C#' },
  { pattern: /\b(dot net|\.net core|\.net)\b/gi, replacement: '.NET' },
  { pattern: /\b(python)\b/gi, replacement: 'Python' },
  { pattern: /\b(golang|go lang)\b/gi, replacement: 'Go' },
  { pattern: /\b(rust)\b/gi, replacement: 'Rust' },
  { pattern: /\b(ruby on rails)\b/gi, replacement: 'Ruby on Rails' },
  { pattern: /\b(html five|html 5)\b/gi, replacement: 'HTML5' },
  { pattern: /\b(css three|css 3)\b/gi, replacement: 'CSS3' },

  // Architecture & Engineering Concepts
  { pattern: /\b(rest api|rest apis|restful api|restful apis)\b/gi, replacement: 'REST API' },
  { pattern: /\b(graph ql|graphql)\b/gi, replacement: 'GraphQL' },
  { pattern: /\b(ci cd|see eye see dee|ci\/cd pipeline)\b/gi, replacement: 'CI/CD' },
  { pattern: /\b(micro services|microservice|microservices)\b/gi, replacement: 'microservices' },
  { pattern: /\b(monolith|monolithic)\b/gi, replacement: 'monolithic' },
  { pattern: /\b(front end|frontend)\b/gi, replacement: 'frontend' },
  { pattern: /\b(back end|backend)\b/gi, replacement: 'backend' },
  { pattern: /\b(full stack|fullstack)\b/gi, replacement: 'full-stack' },
  { pattern: /\b(object oriented programming|oops concepts|oop)\b/gi, replacement: 'OOP' },
  { pattern: /\b(solid principles)\b/gi, replacement: 'SOLID principles' },
  { pattern: /\b(design patterns?)\b/gi, replacement: 'design patterns' },
  { pattern: /\b(data structures? and algorithms?|dsa)\b/gi, replacement: 'Data Structures and Algorithms' },
  { pattern: /\b(time complexity|space complexity)\b/gi, replacement: '$1' },
  { pattern: /\b(big o|big-o notation)\b/gi, replacement: 'Big-O' },

  // Cloud & DevOps Tools
  { pattern: /\b(git hub|get hub)\b/gi, replacement: 'GitHub' },
  { pattern: /\b(git lab)\b/gi, replacement: 'GitLab' },
  { pattern: /\b(git)\b/gi, replacement: 'Git' },
  { pattern: /\b(docker container|docker)\b/gi, replacement: 'Docker' },
  { pattern: /\b(cooberneties|kubernetees|k8s|kubernetes)\b/gi, replacement: 'Kubernetes' },
  { pattern: /\b(a w s|amazon web services)\b/gi, replacement: 'AWS' },
  { pattern: /\b(g c p|google cloud platform)\b/gi, replacement: 'GCP' },
  { pattern: /\b(azure|microsoft azure)\b/gi, replacement: 'Azure' },
  { pattern: /\b(kafka|apache kafka)\b/gi, replacement: 'Kafka' },
  { pattern: /\b(redis|rediss cache)\b/gi, replacement: 'Redis' },
  { pattern: /\b(mongo db|mongodb)\b/gi, replacement: 'MongoDB' },
  { pattern: /\b(elastic search|elasticsearch)\b/gi, replacement: 'Elasticsearch' },
  { pattern: /\b(terra form|terraform)\b/gi, replacement: 'Terraform' },

  // HR, Behavioral & Placement Interview Vocabulary
  { pattern: /\b(star method|star technique)\b/gi, replacement: 'STAR method' },
  { pattern: /\b(situation task action result)\b/gi, replacement: 'Situation, Task, Action, Result' },
  { pattern: /\b(k p i|kpi|kpis)\b/gi, replacement: 'KPI' },
  { pattern: /\b(o k r|okr|okrs)\b/gi, replacement: 'OKR' },
  { pattern: /\b(h r round|hr interview|hr round)\b/gi, replacement: 'HR round' },
  { pattern: /\b(u i u x|ui ux|ui\/ux)\b/gi, replacement: 'UI/UX' },
  { pattern: /\b(pr review|pull request)\b/gi, replacement: 'pull request' },
  { pattern: /\b(agile methodology|agile framework)\b/gi, replacement: 'Agile' },
  { pattern: /\b(scrum master|scrum framework)\b/gi, replacement: 'Scrum' },
  { pattern: /\b(sprint retrospective|sprint planning)\b/gi, replacement: '$1' },
  { pattern: /\b(peer review)\b/gi, replacement: 'peer review' },
  { pattern: /\b(cross functional team)\b/gi, replacement: 'cross-functional team' },
  { pattern: /\b(stakeholders?)\b/gi, replacement: 'stakeholder' },
  { pattern: /\b(root cause analysis|rca)\b/gi, replacement: 'Root Cause Analysis' },
  { pattern: /\b(latency|throughput)\b/gi, replacement: '$1' },
];

/**
 * Enhance and clean speech recognition text by applying tech vocabulary mapping,
 * eliminating immediate speech stutters, and fixing capitalization & whitespace.
 */
export function enhanceSpeechText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Apply technical vocabulary replacements
  for (const { pattern, replacement } of TECHNICAL_TERMS_MAP) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // 2. Eliminate repetitive duplicate words caused by speech pauses (e.g., "I I think think that")
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 3. Normalize multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // 4. Ensure first character is capitalized
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * AudioLevelMeter: analyzes live microphone audio using Web Audio API.
 * Computes live RMS input level (0-100) and detects active candidate vocalization.
 */
export class AudioLevelMeter {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isMeasuring: boolean = false;
  private onLevelCallback: ((level: number) => void) | null = null;

  async start(callback: (level: number) => void): Promise<boolean> {
    this.stop();
    this.onLevelCallback = callback;

    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      // Request stream with echo cancellation & noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.microphoneStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      source.connect(this.analyser);
      this.isMeasuring = true;

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!this.isMeasuring || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Calculate root mean square (RMS)
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Scale RMS to 0 - 100 percentage
        const normalized = Math.min(100, Math.round((rms / 128) * 100));

        this.onLevelCallback?.(normalized);
        this.animationFrameId = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      return true;
    } catch (err) {
      console.warn('[AudioLevelMeter] Could not initiate audio analysis:', err);
      return false;
    }
  }

  stop(): void {
    this.isMeasuring = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
    this.analyser = null;
    this.onLevelCallback = null;
  }
}
