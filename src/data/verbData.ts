import type { Pattern } from '../domain/types';

export interface VerbStaticData {
  meaning: string;
  typicalPattern: Pattern;
  rarity: 'N' | 'R' | 'SR';
  baseForm?: string; // If different from ID (usually same)
}

// Static definitions for Verb Cards
// This maps the verb ID (e.g., "give") to its static properties.
// Questions will be linked to these via tags (v:give).
export const VERB_DATA: Record<string, VerbStaticData> = {
  // SV (Level 1-2)
  "go": { meaning: "行く", typicalPattern: 1, rarity: 'N' },
  "live": { meaning: "住む・生きる", typicalPattern: 1, rarity: 'N' },
  "stand": { meaning: "立つ", typicalPattern: 1, rarity: 'N' },
  "swim": { meaning: "泳ぐ", typicalPattern: 1, rarity: 'N' },
  "run": { meaning: "走る・経営する", typicalPattern: 1, rarity: 'N' }, // SR candidate if focusing on confusion?
  "sleep": { meaning: "眠る", typicalPattern: 1, rarity: 'N' },
  "arrive": { meaning: "到着する", typicalPattern: 1, rarity: 'N' },
  "fly": { meaning: "飛ぶ", typicalPattern: 1, rarity: 'N' },
  "cry": { meaning: "泣く・叫ぶ", typicalPattern: 1, rarity: 'N' },
  "burn": { meaning: "燃える", typicalPattern: 1, rarity: 'N' },

  // SVC (Level 1-2)
  "be": { meaning: "〜である・いる", typicalPattern: 2, rarity: 'N' },
  "become": { meaning: "〜になる", typicalPattern: 2, rarity: 'R' },
  "look": { meaning: "〜に見える", typicalPattern: 2, rarity: 'N' },
  "seem": { meaning: "〜のように思える", typicalPattern: 2, rarity: 'N' },
  "feel": { meaning: "〜と感じる", typicalPattern: 2, rarity: 'N' },
  "sound": { meaning: "〜に聞こえる", typicalPattern: 2, rarity: 'N' },
  "taste": { meaning: "〜の味がする", typicalPattern: 2, rarity: 'N' },
  "smell": { meaning: "〜のにおいがする", typicalPattern: 2, rarity: 'N' },
  "get": { meaning: "〜になる・得る", typicalPattern: 2, rarity: 'SR' }, // SVC/SVO/SVOC/SVOO
  "turn": { meaning: "〜になる・回る", typicalPattern: 2, rarity: 'N' },
  "stay": { meaning: "〜のままでいる", typicalPattern: 2, rarity: 'N' },
  "remain": { meaning: "〜のままである", typicalPattern: 2, rarity: 'N' },
  "grow": { meaning: "〜になる・育つ", typicalPattern: 2, rarity: 'N' },
  "appear": { meaning: "〜に見える", typicalPattern: 2, rarity: 'N' },

  // SVO (Level 1-2)
  "like": { meaning: "〜が好きだ", typicalPattern: 3, rarity: 'N' },
  "want": { meaning: "〜が欲しい", typicalPattern: 3, rarity: 'N' },
  "have": { meaning: "〜を持っている", typicalPattern: 3, rarity: 'N' },
  "eat": { meaning: "〜を食べる", typicalPattern: 3, rarity: 'N' },
  "drink": { meaning: "〜を飲む", typicalPattern: 3, rarity: 'N' },
  "know": { meaning: "〜を知っている", typicalPattern: 3, rarity: 'N' },
  "play": { meaning: "〜をする・遊ぶ", typicalPattern: 3, rarity: 'N' },
  "buy": { meaning: "〜を買う", typicalPattern: 3, rarity: 'N' }, // SVO/SVOO
  "speak": { meaning: "〜を話す", typicalPattern: 3, rarity: 'N' },
  "study": { meaning: "〜を勉強する", typicalPattern: 3, rarity: 'N' },
  "open": { meaning: "〜を開ける", typicalPattern: 3, rarity: 'N' },
  "close": { meaning: "〜を閉める", typicalPattern: 3, rarity: 'N' },
  "visit": { meaning: "〜を訪れる", typicalPattern: 3, rarity: 'N' },
  "enter": { meaning: "〜に入る", typicalPattern: 3, rarity: 'R' }, // confusing with enter into
  "answer": { meaning: "〜に答える", typicalPattern: 3, rarity: 'N' },
  "discuss": { meaning: "〜を議論する", typicalPattern: 3, rarity: 'R' }, // confusing with discuss about
  "reach": { meaning: "〜に着く", typicalPattern: 3, rarity: 'R' }, // confusing with reach to
  "marry": { meaning: "〜と結婚する", typicalPattern: 3, rarity: 'R' }, // confusing with marry with
  "resemble": { meaning: "〜に似ている", typicalPattern: 3, rarity: 'R' }, // confusing with resemble to

  // SVOO (Level 2-3)
  "give": { meaning: "与える", typicalPattern: 4, rarity: 'R' },
  "tell": { meaning: "伝える・教える", typicalPattern: 4, rarity: 'R' }, // SVOO/SVOC(to)
  "show": { meaning: "見せる", typicalPattern: 4, rarity: 'R' },
  "teach": { meaning: "教える", typicalPattern: 4, rarity: 'R' },
  "send": { meaning: "送る", typicalPattern: 4, rarity: 'R' },
  "pass": { meaning: "手渡す・通る", typicalPattern: 4, rarity: 'N' },
  "write": { meaning: "書く", typicalPattern: 4, rarity: 'N' },
  "lend": { meaning: "貸す", typicalPattern: 4, rarity: 'R' },
  "read": { meaning: "読む", typicalPattern: 4, rarity: 'N' }, // can be SVOO (read him a book)
  "cook": { meaning: "料理する", typicalPattern: 4, rarity: 'N' },
  "make": { meaning: "作る・させる", typicalPattern: 5, rarity: 'SR' }, // SVO/SVOO/SVOC super versatile
  "pay": { meaning: "支払う", typicalPattern: 4, rarity: 'N' },
  "offer": { meaning: "提供する", typicalPattern: 4, rarity: 'R' },
  "bring": { meaning: "持ってくる", typicalPattern: 4, rarity: 'N' },
  "ask": { meaning: "尋ねる・頼む", typicalPattern: 4, rarity: 'R' },
  "leave": { meaning: "残す・去る", typicalPattern: 5, rarity: 'SR' }, // SVO/SVOO/SVOC/SV
  "save": { meaning: "救う・省く", typicalPattern: 4, rarity: 'R' },
  "spare": { meaning: "割く・免れさせる", typicalPattern: 4, rarity: 'SR' },
  "deny": { meaning: "否定する・与えない", typicalPattern: 4, rarity: 'SR' },
  "envy": { meaning: "うらやむ", typicalPattern: 4, rarity: 'SR' },
  "cost": { meaning: "費用がかかる", typicalPattern: 4, rarity: 'R' }, // SVOO exclusive-ish
  "take": { meaning: "時間がかかる・取る", typicalPattern: 4, rarity: 'R' }, // SVOO exclusive-ish usages

  // SVOC (Level 3-5)
  "call": { meaning: "呼ぶ", typicalPattern: 5, rarity: 'R' },
  "name": { meaning: "名付ける", typicalPattern: 5, rarity: 'R' },
  "keep": { meaning: "保つ", typicalPattern: 5, rarity: 'R' },
  "find": { meaning: "わかる・見つける", typicalPattern: 5, rarity: 'SR' }, // SVO/SVOO/SVOC
  "paint": { meaning: "ペンキで塗る", typicalPattern: 5, rarity: 'N' }, // SVOC paint O C
  "dye": { meaning: "染める", typicalPattern: 5, rarity: 'N' },
  "elect": { meaning: "選出する", typicalPattern: 5, rarity: 'R' },
  "consider": { meaning: "〜とみなす", typicalPattern: 5, rarity: 'R' },
  "think": { meaning: "考える", typicalPattern: 5, rarity: 'SR' }, // SVOC (think O C) is rare/advanced
  "believe": { meaning: "信じる", typicalPattern: 5, rarity: 'R' }, // SVOC (to be)
  "cause": { meaning: "引き起こす", typicalPattern: 5, rarity: 'R' },
  "allow": { meaning: "許す", typicalPattern: 5, rarity: 'R' },
  "hear": { meaning: "聞こえる", typicalPattern: 5, rarity: 'R' }, // 知覚
  "see": { meaning: "見える", typicalPattern: 5, rarity: 'R' }, // 知覚
  "watch": { meaning: "見る", typicalPattern: 5, rarity: 'R' }, // 知覚
  "feel": { meaning: "感じる", typicalPattern: 5, rarity: 'R' }, // 知覚 (SVOC)
  "notice": { meaning: "気づく", typicalPattern: 5, rarity: 'R' },
  "let": { meaning: "〜させる", typicalPattern: 5, rarity: 'R' }, // 使役 (bare)
  "have": { meaning: "持つ・〜させる", typicalPattern: 5, rarity: 'SR' }, // 使役 (bare, pp)
};
