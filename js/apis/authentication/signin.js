document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/pages/dashboard/dashboard.html';
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
    
        // Basic validation
        if (!email || !password) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Please enter both email and password.';
            errorMessage.style.color = 'red';
            return;
        }
    
        try {
            const response = await fetch('https://quizify-backend-theta.vercel.app/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await response.json();
    
            if (response.ok && data.token) {
                // Login successful
                // Store the token in localStorage
                localStorage.setItem('token', data.token);
                
                // Store user ID
                localStorage.setItem('userId', data.userId);

                // Optionally, store user info
                localStorage.setItem('user', JSON.stringify({ email }));

                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Login successful! Redirecting...';
                errorMessage.style.color = 'green';
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/pages/dashboard/dashboard.html';
                }, 1500); // 1.5 second delay
            } else {
                // Login failed
                errorMessage.style.display = 'block';
                errorMessage.textContent = data.error || 'Login failed. Please try again.';
                errorMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'An error occurred. Please try again later.';
            errorMessage.style.color = 'red';
        }
    });
});
