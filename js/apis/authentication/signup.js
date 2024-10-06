document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/pages/dashboard/dashboard.html';
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const role = document.querySelector('input[name="role"]').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Basic validation for required fields
        if (!name || !email || !password || !role) {
            alert("Please fill in all required fields.");
            return;
        }

        const data = {
            name,
            email,
            password,
            role
        };

        try {
            const response = await fetch('https://quizify-backend-theta.vercel.app/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.message === 'User registered successfully') {
                alert('Registration successful! Redirecting to login page...');
                setTimeout(() => {
                    window.location.href = '/pages/authentication/signin.html';
                }, 1500); // 1.5 second delay
            } else {
                alert('Registration failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during registration. Please try again later.');
        }
    });
});
