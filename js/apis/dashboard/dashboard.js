// public/js/dashboard.js

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/authentication/signin.html";
    return;
  }

  const dashboardContent = document.getElementById("dashboard-content");
  const logoutButton = document.getElementById("logout-button");
  const errorMessage = document.getElementById("error-message");

  async function fetchDashboardData() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User ID not found");
      return;
    }

    try {
      const response = await fetch(
        `https://quizify-backend-theta.vercel.app/user/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        displayUserData(data);
        displayQuizzes(data.quizzes);
      } else {
        handleError(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      dashboardContent.textContent =
        "An error occurred while fetching user data.";
    }
  }

  function displayUserData(userData) {
    const teacherName = document.getElementById("teacher-name");
    const teacherFullName = document.getElementById("teacher-full-name");
    const teacherEmail = document.getElementById("teacher-email");

    if (teacherName) teacherName.textContent = userData.name;
    if (teacherFullName) teacherFullName.textContent = userData.name;
    if (teacherEmail) teacherEmail.textContent = userData.email;
  }
  function displayQuizzes(quizzes) {
    const quizListBody = document.getElementById("quiz-list-body");
    quizListBody.innerHTML = "";

    quizzes.forEach((quiz) => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td data-label="Quiz Name">${quiz.title}</td>
            <td data-label="Date Created">${new Date(quiz.createdAt).toLocaleDateString()}</td>
            <td data-label="Actions">
                <button class="btn btn-toggle" data-id="${quiz.id}" data-status="${quiz.isPublic ? "public" : "private"}">
                    ${quiz.isPublic ? "Public" : "Private"}
                </button>
                <button class="btn btn-share" data-id="${quiz.id}">
                    <i class="bi bi-share"></i>
                </button>
                <button class="btn btn-submissions" data-id="${quiz.id}">
                    <i class="bi bi-file-earmark-text"></i>
                </button>
                <button class="btn btn-delete" data-id="${quiz.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
      quizListBody.appendChild(row);
    });

    // Update event listeners (removed edit functionality)
    quizListBody.addEventListener("click", function (e) {
      if (e.target.classList.contains("btn-toggle")) {
        toggleQuizVisibility(e.target);
      } else if (e.target.classList.contains("btn-share")) {
        shareQuiz(e.target.dataset.id);
      } else if (e.target.classList.contains("btn-submissions")) {
        viewSubmissions(e.target.dataset.id);
      } else if (e.target.classList.contains("btn-delete")) {
        deleteQuiz(e.target.dataset.id);
      }
    });
  }
  async function toggleQuizVisibility(button) {
    const quizId = button.dataset.id;
    const currentStatus = button.dataset.status;

    try {
      const response = await fetch("https://quizify-backend-theta.vercel.app/toggle-quiz-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ quizId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quiz visibility");
      }

      const data = await response.json();
      const newStatus = data.isPublic ? "public" : "private";

      button.dataset.status = newStatus;
      button.textContent =
        newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

      console.log(data.message);
    } catch (error) {
      console.error("Error toggling quiz visibility:", error);
      alert(
        "An error occurred while updating quiz visibility. Please try again."
      );
    }
  }
  function shareQuiz(quizId) {
    const shareLink = `https://quizify-frontend-jade.vercel.app/pages/attempt/attempt.html?id=${quizId}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('Share link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link. Please try again.');
      });
    console.log(`Sharing quiz with ID: ${quizId}`);
  }

  function viewSubmissions(quizId) {
    // TODO: Implement view submissions functionality
    console.log(`Viewing submissions for quiz with ID: ${quizId}`);
  }
  async function deleteQuiz(quizId) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`https://quizify-backend-theta.vercel.app/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          throw new Error("Quiz not found");
        } else if (response.status === 403) {
          throw new Error("Unauthorized: You don't have permission to delete this quiz");
        } else if (response.status === 500) {
          throw new Error(errorData.error || "Failed to delete quiz");
        } else {
          throw new Error(errorData.error || "Failed to delete quiz");
        }
      }

      const result = await response.json();
      console.log(result.message);
      alert("Quiz deleted successfully!");
      
      // Refresh the dashboard to reflect the changes
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      if (error.message === "No authentication token found") {
        window.location.href = "/pages/authentication/signin.html";
      } else if (error.message === "Quiz not found") {
        alert("The quiz you're trying to delete doesn't exist.");
      } else if (error.message.startsWith("Unauthorized")) {
        alert("You don't have permission to delete this quiz.");
      } else if (error.message === "Database operation failed") {
        alert("A database error occurred. Please try again later.");
      } else {
        alert(`Error deleting quiz: ${error.message}`);
      }
    }
  }

  function handleError(errorMsg) {
    errorMessage.style.display = "block";
    errorMessage.textContent = errorMsg;
    if (
      errorMsg === "Access denied. No token provided." ||
      errorMsg === "Invalid token."
    ) {
      setTimeout(() => {
        window.location.href = "/pages/authentication/signin.html";
      }, 2000);
    }
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        console.log("Logout successful. Redirecting to login page...");
        window.location.href = "/pages/authentication/signin.html";
      } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred during logout. Please try again.");
      }
    });
  } else {
    console.error("Logout button not found in the DOM");
  }

  fetchDashboardData();
});