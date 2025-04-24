import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '../../services/Cloudinary';
import ImageUploadLoader from './ImgLoader';
import styles from '../../styles/voiceMessage.module.css';

export default function VoiceMessage({ onSend, onClose }) {
  const [recording, setRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const audioRecorderRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);

  // Draw waveform on canvas
  const drawVisualizer = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!recording) return;
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = '#121416';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00f5d4';
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    };

    draw();
  };

  // Start audio + video recording
  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    await audioCtx.resume();

    // Set up analyser for visualizer
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;

    // Clear any previous canvas drawings
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Audio recorder
    const audioRecorder = new MediaRecorder(stream);
    audioRecorderRef.current = audioRecorder;
    audioChunksRef.current = [];
    audioRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
    audioRecorder.start();

    // Video recorder from canvas stream
    const canvasStream = canvas.captureStream(30);
    const videoRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm; codecs=vp8' });
    videoRecorderRef.current = videoRecorder;
    videoChunksRef.current = [];
    videoRecorder.ondataavailable = e => videoChunksRef.current.push(e.data);
    videoRecorder.start();

    setRecording(true);
    drawVisualizer();
  };

  // Stop and process recordings
  const handleStopRecording = async () => {
    setRecording(false);

    // Stop recorders
    audioRecorderRef.current.stop();
    videoRecorderRef.current.stop();

    // Wait for blobs
    const audioBlob = await new Promise(resolve => {
      audioRecorderRef.current.onstop = () => resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
    });
    const videoBlob = await new Promise(resolve => {
      videoRecorderRef.current.onstop = () => resolve(new Blob(videoChunksRef.current, { type: 'video/webm' }));
    });

    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: audioBlob.type });
    const videoFile = new File([videoBlob], `wave_${Date.now()}.webm`, { type: videoBlob.type });

    // Show loader
    setIsSaving(true);
    setUploadProgress(0);

    try {
      // Upload audio
      const audioUrl = await uploadToCloudinary(
        audioFile,
        e => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded * 100) / e.total)); },
        'voice_notes'
      );

      // Upload video
      setUploadProgress(0);
      const videoUrl = await uploadToCloudinary(
        videoFile,
        e => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded * 100) / e.total)); },
        'voice_waveforms'
      );

      onSend({ type: 'voice', mediaSrc: audioUrl, visualizerVideoSrc: videoUrl, effectUsed: 'none' });
    } catch (err) {
      console.error('Voice upload failed:', err);
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
      onClose();
      audioChunksRef.current = [];
      videoChunksRef.current = [];
    }
  };

  useEffect(() => { if (recording) drawVisualizer(); }, [recording]);

  if (isSaving) {
    return <ImageUploadLoader progress={uploadProgress} />;
  }

  return ReactDOM.createPortal(
    <div className={styles.voiceOverlay} onClick={onClose}>
      <AnimatePresence>
        <motion.div
          className={styles.voiceContainer}
          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          onClick={e => e.stopPropagation()}
        >
          <canvas ref={canvasRef} width={320} height={100} className={styles.visualizer} />
          <div className={styles.controls}>
            {!recording ? (
              <button className={styles.startBtn} onClick={handleStartRecording}>🎙️ Record</button>
            ) : (
              <button className={styles.stopBtn} onClick={handleStopRecording}> ☑ Send </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✖️</button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>, document.body
  );
}
