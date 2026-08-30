const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { initModel, detectImage } = require('./utils/yolo.cjs');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ensure models directory exists
const modelsDir = path.join(__dirname, '..', 'server', 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    console.log(`[api] Received upload: field=${req.file.fieldname} size=${req.file.size} mimetype=${req.file.mimetype} orig=${req.file.originalname}`);
    const imageBuffer = req.file.buffer;
    const detections = await detectImage(imageBuffer);

    console.log(`[api] Detection complete: ${detections.length} detections`);
    res.json({ success: true, detections });
  } catch (error) {
    console.error('[api] Detection error:', error);
    res.status(500).json({ error: error.message || 'Error processing image.' });
  }
});

// Health check useful for confirming the function is reachable
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve the built React frontend (dist) from the same function so this single
// serverless function hosts both the API and the static SPA. On Vercel the
// dist/** files are bundled into the function via includeFiles.
function resolveDistDir() {
  const candidates = [
    path.join(__dirname, '..', 'dist'),
    path.join(process.cwd(), 'dist')
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

const distDir = resolveDistDir();
console.log(`[api] Static frontend dir: ${distDir} (exists=${fs.existsSync(distDir)})`);

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: any non-API GET returns index.html
  app.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.status(404).send('Frontend build (dist) not found. Run npm run build first.');
  });
}

module.exports = app;
