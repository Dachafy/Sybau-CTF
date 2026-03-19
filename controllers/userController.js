import User from "../models/userModel.js";
import bcrypt from 'bcrypt';
import { sessionCookieName } from '../config/sessionConfig.js';

const signupDefaults = {
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    province: ''
};

const loginDefaults = {
    email: ''
};

const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function getSignupFormData(body = {}) {
    return {
        firstName: cleanText(body.firstName),
        lastName: cleanText(body.lastName),
        email: cleanText(body.email).toLowerCase(),
        gender: cleanText(body.gender).toLowerCase(),
        province: cleanText(body.province)
    };
}

function getLoginFormData(body = {}) {
    return {
        email: cleanText(body.email).toLowerCase()
    };
}

function renderSignup(res, options = {}) {
    res.status(options.status || 200).render('users/userIndex', {
        layout: 'templates/mains',
        title: 'Sign Up',
        error: options.error || null,
        formData: {
            ...signupDefaults,
            ...(options.formData || {})
        }
    });
}

function renderLogin(res, options = {}) {
    res.status(options.status || 200).render('users/login', {
        layout: 'templates/mains',
        title: 'Login',
        error: options.error || null,
        formData: {
            ...loginDefaults,
            ...(options.formData || {})
        }
    });
}

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

async function establishUserSession(req, user) {
    await regenerateSession(req);

    req.session.user = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email
    };
    req.session.userId = user.id;
    req.session.userName = user.first_name;

    await saveSession(req);
}

export async function getCreateUser(req, res) {
    try {
        renderSignup(res);
    } catch (error) {
        console.error(error);   
        res.status(500).send('Internal Server Error');
    }
}

export async function createUser(req, res) {
    const formData = getSignupFormData(req.body);
    const password = cleanText(req.body?.password);
    const confirmPassword = cleanText(req.body?.confirmPassword);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.gender || !formData.province || !password || !confirmPassword) {
        return renderSignup(res, {
            status: 400,
            error: 'All fields are required.',
            formData
        });
    }

    if (!VALID_EMAIL_REGEX.test(formData.email)) {
        return renderSignup(res, {
            status: 400,
            error: 'Enter a valid email address.',
            formData
        });
    }

    if (password.length < 8) {
        return renderSignup(res, {
            status: 400,
            error: 'Password must be at least 8 characters long.',
            formData
        });
    }

    if (password !== confirmPassword) {
        return renderSignup(res, {
            status: 400,
            error: 'Passwords do not match.',
            formData
        });
    }

    try {
        const [existingUsers] = await User.findByEmail(formData.email);

        if (existingUsers.length > 0) {
            return renderSignup(res, {
                status: 409,
                error: 'An account with that email already exists.',
                formData
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const [insertResult] = await User.save(
            formData.firstName,
            formData.lastName,
            formData.email,
            hashedPassword,
            formData.gender,
            formData.province
        );
        const [createdUsers] = await User.findById(insertResult.insertId);

        if (createdUsers.length === 0) {
            throw new Error('User was created but could not be loaded from the database.');
        }

        await establishUserSession(req, createdUsers[0]);
        res.redirect(303, '/dashboard');
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return renderSignup(res, {
                status: 409,
                error: 'An account with that email already exists.',
                formData
            });
        }

        res.status(500).send('Server Error');
    }
}

export async function login(req, res) {
    try {
        renderLogin(res);
    } catch (error) {
        console.error(error);   
        res.status(500).send('Internal Server Error');
    }
}

export async function loginUser(req, res) {
    const formData = getLoginFormData(req.body);
    const password = cleanText(req.body?.password);

    if (!formData.email || !password) {
        return renderLogin(res, {
            status: 400,
            error: 'Email and password are required.',
            formData
        });
    }

    try {
        const [rows] = await User.findByEmail(formData.email);

        if (rows.length === 0) {
            return renderLogin(res, {
                status: 401,
                error: 'Invalid email or password.',
                formData
            });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            await establishUserSession(req, user);
            return res.redirect(303, '/dashboard');
        }

        renderLogin(res, {
            status: 401,
            error: 'Invalid email or password.',
            formData
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

export async function listUser(req, res) {
    try {
        const userId = req.session.user?.id || req.session.userId;
        const [rows] = await User.findById(userId);

        if (rows.length === 0) {
            await destroySession(req);
            res.clearCookie(sessionCookieName);
            return res.redirect(303, '/login');
        }

        res.render('users/list', {
            layout: 'templates/mains',
            title: 'Dashboard',
            profile: rows[0]
        });
    } catch (error) {
        console.error(error);   
        res.status(500).send('Internal Server Error');
    }
}


export async function findUser(req, res) {
    try {
        const search = cleanText(req.body?.search || req.body?.firstName);
        const queryString = search ? `?search=${encodeURIComponent(search)}` : '';

        res.redirect(303, `/dashboard${queryString}`);
    } catch (error) {
        console.error(error);   
        res.status(500).send('Internal Server Error');
    }
}

export async function logoutUser(req, res) {
    try {
        await destroySession(req);
        res.clearCookie(sessionCookieName);
        res.redirect(303, '/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
