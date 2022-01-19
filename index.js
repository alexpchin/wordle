const fs = require("fs");

const buildRegex = (
  correctGuess, 
  appearsInWord, 
  wrongPosition, 
  doesntAppear, 
  wordle, 
  guess
) => {
  const letters = guess.split("");

  let green = '';
  let yellowPlace = '';
  let yellow = '';
  let gray = '';

  let duplicateLetters = {};

  for (const [i, l] of letters.entries()) {
    if (wordle[i] === l) {
      correctGuess[i] = l;
    } else {
      if (wordle.includes(l)) {
        // If the letter is not the first example in the guess
        const letterIndices = letters.map((x, y) => x === l ? y : undefined).filter(Boolean)
        const numberOfOccurancesInWordle = wordle.split('').filter((w) => w === l).length;
        const firstGuessOfLetter = !duplicateLetters[l];
        const duplicateGuessOfLetter = duplicateLetters[l] < i;
        const duplicatePresentInWordle = numberOfOccurancesInWordle >= i+1;

        if (firstGuessOfLetter || duplicateGuessOfLetter && duplicatePresentInWordle) {
          // Save position of last guessed duplicate letter
          duplicateLetters[l] = i;

          const numberOfTimesGuessed = appearsInWord.filter(a => a === l).length
          if (numberOfOccurancesInWordle > numberOfTimesGuessed) {
            appearsInWord.push(l);
          }

          // Even though the letter is present, it's specifically not here
          if (wrongPosition[i]) {
            wrongPosition[i] += l
          }  else {
            wrongPosition[i] = l
          }
        }
      } else {
        // Letter doesn't exist in the word at all, only add once
        if (!doesntAppear.includes(l)) doesntAppear.push(l)
      }
    }

    green += correctGuess[i] ? correctGuess[i] : '.';
    yellowPlace += wrongPosition[i] ? `[^${wrongPosition[i]}]`  : '.';
  }

  // Without letter counts
  // yellow = [...new Set(appearsInWord)].map(a => `(?=.*${a})`).join('')
  
  // With letter counts
  yellow = [...new Set(appearsInWord)].map(a => `(?=.*${a}{${appearsInWord.filter(n => n === a).length},}.*)`).join('')

  if (doesntAppear.length) {
    gray = `(?=\\b[^\\W${doesntAppear.join('')}]+\\b)`
  }

  return new RegExp(`^(?=${green})(?=${yellowPlace})${yellow}${gray}.*`, 'gm');
};

const pick = () => {
  const solutions = fs.readFileSync("solutions.txt", "utf8");
  const solutionWords = solutions.split("\n");
  return solutionWords[Math.floor(Math.random() * solutionWords.length)]
}

const makeGuess = (previousGuess='ADIEU', wordlist) => {
  if (!previousGuess) return previousGuess;
  // Improvements could be made here rather than random
  return wordlist[Math.floor(Math.random() * wordlist.length)]
}

const run = (wordlist, wordle) => {
  let guess;
  let regex;
  let count = 1;
  const correctGuess = new Array(5); // Green
  const appearsInWord = []; // Yellow(1)
  const wrongPosition = new Array(5); // Yellow(2)
  const doesntAppear = []; // Doesn't need to be stored each loop but interesting

  let remainingWords = wordlist.split("\n");

  try {
    while (remainingWords.length !== 1) {
      guess = makeGuess(guess, remainingWords);
      console.log(`Guess ${count++}: ${guess}`);
      regex = buildRegex(
        correctGuess, 
        appearsInWord, 
        wrongPosition, 
        doesntAppear, 
        wordle, 
        guess
      )
      remainingWords = wordlist.match(regex)
      wordlist = remainingWords.join('\n')
    }
    console.log(`\nCORRECT ANSWER: ${wordlist}\nUsing regex: ${regex}`);
  } catch (e) {
    console.log(`\nCORRECT ANSWER: ${wordle}\nUsing regex: ${regex}`);
    console.log("Error:", e.stack);
  }
}

const start = () => {
  const wordle = pick();
  let wordlist = fs.readFileSync("word-list-wordle.txt", "utf8");
  run(wordlist, wordle);
}

start()