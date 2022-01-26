import chalk from "chalk";
import readline from "readline";
import fs from "fs";

const storeGreen = (i, l, correctGuess, doesntAppear) => {
  correctGuess[i] = l;
};

const storeYellow = (
  i,
  l,
  appearsInWord,
  wrongPosition,
  duplicateLetters,
  wordle, // We don't know wordle here
  guess
) => {
  // const letters = guess.split("");
  // If the letter is not the first example in the guess
  // const numberOfOccurancesInGuess = letters
  //   .map((x, y) => (x === l ? y : undefined))
  //   .filter(Boolean);
  // const numberOfOccurancesInWordle = wordle
  //   .split("")
  //   .filter((w) => w === l).length;
  // const firstGuessOfLetter = !duplicateLetters[l];
  // const duplicateGuessOfLetter = duplicateLetters[l] < i;
  // // const duplicatePresentInWordle = numberOfOccurancesInWordle >= i + 1;
  // const duplicatePresentInWordle = numberOfOccurancesInGuess >= i + 1;

  // if (
  //   firstGuessOfLetter ||
  //   (duplicateGuessOfLetter && duplicatePresentInWordle)
  // ) {
  //   // Save position of last guessed duplicate letter
  //   duplicateLetters[l] = i;

  //   const numberOfTimesGuessed = appearsInWord.filter((a) => a === l).length;
  // if (numberOfOccurancesInWordle > numberOfTimesGuessed) {
  appearsInWord.push(l);
  // }

  // Even though the letter is present, it's specifically not here
  if (wrongPosition[i]) {
    wrongPosition[i] += l;
  } else {
    wrongPosition[i] = l;
  }
  // }
};

const storeGray = (l, doesntAppear, appearsInWord, correctGuess) => {
  doesntAppear.push(l);
};

const createResults = (wordle, guess) => {
  const wordleLetters = wordle.split("");
  const letters = guess.split("");
  let results = "";
  for (const [i, l] of letters.entries()) {
    if (wordleLetters[i] === letters[i]) {
      results += "G";
    } else if (wordle.includes(l)) {
      // Needs to handle better here
      results += "Y";
    } else {
      results += " ";
    }
  }
  return results;
};

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

const buildRegex = (
  correctGuess,
  appearsInWord,
  wrongPosition,
  doesntAppear
) => {
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

  return new RegExp(`^(?=${green})(?=${yellowPlace})${yellow}${gray}.*`, "gm");
};

const pick = () => {
  const solutions = fs.readFileSync("solutions.txt", "utf8");
  const solutionWords = solutions.split("\n");
  return solutionWords[Math.floor(Math.random() * solutionWords.length)];
};

function mutationFilter(arr, cb) {
  for (let l = arr.length - 1; l >= 0; l -= 1) {
    if (!cb(arr[l])) arr.splice(l, 1);
  }
}

const makeGuess = (previousGuess, wordlist) => {
  if (!previousGuess) return "ADIEU";
  // Improvements could be made here rather than random
  return wordlist[Math.floor(Math.random() * wordlist.length)];
};

