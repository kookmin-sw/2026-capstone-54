import type { ISTTProvider, STTResult } from "./types";

// SpeechRecognition is not in standard TypeScript lib — declare minimal shim
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export class WebSpeechSTTProvider implements ISTTProvider {
  private recognition: SpeechRecognitionInstance | null = null;
  private resultCallback?: (result: STTResult) => void;
  private errorCallback?: (error: unknown) => void;
  private isIntentionalStop = false;
  private startTime = 0;

  constructor() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.error("Web Speech API is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognitionClass();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (this.resultCallback) {
        const timestampMs = Date.now() - this.startTime;
        if (finalTranscript) this.resultCallback({ text: finalTranscript, isFinal: true, timestampMs });
        if (interimTranscript) this.resultCallback({ text: interimTranscript, isFinal: false, timestampMs });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") return;
      this.errorCallback?.(event.error);
    };

    this.recognition.onend = () => {
      if (!this.isIntentionalStop) {
        try { this.recognition?.start(); } catch { /* already running */ }
      }
    };
  }

  start(language: string): void {
    if (!this.recognition) return;
    this.isIntentionalStop = false;
    this.startTime = Date.now();
    this.recognition.lang = language;
    try { this.recognition.start(); } catch { /* already started */ }
  }

  getStartTime(): number {
    return this.startTime;
  }

  stop(): void {
    if (!this.recognition) return;
    this.isIntentionalStop = true;
    try { this.recognition.stop(); } catch { /* already stopped */ }
  }

  switchLanguage(language: string): void {
    this.stop();
    setTimeout(() => this.start(language), 400);
  }

  onResult(callback: (result: STTResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: unknown) => void): void {
    this.errorCallback = callback;
  }
}
