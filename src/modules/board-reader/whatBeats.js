// "What beats you" logic for Module 3 (CLAUDE.md §4 Module 3).
//
// This drill is NOT a heuristic — it is exact combinatorial truth from the engine
// evaluator, so it needs no correctness review beyond the evaluator itself. Given
// the hero's hole cards and a full 5-card board, we enumerate EVERY possible
// 2-card opponent holding from the remaining 46 cards (46·45/2 = 1035 combos),
// evaluate each against the board, and collect which hand CATEGORIES can beat the
// hero. That set is the answer key.

import { createDeck } from '../../engine/deck.js'
import { evaluateHand, compareHands } from '../../engine/evaluator.js'

// Hand classes the drill quizzes, weakest → strongest. "High Card" is intentionally
// excluded from the menu: generators only produce spots where the hero already holds
// at least a pair, so a bare high card can never be the thing that beats you.
export const HAND_CLASSES = [
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
]

// pokersolver reports a made royal flush as "Royal Flush"; fold it into the
// "Straight Flush" bucket so the menu stays to the standard classes above.
function normalize(name) {
  return name === 'Royal Flush' ? 'Straight Flush' : name
}

/**
 * Which hand classes an opponent could hold that BEAT the hero on this board.
 * @param {string[]} hole  - hero's two hole cards
 * @param {string[]} board - the full 5-card board
 * @returns {{
 *   heroName: string,          // hero's made-hand class
 *   heroDescr: string,         // human-readable hero hand, e.g. "Two Pair, K's & 9's"
 *   categories: string[],      // beating classes, sorted weakest → strongest
 *   examples: Record<string,string[]>, // one representative villain holding per class
 * }}
 */
export function beatingCategories(hole, board) {
  const hero = evaluateHand(hole, board)
  const used = new Set([...hole, ...board])
  const rem = createDeck().filter((c) => !used.has(c))

  const examples = {}
  for (let i = 0; i < rem.length; i++) {
    for (let j = i + 1; j < rem.length; j++) {
      const villain = evaluateHand([rem[i], rem[j]], board)
      if (compareHands(villain, hero) > 0) {
        const name = normalize(villain.name)
        if (!examples[name]) examples[name] = [rem[i], rem[j]]
      }
    }
  }

  const categories = HAND_CLASSES.filter((c) => examples[c])
  return { heroName: normalize(hero.name), heroDescr: hero.descr, categories, examples }
}
