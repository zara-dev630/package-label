const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { initModel, detectImage } = require('./utils/yolo');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ensure models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Initialize the model on startup
initModel().then(() => {
  console.log('Model initialized successfully.');
}).catch((err) => {
  console.error('Failed to initialize model on startup:', err.message);
  console.log('Please place best.onnx in the server/models directory and restart, or it will try on first request.');
});

app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    const imageBuffer = req.file.buffer;
    const detections = await detectImage(imageBuffer);
    
    res.json({ success: true, detections });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ error: error.message || 'Error processing image.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
