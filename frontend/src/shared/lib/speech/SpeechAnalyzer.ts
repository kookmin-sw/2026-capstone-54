export interface SpeechMetrics {
  wpm: number;
  fillerCount: number;
  badWordCount: number;
  pauseWarnings: number;
  highlightedHtml: string;
}

export class SpeechAnalyzer {
  private startTime: number | null = null;
  private lastActiveTime: number | null = null;
  private lastTranscript = "";
  private pauseCount = 0;
  private isCurrentlyPaused = false;

  private readonly krStandaloneFillers = ["음", "어", "아"];
  private readonly krStretchedFillers = ["어어", "음음", "으음", "그으", "저어", "아아", "그오"];
  private readonly krHabitualWords = ["근데", "약간", "막", "뭐랄까", "좀", "쫌", "에너", "거시기", "저기", "저기요", "그러니까", "그니까"];
  private readonly enFillers = ["um", "uh", "hmm", "ah", "like", "you know", "i mean", "basically", "actually", "literally", "right"];
  private readonly krBadWords = ["시발", "씨발", "개새끼", "병신", "지랄", "존나", "좆", "미친", "새끼", "젠장", "빌어먹을", "제기랄", "염병"];
  private readonly enBadWords = ["fuck", "shit", "bitch", "asshole", "damn", "cunt", "dick"];

  private createRegexInfo(language: string) {
    const enFillerRegex = new RegExp(`\\b(${this.enFillers.join("|")})\\b`, "gi");
    const enBadRegex = new RegExp(`\\b(${this.enBadWords.join("|")})\\b`, "gi");

    if (language === "ko-KR") {
      const standalone = this.krStandaloneFillers.join("|");
      const stretched = this.krStretchedFillers.join("|");
      const habitual = this.krHabitualWords.join("|");
      const krPattern = `(?<![가-힣])(${standalone}|${stretched}|${habitual})(?![가-힣])`;
      const krBadPattern = `(?<![가-힣])(${this.krBadWords.join("|")})(?![가-힣])`;
      return {
        fillerRegexes: [new RegExp(krPattern, "g"), enFillerRegex],
        badRegexes: [new RegExp(krBadPattern, "g"), enBadRegex],
        isKorean: true,
      };
    }
    return { fillerRegexes: [enFillerRegex], badRegexes: [enBadRegex], isKorean: false };
  }

  public analyze(transcript: string, language: string, isListening: boolean): SpeechMetrics {
    if (!isListening) {
      this.startTime = null;
      this.lastActiveTime = null;
      this.lastTranscript = "";
      this.pauseCount = 0;
      this.isCurrentlyPaused = false;
      return { wpm: 0, fillerCount: 0, badWordCount: 0, pauseWarnings: 0, highlightedHtml: transcript };
    }

    const now = Date.now();
    if (!this.startTime) {
      this.startTime = now;
      this.lastActiveTime = now;
      this.lastTranscript = transcript;
    }

    if (transcript === this.lastTranscript) {
      if (this.lastActiveTime && now - this.lastActiveTime > 2000 && !this.isCurrentlyPaused) {
        this.pauseCount++;
        this.isCurrentlyPaused = true;
      }
    } else {
      this.lastActiveTime = now;
      this.lastTranscript = transcript;
      this.isCurrentlyPaused = false;
    }

    const { fillerRegexes, badRegexes, isKorean } = this.createRegexInfo(language);
    const elapsedMinutes = (now - this.startTime!) / 60000;
    let wpm = 0;
    if (elapsedMinutes > 0) {
      if (isKorean) {
        wpm = Math.round(transcript.replace(/\s/g, "").length / elapsedMinutes);
      } else {
        wpm = Math.round(transcript.trim().split(/\s+/).length / elapsedMinutes);
      }
    }

    let fillerCount = 0;
    let badWordCount = 0;
    let highlightedHtml = transcript;

    badRegexes.forEach((regex) => {
      highlightedHtml = highlightedHtml.replace(regex, (match) => {
        badWordCount++;
        return `<span class="bad-word">${match}</span>`;
      });
    });
    fillerRegexes.forEach((regex) => {
      highlightedHtml = highlightedHtml.replace(regex, (match) => {
        fillerCount++;
        return `<span class="filler-word">${match}</span>`;
      });
    });

    return { wpm, fillerCount, badWordCount, pauseWarnings: this.pauseCount, highlightedHtml };
  }
}
