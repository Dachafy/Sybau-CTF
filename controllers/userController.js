import User from "../models/userModel.js";
export async function getAllUsers(req, res) {
    try {
        const [rows] = await User.fetchAll();
        res.render('userIndex', { title: 'Users', users: rows });
    } catch (error) {
        console.error(error);   
        res.status(500).send('Internal Server Error');
    }
}
export async function createUser(req, res) {
    const { username, email, password } = req.body;     
    try {
        await User.save(username, email, password);
        res.redirect('/');
    } catch (error) {
        console.error(error);   
        res.status(500).send('Internal Server Error');
    }
}