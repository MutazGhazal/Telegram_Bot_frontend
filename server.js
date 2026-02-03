import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xxxxx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJxxxxx';
const API_BASE_URL = process.env.API_BASE_URL || '';

app.get('/config.js', (_req, res) => {
  res.type('application/javascript').send(
    `export const SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)};\n` +
      `export const SUPABASE_KEY = ${JSON.stringify(SUPABASE_KEY)};\n` +
      `export const API_BASE_URL = ${JSON.stringify(API_BASE_URL)};\n`
  );
});

app.use(express.static(__dirname));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
