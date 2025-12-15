import type { Question } from '../domain/types';

export const questions: Question[] = [
  {
    "id": "q0001",
    "sentence": "Birds fly.",
    "level": 1,
    "correctPattern": 1,
    "explanationShort": "OもCもない → SV",
    "tags": ["SV"]
  },
  {
    "id": "q0002",
    "sentence": "She is tired.",
    "level": 1,
    "correctPattern": 2,
    "explanationShort": "be動詞 + 補語(C) → SVC",
    "tags": ["SVC", "be"]
  },
  {
    "id": "q0003",
    "sentence": "I like coffee.",
    "level": 1,
    "correctPattern": 3,
    "explanationShort": "目的語が1つ → SVO",
    "tags": ["SVO"]
  },
  {
    "id": "q0004",
    "sentence": "He gave me a book.",
    "level": 2,
    "correctPattern": 4,
    "explanationShort": "目的語が2つ → SVOO",
    "tags": ["SVOO", "give"]
  },
  {
    "id": "q0005",
    "sentence": "They made him angry.",
    "level": 2,
    "correctPattern": 5,
    "explanationShort": "Oの後ろが補語(C) → SVOC",
    "tags": ["SVOC", "make"]
  },
  {
    "id": "q0006",
    "sentence": "He looked at the picture.",
    "level": 3,
    "correctPattern": 1,
    "explanationShort": "at以下は修飾語(M)扱い → SV",
    "tags": ["SV", "noise:pp"]
  },
  {
    "id": "q0007",
    "sentence": "She became a doctor.",
    "level": 2,
    "correctPattern": 2,
    "explanationShort": "becomeは補語(C)を取る → SVC",
    "tags": ["SVC", "become"]
  },
  {
    "id": "q0008",
    "sentence": "We found the room clean.",
    "level": 4,
    "correctPattern": 5,
    "explanationShort": "O + 形容詞(C) → SVOC",
    "tags": ["SVOC", "find"]
  },
  {
    "id": "q0009",
    "sentence": "Please show us the way.",
    "level": 3,
    "correctPattern": 4,
    "explanationShort": "us と the way の2目的語 → SVOO",
    "tags": ["SVOO", "show"]
  },
  {
    "id": "q0010",
    "sentence": "The meeting lasted two hours.",
    "level": 4,
    "correctPattern": 1,
    "explanationShort": "two hoursは目的語ではなく補足(M) → SV",
    "tags": ["SV", "noise:np"]
  }
];
