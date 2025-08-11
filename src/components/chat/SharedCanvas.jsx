// coming soon feature

import React, { useRef } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { uploadToCloudinary } from '../../services/Cloudinary';

const SharedCanvas = ({ onSend }) => {
  const canvasRef = useRef(null);

  const handleSaveCanvas = async () => {
    const dataURL = canvasRef.current.getSaveData();
    // dataURL is JSON describing the drawing. For an actual image, use getDataURL().
    // Convert that dataURL to a file if needed, then upload to Cloudinary.
    const imageData = canvasRef.current.getDataURL('image/png');
    const blob = await (await fetch(imageData)).blob();
    const file = new File([blob], 'canvas.png', { type: 'image/png' });
    const url = await uploadToCloudinary(file);
    onSend({
      type: 'image',
      mediaSrc: url
    });
  };

  return (
    <div>
      <CanvasDraw ref={canvasRef} brushColor="#000" brushRadius={2} />
      <button onClick={handleSaveCanvas}>Save Doodle</button>
    </div>
  );
};

export default SharedCanvas;
