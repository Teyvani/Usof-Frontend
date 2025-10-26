function registerErrorHandler(req, res, next) {
    const { login, full_name, password, confirm_password, email } = req.body;
    if (!login || !full_name || !password || !confirm_password || !email) {
        return res.status(400).json({ error: 'All fields are required.'});
    }
    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match.'});
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (login.length < 3 || login.length > 20) {
        return res.status(400).json({ error: 'Login must be between 3 and 20 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(login)) {
        return res.status(400).json({ error: 'Login can only contain letters, numbers, and underscores.' });
    }
    if (full_name.length < 3 || full_name.length > 50) {
        return res.status(400).json({ error: 'Full name must be between 3 and 50 characters.' });
    }
    if (!/^[a-zA-Z\s\-']+$/.test(full_name)) {
        return res.status(400).json({ error: 'Full name can only contain letters, spaces, hyphens, and apostrophes.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one letter and one number.' });
    }
    next();
}

function loginErrorHandler(req, res, next) {
    const { login, email, password } = req.body;
    if ((!login && !email) || !password) {
        return res.status(400).json({ error: 'Login or email and password are required.' });
    }
    next();
}

function passwordResetErrorHandler(req, res, next) {
    const { token, password, confirm_password } = req.body;
    if (!token || !password || !confirm_password) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }
    next();
}

module.exports = {registerErrorHandler, loginErrorHandler, passwordResetErrorHandler};
