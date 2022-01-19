## Wordle Solver

To run:

```
node index.js
```

### Pseudo-code

The strategy is to create a regex that will filter out all possible words from the list for each guess. The regex will be constructed as follows:

```
^(?=match all GREEN words)(?=match all YELLOW words)(?=omit all GRAY words))
```

Regex structure

```
new RegExp(
// String starts with, ^
`^` +
// Correct letters (GREEN), (?=A.K..)
`(?=${CORRECT})` +
// Letter exists but not in that place (YELLOW), (?=[^K][^KA][^A][^KA])
`(?=${WRONG_PLACE})` +
// Possible letters (YELLOW), (?=.*A)(?=.*B)(?=.*C)
// With counts, (?=.*E{2,}.*)
POSSIBLE +
// Don't appear (GRAY), T (have to add double backslash!), (?=\\b[^\\WT]+\\b)
WRONG +
// Finish with positive lookahead, .*
'.*', 
// g = global
// m = match newline
'gm'
)
``

### The game

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
