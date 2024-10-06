// public/js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/authentication/signin.html';
        return;
    }

    const dashboardContent = document.getElementById('dashboard-content');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');

    async function fetchDashboardData() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.error('User ID not found');
            return;
        }

        try {
            const response = await fetch(`https://quizify-backend-theta.vercel.app/user/${userId}`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            console.log(data);

            if (response.ok) {
                displayUserData(data);
                displayQuizzes(data.quizzes);
            } else {
                handleError(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            dashboardContent.textContent = 'An error occurred while fetching user data.';
        }
    }

    function displayUserData(userData) {
        const teacherName = document.getElementById('teacher-name');
        const teacherFullName = document.getElementById('teacher-full-name');
        const teacherEmail = document.getElementById('teacher-email');

        if (teacherName) teacherName.textContent = userData.name;
        if (teacherFullName) teacherFullName.textContent = userData.name;
        if (teacherEmail) teacherEmail.textContent = userData.email;
    }
    function displayQuizzes(quizzes) {
        const quizListBody = document.getElementById('quiz-list-body');
        quizListBody.innerHTML = '';

        quizzes.forEach(quiz => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${quiz.title}</td>
                <td>${new Date().toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-toggle" data-id="${quiz.id}" data-status="${quiz.isPublic ? 'public' : 'private'}">
                        ${quiz.isPublic ? 'Public' : 'Private'}
                    </button>
                    <button class="btn btn-share" data-id="${quiz.id}"><i class="bi bi-share"></i></button>
                    <button class="btn btn-edit" data-id="${quiz.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-submissions" data-id="${quiz.id}"><i class="bi bi-file-earmark-text"></i></button>
                    <button class="btn btn-delete" data-id="${quiz.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
            quizListBody.appendChild(row);
        });

        // Add event listeners for the new buttons
        quizListBody.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-toggle')) {
                toggleQuizVisibility(e.target);
            } else if (e.target.classList.contains('btn-share')) {
                shareQuiz(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-edit')) {
                editQuiz(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-submissions')) {
                viewSubmissions(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-delete')) {
                deleteQuiz(e.target.dataset.id);
            }
        });
    }

    function toggleQuizVisibility(button) {
        const newStatus = button.dataset.status === 'public' ? 'private' : 'public';
        button.dataset.status = newStatus;
        button.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        // TODO: Implement API call to update quiz visibility
    }

    function shareQuiz(quizId) {
        // TODO: Implement share functionality
        console.log(`Sharing quiz with ID: ${quizId}`);
    }

    function editQuiz(quizId) {
        // TODO: Implement edit functionality
        console.log(`Editing quiz with ID: ${quizId}`);
    }

    function viewSubmissions(quizId) {
        // TODO: Implement view submissions functionality
        console.log(`Viewing submissions for quiz with ID: ${quizId}`);
    }

    function deleteQuiz(quizId) {
        // TODO: Implement delete functionality
        console.log(`Deleting quiz with ID: ${quizId}`);
    }

    function handleError(errorMsg) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = errorMsg;
        if (errorMsg === 'Access denied. No token provided.' || errorMsg === 'Invalid token.') {
            setTimeout(() => {
                window.location.href = '/pages/authentication/signin.html';
            }, 2000);
        }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                console.log('Logout successful. Redirecting to login page...');
                window.location.href = '/pages/authentication/signin.html';
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout. Please try again.');
            }
        });
    } else {
        console.error('Logout button not found in the DOM');
    }

    fetchDashboardData();
});
