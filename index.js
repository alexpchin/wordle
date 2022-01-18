const fs = require("fs");

const WORDLE = "ANKLE";
const CORRECT_GUESS = new Array(5);
const IN_WRONG_PLACE = [];
const WRONG_GUESS = new Array(5);

const buildRegex = (word) => {
  const letters = word.split("");

  // Assign guesses
  for (const [i, letter] of letters.entries()) {
    if (WORDLE[i] === letter) {
      CORRECT_GUESS[i] = letter;
    } else {
      if (WORDLE.includes(letter)) {
        IN_WRONG_PLACE.push(letter);
      }
      // Even though the letter is present, it's specifically not here
      if (WRONG_GUESS[i]) {
        WRONG_GUESS[i] += letter;
      } else {
        // Prevent undefineds
        WRONG_GUESS[i] = letter
      }
    }
  }

  let CORRECT = ''
  let WRONG = ''
  for (const i of [...Array(5).keys()]) {
    if (CORRECT_GUESS[i]) {
      CORRECT += CORRECT_GUESS[i];
    } else {
      CORRECT += '.'
    }
    if (WRONG_GUESS[i]) {
      WRONG += `[^${WRONG_GUESS[i]}]`;
    } else {
      WRONG += '.'
    }
  }
  CORRECT = `(?=${CORRECT})`
  WRONG = `(?=${WRONG})`

  let POSSIBLE = IN_WRONG_PLACE.map(l => `(?=.*${l})`).join()

  return new RegExp(
    // String starts with
    // ^
    `^` +
    // Correct letters
    // (?=A.K..)
    CORRECT +
    // Not letters
    // (?=[^K][^KA][^A][^KA])
    WRONG +
    // WHAT ABOUT MORE THAN ONE?
    // Possible letters
    // (?=.*A)(?=.*B)(?=.*C)
    POSSIBLE +
    // Finish with positive lookahead
    // .*
    '.*', 
    // g = global
    // m = match newline
    'gm'
    );
};

// const guess = "AULCB";
// let regex = buildRegex(guess);
// console.log('regex1', regex);
// const guess2 = "ATKLE";
// regex = buildRegex(guess2);
// console.log('regex2', regex);
// const guess3 = "ANKLE";
// regex = buildRegex(guess3);
// console.log(regex);

try {
  let WORDS = fs.readFileSync("word-list-5-uniq.txt", "utf8");
  let guess;
  while (WORDS.length > 1) {
    guess = WORDS.split('\n')[Math.floor(Math.random() * WORDS.length)]
    console.log(`Guessing: ${guess}`)
    const regex = buildRegex(guess)
    console.log(`Using regex ${regex}`);
    WORDS = WORDS.match(regex).join('\n')
  }
  console.log(matched);
} catch (e) {
  console.log("Error:", e.stack);
}