const recordResults = (
  wordle,
  guess,
  results,
  correctGuess,
  appearsInWord,
  wrongPosition,
  doesntAppear,
  duplicateLetters
) => {
  const resultsLetters = results.split("");
  for (const [i, result] of resultsLetters.entries()) {
    const letter = guess[i];
    switch (result) {
      case "G":
        storeGreen(i, letter, correctGuess);
        break;
      case "Y":
        storeYellow(
          i,
          letter,
          appearsInWord,
          wrongPosition,
          duplicateLetters,
          wordle, // We don't know this for interactive
          guess
        );
        break;
      case " ":
        storeGray(letter, doesntAppear, appearsInWord, correctGuess);
        break;
    }
  }

  // Remove all letters from doesn't appear that also appear in correctGuess or appearsInWord, must mutate existing array
  const condition = (d) =>
    !correctGuess.includes(d) && !appearsInWord.includes(d);
  mutationFilter(doesntAppear, condition);
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
  let wordle;
  let count = 1;
  let wordlist = fs.readFileSync("word-list-wordle.txt", "utf8");
  let remainingWords = wordlist.split("\n");
  const correctGuess = new Array(5);
  const appearsInWord = [];
  const wrongPosition = new Array(5);
  const doesntAppear = [];
  let duplicateLetters = {};

  // When adding existing
  // To refactor
  if (results) {
    recordResults(
      wordle,
      guess,
      results,
      correctGuess,
      appearsInWord,
      wrongPosition,
      doesntAppear,
      duplicateLetters
    );
    regex = buildRegex(
      correctGuess,
      appearsInWord,
      wrongPosition,
      doesntAppear
    );
    console.log(`Using regex: ${regex}`);
    remainingWords = wordlist.match(regex);
    console.log(`${remainingWords.length} words remaining`);
    wordlist = remainingWords.join("\n");
  }

  try {
    while (remainingWords.length !== 1) {
      console.log(`${remainingWords.length} words remaining`);
      guess = makeGuess(guess, remainingWords);
      console.log(`Make guess ${count}: ${guess}`);
      count++;
      results = await ask("Enter the results, e.g. G YF ");
      prettyPrintResults(results, guess);
      recordResults(
        wordle,
        guess,
        results,
        correctGuess,
        appearsInWord,
        wrongPosition,
        doesntAppear,
        duplicateLetters
      );
      regex = buildRegex(
        correctGuess,
        appearsInWord,
        wrongPosition,
        doesntAppear
      );
      // console.log(`Using regex: ${regex}`);
      remainingWords = wordlist.match(regex);
      wordlist = remainingWords.join("\n");
      regex = undefined;
      results = undefined;
    }
    console.log(`\nCORRECT ANSWER: ${wordlist}\nUsing regex: ${regex}`);
  } catch (e) {
    console.log(`\nCORRECT ANSWER: ${wordle}\nUsing regex: ${regex}`);
    console.log("Error:", e.stack);
  }
};

const automatic = async (solution) => {
  let guess;
  let wordle = solution || pick();
  let regex;
  let count = 1;
  let wordlist = fs.readFileSync("word-list-wordle.txt", "utf8");
  let remainingWords = wordlist.split("\n");
  const correctGuess = new Array(5);
  const appearsInWord = [];
  const wrongPosition = new Array(5);
  const doesntAppear = []; // Doesn't need to be stored each loop but interesting
  let duplicateLetters = {};
  try {
    while (remainingWords.length !== 1) {
      guess = makeGuess(guess, remainingWords);
      count++;
      const results = createResults(wordle, guess);
      prettyPrintResults(results, guess);
      recordResults(
        wordle,
        guess,
        results,
        correctGuess,
        appearsInWord,
        wrongPosition,
        doesntAppear,
        duplicateLetters
      );
      regex = buildRegex(
        correctGuess,
        appearsInWord,
        wrongPosition,
        doesntAppear
      );
      remainingWords = wordlist.match(regex);
      wordlist = remainingWords.join("\n");
    }
    const results = createResults(wordle, wordlist);
    prettyPrintResults(results, wordlist);
    console.log(`\nCORRECT ANSWER: ${wordlist}\nUsing regex: ${regex}`);
    return {
      count,
      wordle,
    };
  } catch (e) {
    console.log(`\nCORRECT ANSWER: ${wordle}\nUsing regex: ${regex}`);
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
  for (const solution of solutionWords) {
    const { count } = await automatic(solution);
    benchmarks[count] = benchmarks[count] ? benchmarks[count] + 1 : 1;
  }
  console.log(JSON.stringify(benchmarks, 0, 2));
};

/**
 * Main menu function to run the program
 */
const main = async () => {
  const mode = await ask(
    "What mode do you want to use?\n1. Interactive\n2. Automatic\n3. Benchmark Solutions"
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
