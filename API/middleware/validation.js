function isLoggedIn(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Log in required.' });
    next();
}

function isAdmin(req, res, next) {
    if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
    next();
}

module.exports = {isAdmin, isLoggedIn};
