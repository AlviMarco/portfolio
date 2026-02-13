import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Route
import routes from './routes/index.js';

app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hisab-Pati Backend API is running' });
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK' });
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;
