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

module.exports = app;
