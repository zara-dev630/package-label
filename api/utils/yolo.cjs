const ort = require('onnxruntime-node');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const modelPath = path.join(__dirname, '..', '..', 'server', 'models', 'best.onnx');
let session = null;

const CLASSES = ["BB", "Batch", "MFG", "RS", "TimeStamp"];

async function initModel() {
  if (session) return session;
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model file not found at ${modelPath}`);
  }
  const sizeMb = (fs.statSync(modelPath).size / (1024 * 1024)).toFixed(2);
  console.log(`[yolo] Loading model from ${modelPath} (${sizeMb} MB)`);
  session = await ort.InferenceSession.create(modelPath);
  console.log(`[yolo] Model loaded. input=${session.inputNames.join(',')} output=${session.outputNames.join(',')}`);
  return session;
}

function iou(box1, box2) {
  // box is [x1, y1, x2, y2]
  const xA = Math.max(box1[0], box2[0]);
  const yA = Math.max(box1[1], box2[1]);
  const xB = Math.min(box1[2], box2[2]);
  const yB = Math.min(box1[3], box2[3]);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  
  const box1Area = (box1[2] - box1[0]) * (box1[3] - box1[1]);
  const box2Area = (box2[2] - box2[0]) * (box2[3] - box2[1]);
  
  return interArea / (box1Area + box2Area - interArea);
}

function nms(boxes, iouThreshold = 0.45) {
  // boxes: array of {box: [x1, y1, x2, y2], confidence, label}
  boxes.sort((a, b) => b.confidence - a.confidence);
  const result = [];
  
  for (const current of boxes) {
    let keep = true;
    for (const res of result) {
      if (current.label === res.label) {
        if (iou(current.box, res.box) > iouThreshold) {
          keep = false;
          break;
        }
      }
    }
    if (keep) {
      result.push(current);
    }
  }
  return result;
}

async function prepareInput(imageBuffer) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  const { width: origWidth, height: origHeight } = metadata;

  // Resize to 640x640
const resized = await image.rotate().resize(640, 640, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    // Create tensor Float32Array [1, 3, 640, 640]
  const float32Data = new Float32Array(3 * 640 * 640);
  
  // RGB channel separated
  for (let i = 0; i < 640 * 640; i++) {
    // Normalize to 0-1
    float32Data[i] = resized[i * 3] / 255.0; // R
    float32Data[i + 640 * 640] = resized[i * 3 + 1] / 255.0; // G
    float32Data[i + 2 * 640 * 640] = resized[i * 3 + 2] / 255.0; // B
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);
  return { tensor, origWidth, origHeight };
}

async function detectImage(imageBuffer) {
  if (!session) {
    await initModel();
  }
  
  console.log(`[yolo] Received image buffer: ${imageBuffer.length} bytes`);
  const { tensor, origWidth, origHeight } = await prepareInput(imageBuffer);
  
  const feeds = {};
  feeds[session.inputNames[0]] = tensor;
  
  const outputData = await session.run(feeds);
  const output = outputData[session.outputNames[0]]; // [1, 9, 8400]
  
  const boxes = [];
  const confidenceThreshold = 0.5;

  const data = output.data;
  const numElements = 8400; // YOLOv8 typical output size for 640x640
  const numClasses = 5;
  const rowLength = 4 + numClasses; // 9

  // Output format is [1, 9, 8400]. 
  // It means we have 9 channels and 8400 elements per channel
  // Channel 0: x_center, 1: y_center, 2: width, 3: height, 4..8: classes
  
  for (let i = 0; i < numElements; i++) {
    let maxConf = 0;
    let maxClassId = -1;
    
    // Check classes 4 to 8
    for (let c = 0; c < numClasses; c++) {
      // index for channel c+4, element i
      const conf = data[(c + 4) * numElements + i];
      if (conf > maxConf) {
        maxConf = conf;
        maxClassId = c;
      }
    }
    
    if (maxConf >= confidenceThreshold) {
      const cx = data[0 * numElements + i];
      const cy = data[1 * numElements + i];
      const w = data[2 * numElements + i];
      const h = data[3 * numElements + i];
      
      const x1 = cx - w / 2;
      const y1 = cy - h / 2;
      const x2 = cx + w / 2;
      const y2 = cy + h / 2;
      
      // Scale back to original image size
      const scaleX = origWidth / 640;
      const scaleY = origHeight / 640;
      
      boxes.push({
        box: [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY],
        confidence: maxConf,
        label: CLASSES[maxClassId]
      });
    }
  }

  // Diagnostics: report min/max class confidence so we can tell if the model
  // is producing near-zero output (would indicate the model didn't load/run correctly).
  let globalMax = 0;
  for (let i = 0; i < numElements; i++) {
    const conf = data[(4 + 0) * numElements + i];
    const conf2 = data[(4 + 4) * numElements + i];
    const m = conf > conf2 ? conf : conf2;
    if (m > globalMax) globalMax = m;
  }
  console.log(`[yolo] Output dims=${output.dims ? output.dims.join('x') : 'n/a'} len=${data.length} maxClassConf=${globalMax.toFixed(4)} detections=${boxes.length}`);
  
  return nms(boxes);
}

module.exports = {
  initModel,
  detectImage
};
