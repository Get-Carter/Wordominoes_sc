/**************************************************************
 * Wordominoes with Lives
 *
 * Data Model:
 *  - dictionary: loaded from words_dictionary.json
 *  - wordWheel: array of 9 letters (index 0 = center) generated once
 *  - typedWord: the current word being typed
 *  - completedWords: array of finalized words
 *  - totalCharacterCount: sum of lengths of completed words
 *  - currentState: "menu" or "play"
 *  - lives: number of resets available (starts at 3)
 **************************************************************/
let dictionary = {};
let wordWheel = [];
let typedWord = "";
let completedWords = [];
let totalCharacterCount = 0;
let currentState = "menu";
let lives = 3;

// List of finish messages
const finishMessages = [
  "Better luck next time!",
  "Don’t lose your letters—just re-shuffle ’em.",
  "That play didn’t quite spell victory, but keep on word-ing!",
  "Looks like the board wasn’t on your side today.",
  "Even the best of us drop our tiles sometimes.",
  "One misplay isn’t the end—rearrange those letters and try again.",
  "It wasn’t a win, but you still made a bold move.",
  "Keep calm and game on—every round is a fresh start.",
  "That round may have been a bit jumbled, but victory is just a play away.",
  "Your move was off-key, but your spirit’s still in tune.",
  "Not every letter falls into place—next time, they’ll align!",
  "Your strategy may have been a mis-spelling today, but you’ll ace it tomorrow.",
  "One rough round doesn’t define you—keep battling the board.",
  "A little shuffle never hurt—try that move again!",
  "Looks like you scrambled that one—better word luck next time!",
  "Even word wizards have off days—your next spell will be perfect.",
  "That play might have been a letter miss, but tomorrow holds a word win.",
  "Don’t let one flop get you down—every game’s a chance to re-letter your fate.",
  "In the game of words, a misstep is just a chance for a clever comeback.",
  "One misplay isn’t the final chapter—turn the page and start a new game!"
];

document.addEventListener("DOMContentLoaded", () => {
  // Load the dictionary
  fetch("words_dictionary.json")
    .then(res => res.json())
    .then(data => {
      dictionary = data;
    })
    .catch(err => console.error("Error loading dictionary:", err));

  // Attach event listeners
  document.getElementById("playButton").addEventListener("click", startGame);
  document.getElementById("howToPlayButton").addEventListener("click", showInstructions);
  document.getElementById("deleteButton").addEventListener("click", handleDelete);
  document.getElementById("enterButton").addEventListener("click", handleEnter);
  document.getElementById("resetButton").addEventListener("click", handleReset);
  document.getElementById("finishButton").addEventListener("click", handleFinish);

  updateDisplay();
});

/**************************************************************
 * State and Display
 **************************************************************/
function startGame() {
  currentState = "play";
  typedWord = "";
  completedWords = [];
  totalCharacterCount = 0;
  // Generate the word wheel once when the game starts
  generateWordWheel();
  updateDisplay();
}

function showInstructions() {
  currentState = "howToPlay";
  updateDisplay();
}

function updateDisplay() {
  // Show/hide menu vs. game
  document.getElementById("menu").style.display = (currentState === "menu") ? "block" : "none";
  document.getElementById("gameContainer").style.display = (currentState === "play") ? "block" : "none";

  if (currentState === "play") {
    renderWheel();
    renderWordsArea();
    updateCharacterCount();
    updateLivesDisplay();
    // If no lives remain, hide Reset and show Finish button
    if (lives === 0) {
      document.getElementById("resetButton").style.display = "none";
      document.getElementById("finishButton").style.display = "inline-block";
    } else {
      document.getElementById("resetButton").style.display = "inline-block";
      document.getElementById("finishButton").style.display = "none";
    }
  }
}

/**************************************************************
 * Word Wheel Generation and Rendering
 **************************************************************/
function generateWordWheel() {
  // Try to pick a random 9+ letter word from the dictionary
  const dictKeys = Object.keys(dictionary);
  const candidates = dictKeys.filter(word => word.length >= 9);

  if (candidates.length > 0) {
    let randomWord = candidates[Math.floor(Math.random() * candidates.length)].toUpperCase();
    let letters = randomWord.split("");

    // If more than 9 letters, shuffle and take the first 9
    if (letters.length > 9) {
      letters.sort(() => Math.random() - 0.5);
      letters = letters.slice(0, 9);
    }
    // If fewer than 9 letters, add random letters until we have 9
    while (letters.length < 9) {
      letters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    }
    // Ensure the center letter (first letter of randomWord) is in the wheel
    const center = randomWord[0];
    if (!letters.includes(center)) {
      letters[0] = center;
    }
    wordWheel = letters;
  } else {
    // Fallback: random letters
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    wordWheel = [];
    for (let i = 0; i < 9; i++) {
      wordWheel.push(alpha.charAt(Math.floor(Math.random() * alpha.length)));
    }
  }
}

