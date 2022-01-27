import chalk from "chalk";
import readline from "readline";
import fs from "fs";

const GREEN = "G";
const YELLOW = "Y";
const GRAY = " ";

const letterFrequencies = (word) => {
  return word.split("").reduce((total, letter) => {
    total[letter] ? total[letter]++ : (total[letter] = 1);
    return total;
  }, {});
};

const makeRandomGuess = (wordlist) => {
  return wordlist[Math.floor(Math.random() * wordlist.length)];
};

const makeOptimalGuessWithLetterFrequencies = (previousGuesses, wordlist) => {
  const wordlistWithoutPreviousGuesses = wordlist.filter(
    (word) => !previousGuesses.includes(word)
  );

  // This is frequencies of all words
  const frequencies = {
    A: 8.167,
    B: 1.492,
    C: 2.782,
    D: 4.253,
    E: 12.702,
    F: 2.228,
    G: 2.015,
    H: 6.094,
    I: 6.966,
    J: 0.153,
    K: 0.772,
    L: 4.025,
    M: 2.406,
    N: 6.749,
    O: 7.507,
    P: 1.929,
    Q: 0.095,
    R: 5.987,
    S: 6.327,
    T: 9.056,
    U: 2.758,
    V: 0.978,
    W: 2.36,
    X: 0.15,
    Y: 1.974,
    Z: 0.074,
  };

  // Calculate dynamic frequencies in remaining list
  // const frequencies = wordlistWithoutPreviousGuesses.reduce(
  //   (frequencies, word) => {
  //     word.split("").forEach((letter) => {
  //       frequencies[letter] = frequencies[letter] ? frequencies[letter] + 1 : 1;
  //     });
  //     return frequencies;
  //   },
  //   {}
  // );
  // console.log("frequencies", frequencies);

  const sortedWordlist = wordlistWithoutPreviousGuesses
    .map((word) => {
      return {
        word,
        frequency: word.split("").reduce((sum, letter) => {
          sum += frequencies[letter];
          return sum;
        }, 0),
      };
    })
    // Sort by highest frequency score
    .sort((a, b) => b.frequency - a.frequency)
    .map((obj) => obj.word);

  return sortedWordlist[0];
};

/**
 * MinMax? function to take optimise for the guesses
 */
const makeOptimalGuessMinMax = (previousGuesses, wordlist) => {
  const wordlistWithoutPreviousGuesses = wordlist.filter(
    (word) => !previousGuesses.includes(word)
  );

  let minMaxRemainingWords = wordlistWithoutPreviousGuesses.length;
  let minMaxWord = "";
  const guesses = [];

  // Let's say the word is...
  for (let i = 0; i < wordlistWithoutPreviousGuesses.length; i++) {
    const wordle = wordlistWithoutPreviousGuesses[i];
    // console.log({
    //   percent: i / wordlistWithoutPreviousGuesses.length,
    //   wordle,
    //   minMaxWord,
    //   minMaxRemainingWords,
    // });

    const remainingPossibilities = [];

    // And we decide to guess...
    for (const guess of wordlistWithoutPreviousGuesses) {
      // Create possible results for this possibility
      const results = createResults(wordle, guess);

      // Create potential remaining words
      const newPossibilities = filterWords(
        wordlistWithoutPreviousGuesses,
        guess,
        results
      );
      // console.log("remainingPossibilities", newPossibilities.length);

      // Store the count of the number of words that this choice elimates
      remainingPossibilities.push(newPossibilities.length);

      // ?? This will always be smaller?
      // Save time if we already know we won't win the minimax game
      if (newPossibilities.length > minMaxRemainingWords) {
        // console.log("BREAKING...");
        break;
      }
    }

    // What is the smallest elimination word, i.e. most results
    const maxRemainingPossibilities = Math.max(...remainingPossibilities);

    if (maxRemainingPossibilities <= minMaxRemainingWords) {
      minMaxWord = wordle;
      minMaxRemainingWords = maxRemainingPossibilities;
    }

    guesses.push({
      wordle,
      maxRemainingPossibilities,
    });
  }

  // Pick the guess that "minimizes the maximum number of remaining possibilities" (Knuth)
  const optimalGuesses = guesses.filter(
    (guess) => guess.maxRemainingPossibilities <= minMaxRemainingWords
  );
  console.log("guesses", guesses);
  console.log("optimalGuesses", optimalGuesses);

  const { wordle, maxRemainingPossibilities } = optimalGuesses[0];
  return wordle;
};

