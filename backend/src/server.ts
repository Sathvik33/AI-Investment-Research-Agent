import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import researchRouter from './routes/research';
import companiesRouter from './routes/companies';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
app.use(cors({
  origin: ['http://localhost:5173', 'https://ai-investment-research-agent-mh1h.vercel.app', 'https://investment-research.remotewire.net'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api/research', researchRouter);
app.use('/api/companies', companiesRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
