import 'dotenv/config'; // Loads variables from .env immediately
import express from 'express';
import userRoutes from './routes/userRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import expressLayouts from 'express-ejs-layouts';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ensureSessionTableExists, sessionConfig } from './config/sessionConfig.js';
import User from './models/userModel.js';
import { ensureDatabaseExists } from './config/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);

// Session Config (Essential for Security)
app.use(sessionConfig);

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(expressLayouts);


// Use built-in express parser instead of body-parser package
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
    res.locals.currentUser = req.session?.user || null;
    next();
});

app.set('layout', 'templates/mains'); // Set default layout
// app.set('view options', { debug: true });

app.use('/api/v1', apiRoutes);

app.use('/', userRoutes);

const PORT = process.env.PORT_APP || 4000;

try {
    await ensureDatabaseExists();
    await ensureSessionTableExists();
    await User.createTable();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
} catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
}
