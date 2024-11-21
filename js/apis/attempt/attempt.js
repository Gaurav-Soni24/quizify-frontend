const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

let quizData = null; // Global variable to store quiz data

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function setupInstructions() {
  const instructionsContainer = document.getElementById(
    "instructions-container"
  );
  if (quizData && quizData.teacherInstructions) {
    const instructions = quizData.teacherInstructions
      .split("\n")
      .map((instruction) => {
        return `<li>${instruction}</li>`;
      })
      .join("");
    instructionsContainer.innerHTML = instructions;
  } else {
    console.error("Quiz instructions not found");
  }
}

async function fetchQuizData(quizId) {
  try {
    const response = await axios.get(
      `https://quizify-backend-theta.vercel.app/public-quiz/${quizId}`
    );

    if (!response || !response.data || !response.data.quiz) {
      throw new Error("Invalid quiz data received");
    }

    quizData = response.data.quiz;
    console.log("Quiz data fetched successfully:", quizData);

    // Update quiz title and description
    const titleElement = document.querySelector("#section-1 h1");
    const descElement = document.querySelector("#section-1 p");

    if (titleElement && descElement) {
      titleElement.textContent = quizData.title || "Quiz";
      descElement.textContent =
        quizData.description || "No description available";
    }

    // Setup form fields and instructions
    if (typeof setupFormFields === "function") {
      setupFormFields(quizData.requiredFields || {});
    } else {
      console.error("setupFormFields function is not defined");
    }

    if (typeof setupInstructions === "function") {
      setupInstructions();
    } else {
      console.error("setupInstructions function is not defined");
    }

    return quizData;
  } catch (error) {
    console.error("Error fetching quiz data:", {
      message: error.message,
      stack: error.stack,
      response: error.response,
    });

    // Show error message to user
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = "Failed to load quiz. Please try again later.";
    document.querySelector(".container").prepend(errorMessage);

    throw error;
  }
}
fetchQuizData(id);

// Add a separate function to update instructions
function updateInstructions() {
  const instructionsUl = document.querySelector("#section-2 .instructions ul");
  if (instructionsUl && quizData) {
    instructionsUl.innerHTML = `
            <li>Total marks: ${quizData.totalMarks || 0} marks</li>
            <li>Time limit: ${quizData.timeLimit || 0} minutes</li>
            <li>Passing score: ${quizData.passingScore || 0}%</li>
            <li>Number of attempts allowed: ${
              quizData.attemptsAllowed || 1
            }</li>
            ${
              quizData.teacherInstructions
                ? quizData.teacherInstructions
                    .split("\n")
                    .map((instruction) => `<li>${instruction.trim()}</li>`)
                    .join("")
                : ""
            }
          `;
  }
}

function setupFormFields(requiredFields) {
  const form = document.getElementById("details-form");
  if (!form) return;

  form.innerHTML = ""; // Clear existing form fields

  const fieldLabels = {
    name: "Full Name",
    email: "Email",
    department: "Department",
    institution: "Institution",
    dob: "Date of Birth",
    gender: "Gender",
    address: "Address",
    nationality: "Nationality",
    phone: "Phone Number",
  };

  const fieldTypes = {
    name: "text",
    email: "email",
    department: "text",
    institution: "text",
    dob: "date",
    gender: "select",
    address: "textarea",
    nationality: "text",
    phone: "tel",
  };

  // Create fields based on required fields
  for (const [field, isRequired] of Object.entries(requiredFields)) {
    if (isRequired) {
      const fieldContainer = document.createElement("div");
      fieldContainer.className = "form-field";

      const label = document.createElement("label");
      label.setAttribute("for", field);
      label.textContent = fieldLabels[field];

      let input;
      if (field === "gender") {
        input = document.createElement("select");
        const options = ["Select Gender", "Male", "Female", "Other"];
        options.forEach((optionText) => {
          const option = document.createElement("option");
          option.value = optionText.toLowerCase();
          option.textContent = optionText;
          input.appendChild(option);
        });
      } else if (field === "address") {
        input = document.createElement("textarea");
        input.rows = 3;
      } else {
        input = document.createElement("input");
        input.type = fieldTypes[field];
      }

      input.id = field;
      input.name = field;
      input.required = true;

      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      form.appendChild(fieldContainer);
    }
  }

  // Add submit button
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "submit-btn";
  submitButton.textContent = "Continue";
  form.appendChild(submitButton);
}

