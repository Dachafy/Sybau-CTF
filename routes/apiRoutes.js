// Example in routes/apiRoutes.js
import express from 'express';
const router = express.Router();

router.get('/test', (req, res) => {
    // Logic to get users...
    res.status(200).json({
        success: true,
        data: { users: ["dara"] }
    });
});

export default router;