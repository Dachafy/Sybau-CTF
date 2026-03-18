// Protect private pages
export const isAuth = (req, res, next) => {
    if (req.session?.userId) return next();
    res.redirect('/login');
};

// Redirect logged-in users away from Login/Register
export const isGuest = (req, res, next) => {
    if (!req.session?.userId) return next();
    res.redirect('/dashboard');
};