// Modify the details form submit handler
document
  .getElementById("details-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("section-1").style.display = "none";
    document.getElementById("section-2").style.display = "block";
  });

// Handle instructions agreement
document
  .getElementById("agree-checkbox")
  .addEventListener("change", function (e) {
    document.getElementById("start-quiz-btn").disabled = !e.target.checked;
  });

// Handle starting the quiz
document
  .getElementById("start-quiz-btn")
  .addEventListener("click", function () {
    if (!quizData) {
      alert("Quiz data is not loaded yet. Please wait.");
      return;
    }
    document.getElementById("section-2").style.display = "none";
    document.getElementById("section-3").style.display = "block";
    renderQuestions(quizData.questions);
  });

let currentQuestion = 0;

function createQuestionElement(question, index, originalIndex) {
  const questionDiv = document.createElement("div");
  questionDiv.className = `question ${index === 0 ? "active" : ""}`;
  questionDiv.dataset.index = index;
  questionDiv.dataset.originalIndex = originalIndex;

  // Create question header
  const questionHeader = document.createElement("div");
  questionHeader.className = "question-header";
  questionHeader.innerHTML = `
          <span class="question-number">Question ${
            parseInt(originalIndex) + 1
          }</span>
          <span class="question-marks">(${question.marks} marks)</span>
        `;

  // Create question text
  const questionText = document.createElement("h3");
  questionText.textContent = question.text;

  questionDiv.appendChild(questionHeader);
  questionDiv.appendChild(questionText);

  // Render different question types
  switch (question.type) {
    case "single":
      renderSingleChoice(questionDiv, question.options, index);
      break;
    case "multiple":
      renderMultipleChoice(questionDiv, question.options, index);
      break;
    case "text":
      renderTextInput(questionDiv, index);
      break;
    case "integer":
      renderNumberInput(questionDiv, index);
      break;
  }

  // Add question controls
  updateQuestionControls(questionDiv, index);

  return questionDiv;
}

