import express from 'express';
import { getDb } from './src/db/connect.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  return res.status(200).json({ message: 'Server is running' });
});

app.get('/Trials', async (req, res) => {
  try {
    const Trials = await getDb()
      .collection('Trials')
      .find({})
      .toArray();

    return res.status(200).json(Trials);
  } catch (error) {
    console.error('Failed to retrieve trials:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve trials' });
  }
});

export default app;