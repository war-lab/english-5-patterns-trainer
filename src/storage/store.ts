import type { Settings, UserAnswer } from '../domain/types';

const STORAGE_KEYS = {
  SETTINGS: 'e5pt.settings',
  ANSWERS: 'e5pt.answers.v1',
};

export const store = {
  getSettings(): Settings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return { soundEnabled: true };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { soundEnabled: true };
    }
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getAnswers(): UserAnswer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  appendAnswer(answer: UserAnswer): void {
    const answers = this.getAnswers();
    answers.push(answer);
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
  },

  clearAnswers(): void {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
  },
};