function renderSingleChoice(container, options, index) {
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";

  options.forEach((option, optionIndex) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question-${index}`;
    input.value = option.text;
    input.id = `q${index}-option${optionIndex}`;

    const optionText = document.createElement("span");
    optionText.textContent = option.text;

    label.appendChild(input);
    label.appendChild(optionText);
    optionsDiv.appendChild(label);

    // Add answer tracking
    input.addEventListener("change", () => {
      updatePaletteStatus(index, "answered");
    });
  });

  container.appendChild(optionsDiv);
}

function renderMultipleChoice(container, options, index) {
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";

  options.forEach((option, optionIndex) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `question-${index}`;
    input.value = option.text;
    input.id = `q${index}-option${optionIndex}`;

    const optionText = document.createElement("span");
    optionText.textContent = option.text;

    label.appendChild(input);
    label.appendChild(optionText);
    optionsDiv.appendChild(label);

    // Add answer tracking
    input.addEventListener("change", () => {
      const checkedInputs = optionsDiv.querySelectorAll("input:checked");
      if (checkedInputs.length > 0) {
        updatePaletteStatus(index, "answered");
      } else {
        updatePaletteStatus(index, ""); // Remove answered status if no options selected
      }
    });
  });

  container.appendChild(optionsDiv);
}

function renderTextInput(container, index) {
  const inputDiv = document.createElement("div");
  inputDiv.className = "text-input-container";

  const input = document.createElement("input");
  input.type = "text";
  input.name = `question-${index}`;
  input.id = `question-${index}`;
  input.className = "text-input";
  input.placeholder = "Type your answer here";

  // Add answer tracking
  input.addEventListener("input", () => {
    if (input.value.trim()) {
      updatePaletteStatus(index, "answered");
    } else {
      updatePaletteStatus(index, "");
    }
  });

  inputDiv.appendChild(input);
  container.appendChild(inputDiv);
}

function renderNumberInput(container, index) {
  const inputDiv = document.createElement("div");
  inputDiv.className = "number-input-container";

  const input = document.createElement("input");
  input.type = "number";
  input.name = `question-${index}`;
  input.id = `question-${index}`;
  input.className = "number-input";
  input.placeholder = "Enter your answer";

  // Add answer tracking
  input.addEventListener("input", () => {
    if (input.value.trim()) {
      updatePaletteStatus(index, "answered");
    } else {
      updatePaletteStatus(index, "");
    }
  });

  inputDiv.appendChild(input);
  container.appendChild(inputDiv);
}

// Update the renderQuestions function to use the new question element creation
function renderQuestions(questions) {
  if (!questions || !Array.isArray(questions)) return;

  // Create indexMap if shuffling is enabled
  if (quizData.settings.shuffleQuestions) {
    quizData.indexMap = {};
    const indices = Array.from({ length: questions.length }, (_, i) => i);
    const shuffledIndices = shuffleArray([...indices]);
    shuffledIndices.forEach((shuffled, original) => {
      quizData.indexMap[original] = shuffled;
    });
  }

  const container = document.querySelector(".question-container");
  if (!container) return;

  container.innerHTML = "";

  questions.forEach((question, index) => {
    const originalIndex = quizData.indexMap
      ? Object.keys(quizData.indexMap).find(
          (key) => quizData.indexMap[key] === index
        )
      : index;

    const questionDiv = createQuestionElement(question, index, originalIndex);
    container.appendChild(questionDiv);
  });

  // Show first question
  const firstQuestion = container.querySelector(".question");
  if (firstQuestion) {
    firstQuestion.classList.add("active");
  }

  createQuestionNavigation(container, questions.length);
  createQuestionPalette(questions.length);
}

function createQuestionNavigation(container, totalQuestions) {
  const navDiv = document.createElement("div");
  navDiv.className = "question-nav";

  const prevBtn = document.createElement("button");
  prevBtn.id = "prev-btn";
  prevBtn.className = "nav-btn";
  prevBtn.textContent = "Previous";
  prevBtn.onclick = () => navigateToQuestion(currentQuestion - 1);

  const nextBtn = document.createElement("button");
  nextBtn.id = "next-btn";
  nextBtn.className = "nav-btn";
  nextBtn.textContent = "Next";
  nextBtn.onclick = () => navigateToQuestion(currentQuestion + 1);

  navDiv.appendChild(prevBtn);
  navDiv.appendChild(nextBtn);
  container.appendChild(navDiv);

  updateNavigationButtons();
}

function navigateToQuestion(index) {
  if (index < 0 || index >= quizData.questions.length) return;

  const questions = document.querySelectorAll(".question");
  const paletteBtns = document.querySelectorAll(".palette-btn");

  questions.forEach((q) => q.classList.remove("active"));
  paletteBtns.forEach((b) => b.classList.remove("active"));

  questions[index].classList.add("active");
  paletteBtns[index].classList.add("active");

  currentQuestion = index;
  updateNavigationButtons();
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const totalQuestions = quizData.questions.length;

  prevBtn.disabled = currentQuestion === 0;
  nextBtn.disabled = currentQuestion === totalQuestions - 1;
}

// Update answer tracking
function updatePaletteStatus(questionIndex) {
  const paletteBtns = document.querySelectorAll(".palette-btn");
  paletteBtns[questionIndex].classList.add("answered");
}

// Modify input event listeners to track answered questions
function addAnswerTracking(input, questionIndex) {
  input.addEventListener("change", () => {
    updatePaletteStatus(questionIndex);
  });
}

// Update the render functions to add answer tracking
function renderSingleChoice(container, options, index) {
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";

  options.forEach((option, optionIndex) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question-${index}`;
    input.value = option.text;
    input.id = `q${index}-option${optionIndex}`;

    label.appendChild(input);
    label.appendChild(document.createTextNode(option.text));
    optionsDiv.appendChild(label);
    addAnswerTracking(input, index);
  });

  container.appendChild(optionsDiv);
}

function renderMultipleChoice(container, options, index) {
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";

  options.forEach((option, optionIndex) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `question-${index}`;
    input.value = option.text;
    input.id = `q${index}-option${optionIndex}`;

    label.appendChild(input);
    label.appendChild(document.createTextNode(option.text));
    optionsDiv.appendChild(label);
    addAnswerTracking(input, index);
  });

  container.appendChild(optionsDiv);
}

function renderTextInput(container, index) {
  const input = document.createElement("input");
  input.type = "text";
  input.name = `question-${index}`;
  input.id = `question-${index}`;
  input.className = "text-input";
  input.placeholder = "Type your answer here";

  container.appendChild(input);
  addAnswerTracking(input, index);
}

