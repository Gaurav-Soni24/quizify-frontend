let quizData;
let currentQuestionIndex = 0;
let answers = {};
let questionStatus = {};
let quizStartTime;
let remainingTime;
let userDetails = {};

const sounds = {
  success: new Audio("../../assets/sounds/success.mp3"),
  warning: new Audio("../../assets/sounds/warning.mp3"),
  complete: new Audio("../../assets/sounds/complete.mp3"),
};

function playSound(type) {
  if (sounds[type]) {
    sounds[type].play().catch((err) => console.log("Sound playback prevented"));
  }
}

function showSection(sectionId) {
  // Hide all sections first
  const sections = ["section-1", "section-2", "section-3", "section-4"];
  sections.forEach((id) => {
    document.getElementById(id).classList.add("hidden");
  });
  // Show the requested section
  document.getElementById(sectionId).classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
  const detailsForm = document.getElementById("details-form");
  const startQuizButton = document.getElementById("start-quiz");

  detailsForm.addEventListener("submit", function (e) {
    e.preventDefault();
    userDetails = getUserDetails();
    showSection("section-2");
  });

  startQuizButton.addEventListener("click", function () {
    showSection("section-3");
    initializeQuiz();
  });

  // Only add dashboard listener after quiz submission
  const submitQuizButton = document.getElementById("submit-quiz");
  submitQuizButton.addEventListener("click", function () {
    if (confirmSubmission()) {
      submitQuiz();
      // Now add the return dashboard listener
      const returnDashboardButton = document.getElementById("return-dashboard");
      if (returnDashboardButton) {
        returnDashboardButton.addEventListener("click", function () {
          window.location.href = "../dashboard/dashboard.html";
        });
      }
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("quizId");

  if (!quizId) {
    console.error("Error: No quiz ID provided.");
    return;
  }

  fetchQuizData(quizId);

  initializePaletteToggle();
});

async function fetchQuizData(quizId) {
  const loadingEl = document.createElement("div");
  loadingEl.className = "loading";
  loadingEl.textContent = "Loading quiz...";
  document.querySelector(".container").appendChild(loadingEl);

  try {
    const response = await axios.get(
      `https://quizify-backend-theta.vercel.app/public-quiz/${quizId}`
    );
    quizData = response.data.quiz;
    console.log(quizData);
    renderRequiredFields(quizData.requiredFields);
    loadingEl.remove();
  } catch (error) {
    loadingEl.textContent = "Error loading quiz. Please try again.";
    console.error("Error fetching quiz data:", error);
  }
}

function renderRequiredFields(requiredFields) {
  const form = document.getElementById("details-form");
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
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.innerHTML = "Continue"; // Updated icon and text to match the image

  // Styling the button to match the image
  submitButton.style.background =
    "linear-gradient(90deg, #4facfe 0%, #38ef7d 100%)"; // Gradient background
  submitButton.style.color = "white"; // Text color
  submitButton.style.padding = "10px 20px"; // Padding
  submitButton.style.border = "none"; // Remove border
  submitButton.style.borderRadius = "10px"; // Rounded corners
  submitButton.style.cursor = "pointer"; // Pointer cursor on hover
  submitButton.style.fontSize = "16px"; // Font size
  submitButton.style.display = "flex"; // Flex display to align icon and text
  submitButton.style.alignItems = "center"; // Center icon and text vertically
  submitButton.style.gap = "8px"; // Space between icon and text
  form.appendChild(submitButton);
}

function initializeQuiz() {
  if (!quizData) {
    console.error("Quiz data not loaded");
    return;
  }

  renderQuizInfo();
  renderQuestion();
  renderQuestionPalette();
  initializeTimer();
  quizStartTime = new Date();

  // Add event listeners
  const buttons = {
    "clear-response": clearResponse,
    "save-next": saveAndNext,
    "save-mark-review": saveAndMarkForReview,
    "mark-review-next": markForReviewAndNext,
    "submit-quiz": confirmSubmission,
  };

  Object.entries(buttons).forEach(([id, handler]) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", handler);
    } else {
      console.error(`Button with id '${id}' not found`);
    }
  });
}