const numberOfLettersInWord = (wordle, letter) =>
  wordle.split("").filter((w) => w === letter).length;

const createLetterDictionary = (guess) =>
  guess.split("").reduce((obj, l) => {
    obj[l] = 0;
    return obj;
  }, {});

/**
 * Create a representation of the Colored Tiles
 * only used by computer when wordle is known
 */
const createResults = (wordle, guess) => {
  const wordleLetters = wordle.split("");
  const letters = guess.split("");
  let results = "";
  const lettersGuessed = createLetterDictionary(guess);
  for (const [i, l] of letters.entries()) {
    if (wordleLetters[i] === letters[i]) {
      results += GREEN;
    } else if (wordle.includes(l)) {
      const numLet = numberOfLettersInWord(wordle, l);
      if (lettersGuessed[l] < numLet) {
        results += YELLOW;
      } else {
        results += GRAY;
      }
    } else {
      results += GRAY;
    }
    lettersGuessed[l] = lettersGuessed[l] ? lettersGuessed[l] + 1 : 1;
  }
  return results;
};

/**
 * Print tiles
 */
const prettyPrintResults = (results, guess) => {
  let prettyResults = "";
  const resultsLetters = results.split("");
  guess = guess.split("");
  for (const [i, result] of resultsLetters.entries()) {
    switch (result) {
      case "G":
        prettyResults += chalk.bgGreen(guess[i]);
        break;
      case "Y":
        prettyResults += chalk.bgYellow(guess[i]);
        break;
      case " ":
        prettyResults += chalk.bgWhite(guess[i]);
      default:
        break;
    }
  }
  console.log(prettyResults);
};

const pick = () => {
  const solutions = fs.readFileSync("solutions.txt", "utf8");
  const solutionWords = solutions.split("\n");
  return solutionWords[Math.floor(Math.random() * solutionWords.length)];
};

const isGreen = (t) => t === GREEN;

const isGray = (t) => t === GRAY;

const isYellow = (t) => t === YELLOW;

/**
 * Filter Green using regex (words that do have a letter in this spot) (?=..A.T).*
 */
const filterGreen = (guess, results) => {
  if (!results.includes(GREEN)) return "";
  const regexStr = results.split("").reduce(
    (str, result, index) => {
      str += isGreen(result) ? `${guess[index]}` : ".";
      return str;
    },
    "",
    0
  );
  return `(?=${regexStr})`;
};

/**
 * Filter Yellow using regex (words that dont have a letter in this spot) (?=..[^A]..)
 */
const filterYellowPosition = (guess, results) => {
  if (!results.includes(YELLOW)) return "";
  const regexStr = results.split("").reduce(
    (str, result, index) => {
      str += isYellow(result) ? `[^${guess[index]}]` : ".";
      return str;
    },
    "",
    0
  );
  return `(?=${regexStr})`;
};

/**
 * Filter Yellow using regex (words that include) (?=.*Y)
 */
const filterYellow = (guess, results) => {
  if (!results.includes(YELLOW)) return "";
  return (
    results
      .split("")
      .reduce(
        (array, result, index) => {
          if (isYellow(result)) {
            array.push(guess[index]);
          }
          return array;
        },
        [],
        0
      )
      // Uniq the array
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((letter) => `(?=.*${letter})`)
      .join("")
  );
};

const sameLetterIsAlsoGreen = (results, guess, letter) =>
  results.split("").some((r, i) => isGreen(r) && guess[i] === letter);

const sameLetterIsAlsoYellow = (results, guess, letter) =>
  results.split("").some((r, i) => isYellow(r) && guess[i] === letter);

/**
 * Filter Gray using regex (?=\\b[^\\WABC]+\\b)
 */
const filterGray = (guess, results) => {
  if (!results.includes(GRAY)) return "";
  const regexStr = results
    .split("")
    .reduce(
      (array, result, index) => {
        if (
          isGray(result) &&
          !sameLetterIsAlsoGreen(results, guess, guess[index]) &&
          !sameLetterIsAlsoYellow(results, guess, guess[index])
        ) {
          array.push(guess[index]);
        }
        return array;
      },
      [],
      0
    )
    .join("");
  if (!regexStr) return "";
  return `(?=\\b[^\\W${regexStr}]+\\b)`;
};

