const fs = require("fs");

const buildRegex = (
  CORRECT_GUESS, 
  APPEARS_IN_WORD, 
  WRONG_POSITION, 
  DOESNT_APPEAR, 
  wordle, 
  guess
) => {
  const letters = guess.split("");

  let CORRECT = ''
  let WRONG_PLACE = ''
  let POSSIBLE = ''
  let WRONG = ''

  // Assign guesses
  for (const [i, letter] of letters.entries()) {
    if (wordle[i] === letter) {
      CORRECT_GUESS[i] = letter;
    } else {
      if (wordle.includes(letter)) {
        APPEARS_IN_WORD.push(letter);

        // Even though the letter is present, it's specifically not here
        if (WRONG_POSITION[i]) {
          WRONG_POSITION[i] += letter;
        } else {
          // Prevent undefineds
          WRONG_POSITION[i] = letter
        }
      } else {
        // Letter doesn't exist in the word at all
        // Only add once
        if (!DOESNT_APPEAR.includes(letter)) {
          DOESNT_APPEAR.push(letter)
        }
      }
    }

    // BUILD REGEX
    if (CORRECT_GUESS[i]) {
      CORRECT += CORRECT_GUESS[i];
    } else {
      CORRECT += '.'
    }

    if (WRONG_POSITION[i]) {
      WRONG_PLACE += `[^${WRONG_POSITION[i]}]`;
    } else {
      WRONG_PLACE += '.'
    }
  }

  // Series of lookahead assertions:
  POSSIBLE = [...new Set(APPEARS_IN_WORD)].map(l => `(?=.*${l})`).join('')

  if (DOESNT_APPEAR.length) {
    WRONG += `(?=\\b[^\\W${DOESNT_APPEAR.join('')}]+\\b)`
  }

  return new RegExp(
    // String starts with
    // ^
    `^` +
    // Correct letters (GREEN)
    // (?=A.K..)
    `(?=${CORRECT})` +
    // Letter exists but not in that place (YELLOW)
    // (?=[^K][^KA][^A][^KA])
    `(?=${WRONG_PLACE})` +
    // Possible letters (To improve, not in specic place) (YELLOW)
    // (?=.*A)(?=.*B)(?=.*C)
    POSSIBLE +
    // Don't appear (GRAY), T (have to add double backslash!)
    // (?=\\b[^\\WT]+\\b)
    WRONG +
    // Finish with positive lookahead
    // .*
    '.*', 
    // g = global
    // m = match newline
    'gm'
    );
};

const SOLUTIONS = fs.readFileSync("solutions.txt", "utf8");
const SOLUTIONS_WORDS = SOLUTIONS.split("\n");
const WORDLE = SOLUTIONS_WORDS[Math.floor(Math.random() * SOLUTIONS_WORDS.length)]
let WORDLIST = fs.readFileSync("word-list-wordle.txt", "utf8");
let REMAINING_WORDS = WORDLIST.split("\n");
let GUESS;
let COUNT = 1
const CORRECT_GUESS = new Array(5);
const APPEARS_IN_WORD = [];
const WRONG_POSITION = new Array(5);
const DOESNT_APPEAR = [];
let REGEX;

try {
  while (REMAINING_WORDS.length !== 1) {
    if (!GUESS) {
      // Start with good vowel-heavy word
      GUESS = 'ADIEU'
    } else {
      // IMPROVEMENTS should be made here!
      GUESS = REMAINING_WORDS[Math.floor(Math.random() * REMAINING_WORDS.length)]
    }
    console.log(`Guess ${COUNT++}: ${GUESS}`)
    REGEX = buildRegex(
      CORRECT_GUESS, 
      APPEARS_IN_WORD, 
      WRONG_POSITION, 
      DOESNT_APPEAR, 
      WORDLE, 
      GUESS
    )
    REMAINING_WORDS = WORDLIST.match(REGEX)
    WORDLIST = REMAINING_WORDS.join('\n')
  }
  console.log(`\nCORRECT ANSWER: ${WORDLIST}`);
  console.log(`Using regex: ${REGEX}`);
} catch (e) {
  console.log(`\nCORRECT ANSWER: ${WORDLE}`);
  console.log(`Using regex: ${REGEX}`);
  console.log("Error:", e.stack);
}