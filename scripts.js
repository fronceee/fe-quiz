const question = document.querySelector(".question-text");
const answer = document.querySelectorAll(".button-group > button");
const summary_page = document.querySelector(".summary");
const question_page = document.querySelector(".question");
const summary_text = document.querySelector(".summary-text");

summary_page.style.display = "none";

let current_q = -1;
const max_questions = 5;
let correct_count = 0;

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    // The loop repeats until there are elements to mix
    randomIndex = Math.floor(Math.random() * currentIndex); // Select the remaining element.
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      // Swapping with the current element.
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array; // Returning the shuffled array
}

function generateWrongAnswers(correctAnswer, count = 3, options = {}) {
  const {
    allowNegative = true,
    maxDeviation = null,
    strategy = "mixed",
  } = options;

  const wrongAnswers = new Set();
  const correct = Number(correctAnswer);

  // Calculate reasonable deviation range
  const deviation = maxDeviation || Math.max(Math.abs(correct) * 0.5, 10);

  const strategies = {
    // Common calculation errors
    offByOne: () => [correct + 1, correct - 1],

    // Close but wrong (within 10-50% of correct answer)
    nearby: () => {
      const range = Math.max(Math.abs(correct) * 0.2, 3);
      return [
        Math.round(correct + Math.random() * range + 1),
        Math.round(correct - Math.random() * range - 1),
      ];
    },

    // Common multiplication/division errors
    operationError: () => {
      if (correct === 0) return [1, -1];
      return [
        Math.round(correct * 2),
        Math.round(correct / 2),
        Math.round(correct * 1.5),
      ];
    },

    // Sign errors
    signError: () => (allowNegative ? [-correct] : [Math.abs(correct) + 1]),

    // Digit transposition (for multi-digit numbers)
    digitError: () => {
      const str = Math.abs(correct).toString();
      if (str.length < 2) return [correct + 10, correct + 100];

      // Swap first two digits
      const swapped = str[1] + str[0] + str.slice(2);
      return [correct < 0 ? -parseInt(swapped) : parseInt(swapped)];
    },

    // Random but reasonable
    random: () => {
      return Array(2)
        .fill()
        .map(() => {
          const offset = (Math.random() - 0.5) * deviation * 2;
          return Math.round(correct + offset);
        });
    },
  };

  // Generate wrong answers using different strategies
  let attempts = 0;
  while (wrongAnswers.size < count && attempts < 50) {
    let candidates = [];

    if (strategy === "mixed") {
      // Use a mix of strategies
      const strategyNames = Object.keys(strategies);
      const randomStrategy =
        strategyNames[Math.floor(Math.random() * strategyNames.length)];
      candidates = strategies[randomStrategy]();
    } else if (strategies[strategy]) {
      candidates = strategies[strategy]();
    } else {
      candidates = strategies.random();
    }

    candidates.forEach((candidate) => {
      if (
        candidate !== correct &&
        (allowNegative || candidate >= 0) &&
        !wrongAnswers.has(candidate)
      ) {
        wrongAnswers.add(candidate);
      }
    });

    attempts++;
  }

  // Fill remaining slots with random nearby numbers if needed
  while (wrongAnswers.size < count) {
    const offset = (Math.random() - 0.5) * deviation * 2;
    const candidate = Math.round(correct + offset);

    if (
      candidate !== correct &&
      (allowNegative || candidate >= 0) &&
      !wrongAnswers.has(candidate)
    ) {
      wrongAnswers.add(candidate);
    }
  }

  return Array.from(wrongAnswers).slice(0, count);
}

class Question {
  constructor(
    question,
    answer_1,
    answer_2,
    answer_3,
    answer_4,
    answer_correct
  ) {
    this.question = question;
    this.answer_correct = answer_correct;
    this.answer_array = [
      answer_1,
      answer_2,
      answer_3,
      answer_4,
      answer_correct,
    ];
  }
}

const min = 0;
const max = 100;

const questions = [];
const operators = ["+", "-", "*"];

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createCorrectAnswer(ops, n1, n2) {
  switch (ops) {
    case "+":
      return n1 + n2;
    case "-":
      return n1 - n2;
    case "*":
      return n1 * n2;
  }
}

function generateQuestion() {
  const operator = operators[getRandomInt(0, operators.length - 1)];
  const n1 = getRandomInt(1, 30);
  const n2 = getRandomInt(1, 30);

  const correctAnswer = createCorrectAnswer(operator, n1, n2);

  const [w1, w2, w3, w4] = generateWrongAnswers(correctAnswer, 4);

  const question = new Question(
    `${n1} ${operator} ${n2}`,
    w1,
    w2,
    w3,
    w4,
    correctAnswer
  );
  // TODO: display question
  current_q++;
  questions.push(question);
}

function displayCurrentQuestion() {
  const currentQuestion = questions[current_q];
  question.innerHTML = currentQuestion.question;

  const answer_array = shuffle(currentQuestion.answer_array);

  for (let i = 0; i < currentQuestion.answer_array.length; i++) {
    answer[i].innerText = answer_array[i];
  }
}

function handleQuestion() {
  generateQuestion();
  displayCurrentQuestion();
}

handleQuestion();

function handleAnswer(event) {
  const current_choice_event = event.currentTarget;
  current_choice_event.disabled = true;
  const current_answer = event.target.innerText;
  const correct_answer = questions[current_q].answer_correct;

  const isCorrect = correct_answer == current_answer;

  if (isCorrect) correct_count++;

  anime({
    targets: current_choice_event,
    backgroundColor: [isCorrect ? "#90ee90" : "#ee9090ff", "#ffffff"],
    duration: 1000,
    easing: "easeOutSine",
    complete: () => {
      current_choice_event.disabled = false;
      if (current_q == max_questions - 1) {
        summary_page.style.display = "block";
        question_page.style.display = "none";
        summary_text.innerText = `You have given ${correct_count} correct answer${
          correct_answer == 1 ? "" : "s"
        } out of ${max_questions}. Accuracy is ${0}%`;
      } else {
        handleQuestion();
      }
    },
  });
}

for (let i = 0; i < answer.length; i++) {
  answer[i].addEventListener("click", handleAnswer);
}

// TODO: generate not correct answer, handle correct display, create summary page, genrate new questions