function renderQuizInfo() {
  document.getElementById("candidate-name").textContent =
    userDetails.name || "N/A";
  document.getElementById("exam-name").textContent = quizData.title || "N/A";
  document.getElementById("subject-name").textContent =
    quizData.description || "N/A";
  document.getElementById("exam-id-display").textContent =
    quizData.quizId || "N/A";
  document.getElementById("exam-date").textContent =
    new Date().toLocaleDateString();
}

function renderQuestion() {
  const question = quizData.questions[currentQuestionIndex];
  document.getElementById("question-number").textContent =
    currentQuestionIndex + 1;
  document.getElementById("question-text").textContent = question.text;

  const form = document.getElementById("answer-form");
  form.innerHTML = "";
  if (question.type === "text") {
    const input = document.createElement("input");
    input.type = "text";
    input.name = "answer";
    input.required = true;
    form.appendChild(input);
  } else if (question.type === "integer") {
    const input = document.createElement("input");
    input.type = "number";
    input.name = "answer";
    input.required = true;
    form.appendChild(input);
  } else {
    question.options.forEach((option, index) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = question.type === "single" ? "radio" : "checkbox";
      input.name = "answer";
      input.value = index;
      input.checked =
        answers[currentQuestionIndex] &&
        answers[currentQuestionIndex].includes(index.toString());
      label.appendChild(input);
      label.appendChild(document.createTextNode(` ${option.text}`));
      form.appendChild(label);
      form.appendChild(document.createElement("br"));
    });
  }

  updateQuestionStatus();
}

function renderQuestionPalette() {
  const paletteContainer = document.getElementById("palette-container");
  paletteContainer.innerHTML = "";
  quizData.questions.forEach((_, index) => {
    const button = document.createElement("button");
    button.textContent = index + 1;
    button.classList.add("palette-button");
    button.addEventListener("click", () => jumpToQuestion(index));
    paletteContainer.appendChild(button);
  });
  updateQuestionStatus();
}

function updateQuestionStatus() {
  const buttons = document.querySelectorAll(".palette-button");
  buttons.forEach((button, index) => {
    button.className = "palette-button";
    if (!questionStatus[index]) {
      button.classList.add("not-visited");
    } else if (questionStatus[index] === "answered") {
      button.classList.add("answered");
    } else if (questionStatus[index] === "marked") {
      button.classList.add("marked");
    } else if (questionStatus[index] === "answered-marked") {
      button.classList.add("answered-marked");
    } else {
      button.classList.add("not-answered");
    }
  });
}

function jumpToQuestion(index) {
  saveAnswer();
  currentQuestionIndex = index;
  renderQuestion();
}

function clearResponse() {
  const form = document.getElementById("answer-form");
  form.reset();
  delete answers[currentQuestionIndex];
  questionStatus[currentQuestionIndex] = "not-answered";
  updateQuestionStatus();
}

