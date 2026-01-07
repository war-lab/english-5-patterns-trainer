import type { VerbCardCollection, CardProgress, Pattern } from '../domain/types';
import { VERB_DATA } from '../data/verbData';

const STORAGE_KEY = 'e5pt.verbcards.v1';

// XP Thresholds
const LEVEL_THRESHOLDS = {
  1: 0,
  2: 50,
  3: 150,
  MAX: 300,
};

export const collectionStore = {
  getCollection(): VerbCardCollection {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      console.error("Failed to parse collection data, resetting.");
      return {};
    }
  },

  saveCollection(collection: VerbCardCollection): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  },

  // Called when a user gets a correct answer for a verb
  // Returns true if a new level was reached or new card unlocked
  addProgress(verbId: string, isCorrect: boolean): { unlocked: boolean; leveUp: boolean } {
    if (!VERB_DATA[verbId]) return { unlocked: false, leveUp: false }; // Unknown verb

    const collection = this.getCollection();
    let card = collection[verbId];
    let isNewUnlock = false;

    if (!card) {
      // First time unlock
      card = {
        level: 1,
        exp: 0,
        unlockedPatternIds: [],
        history: { correct: 0, wrong: 0, lastPlayed: Date.now() },
      };
      collection[verbId] = card;
      isNewUnlock = true;
    }

    // Update history
    card.history.lastPlayed = Date.now();
    if (isCorrect) {
      card.history.correct++;
      // Add XP
      const XP_PER_WIN = 10;
      const oldLevel = card.level;
      card.exp = Math.min(card.exp + XP_PER_WIN, LEVEL_THRESHOLDS.MAX);
      card.level = this.calculateLevel(card.exp);

      this.saveCollection(collection);

      return { unlocked: isNewUnlock, leveUp: card.level > oldLevel };
    } else {
      card.history.wrong++;
      this.saveCollection(collection);
      return { unlocked: isNewUnlock, leveUp: false };
    }
  },

  calculateLevel(exp: number): number {
    if (exp >= LEVEL_THRESHOLDS.MAX) return 4; // Max
    if (exp >= LEVEL_THRESHOLDS[3]) return 3;
    if (exp >= LEVEL_THRESHOLDS[2]) return 2;
    return 1;
  },

  // Helper to get stats or filtered lists
  getAllCards() {
    return this.getCollection();
  }
};
