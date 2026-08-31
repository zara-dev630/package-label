import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ResultsView({ imageUrl, detections, loading }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    
    const drawDetections = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Setup canvas size to match displayed image size
      const { width, height, naturalWidth, naturalHeight } = img;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections || detections.length === 0) return;

      const scaleX = width / naturalWidth;
      const scaleY = height / naturalHeight;

      const LABEL_HEIGHT = 22;
      const LABEL_PADDING_X = 6;
      const LABEL_GAP = 3;
      const FONT_SIZE = 13;

      const prepared = detections.map(det => {
        const [x1, y1, x2, y2] = det.box;
        const scaledX = x1 * scaleX;
        const scaledY = y1 * scaleY;
        const scaledW = (x2 - x1) * scaleX;
        const scaledH = (y2 - y1) * scaleY;
        const text = `${det.label} ${(det.confidence * 100).toFixed(1)}%`;
        ctx.font = `bold ${FONT_SIZE}px sans-serif`;
        const textWidth = ctx.measureText(text).width;
        const labelW = textWidth + LABEL_PADDING_X * 2;
        return { scaledX, scaledY, scaledW, scaledH, text, textWidth, labelW };
      });

      const placed = [];

      prepared.forEach(p => {
        const { scaledX, scaledY, scaledW, scaledH, text, textWidth, labelW } = p;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

        ctx.font = `bold ${FONT_SIZE}px sans-serif`;

        let labelX = scaledX;
        let labelY = scaledY - LABEL_HEIGHT;

        if (labelY < 0) {
          labelY = scaledY + scaledH + 3;
        }

        let attempts = 0;
        while (attempts < 20) {
          const overlaps = placed.some(other => {
            return (
              labelX < other.x + other.w + LABEL_GAP &&
              labelX + labelW + LABEL_GAP > other.x &&
              labelY < other.y + other.h &&
              labelY + LABEL_HEIGHT > other.y
            );
          });

          if (!overlaps) break;

          labelY += LABEL_HEIGHT + LABEL_GAP;
          if (labelY + LABEL_HEIGHT > canvas.height) {
            labelX += 8;
            labelY = scaledY - LABEL_HEIGHT;
          }
          attempts++;
        }

        const clampedX = Math.max(0, Math.min(labelX, canvas.width - labelW));
        const clampedY = Math.max(0, Math.min(labelY, canvas.height - LABEL_HEIGHT));

        placed.push({ x: clampedX, y: clampedY, w: labelW, h: LABEL_HEIGHT });

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(clampedX, clampedY, labelW, LABEL_HEIGHT);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, clampedX + LABEL_PADDING_X, clampedY + LABEL_HEIGHT - 6);
      });
    };

    if (img.complete) {
      drawDetections();
    } else {
      img.onload = drawDetections;
    }
    
    // Window resize handler
    const handleResize = () => drawDetections();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [imageUrl, detections]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-2 relative rounded-xl overflow-hidden bg-surface border border-gray-800 shadow-2xl"
      >
        <img 
          ref={imgRef}
          src={imageUrl} 
          alt="Uploaded Package" 
          className="w-full h-auto max-h-[70vh] object-contain block"
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-surface rounded-xl border border-gray-800 p-6 shadow-2xl flex flex-col h-full"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <span className="w-2 h-6 bg-accent-500 rounded mr-3"></span>
          Detected Labels
        </h3>
        
        <div className="flex-grow overflow-y-auto pr-2">
          {loading && (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          )}

          {!loading && (!detections || (Array.isArray(detections) ? detections.length === 0 : Object.keys(detections).length === 0)) && (
            <div className="text-gray-400 text-center py-12">
              No labels detected in this image.
            </div>
          )}

          {!loading && detections && (Array.isArray(detections) ? detections.length > 0 : Object.keys(detections).length > 0) && (
            <ul className="space-y-3">
              {(Array.isArray(detections) ? detections : Object.values(detections)).map((det, idx) => {
                // Robust extraction of properties
                const label = det.label || det.class || det.name || det.category || 'Unknown';
                const conf = det.confidence !== undefined ? det.confidence : (det.score !== undefined ? det.score : (det.conf !== undefined ? det.conf : 0));
                
                return (
                  <motion.li 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-accent-500/50 transition-colors"
                  >
                    <span className="font-semibold text-lg">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-500" 
                          style={{ width: `${Math.round(conf * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-accent-400 font-mono">
                        {(conf * 100).toFixed(1)}%
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}