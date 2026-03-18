import {Router} from 'express';
const router = Router();
import { getCreateUser, createUser, login, loginUser, listUser, findUser, logoutUser } from '../controllers/userController.js';
import { isAuth, isGuest } from '../middleware/authMiddleware.js';

router.get('/', (req, res) => {
    res.render('index', {
        layout: 'templates/mains',
        title: 'Home'
    });
});

router.get('/signup', isGuest, getCreateUser);
router.post('/signup', isGuest, createUser);
router.get('/create', isGuest, (req, res) => res.redirect('/signup'));
router.post('/create', isGuest, createUser);

// Public / Guest Only
router.get('/login', isGuest, login);
router.post('/login', isGuest, loginUser);

// Protected / Auth Only
router.get('/dashboard', isAuth, listUser);
router.post('/dashboard', isAuth, findUser);
router.post('/logout', isAuth, logoutUser);
router.get('/logout', isAuth, logoutUser);

export default router;
