document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form'); // Reference the reset password form
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    const passwordMatchError = document.getElementById('password-match-error');
    const errorMessageDisplay = document.getElementById('error-message');

    // Helper function to display messages
    function displayError(message) {
        errorMessageDisplay.textContent = message;
        errorMessageDisplay.style.color = 'red';
    }

    function displaySuccess(message) {
        errorMessageDisplay.textContent = message;
        errorMessageDisplay.style.color = 'green';
    }

    // Show the login form by default when the page loads
    showLogin();

    // Show Login form
    window.showLogin = function () {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        forgotPasswordForm.classList.add('hidden');
        resetPasswordForm.classList.add('hidden');
        errorMessageDisplay.textContent = '';  // Clear any error messages
    };

    // Show Forgot Password form
    window.showForgotPassword = function () {
        loginForm.classList.add('hidden');
        signupForm.classList.add('hidden');
        forgotPasswordForm.classList.remove('hidden');
        resetPasswordForm.classList.add('hidden');
        errorMessageDisplay.textContent = '';  // Clear any error messages
    };

    // Show Reset Password form
    function showResetPasswordForm(email) {
        resetPasswordForm.classList.remove('hidden');
        forgotPasswordForm.classList.add('hidden');
        loginForm.classList.add('hidden');
        signupForm.classList.add('hidden');
        document.getElementById('reset-email').value = email; // Pre-fill the email field
    }

    // Handle Forgot Password form submission
    document.getElementById('forgot-password-form').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Get the user's email from the input
        const emailInput = document.getElementById('forgot-email');
        if (emailInput) {
            const email = emailInput.value;

            // Send a POST request to the backend to request a password reset link
            fetch('http://localhost:3001/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || 'A password reset link has been sent to your email.');
                if (data.success) {
                    // Show the reset password form with the user's email pre-filled
                    showResetPasswordForm(email);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            });
        } else {
            console.error('Forgot password email input not found.');
        }
    });

    // Handle Reset Password form submission
    resetPasswordForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        const passwordField = document.getElementById('reset-password');
        const confirmPasswordField = document.getElementById('reset-confirm-password');
        const emailField = document.getElementById('reset-email');

        if (!passwordField || !confirmPasswordField || !emailField) {
            console.error('Password fields or email field not found in the document.');
            return; // Stop the function if the input fields are not found
        }

        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        const email = emailField.value;

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token'); // Assuming reset token is available in the URL

        fetch(`http://localhost:3001/auth/reset-password/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Password has been successfully reset. You may now log in.');
                window.location.href = '/';
            } else {
                alert(data.message || 'An error occurred. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        });
    });
});
