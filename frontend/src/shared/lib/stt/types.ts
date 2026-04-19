export interface STTResult {
  text: string;
  isFinal: boolean;
  timestampMs: number;
}

export interface STTSegment {
  text: string;
  startMs: number;
  endMs: number;
}

export interface ISTTProvider {
  start(language: string): void;
  stop(): void;
  switchLanguage(language: string): void;
  onResult(callback: (result: STTResult) => void): void;
  onError(callback: (error: unknown) => void): void;
  getStartTime(): number;
}
