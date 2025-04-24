import React, { useRef, useState } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { uploadToCloudinary } from '../../services/Cloudinary';
import ImageUploadLoader from './ImgLoader';
import styles from '../../styles/canvas.module.css';

function hexToRGBA(hex, alpha = 1) {
  const r = parseInt(hex.slice(1,3),16),
        g = parseInt(hex.slice(3,5),16),
        b = parseInt(hex.slice(5,7),16);
       return `rgba(${r},${g},${b},${alpha})`;
    }

export default function CanvasDrawer({ onSend }) {
  const canvasRef = useRef(null);

  const [tool,     setTool]    = useState('pencil');  
  const [color,    setColor]   = useState('#000000');
  const [bgColor,  setBgColor] = useState('#ffffff');
  const [width,    setWidth]   = useState(5);

  const [saving,   setSaving]  = useState(false);
  const [progress, setProgress]= useState(null);

  // Eraser just sets strokeColor to bgColor
  let strokeW = width;
  let strokeC = color;
  if      (tool === 'pen')    strokeW = width * 1.5;
  else if (tool === 'marker') strokeW = width * 2, strokeC = hexToRGBA(color,0.6);
  else if (tool === 'brush')  strokeW = width * 3, strokeC = hexToRGBA(color,0.4);
  else if (tool === 'eraser') strokeC = bgColor;

  const handleSave = async () => {
    setSaving(true);
    setProgress(0);
    try {
      const png  = await canvasRef.current.exportImage('png');
      const blob = await fetch(png).then(r=>r.blob());
      const file = new File([blob],'drawing.png',{ type: blob.type });
      const url  = await uploadToCloudinary(
        file,
        e=> e.lengthComputable && setProgress(Math.round(e.loaded*100/e.total)),
        'canvas_drawings'
      );
      await onSend({ type:'image', mediaSrc:url });
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const handleUndo  = () => canvasRef.current.undo();
  const handleClear = () => canvasRef.current.clearCanvas();

  const handleCanvasClick = e => {
    if (tool !== 'text') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const txt = prompt('Enter text:');
    if (txt) {
      const ctx = canvasRef.current.canvas.drawingCanvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.font = `${width * 4}px sans-serif`;
      ctx.fillText(txt,x,y);
    }
    setTool('pencil');
  };

  if (saving) return <ImageUploadLoader progress={progress} />;

  return (
    <div className={styles.canvasContainer}>
      <aside className={styles.sidebar}>
  
        {/* Action buttons */}
        <div className={styles.actionSection}>
          <button className={styles.saveBtn} onClick={handleSave}><i className="fa-solid fa-paper-plane" /></button>
          <button className={styles.undoBtn} onClick={handleUndo}>↩️</button>
          <button className={styles.clearBtn} onClick={handleClear}>🧹</button>
        </div>
  
        {/* Tool icons */}
        <div className={styles.toolSection}>
          {['pencil', 'pen', 'marker', 'brush', 'eraser', 'text'].map(t => (
            <button
              key={t}
              className={`${styles.toolBtn} ${tool === t ? styles.activeTool : ''}`}
              onClick={() => setTool(t)}
              title={t}
            >
              {{
                pencil: '✏️',
                pen: '🖋️',
                marker: '🖊️',
                brush: '🖌️',
                eraser: '🧽',
                text: '🔤'
              }[t]}
            </button>
          ))}
        </div>
  
        <br />
  
        {/* Size slider */}
        <div className={styles.sliderSection}>
          <input
            type="range" min="1" max="30" value={width}
            onChange={e => setWidth(+e.target.value)}
            className={styles.slider}
            title="Stroke size"
          />
        </div>
  
        <br />
  
        {/* Color pickers */}
        <div className={styles.colorSection}>
          <input
            type="color" value={color}
            onChange={e => setColor(e.target.value)}
            className={styles.colorPicker}
            title="Stroke color"
          />
          <input
            type="color" value={bgColor}
            onChange={e => {
              setBgColor(e.target.value);
              canvasRef.current.clearCanvas();
              canvasRef.current.canvasColor = e.target.value;
            }}
            className={styles.colorPicker}
            title="Background color"
          />
        </div>
  
        <br />
  
        {/* Spacer pushes actions to bottom */}
        <div className={styles.spacer} />
  
        <div className={styles.actionSection}>
          <button className={styles.saveBtn} onClick={handleSave}><i className="fa-solid fa-paper-plane" /></button>
          <button className={styles.undoBtn} onClick={handleUndo}>↩️</button>
          <button className={styles.clearBtn} onClick={handleClear}>🧹</button>
        </div>
      </aside>
  
      <main
        className={styles.canvasWrapper}
        onClick={handleCanvasClick}
      >
        <ReactSketchCanvas
          ref={canvasRef}
          width="100%" height="100%"
          strokeWidth={strokeW}
          strokeColor={strokeC}
          canvasColor={bgColor}
          strokeCap="round"
          style={{ cursor: "crosshair" }}
        />
      </main>
    </div>
  );
  ;
}  