const filterWords = (remainingWords, guess, results) => {
  const words = remainingWords.join("\n");
  const regexStr =
    filterGreen(guess, results) +
    filterYellowPosition(guess, results) +
    filterYellow(guess, results) +
    filterGray(guess, results);

  const regex = new RegExp(`${regexStr}.*`, "gm");
  return words.match(regex);
};

const ask = (query) => {
  const i = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    i.question(query, (answer) => {
      i.close();
      resolve(answer);
    })
  );
};

const makeGuess = (previousGuesses, wordlist) => {
  let guess;
  if (!previousGuesses.length) {
    guess = "ADIEU";
  } else {
    // guess = makeRandomGuess(wordlist);
    guess = makeOptimalGuessMinMax(previousGuesses, wordlist);
    // guess = makeOptimalGuessWithLetterFrequencies(previousGuesses, wordlist);
  }
  previousGuesses.push(guess);
  return guess;
};

const interactive = async (regex, guess, results) => {
  let count = 1;
  let correct = false;
  const guesses = [];
  let wordlist = fs.readFileSync("word-list-wordle.txt", "utf8");
  let remainingWords = wordlist.split("\n");

  let solutions = fs.readFileSync("solutions.txt", "utf8");
  const solutionWords = solutions.split("\n");
  wordlist = [new Set([...wordlist, ...solutionWords])];

  try {
    while (!correct) {
      console.log(`${remainingWords.length} words remaining`);
      guess = makeGuess(guesses, remainingWords);
      console.log(`Make guess ${count}: ${guess}`);
      results = await ask("Enter the results, e.g. G YF ");
      prettyPrintResults(results, guess);
      if (results === GREEN.repeat(5)) break;
      count++;
      remainingWords = filterWords(remainingWords, guess, results);
      results = undefined;
    }
  } catch (e) {
    console.log("Error:", e.stack);
  }
};

const automatic = async (solution, log = true) => {
  let wordle = solution || pick();
  let count = 1;
  let correct = false;
  const guesses = [];
  let wordlist = fs.readFileSync("word-list-wordle.txt", "utf8");
  let remainingWords = wordlist.split("\n");
  try {
    while (!correct) {
      const guess = makeGuess(guesses, remainingWords);
      const results = createResults(wordle, guess);
      log && prettyPrintResults(results, guess);
      if (results === GREEN.repeat(5)) break;
      count++;
      remainingWords = filterWords(remainingWords, guess, results);
    }
    return {
      count,
      wordle,
    };
  } catch (e) {
    console.log("Error:", e.stack);
  }
};

/**
 * Run automatic against all previous solutions to measure efficacy
 */
const benchmark = async () => {
  let solutions = fs.readFileSync("solutions.txt", "utf8");
  const solutionWords = solutions.split("\n");
  const benchmarks = {};
  for (const [i, solution] of solutionWords.entries()) {
    console.log({
      percent: (i / solutionWords.length) * 100,
      progress: `${i + 1} / ${solutionWords.length}`,
      solution,
    });
    const { count } = await automatic(solution, false);
    benchmarks[count] = benchmarks[count] ? benchmarks[count] + 1 : 1;
  }
  // Work out %
  for (const key in benchmarks) {
    benchmarks[key] = `${(
      (benchmarks[key] / solutionWords.length) *
      100
    ).toFixed(2)}%`;
  }
  console.log(JSON.stringify(benchmarks, 0, 2));
};

/**
 * Main menu function to run the program
 */
const main = async () => {
  console.clear();
  const mode = await ask(
    "What mode do you want to use?\n\n1. Interactive\n2. Automatic\n3. Benchmark Solutions\n\n"
  );
  switch (mode) {
    case "1":
      console.clear();
      await interactive(regex, guess, results);
      break;
    case "2":
      console.clear();
      await automatic();
      break;
    case "3":
      console.clear();
      await benchmark();
      break;
    default:
      console.log("Incorrect input, exiting.");
  }
};

/**
 * Run program on load
 */
main();
