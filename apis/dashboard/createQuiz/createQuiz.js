const quizData = {
    title: document.getElementById('quiz-title').value,
    description: document.getElementById('quiz-description').value,
    teacherInstructions: document.getElementById('quiz-instructions').value,
    isPublic: false, // Set the quiz to private by default
    requiredFields: {
        name: document.getElementById('require-name')?.checked || false,
        email: true, // Always required
        dob: document.getElementById('require-dob')?.checked || false,
        gender: document.getElementById('require-gender')?.checked || false,
        address: document.getElementById('require-address')?.checked || false,
        nationality: document.getElementById('require-nationality')?.checked || false,
        institution: document.getElementById('require-institution')?.checked || false,
        department: document.getElementById('require-department')?.checked || false,
        phone: document.getElementById('require-phone')?.checked || false
    },
    // ... rest of quizData object ...
}; 