function saveAndNext() {
  saveAnswer();
  if (currentQuestionIndex < quizData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

function saveAndMarkForReview() {
  saveAnswer();
  questionStatus[currentQuestionIndex] = "answered-marked";
  updateQuestionStatus();
  if (currentQuestionIndex < quizData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

function markForReviewAndNext() {
  questionStatus[currentQuestionIndex] = "marked";
  updateQuestionStatus();
  if (currentQuestionIndex < quizData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
}

function saveAnswer() {
  const selectedOptions = Array.from(
    document.querySelectorAll('input[name="answer"]:checked')
  ).map((input) => input.value);
  if (selectedOptions.length > 0) {
    answers[currentQuestionIndex] = selectedOptions;
    questionStatus[currentQuestionIndex] = "answered";
  } else {
    questionStatus[currentQuestionIndex] = "not-answered";
  }
  updateQuestionStatus();
}

function confirmSubmission() {
  if (!quizData || !answers) {
    console.error("Quiz data or answers not available");
    return;
  }

  const unanswered = Object.keys(questionStatus).filter(
    (index) =>
      questionStatus[index] === "not-answered" ||
      questionStatus[index] === "not-visited"
  ).length;

  if (unanswered > 0) {
    if (
      confirm(
        `You have ${unanswered} unanswered questions. Are you sure you want to submit?`
      )
    ) {
      submitQuiz();
    }
  } else if (confirm("Are you sure you want to submit the quiz?")) {
    submitQuiz();
  }
}

function submitQuiz() {
  saveAnswer();
  const quizEndTime = new Date();
  const timeTaken = (quizEndTime - quizStartTime) / 1000; // in seconds

  const results = calculateResults();
  const submissionData = {
    quizId: quizData.quizId,
    answers: answers,
    timeTaken: timeTaken,
    userDetails: getUserDetails(),
    results: results,
  };

  console.log("Quiz submission:", submissionData);
  displayResults(results);
}

function calculateResults() {
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let totalMarks = 0;

  quizData.questions.forEach((question, index) => {
    if (answers[index] !== undefined) {
      if (question.type === "single") {
        if (
          parseInt(answers[index]) ===
          question.options.findIndex((option) => option.isCorrect)
        ) {
          correctAnswers++;
          totalMarks += question.marks || 1; // Default to 1 mark if not specified
        } else {
          incorrectAnswers++;
        }
      } else {
        const selectedOptions = answers[index].map(
          (option) => question.options[option]
        );
        if (
          selectedOptions.every((option) => option.isCorrect) &&
          selectedOptions.length ===
            question.options.filter((option) => option.isCorrect).length
        ) {
          correctAnswers++;
          totalMarks += question.marks || 1; // Default to 1 mark if not specified
        } else {
          incorrectAnswers++;
        }
      }
    } else {
      incorrectAnswers++;
    }
  });

  const totalQuestions = quizData.questions.length;
  const score = (correctAnswers / totalQuestions) * 100;

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    totalMarks,
    score,
  };
}

function getUserDetails() {
  const details = {};
  const form = document.getElementById("details-form");
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    details[key] = value;
  }

  return details;
}

function initializeTimer() {
  // Get duration from quiz data or default to 60 minutes
  const durationInMinutes = quizData.duration || 60;
  remainingTime = durationInMinutes * 60;
  quizStartTime = new Date();
  updateTimer();
  setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (remainingTime > 0) {
    remainingTime--;
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    document.getElementById("remaining-time").textContent = `${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    alert("Time is up! Submitting quiz...");
    submitQuiz();
  }
}

function displayResults(results) {
  try {
    // Update stats first
    document.getElementById("total-questions").textContent =
      results.totalQuestions;
    document.getElementById("correct-answers").textContent =
      results.correctAnswers;
    document.getElementById("incorrect-answers").textContent =
      results.incorrectAnswers;

    // Calculate circumference
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    // Update score progress
    const scoreCircle = document.querySelector(".progress-ring-circle");
    if (scoreCircle) {
      const scoreValue = results.score;
      scoreCircle.style.strokeDasharray = `${circumference}`;
      scoreCircle.style.strokeDashoffset = `${circumference}`;
      scoreCircle.style.stroke = getColorForValue(scoreValue);

      // Add loaded class to enable animation
      const progressRing = document.querySelector(".progress-ring");
      progressRing.classList.add("loaded");

      setTimeout(() => {
        scoreCircle.style.strokeDashoffset = `${
          circumference - (scoreValue / 100) * circumference
        }`;
        // Show confetti for high scores
        if (scoreValue >= 80) {
          showConfetti();
          playSound("success");
        } else if (scoreValue >= 60) {
          playSound("complete");
        } else {
          playSound("warning");
        }
      }, 100);

      // Animate score number
      animateNumber("score", scoreValue);
    }
  } catch (error) {
    console.error("Error updating progress circles:", error);
  }

  showSection("section-4");
}

function getColorForValue(value) {
  if (value >= 80) return "var(--success-color)";
  if (value >= 60) return "var(--warning-color)";
  return "var(--danger-color)";
}

function animateNumber(elementId, finalValue) {
  const element = document.getElementById(elementId);
  const duration = 1000;
  const steps = 60;
  const increment = finalValue / steps;
  let currentValue = 0;
  const interval = duration / steps;

  const timer = setInterval(() => {
    currentValue += increment;
    if (currentValue >= finalValue) {
      currentValue = finalValue;
      clearInterval(timer);
    }
    element.textContent =
      elementId === "accuracy"
        ? `${Math.round(currentValue)}%`
        : Math.round(currentValue).toFixed(2);
  }, interval);
}

function initializeQuestionPalette() {
  const container = document.getElementById("palette-container");
  quizData.questions.forEach((_, index) => {
    const button = document.createElement("button");
    button.className = "palette-button not-visited";
    button.textContent = index + 1;
    button.onclick = () => navigateToQuestion(index);
    container.appendChild(button);
  });
  updateQuestionStatus(0, "not-answered");
}

document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight") {
    document.getElementById("save-next").click();
  } else if (e.key === "ArrowLeft") {
    navigateToPreviousQuestion();
  }
});

function showConfetti() {
  const colors = ["#2ecc71", "#3498db", "#f1c40f", "#e74c3c"];
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    const timeLeft = end - Date.now();
    if (timeLeft <= 0) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  })();
}

document.addEventListener("DOMContentLoaded", function () {
  // ... existing code ...

  // Add shortcuts modal handler
  const shortcutsButton = document.getElementById("show-shortcuts");
  const shortcutsModal = document.getElementById("shortcuts-modal");

  shortcutsButton.addEventListener("click", () => {
    shortcutsModal.classList.toggle("hidden");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") {
      document.getElementById("save-next")?.click();
    } else if (e.key === "ArrowLeft") {
      navigateToPreviousQuestion();
    } else if (e.key === "Space") {
      e.preventDefault();
      document.getElementById("save-mark-review")?.click();
    } else if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("save-next")?.click();
    } else if (e.key === "Escape") {
      shortcutsModal.classList.add("hidden");
    }
  });
});

function initializePaletteToggle() {
  const paletteToggle = document.getElementById("palette-toggle");
  const questionPalette = document.querySelector(".question-palette");
  const toggleIcon = paletteToggle.querySelector("i");

  if (!paletteToggle || !questionPalette || !toggleIcon) return;

  // Initial state
  questionPalette.style.display = "none";
  let isAnimating = false;

  paletteToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isAnimating) return;
    isAnimating = true;

    const isShowing = questionPalette.classList.contains("show");

    if (!isShowing) {
      questionPalette.style.display = "block";
      requestAnimationFrame(() => {
        questionPalette.classList.add("show");
        toggleIcon.className = "fas fa-times";
        paletteToggle.classList.add("active");
      });
    } else {
      questionPalette.classList.remove("show");
      toggleIcon.className = "fas fa-bars";
      paletteToggle.classList.remove("active");

      setTimeout(() => {
        questionPalette.style.display = "none";
      }, 300); // Match animation duration
    }

    setTimeout(() => {
      isAnimating = false;
    }, 300);
  });

  // Close palette when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !questionPalette.contains(e.target) &&
      !paletteToggle.contains(e.target) &&
      questionPalette.classList.contains("show")
    ) {
      paletteToggle.click();
    }
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      questionPalette.style.display = "block";
      questionPalette.classList.remove("show");
      paletteToggle.classList.remove("active");
      toggleIcon.className = "fas fa-bars";
    } else {
      if (!questionPalette.classList.contains("show")) {
        questionPalette.style.display = "none";
      }
    }
  });
}
