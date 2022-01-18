## Wordle Solver

### Pseudo-code

`_`,`_`,`_`,`_`,`_`

Wrong = 0
Right, wrong place = 1
Right, right place = 2

How to sort the list?

Look for 2, filter words that have letter in the same place.

Look for 1, filter words that include that letter.

Remove all words that include 0.

### Regex notes

// WORDLE = ALEXC

// Letter is correct, e.g A
// A

// Letter is not, e.g. F
// [^f]

// Regex to appear somewhere, e.g. X
// (?=._X._)

(?=match this expression)(?=match this too)(?=oh, and match this as well)

### Ideas

Google Ngram