function renderNumberInput(container, index) {
  const input = document.createElement("input");
  input.type = "number";
  input.name = `question-${index}`;
  input.id = `question-${index}`;
  input.className = "number-input";
  input.placeholder = "Enter your answer";

  container.appendChild(input);
  addAnswerTracking(input, index);
}

// Update collectAnswers to handle all question types
function collectAnswers() {
  const answers = [];
  const questions = document.querySelectorAll(".question");
  let allAnswered = true;

  questions.forEach((questionDiv, index) => {
    const question = quizData.questions[index];
    let answer = null;

    switch (question.type) {
      case "single":
        const selected = questionDiv.querySelector(
          'input[type="radio"]:checked'
        );
        if (!selected) allAnswered = false;
        answer = selected?.value;
        break;

      case "multiple":
        const selectedMultiple = Array.from(
          questionDiv.querySelectorAll('input[type="checkbox"]:checked')
        ).map((input) => input.value);
        if (!selectedMultiple.length) allAnswered = false;
        answer = selectedMultiple;
        break;

      case "text":
        const textInput = questionDiv.querySelector('input[type="text"]');
        if (!textInput?.value.trim()) allAnswered = false;
        answer = textInput?.value.trim();
        break;

      case "integer":
        const numInput = questionDiv.querySelector('input[type="number"]');
        if (!numInput?.value) allAnswered = false;
        answer = numInput?.value;
        break;
    }

    answers.push({
      questionIndex: index,
      type: question.type,
      answer: answer,
    });
  });

  if (!allAnswered) {
    alert("Please answer all questions before x.");
    return null;
  }

  return answers;
}

// Update checkAnswers function
function checkAnswers(answers, questions) {
  const results = answers.map((answer) => {
    const question = questions[answer.questionIndex];
    let isCorrect = false;
    let correctAnswer = null;

    switch (question.type) {
      case "single":
        const correctOption = question.options.find((opt) => opt.isCorrect);
        isCorrect = answer.answer === correctOption.text;
        correctAnswer = correctOption.text;
        break;

      case "multiple":
        const correctOptions = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.text);
        isCorrect =
          JSON.stringify(answer.answer.sort()) ===
          JSON.stringify(correctOptions.sort());
        correctAnswer = correctOptions;
        break;

      case "text":
        isCorrect =
          answer.answer.toLowerCase() === question.correctAnswer.toLowerCase();
        correctAnswer = question.correctAnswer;
        break;

      case "integer":
        isCorrect =
          parseInt(answer.answer) === parseInt(question.correctAnswer);
        correctAnswer = question.correctAnswer;
        break;
    }

    return {
      questionIndex: answer.questionIndex,
      type: question.type,
      isCorrect,
      correctAnswer,
      userAnswer: answer.answer,
    };
  });

  return results;
}

// Update the submit quiz handler
document
  .getElementById("submit-quiz-btn")
  .addEventListener("click", function () {
    submitQuiz(false);
  });

// Update submit quiz function
async function submitQuiz(isAutoSubmit = false) {
  const confirmMessage = isAutoSubmit
    ? "Time is up! Your quiz will be submitted automatically."
    : "Are you sure you want to submit the quiz?";

  if (isAutoSubmit || confirm(confirmMessage)) {
    const answers = collectAnswers();
    if (answers) {
      // Stop the timer
      stopTimer();

      // Remove quiz active state
      document.body.classList.remove("quiz-active");

      // Process results
      const results = checkAnswers(answers, quizData.questions);
      const resultJSON = generateResultJSON(results);

      // Log the submitted data
      console.log("Submitted Data:", resultJSON);

      // ** New Code: Submit the results to the backend API **
      try {
        const response = await axios.post("http://localhost:3000/submission", {
          quizId: quizData.quizId,
          userDetails: resultJSON.userDetails,
          submittedAt: resultJSON.submittedAt,
          score: resultJSON.score,
          questions: resultJSON.questions,
          quizDescription: quizData.description, // Include quiz description
        });

        console.log("Submission Response:", response.data);
      } catch (error) {
        console.error("Error submitting quiz:", error);
        alert("Failed to submit quiz. Please try again.");
      }

      // Switch to results section
      document.getElementById("section-3").style.display = "none";
      document.getElementById("section-4").style.display = "block";

      showResults(results);
    }
  }
}

