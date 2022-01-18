const fs = require("fs");

const buildRegex = (wordle, guess) => {
  const CORRECT_GUESS = new Array(5);
  const IN_WRONG_PLACE = [];
  const WRONG_GUESS = new Array(5);
  const letters = guess.split("");

  // Assign guesses
  for (const [i, letter] of letters.entries()) {
    if (wordle[i] === letter) {
      CORRECT_GUESS[i] = letter;
    } else {
      if (wordle.includes(letter)) {
        // TODO: Improve to match mutiple letters, e.g. L in HELLO 
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

  // TODO: Improve to match mutiple letters, e.g. L in HELLO 
  let POSSIBLE = IN_WRONG_PLACE.map(l => `(?=.*${l})`).join('')

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

try {
  const SOLUTIONS = fs.readFileSync("solutions.txt", "utf8");
  // Choose solution
  const SOLUTIONS_WORDS = SOLUTIONS.split("\n");
  const WORDLE = SOLUTIONS_WORDS[Math.floor(Math.random() * SOLUTIONS_WORDS.length)]
  let WORDLIST = fs.readFileSync("word-list-5.txt", "utf8");
  let REMAINING_WORDS = WORDLIST.split("\n");
  let guess;
  let count = 1
  while (REMAINING_WORDS.length !== 1) {
    guess = REMAINING_WORDS[Math.floor(Math.random() * REMAINING_WORDS.length)]
    console.log(`Guessing ${count++}: ${guess}`)
    const regex = buildRegex(WORDLE, guess)
    // console.log(`Using regex ${regex}`);
    REMAINING_WORDS = WORDLIST.match(regex)
    WORDLIST = REMAINING_WORDS.join('\n')
  }
  console.log(`CORRECT ANSWER: ${WORDLIST}`);
} catch (e) {
  console.log("Error:", e.stack);
}
