document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
    });

    const result = await response.json();

    if (result.success) {
        alert('Registration successful!');
        window.location.href = 'login.html';
    } else {
        alert('Registration failed: ' + result.message);
    }
});
