document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    // Функция для отображения ошибки
    function showError(input, message) {
        const errorElement = document.getElementById(input.id + 'Error');
        errorElement.textContent = message;
        input.classList.add('error');
    }

    // Функция для очистки ошибки
    function clearError(input) {
        const errorElement = document.getElementById(input.id + 'Error');
        errorElement.textContent = '';
        input.classList.remove('error');
    }

    // Валидация username
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

    // Валидация password
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

    // Валидация при вводе
    username.addEventListener('input', validateUsername);
    password.addEventListener('input', validatePassword);

    // Валидация при отправке формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const isUsernameValid = validateUsername();
        const isPasswordValid = validatePassword();

        if (isUsernameValid && isPasswordValid) {
            form.submit();
        }
    });
}); 