// Update generateResultJSON to handle shuffled questions
function generateResultJSON(results) {
  // Get user details from the form
  const formData = new FormData(document.getElementById("details-form"));
  const userDetails = {};
  formData.forEach((value, key) => {
    userDetails[key] = value;
  });

  // Calculate score
  const totalQuestions = results.length;
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(2);

  // Map shuffled indices back to original order if questions were shuffled
  const questionResults = results.map((result, index) => {
    const originalIndex = quizData.indexMap
      ? Object.keys(quizData.indexMap).find(
          (key) => quizData.indexMap[key] === index
        )
      : index;

    return {
      questionNumber: parseInt(originalIndex) + 1,
      questionText: quizData.questions[index].text,
      questionType: quizData.questions[index].type,
      userAnswer: result.userAnswer,
      correctAnswer: result.correctAnswer,
      isCorrect: result.isCorrect,
      marks: quizData.questions[index].marks || 0,
    };
  });

  // Sort results by original question number if shuffled
  if (quizData.indexMap) {
    questionResults.sort((a, b) => a.questionNumber - b.questionNumber);
  }

  return {
    quizId: quizData.quizId,
    quizTitle: quizData.title,
    quizDescription: quizData.description,
    userDetails: userDetails,
    submittedAt: new Date().toISOString(),
    score: {
      total: totalQuestions,
      correct: correctAnswers,
      percentage: parseFloat(percentage),
      totalMarks: quizData.totalMarks,
      obtainedMarks: questionResults.reduce(
        (sum, q) => sum + (q.isCorrect ? q.marks : 0),
        0
      ),
    },
    questions: questionResults,
  };
}

// Update showResults to handle all question types
function showResults(results) {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = "";

  const captureDiv = document.createElement("div");
  captureDiv.className = "results-capture";

  // Add quiz title and description
  const titleDiv = document.createElement("div");
  titleDiv.className = "quiz-title";
  titleDiv.innerHTML = `
          <h2>${quizData.title}</h2>
          <p class="quiz-description">${quizData.description}</p>
        `;
  captureDiv.appendChild(titleDiv);

  // Calculate score
  const totalMarks = quizData.totalMarks;
  const earnedMarks = results.reduce((total, result, index) => {
    return total + (result.isCorrect ? quizData.questions[index].marks : 0);
  }, 0);
  const percentage = (earnedMarks / totalMarks) * 100;

  // Show score
  const scoreDiv = document.createElement("div");
  scoreDiv.className = "score";
  scoreDiv.innerHTML = `
          <h3>Quiz Results</h3>
          <h4>Your Score: ${earnedMarks}/${totalMarks}</h4>
          <p>Percentage: ${percentage.toFixed(2)}%</p>
          <p>Pass/Fail: ${
            percentage >= quizData.passingScore ? "✅ Passed" : "❌ Failed"
          }</p>
        `;
  captureDiv.appendChild(scoreDiv);

  // Show detailed results only if enabled in settings
  if (quizData.settings.showAnswers) {
    results.forEach((result, index) => {
      const resultDiv = document.createElement("div");
      resultDiv.className = `result-item ${
        result.isCorrect ? "correct" : "incorrect"
      }`;

      const question = quizData.questions[index];
      resultDiv.innerHTML = `
              <p>Question ${index + 1} (${question.marks} marks): ${
        result.isCorrect ? "✅ Correct" : "❌ Incorrect"
      }</p>
              <p>Question: ${question.text}</p>
              ${
                !result.isCorrect
                  ? `
                <p>Your answer: ${result.userAnswer}</p>
                <p>Correct answer: ${result.correctAnswer}</p>
              `
                  : ""
              }
            `;

      captureDiv.appendChild(resultDiv);
    });
  }

  resultsContainer.appendChild(captureDiv);

  // Add download button
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-btn";
  downloadBtn.innerHTML = "📥 Download Results";
  downloadBtn.onclick = () => downloadResults(captureDiv);
  resultsContainer.appendChild(downloadBtn);
}