function renderWheel() {
  const wheelDiv = document.getElementById("wordWheel");
  wheelDiv.innerHTML = "";

  // Center letter
  const centerDiv = document.createElement("div");
  centerDiv.className = "centerLetter";
  centerDiv.innerText = wordWheel[0];
  centerDiv.addEventListener("click", () => handleLetterClick(wordWheel[0]));
  wheelDiv.appendChild(centerDiv);

  // Encircling letters
  const radius = 35;
  for (let i = 1; i < 9; i++) {
    const angle = 25 + 45 * i;
    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
    const y = 50 + radius * Math.sin(angle * Math.PI / 180);

    const letterDiv = document.createElement("div");
    letterDiv.className = "encirclingLetter";
    letterDiv.style.left = x + "%";
    letterDiv.style.top = y + "%";
    letterDiv.innerText = wordWheel[i];
    letterDiv.addEventListener("click", () => handleLetterClick(wordWheel[i]));
    wheelDiv.appendChild(letterDiv);
  }
}

/**************************************************************
 * Words Area Rendering
 **************************************************************/
function renderWordsArea() {
  const wordsArea = document.getElementById("wordsArea");
  wordsArea.innerHTML = "";

  // Render completed words (each on its own row)
  completedWords.forEach(word => {
    const row = document.createElement("div");
    row.className = "wordRow";
    for (let i = 0; i < word.length; i++) {
      const box = document.createElement("div");
      box.className = "letterBox";
      box.innerText = word[i];
      // Highlight the last letter in green
      if (i === word.length - 1) {
        box.classList.add("greenBox");
      }
      row.appendChild(box);
    }
    wordsArea.appendChild(row);
  });

  // Render the currently typed word
  if (typedWord.length > 0) {
    const row = document.createElement("div");
    row.className = "wordRow";
    for (let i = 0; i < typedWord.length; i++) {
      const box = document.createElement("div");
      box.className = "letterBox";
      box.innerText = typedWord[i];
      row.appendChild(box);
    }
    wordsArea.appendChild(row);
  }
}

/**************************************************************
 * Character Count
 **************************************************************/
function updateCharacterCount() {
  const countSoFar = totalCharacterCount + typedWord.length;
  document.getElementById("characterCount").innerText = "Character count: " + countSoFar;
}

/**************************************************************
 * Lives Display and Reset / Finish
 **************************************************************/
function updateLivesDisplay() {
  const livesStr = ".".repeat(lives);
  document.getElementById("livesDisplay").innerText = "Lives: " + livesStr;
}

function handleReset() {
  if (lives > 0) {
    lives--;
    // Reset only the words and character count; leave the existing word wheel intact
    typedWord = "";
    completedWords = [];
    totalCharacterCount = 0;
    updateDisplay();
  } else {
    alert("No more lives left!");
  }
}

function handleFinish() {
  // Choose a random finish message and display it
  const randomIndex = Math.floor(Math.random() * finishMessages.length);
  const message = finishMessages[randomIndex];
  alert(message);
}

/**************************************************************
 * Button Handlers for Letters, Delete, Enter
 **************************************************************/
function handleLetterClick(letter) {
  typedWord += letter;
  renderWordsArea();
  updateCharacterCount();
}

function handleDelete() {
  if (typedWord.length > 0) {
    typedWord = typedWord.slice(0, -1);
    renderWordsArea();
    updateCharacterCount();
  }
}

function handleEnter() {
  if (typedWord.length === 0) return;

  const center = wordWheel[0];
  if (!typedWord.includes(center)) {
    alert(`Word must include the center letter: ${center}`);
    return;
  }

  if (!dictionary[typedWord.toLowerCase()]) {
    alert(`Invalid word: ${typedWord}`);
    return;
  }

  completedWords.push(typedWord);
  totalCharacterCount += typedWord.length;
  typedWord = "";

  if (completedWords.length >= 5) {
    alert("Congratulations, you formed 5 valid words!");
  }

  renderWordsArea();
  updateCharacterCount();
}
