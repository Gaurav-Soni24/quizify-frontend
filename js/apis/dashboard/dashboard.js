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

            console.log(data)

            if (response.ok) {
                displayUserData(data);
                fetchQuizzes();
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

    async function fetchQuizzes() {
        try {
            const response = await fetch('https://quizify-backend-theta.vercel.app/quizzes', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const quizzes = await response.json();

            if (response.ok) {
                displayQuizzes(quizzes);
            } else {
                handleError('Failed to fetch quizzes');
            }
        } catch (error) {
            console.error('Error:', error);
            handleError('An error occurred while fetching quizzes');
        }
    }

    function displayQuizzes(quizzes) {
        const quizListBody = document.getElementById('quiz-list-body');
        quizListBody.innerHTML = '';

        quizzes.forEach(quiz => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${quiz.name}</td>
                <td>${new Date(quiz.createdAt).toLocaleDateString()}</td>
                <td>
                    <a href="#edit" class="btn" data-id="${quiz.id}">Edit</a>
                    <a href="#delete" class="btn btn-delete" data-id="${quiz.id}">Delete</a>
                </td>
            `;
            quizListBody.appendChild(row);
        });
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
