document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
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

    // Check for error messages in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');

    if (error === 'user-exists') {
        displayError('User already exists! Please try logging in.');
        showSignUp();  // Switch to the sign-up form if the user already exists
    } else if (error === 'password-mismatch') {
        displayError('Passwords do not match!');
        showSignUp();
    } else if (error === 'server-error') {
        displayError('An error occurred. Please try again later.');
    } else if (success === 'registered') {
        displaySuccess('Registration successful! Please log in.');
        showLogin();  // Switch to the login form after successful registration
    }

    // Ensure error message is hidden initially
    passwordMatchError.style.display = 'none';

    // Show Login form
    window.showLogin = function () {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        forgotPasswordForm.classList.add('hidden');
        errorMessageDisplay.textContent = '';  // Clear any error messages
    };

    // Show SignUp form
    window.showSignUp = function () {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        forgotPasswordForm.classList.add('hidden');
        errorMessageDisplay.textContent = '';  // Clear any error messages
    };

    // Show Forgot Password form
    window.showForgotPassword = function () {
        loginForm.classList.add('hidden');
        signupForm.classList.add('hidden');
        forgotPasswordForm.classList.remove('hidden');
        errorMessageDisplay.textContent = '';  // Clear any error messages
    };

    // Signup Form Submission
    signupForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            passwordMatchError.style.display = 'block';
            return;
        } else {
            passwordMatchError.style.display = 'none';
        }

        const data = {
            username,
            email,
            password
        };

        fetch('http://127.0.0.1:3001/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySuccess('Registration successful! Please log in.');
                showLogin();
            } else {
                displayError(data.message || 'An error occurred. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError('An error occurred. Please try again.');
        });
    });

    // Login Form Submission
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const emailOrUsername = document.getElementById('login-email-username').value;
        const password = document.getElementById('login-password').value;

        fetch('http://127.0.0.1:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emailOrUsername, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Login successful!'); // Optionally replace this with a redirect or a better user experience
            } else {
                displayError(data.message || 'Invalid credentials.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError('An error occurred. Please try again.');
        });
    });

    // Realtime password matching validation
    confirmPasswordInput.addEventListener('input', function () {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password === '' || confirmPassword === '') {
            passwordMatchError.style.display = 'none'; // Don't show an error if either field is empty
        } else if (password !== confirmPassword) {
            passwordMatchError.style.display = 'block';
        } else {
            passwordMatchError.style.display = 'none';
        }
    });

    // Default to showing the login form on page load
    showLogin();
});
