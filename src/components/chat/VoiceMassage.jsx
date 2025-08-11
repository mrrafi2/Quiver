import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '../../services/Cloudinary';
import ImageUploadLoader from './ImgLoader';
import styles from '../../styles/voiceMessage.module.css';

export default function VoiceMessage({ onSend, onClose }) {

  const [recording, setRecording] = useState(false);    // are we currently recording?
  const [isSaving, setIsSaving] = useState(false); // uploading in progress?
  const [uploadProgress, setUploadProgress] = useState(null);

  const audioRecorderRef = useRef(null);
  const videoRecorderRef = useRef(null);

  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);

  // Draw waveform continuously while recording 
  const drawVisualizer = () => {
    const analyser = analyserRef.current
    const canvas = canvasRef.current

    if (!analyser || !canvas) return  // no analyser? no fun

    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.fftSize

    const dataArray = new Uint8Array (bufferLength)

    const draw = () => {
      if (!recording) return; // stop the loop when done

      requestAnimationFrame (draw)

      analyser.getByteTimeDomainData(dataArray)

      ctx.fillStyle = '#121416'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#00f5d4'
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0
      for (let i = 0; i < bufferLength; i++) {

        const v = dataArray[i] / 128.0
      const y = (v * canvas.height) / 2

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        x += sliceWidth
      }
      ctx.stroke();
    };

    draw()
  };

  // start audio + video recording

  const handleStartRecording = async () => {

    // Tip: ask for mic permission only when needed
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // set up Web Audio API for visualizer
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    await audioCtx.resume();

    // set up analyser for visualizer
    const source = audioCtx.createMediaStreamSource (stream)

    const analyser = audioCtx.createAnalyser ()

    analyser.fftSize = 1024

    source.connect(analyser)
    analyserRef.current = analyser

    // clear any previous canvas drawings
    const canvas = canvasRef.current

    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Audio recorder
    const audioRecorder = new MediaRecorder(stream)

    audioRecorderRef.current = audioRecorder

    audioChunksRef.current = []
    audioRecorder.ondataavailable = e => audioChunksRef.current.push(e.data)

    audioRecorder.start();


    
    setRecording(true)
    drawVisualizer();
  };


  // Stop and process recordings
  const handleStopRecording = async () => {
    setRecording(false)

    // Stop recorders
    audioRecorderRef.current.stop()

    // wait for blobs
    const audioBlob = await new Promise(resolve => {

      audioRecorderRef.current.onstop = ( ) => resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }
      ) )
  })

   

    
    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: audioBlob.type })

    

    // Show loader
    setIsSaving(true);
    setUploadProgress(0);

    try {
      // upload audio first
      const audioUrl = await uploadToCloudinary (

        audioFile,

        e => { if (e.lengthComputable ) setUploadProgress(Math.round((e.loaded * 100) / e.total )); },
        'voice_notes'
      );
      

      
      
      // send URL to parent
      onSend ({ type: 'voice', 
        mediaSrc: audioUrl, visualizerVideoSrc: null, 
        effectUsed: 'none' })

    } catch (err) {
      console.error('Voice upload failed:', err)
    // Todo: Show user a retry button

    } finally {

      setIsSaving(false);
      setUploadProgress(null)
      onClose(); // close overlay automatically

      audioChunksRef.current = [];
    }
  };

    // re-trigger visualizer when recording toggles
  useEffect(( ) => 
    { if (recording) drawVisualizer() }, 
  [recording]);


// show the loader while saving
  if (isSaving) {
    return <ImageUploadLoader progress={uploadProgress} />;
  }


  return ReactDOM.createPortal (

    <div className={styles.voiceOverlay} onClick={onClose}>

      <AnimatePresence>

        <motion.div
          className={styles.voiceContainer}
          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          onClick={e => e.stopPropagation()}
        >
           {/* waveform canvas */}
          <canvas 
          ref={canvasRef} 
          width={320} height={100} 
          className={styles.visualizer} 
          />
         
       {/* controls: record / stop / close */}
          <div className={styles.controls}>

            { !recording ? (
              <button className={styles.startBtn} onClick={handleStartRecording}>
                🎙️ Record
                </button>

            ) : (
              <button className={styles.stopBtn}
               onClick={handleStopRecording}>
                 ☑ Send 
                 </button>
            )}
            <button className={styles.closeBtn} 
            onClick={onClose}>
              ✖️
              </button>

          </div>

        </motion.div>
      </AnimatePresence>
    </div>, document.body
  );
}
