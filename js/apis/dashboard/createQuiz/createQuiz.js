document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('quiz-form');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const quizData = {
            title: document.getElementById('quiz-title').value,
            description: document.getElementById('quiz-description').value,
            questions: []
        };

        const questionContainers = document.querySelectorAll('.question');

        questionContainers.forEach((container, index) => {
            const questionNumber = index + 1;
            const questionType = document.getElementById(`question-type-${questionNumber}`).value;
            const questionText = document.getElementById(`question-${questionNumber}`).value;

            const question = {
                type: questionType,
                text: questionText,
                options: []
            };

            if (questionType === 'multiple' || questionType === 'single') {
                const options = container.querySelectorAll('.option');
                options.forEach((option, optionIndex) => {
                    const optionText = option.querySelector('input[type="text"]').value;
                    const isCorrect = option.querySelector('input[type="radio"], input[type="checkbox"]').checked;
                    question.options.push({
                        text: optionText,
                        isCorrect: isCorrect
                    });
                });
            } else if (questionType === 'text' || questionType === 'integer') {
                const correctAnswer = container.querySelector('.options input[type="text"]').value;
                question.correctAnswer = correctAnswer;
            }

            quizData.questions.push(question);
        });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('https://quizify-backend-theta.vercel.app/create-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(quizData)
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error('Failed to create quiz');
            }

            const result = await response.json();
            console.log('Quiz created successfully:', result);
            
            // Show popup
            alert('Quiz created successfully!');
            
            // Redirect to dashboard
            window.location.href = '/pages/dashboard/dashboard.html';
        } catch (error) {
            console.error('Error creating quiz:', error);
            alert(`Error creating quiz: ${error.message}`);
            // If token is invalid, redirect to login page
            if (error.message.includes('Authentication failed')) {
                localStorage.removeItem('token');
                window.location.href = '/pages/authentication/signin.html';
            }
        }
    });
});
