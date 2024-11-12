document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('quiz-form');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Validate that at least one question exists
        const questionContainers = document.querySelectorAll('.question');
        if (questionContainers.length === 0) {
            alert('Please add at least one question to the quiz');
            return;
        }

        const quizData = {
            title: document.getElementById('quiz-title')?.value?.trim(),
            description: document.getElementById('quiz-description')?.value?.trim(),
            teacherInstructions: document.getElementById('quiz-instructions')?.value?.trim() || '',
            isPublic: false,
            requiredFields: {
                name: document.getElementById('require-name')?.checked ?? false,
                email: true,
                dob: document.getElementById('require-dob')?.checked ?? false,
                gender: document.getElementById('require-gender')?.checked ?? false,
                address: document.getElementById('require-address')?.checked ?? false,
                nationality: document.getElementById('require-nationality')?.checked ?? false,
                institution: document.getElementById('require-institution')?.checked ?? false,
                department: document.getElementById('require-department')?.checked ?? false,
                phone: document.getElementById('require-phone')?.checked ?? false
            },
            questions: [],
            timeLimit: document.getElementById('enable-time-limit')?.checked ? 
                      (parseInt(document.getElementById('time-limit')?.value) || null) : null,
            difficulty: document.getElementById('difficulty')?.value || 'medium',
            passingScore: parseInt(document.getElementById('passing-score')?.value) || 60,
            attemptsAllowed: parseInt(document.getElementById('attempts-allowed')?.value) || 1,
            settings: {
                shuffleQuestions: document.getElementById('shuffle-questions')?.checked ?? false,
                showResults: document.getElementById('show-results')?.checked ?? false,
                showAnswers: document.getElementById('show-answers')?.checked ?? false,
                allowReview: document.getElementById('allow-review')?.checked ?? false
            }
        };

        // Process each question
        questionContainers.forEach((container, index) => {
            const questionNumber = index + 1;
            const questionType = document.getElementById(`question-type-${questionNumber}`)?.value;
            const questionText = document.getElementById(`question-${questionNumber}`)?.value?.trim();
            const questionMarks = parseFloat(document.getElementById(`marks-${questionNumber}`)?.value) || 0;

            if (!questionText || !questionType) {
                throw new Error(`Question ${questionNumber} is incomplete`);
            }

            const question = {
                type: questionType,
                text: questionText,
                marks: questionMarks,
                options: []
            };

            if (questionType === 'multiple' || questionType === 'single') {
                const options = container.querySelectorAll('.option');
                let hasCorrectAnswer = false;

                options.forEach((option) => {
                    const optionText = option.querySelector('input[type="text"]')?.value?.trim();
                    const isCorrect = option.querySelector('input[type="radio"], input[type="checkbox"]')?.checked ?? false;

                    if (!optionText) {
                        throw new Error(`Option text missing in question ${questionNumber}`);
                    }

                    if (isCorrect) {
                        hasCorrectAnswer = true;
                    }

                    question.options.push({
                        text: optionText,
                        isCorrect: isCorrect
                    });
                });

                if (!hasCorrectAnswer) {
                    throw new Error(`Question ${questionNumber} needs at least one correct answer`);
                }

            } else if (questionType === 'text' || questionType === 'integer') {
                const correctAnswer = container.querySelector('.options input[type="text"]')?.value?.trim();
                if (!correctAnswer) {
                    throw new Error(`Correct answer missing for question ${questionNumber}`);
                }
                question.correctAnswer = correctAnswer;
            }

            quizData.questions.push(question);
        });

        // Validate total marks
        const totalMarks = quizData.questions.reduce((sum, q) => sum + q.marks, 0);
        if (totalMarks <= 0) {
            alert('Total marks must be greater than 0');
            return;
        }
        quizData.totalMarks = totalMarks;

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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create quiz');
            }

            const result = await response.json();
            console.log('Quiz created successfully:', result);
            alert(`Quiz created successfully! Total marks: ${totalMarks}`);
            window.location.href = '/pages/dashboard/dashboard.html';

        } catch (error) {
            console.error('Error creating quiz:', error);
            alert(error.message);
            
            if (error.message.includes('authentication') || error.message.includes('token')) {
                localStorage.removeItem('token');
                window.location.href = '/pages/authentication/signin.html';
            }
        }
    });

    // Add these functions to handle the time limit toggle
    document.getElementById('enable-time-limit')?.addEventListener('change', function() {
        const timeInput = document.getElementById('time-limit');
        if (timeInput) {
            timeInput.style.display = this.checked ? 'block' : 'none';
            timeInput.required = this.checked;
            if (!this.checked) {
                timeInput.value = '';
            }
        }
    });

    // Add this function to update the question counter
    function updateQuestionCounter() {
        const counter = document.getElementById('question-count');
        if (counter) {
            counter.textContent = questionCount;
        }
    }

    // Update the addQuestion function to use textarea instead of input
    function addQuestion() {
        questionCount++;
        const questionHtml = `
            <div class="form-group question" id="question-${questionCount}-container">
                <div class="question-header">
                    <label for="question-${questionCount}"><i class="bi bi-question-circle"></i> Question ${questionCount}</label>
                    <div class="question-tools">
                        <div class="marks-input">
                            <label for="marks-${questionCount}">Marks:</label>
                            <input type="number" id="marks-${questionCount}" name="marks[]" min="0" step="0.5" required>
                        </div>
                        <select id="question-type-${questionCount}" name="question-type[]" onchange="updateQuestionType(${questionCount})" required>
                            <option value="multiple">Multiple choice</option>
                            <option value="single">Single choice</option>
                            <option value="text">Short answer</option>
                            <option value="integer">Number</option>
                        </select>
                        <button type="button" class="tool-button" onclick="deleteQuestion(${questionCount})"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
                <textarea 
                    id="question-${questionCount}" 
                    name="question[]" 
                    class="question-textarea" 
                    placeholder="Enter your question" 
                    rows="3"
                    required
                ></textarea>
                <div id="options-${questionCount}" class="options">
                    <!-- Options will be added here dynamically -->
                </div>
                <button type="button" class="add-option" onclick="addOption(${questionCount})">Add option</button>
            </div>
        `;
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Add auto-resize event listener to the new textarea
        const textarea = document.getElementById(`question-${questionCount}`);
        if (textarea) {
            autoResizeTextarea(textarea);
            textarea.addEventListener('input', () => autoResizeTextarea(textarea));
        }
        
        updateQuestionType(questionCount);
        formChanged = true;
    }

    // Add this function for auto-resizing textareas
    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px';
    }

    // Update the deleteQuestion function to update the counter
    function deleteQuestion(questionNumber) {
        const questionElement = document.getElementById(`question-${questionNumber}-container`);
        if (questionElement) {
            questionElement.remove();
            updateQuestionNumbers();
            updateQuestionCounter();
        }
        formChanged = true;
    }

    // Update the updateQuestionNumbers function to handle textarea instead of input
    function updateQuestionNumbers() {
        const questions = document.querySelectorAll('.question');
        questions.forEach((question, index) => {
            const newNumber = index + 1;
            question.id = `question-${newNumber}-container`;
            
            // Update label
            const label = question.querySelector('label');
            label.innerHTML = `<i class="bi bi-question-circle"></i> Question ${newNumber}`;
            label.setAttribute('for', `question-${newNumber}`);
            
            // Update textarea instead of input
            const textarea = question.querySelector('textarea');
            if (textarea) {
                textarea.id = `question-${newNumber}`;
                textarea.name = 'question[]';
            }
            
            // Update other elements
            const questionType = question.querySelector('select');
            if (questionType) {
                questionType.id = `question-type-${newNumber}`;
                questionType.name = 'question-type[]';
                questionType.setAttribute('onchange', `updateQuestionType(${newNumber})`);
            }
            
            const optionsContainer = question.querySelector('.options');
            if (optionsContainer) {
                optionsContainer.id = `options-${newNumber}`;
            }
            
            // Update options
            const options = optionsContainer?.querySelectorAll('.option') || [];
            options.forEach((option, optionIndex) => {
                const optionNumber = optionIndex + 1;
                const inputType = option.querySelector('input[type="radio"], input[type="checkbox"]');
                const optionInput = option.querySelector('input[type="text"]');
                
                if (inputType) {
                    inputType.id = `correct-${newNumber}-${optionNumber}`;
                    inputType.name = `correct[${newNumber}][]`;
                    inputType.value = optionIndex;
                }
                
                if (optionInput) {
                    optionInput.id = `option-${newNumber}-${optionNumber}`;
                    optionInput.name = `option[${newNumber}][]`;
                }
            });
            
            // Update buttons
            const addOptionBtn = question.querySelector('.add-option');
            const deleteBtn = question.querySelector('.delete-question');
            
            if (addOptionBtn) {
                addOptionBtn.setAttribute('onclick', `addOption(${newNumber})`);
            }
            if (deleteBtn) {
                deleteBtn.setAttribute('onclick', `deleteQuestion(${newNumber})`);
            }
        });
        
        questionCount = questions.length;
    }
});
