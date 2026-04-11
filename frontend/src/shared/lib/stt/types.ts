export interface STTResult {
  text: string;
  isFinal: boolean;
}

export interface ISTTProvider {
  start(language: string): void;
  stop(): void;
  switchLanguage(language: string): void;
  onResult(callback: (result: STTResult) => void): void;
  onError(callback: (error: unknown) => void): void;
}
