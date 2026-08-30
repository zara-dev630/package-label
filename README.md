# PackLabel Detector

A full-stack web application for detecting package label fields (Batch number, MFG date, RS code, TimeStamp, BB) from uploaded images using a pre-trained YOLOv8 object detection model (ONNX).

## Architecture

- **Frontend**: React, Vite, Tailwind CSS, React Three Fiber (for 3D Hero), Framer Motion.
- **Backend**: Node.js, Express, `onnxruntime-node` (for YOLOv8 inference), `sharp` (for image processing).

## Prerequisites

- Node.js (v18 or higher recommended)
- A YOLOv8 model exported to ONNX format.

## Setup Instructions

### 1. Model Placement

Before running the backend, you must place your exported ONNX model (`best.onnx`) inside the `server/models` directory:
```
server/
  models/
    best.onnx
```

### 2. Backend Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
   The server will start on `http://localhost:5000`.

### 3. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Usage

1. Navigate to the frontend URL in your browser.
2. Drag and drop or click to upload a package image.
3. The image will be sent to the backend where the YOLOv8 model processes it.
4. Bounding boxes and confidence scores will be overlaid on the uploaded image.