// Function to download results as PNG
async function downloadResults(element) {
  try {
    // Show loading state
    const downloadBtn = document.querySelector(".download-btn");
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = "Generating image...";

    // Create canvas from the results div
    const canvas = await html2canvas(element, {
      backgroundColor: "white",
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    });

    // Convert to image and download
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `quiz-results-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();

    // Reset button state
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = "📥 Download Results";
  } catch (error) {
    console.error("Error generating image:", error);
    alert("Failed to generate image. Please try again.");
  }
}

function updateQuestionControls(container, questionIndex) {
  const controlsDiv = document.createElement("div");
  controlsDiv.className = "question-controls";
  controlsDiv.style.marginTop = "1rem";
  controlsDiv.style.display = "flex";
  controlsDiv.style.gap = "0.5rem";

  // Save & Next button
  const saveNextBtn = document.createElement("button");
  saveNextBtn.className = "nav-btn";
  saveNextBtn.textContent = "Save & Next";
  saveNextBtn.onclick = () => {
    updatePaletteStatus(questionIndex, "answered");
    if (questionIndex < quizData.questions.length - 1) {
      navigateToQuestion(questionIndex + 1);
    }
  };

  // Mark for Review button
  const markReviewBtn = document.createElement("button");
  markReviewBtn.className = "nav-btn";
  markReviewBtn.style.background = "#ffc107";
  markReviewBtn.textContent = "Mark for Review";
  markReviewBtn.onclick = () => {
    updatePaletteStatus(questionIndex, "marked");
    if (questionIndex < quizData.questions.length - 1) {
      navigateToQuestion(questionIndex + 1);
    }
  };

  // Save & Mark for Review button
  const saveMarkBtn = document.createElement("button");
  saveMarkBtn.className = "nav-btn";
  saveMarkBtn.style.background = "#04AA6D";
  saveMarkBtn.textContent = "Save & Mark for Review";
  saveMarkBtn.onclick = () => {
    updatePaletteStatus(questionIndex, "saved-marked");
    if (questionIndex < quizData.questions.length - 1) {
      navigateToQuestion(questionIndex + 1);
    }
  };

  controlsDiv.appendChild(saveNextBtn);
  controlsDiv.appendChild(markReviewBtn);
  controlsDiv.appendChild(saveMarkBtn);
  container.appendChild(controlsDiv);
}

// Update the palette status function
function updatePaletteStatus(questionIndex, status) {
  const paletteBtns = document.querySelectorAll(".palette-btn");
  const btn = paletteBtns[questionIndex];

  // Remove all status classes first
  btn.classList.remove("answered", "marked", "saved-marked");

  // Add the new status class
  btn.classList.add(status);
}

// Add legend to palette
function addPaletteLegend() {
  const palette = document.querySelector(".question-palette");
  const legend = document.createElement("div");
  legend.className = "palette-legend";

  legend.innerHTML = `
          <div class="legend-item">
            <div class="legend-color not-visited"></div>
            <span>Not Visited</span>
          </div>
          <div class="legend-item">
            <div class="legend-color answered"></div>
            <span>Answered</span>
          </div>
          <div class="legend-item">
            <div class="legend-color marked"></div>
            <span>Marked for Review</span>
          </div>
          <div class="legend-item">
            <div class="legend-color saved-marked"></div>
            <span>Answered & Marked for Review</span>
          </div>
        `;

  palette.appendChild(legend);
}

// Global timer variables
let quizTimer = null;
let timerDiv = null;

// Timer setup function
function setupTimer(minutes) {
  if (!minutes) return;

  stopTimer();
  const seconds = minutes * 60;

  timerDiv = document.createElement("div");
  timerDiv.id = "quiz-timer";
  document.body.appendChild(timerDiv);

  let timeLeft = seconds;

  quizTimer = setInterval(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    timerDiv.textContent = `Time Left: ${mins}:${secs
      .toString()
      .padStart(2, "0")}`;

    if (timeLeft <= 300) {
      // 5 minutes warning
      timerDiv.classList.add("warning");
    }

    if (timeLeft === 0) {
      stopTimer();
      submitQuiz(true);
    }
    timeLeft--;
  }, 1000);
}

// Stop timer function
function stopTimer() {
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
  if (timerDiv && timerDiv.parentNode) {
    timerDiv.parentNode.removeChild(timerDiv);
    timerDiv = null;
  }
}

// Update the instruction acceptance and quiz start
document
  .getElementById("agree-checkbox")
  .addEventListener("change", function (e) {
    const startQuizBtn = document.getElementById("start-quiz-btn");
    startQuizBtn.disabled = !e.target.checked;
  });

// Start quiz button handler
document
  .getElementById("start-quiz-btn")
  .addEventListener("click", function () {
    if (!quizData) {
      alert("Quiz data is not loaded yet. Please wait.");
      return;
    }

    const agreeCheckbox = document.getElementById("agree-checkbox");
    if (!agreeCheckbox.checked) {
      alert("Please read and accept the instructions first.");
      return;
    }

    // Start the quiz
    document.getElementById("section-2").style.display = "none";
    document.getElementById("section-3").style.display = "block";
    document.body.classList.add("quiz-active");

    // Start timer only after accepting instructions
    if (quizData.timeLimit) {
      setupTimer(quizData.timeLimit);
    }

    renderQuestions(quizData.questions);
  });

// Handle page visibility changes
document.addEventListener("visibilitychange", function () {
  if (document.hidden && quizTimer) {
    // Optionally add warning or handle tab switching
    console.log("Quiz tab lost focus");
  }
});

// Handle window resize for timer positioning
window.addEventListener("resize", function () {
  if (timerDiv) {
    if (window.innerWidth <= 768) {
      timerDiv.style.top = "10px";
      timerDiv.style.right = "10px";
      timerDiv.style.fontSize = "1.1rem";
      timerDiv.style.padding = "8px 16px";
    } else {
      timerDiv.style.top = "20px";
      timerDiv.style.right = "20px";
      timerDiv.style.fontSize = "1.2rem";
      timerDiv.style.padding = "12px 24px";
    }
  }
});

// Update the instructions section
document.addEventListener("DOMContentLoaded", () => {
  const instructionsUl = document.querySelector("#section-2 .instructions ul");
  instructionsUl.innerHTML = `
          <li>Total marks: ${quizData?.totalMarks || 0} marks</li>
          <li>Time limit: ${quizData?.timeLimit || 0} minutes</li>
          <li>Passing score: ${quizData?.passingScore || 0}%</li>
          <li>Number of attempts allowed: ${quizData?.attemptsAllowed || 1}</li>
          ${quizData?.teacherInstructions
            ?.split("\n")
            .map((instruction) => `<li>${instruction}</li>`)
            .join("")}
        `;
});

// Update createQuestionPalette function
function createQuestionPalette(questionCount) {
  const palette = document.querySelector(".question-palette");
  if (!palette) return;

  palette.innerHTML = "<h3>Question Palette</h3>";

  const paletteContainer = document.createElement("div");
  paletteContainer.className = "palette-container";

  for (let i = 0; i < questionCount; i++) {
    const originalIndex = quizData.indexMap
      ? Object.keys(quizData.indexMap).find(
          (key) => quizData.indexMap[key] === i
        )
      : i;

    const btn = document.createElement("button");
    btn.className = `palette-btn ${i === 0 ? "active" : ""}`;
    btn.textContent = (parseInt(originalIndex) + 1).toString();
    btn.dataset.index = i;
    btn.dataset.originalIndex = originalIndex;

    btn.addEventListener("click", () => {
      navigateToQuestion(i);
      updateQuestionStatus(i);
    });

    paletteContainer.appendChild(btn);
  }

  palette.appendChild(paletteContainer);

  // Add legend
  addPaletteLegend(palette);
}

// Add this function to update question status
function updateQuestionStatus(index) {
  const question = document.querySelector(`.question[data-index="${index}"]`);
  const paletteBtn = document.querySelector(
    `.palette-btn[data-index="${index}"]`
  );

  if (!question || !paletteBtn) return;

  const inputs = question.querySelectorAll("input");
  let isAnswered = false;

  inputs.forEach((input) => {
    if (
      (input.type === "radio" || input.type === "checkbox") &&
      input.checked
    ) {
      isAnswered = true;
    } else if (
      (input.type === "text" || input.type === "number") &&
      input.value.trim()
    ) {
      isAnswered = true;
    }
  });

  if (isAnswered) {
    paletteBtn.classList.add("answered");
  } else {
    paletteBtn.classList.remove("answered");
  }
}

// Add event listeners for input changes
document.addEventListener("change", function (e) {
  const question = e.target.closest(".question");
  if (question) {
    const index = question.dataset.index;
    updateQuestionStatus(index);
  }
});
