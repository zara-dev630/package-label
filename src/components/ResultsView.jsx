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

      const LABEL_HEIGHT = 24;
      const LABEL_PAD = 6;
      const GAP = 6;
      const EXPAND = 8; // expand boxes on all sides to better enclose text

      const boxes = detections.map(det => {
        const [x1, y1, x2, y2] = det.box;
        let bx = x1 * scaleX;
        let by = y1 * scaleY;
        let bw = (x2 - x1) * scaleX;
        let bh = (y2 - y1) * scaleY;
        const expX = EXPAND * scaleX;
        const expY = EXPAND * scaleY;
        bx = Math.max(0, bx - expX);
        by = Math.max(0, by - expY);
        bw = bw + 2 * expX;
        bh = bh + 2 * expY;
        const text = `${det.label} ${(det.confidence * 100).toFixed(1)}%`;
        ctx.font = 'bold 14px sans-serif';
        const tw = ctx.measureText(text).width;
        const lw = tw + LABEL_PAD * 2;
        return { bx, by, bw, bh, text, lw };
      });

      const placed = [];

      const overlapsAnyBox = (x, y, w, h) =>
        boxes.some(b =>
          x < b.bx + b.bw && x + w > b.bx &&
          y < b.by + b.bh && y + h > b.by
        );

      const overlapsAnyLabel = (x, y, w, h) =>
        placed.some(o =>
          x < o.x + o.w + LABEL_PAD && x + w + LABEL_PAD > o.x &&
          y < o.y + o.h && y + LABEL_HEIGHT > o.y
        );

      boxes.forEach(b => {
        const { bx, by, bw, bh, text, lw } = b;

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, bw, bh);

        let lx = bx;
        let ly;
        let chosen = null;

        const cands = [
          { ly: by - LABEL_HEIGHT - GAP },
          { ly: by + bh + GAP },
        ];
        // Also try sliding within the gap above/below, plus global clear bands
        for (let n = 1; n <= 6; n++) {
          cands.push({ ly: by - GAP - LABEL_HEIGHT - n * (LABEL_HEIGHT + 2), offset: -n });
          cands.push({ ly: by + bh + GAP + n * (LABEL_HEIGHT + 2), offset: n });
        }
        // Global cleared bands: stack in the top clear zone or bottom clear zone
        const topClear = 0;
        const bottomClear = canvas.height - LABEL_HEIGHT * boxes.length;
        cands.push({ ly: topClear, band: 'top' });
        cands.push({ ly: bottomClear, band: 'bottom' });

        for (const c of cands) {
          const cx = lx;
          const cy = Math.max(0, Math.min(c.ly, canvas.height - LABEL_HEIGHT));
          if (cx < 0 || cx + lw > canvas.width + 1) continue;
          if (!overlapsAnyBox(cx, cy, lw, LABEL_HEIGHT) && !overlapsAnyLabel(cx, cy, lw, LABEL_HEIGHT)) {
            chosen = { x: cx, y: cy };
            break;
          }
        }

        if (!chosen) {
          chosen = { x: lx, y: Math.max(0, canvas.height - LABEL_HEIGHT) };
        }

        const lxr = Math.max(0, Math.min(chosen.x, canvas.width - lw));
        const lyr = Math.max(0, Math.min(chosen.y, canvas.height - LABEL_HEIGHT));

        placed.push({ x: lxr, y: lyr, w: lw, h: LABEL_HEIGHT });

        // Calculate final label rect
        const lrx = lxr;
        const lry = lyr;
        const lrw = lw;
        const lrh = LABEL_HEIGHT;

        // Draw connector line: short direct line from label to nearest box edge
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (lry + lrh <= by) {
          // label above box: connect label bottom edge to box top edge,
          // keeping x within whichever horizontal span the line crosses
          const nearX = Math.max(bx, Math.min(lrx + lrw, bx + bw));
          const midX = (lrx + lrw / 2 + nearX) / 2;
          ctx.moveTo(midX, lry + lrh);
          ctx.lineTo(nearX, by);
        } else {
          // label below box: connect label top edge to box bottom edge
          const nearX = Math.max(bx, Math.min(lrx + lrw, bx + bw));
          const midX = (lrx + lrw / 2 + nearX) / 2;
          ctx.moveTo(midX, lry);
          ctx.lineTo(nearX, by + bh);
        }
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(lrx, lry, lrw, lrh);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, lrx + LABEL_PAD, lry + LABEL_HEIGHT - 6);
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