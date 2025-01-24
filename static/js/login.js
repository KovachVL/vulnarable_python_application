document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    function showError(input, message) {
        const errorElement = document.getElementById(input.id + 'Error');
        errorElement.textContent = message;
        input.classList.add('error');
    }

    function clearError(input) {
        const errorElement = document.getElementById(input.id + 'Error');
        errorElement.textContent = '';
        input.classList.remove('error');
    }

    function validateUsername() {
        if (username.value.trim() === '') {
            showError(username, 'Username is required');
            return false;
        }
        if (username.value.length < 3) {
            showError(username, 'Username must be at least 3 characters');
            return false;
        }
        clearError(username);
        return true;
    }

    function validatePassword() {
        if (password.value === '') {
            showError(password, 'Password is required');
            return false;
        }
        if (password.value.length < 6) {
            showError(password, 'Password must be at least 6 characters');
            return false;
        }
        clearError(password);
        return true;
    }

    username.addEventListener('input', validateUsername);
    password.addEventListener('input', validatePassword);

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const isUsernameValid = validateUsername();
        const isPasswordValid = validatePassword();

        if (isUsernameValid && isPasswordValid) {
            form.submit();
        }
    });
}); 