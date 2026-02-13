import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { globalErrorHandler } from './middleware/error.middleware';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Hisab-Pati Backend API'
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Hisab-Pati Backend API is running smoothly',
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`
    🚀 Backend Server Started!
    📡 Port: ${PORT}
    🏠 URL: http://localhost:${PORT}
    `);
});
