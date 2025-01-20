document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    form.addEventListener('submit', function(e) {
        // Уязвимость: минимальная валидация
        if (password.value !== confirmPassword.value) {
            e.preventDefault();
            alert('Passwords do not match');
            return;
        }
        
        // Форма отправится автоматически
    });
});
