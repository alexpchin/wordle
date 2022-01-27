import chalk from "chalk";
import readline from "readline";
import fs from "fs";

const makeRandomGuess = (wordlist) => {
  return wordlist[Math.floor(Math.random() * wordlist.length)];
};

/**
 * MinMax? function to take optimise for the guesses
 */
const makeOptimalGuess = (guessResults, wordlist) => {
  let minMaxRemainingWords = wordlist.length;
  let minMaxWord = "";
  const guesses = [];

  // Let's say the word is...
  for (let i = 0; i < wordlist.length; i++) {
    const wordle = wordlist[i];
    // console.log({
    //   percent: i / wordlist.length,
    //   wordle,
    //   minMaxWord,
    //   minMaxRemainingWords,
    // });

    const remainingPossibilities = [];

    // And we decide to guess...
    for (const guess of wordlist) {
      // Create possible results for this possibility
      const results = createResults(wordle, guess);

      // Create potential remaining words
      const newPossibilities = filterWords(wordlist, guess, results);
      // console.log("remainingPossibilities", newPossibilities.length);

      // Store the count of the number of words that this choice elimates
      remainingPossibilities.push(newPossibilities.length);

      // ?? This will always be smaller?
      // Save time if we already know we won't win the minimax game
      if (newPossibilities.length > minMaxRemainingWords) break;
    }

    // What is the smallest elimination word, i.e. most results
    const maxRemainingPossibilities = Math.max(...remainingPossibilities);

    // ?? Won't this always be true?
    if (maxRemainingPossibilities <= minMaxRemainingWords) {
      minMaxWord = wordle;
      minMaxRemainingWords = maxRemainingPossibilities;
    }
    guesses.push({
      wordle,
      maxRemainingPossibilities,
    });
  }

  // GREEDY vs AVERAGE?

  // Pick the guess that "minimizes the maximum number of remaining possibilities" (Knuth)
  const optimalGuesses = guesses.filter(
    (guess) => guess.maxRemainingPossibilities <= minMaxRemainingWords
  );
  // console.log("optimalGuesses", optimalGuesses);

  const { wordle, maxRemainingPossibilities } = optimalGuesses[0];
  return wordle;
};

/**
 * Create a representation of the Colored Tiles
 */
const createResults = (wordle, guess) => {
  // console.log("createResults wordle:", wordle);
  // console.log("createResults guess:", guess);
  const wordleLetters = wordle.split("");
  const letters = guess.split("");
  let results = "";
  const lettersGuessed = letters.reduce((obj, l) => {
    obj[l] = 0;
    return obj;
  }, {});
  for (const [i, l] of letters.entries()) {
    if (wordleLetters[i] === letters[i]) {
      results += "G";
    } else if (wordle.includes(l)) {
      const numberOfLettersInWord = wordleLetters.filter((w) => w === l).length;
      if (lettersGuessed[l] < numberOfLettersInWord) {
        results += "Y";
      } else {
        results += " ";
      }
    } else {
      results += " ";
    }
    lettersGuessed[l] = lettersGuessed[l] ? lettersGuessed[l] + 1 : 1;
  }
  // console.log("results", results);
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

const makeGuess = (previousGuesses, wordlist) => {
  // console.log("makeGuess wordlist", wordlist);
  let guess;
  if (!previousGuesses.length) {
    guess = "ADIEU";
  } else {
    guess = makeRandomGuess(wordlist);
    // guess = makeOptimalGuess(previousGuesses, wordlist);
  }
  previousGuesses.push(guess);
  return guess;
};

// Returns remaining words
const filterWords = (remainingWords, guess, results) => {
  // console.log(`Filtering ${remainingWords.length} words`);

  // Should this persist?
  const correctGuess = new Array(5);
  const appearsInWord = [];
  const wrongPosition = new Array(5);
  const doesntAppear = []; // Doesn't need to

  // Record words
  const resultsLetters = results.split("");
  for (const [i, result] of resultsLetters.entries()) {
    const l = guess[i];
    switch (result) {
      case "G":
        correctGuess[i] = l;
        break;
      case "Y":
        appearsInWord.push(l);
        // Even though the letter is present, it's specifically not here
        if (wrongPosition[i]) {
          wrongPosition[i] += l;
        } else {
          wrongPosition[i] = l;
        }
        break;
      case " ":
        if (!correctGuess.includes(l) && !appearsInWord.includes(l)) {
          doesntAppear.push(l);
        }
        break;
    }
  }

  // Build regex
  let green = "";
  let yellowPlace = "";
  let yellow = "";
  let gray = "";

  [...Array(5)].forEach((_, i) => {
    green += correctGuess[i] ? correctGuess[i] : ".";
    yellowPlace += wrongPosition[i] ? `[^${wrongPosition[i]}]` : ".";
  });

  // Without letter counts
  yellow = [...new Set(appearsInWord)].map((a) => `(?=.*${a})`).join("");

  // With letter counts
  // yellow = [...new Set(appearsInWord)]
  //   .map((a) => `(?=.*${a}{${appearsInWord.filter((n) => n === a).length},}.*)`)
  //   .join("");

  if (doesntAppear.length) {
    gray = `(?=\\b[^\\W${doesntAppear.join("")}]+\\b)`;
  }

  const regex = new RegExp(
    `^(?=${green})(?=${yellowPlace})${yellow}${gray}.*`,
    "gm"
  );
  // console.log("Using regex", regex);

  return remainingWords.filter((word) => word.match(regex));
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

const interactive = async (regex, guess, results) => {
  let count = 1;
  let correct = false;
  let wordlist = fs.readFileSync("word-list-wordle.txt", "utf8");
  let remainingWords = wordlist.split("\n");

  // When adding existing results to test
  // To remove
  if (results) {
    remainingWords = filterWords(remainingWords, guess, results);
  }

  try {
    while (!correct) {
      console.log(`${remainingWords.length} words remaining`);
      guess = makeGuess(guess, remainingWords);
      console.log(`Make guess ${count}: ${guess}`);
      results = await ask("Enter the results, e.g. G YF ");
      prettyPrintResults(results, guess);
      if (results === "GGGGG") break;
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
      // log && console.log("Guessing:", guess);
      const results = createResults(wordle, guess);
      // log && console.log("remainingWords.length", remainingWords);
      log && prettyPrintResults(results, guess);
      if (results === "GGGGG") break;
      count++;
      remainingWords = filterWords(remainingWords, guess, results);
      // console.log("autmatic remainingWords", remainingWords);
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
    // console.log({
    //   percent: i / solutionWords.length,
    //   progress: `${i} / ${solutionWords.length}`,
    //   solution,
    // });
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
      const regex = await ask("Enter existing regex");
      const guess = await ask("Enter existing guess");
      const results = await ask("Enter existing results");
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
