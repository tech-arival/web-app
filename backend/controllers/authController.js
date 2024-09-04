exports.login = (req, res) => {
    const { email, password } = req.body;

    // Implement your authentication logic here

    if (email === 'tech@arival.ai' && password === 'pass') {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};

