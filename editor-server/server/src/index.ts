import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import filesRouter from './routes/files';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const clientDistPath = path.resolve(__dirname, '..', '..', 'client', 'dist', 'app');
const clientDistExists = fs.existsSync(clientDistPath);

if (clientDistExists) {
  app.use(express.static(clientDistPath));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use('/api/files', filesRouter);

if (clientDistExists) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SolarWire Server running at http://localhost:${PORT}`);
  console.log(`Workspace directory: ${path.resolve(__dirname, '..', '..', 'workspace')}`);
});