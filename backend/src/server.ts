import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import researchRouter from './routes/research';
import companiesRouter from './routes/companies';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
app.use(cors()); // Allow all origins for Vercel deployment
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api/research', researchRouter);
app.use('/api/companies', companiesRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
