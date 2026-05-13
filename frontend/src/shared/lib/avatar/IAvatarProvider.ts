export interface IAvatarProvider {
  initialize(container: HTMLElement): Promise<void>;
  speak(audioUrlOrBase64: string, text: string): Promise<void>;
  stop(): void;
  destroy(): void;
}
