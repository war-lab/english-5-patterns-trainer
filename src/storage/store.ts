import type { Settings, UserAnswer } from '../domain/types';

const STORAGE_KEYS = {
  SETTINGS: 'e5pt.settings',
  ANSWERS_V1: 'e5pt.answers.v1',
  SCHEMA_VERSION: 'e5pt.schema_version',
};

const CURRENT_SCHEMA_VERSION = 1;

export const store = {
  migrate(): void {
    const currentVersionStr = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    let currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 0;

    // Initial load or upgrade
    if (currentVersion === 0) {
      // If we have v1 data but no version key, we assume it's v1
      if (localStorage.getItem(STORAGE_KEYS.ANSWERS_V1)) {
        currentVersion = 1;
      } else {
        // Brand new user
        currentVersion = CURRENT_SCHEMA_VERSION;
      }
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, currentVersion.toString());
    }

    // Example migration v1 -> v2
    // if (currentVersion < 2) {
    //   const v1Data = localStorage.getItem(STORAGE_KEYS.ANSWERS_V1);
    //   if (v1Data) {
    //      // transform...
    //      localStorage.setItem('e5pt.answers.v2', JSON.stringify(newData));
    //      localStorage.removeItem(STORAGE_KEYS.ANSWERS_V1);
    //   }
    //   currentVersion = 2;
    //   localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, '2');
    // }
  },

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
    // In strict v2, we would read V2 key. For now we use V1.
    const raw = localStorage.getItem(STORAGE_KEYS.ANSWERS_V1);
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
    localStorage.setItem(STORAGE_KEYS.ANSWERS_V1, JSON.stringify(answers));
  },

  clearAnswers(): void {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS_V1);
  },
};

// Auto-run migration on import (or we could call it explicitly in main.tsx)
store.migrate();
