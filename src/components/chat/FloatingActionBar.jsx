import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasDrawer from './Canvas';
import VoiceMessage from './VoiceMassage';
import { uploadToCloudinary } from '../../services/Cloudinary';
import styles from '../../styles/actionBar.module.css';
import ImageUploadLoader from './ImgLoader';

export default function FloatingActionBar({ onSend, onType }) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const galleryInputRef = useRef();
  const cameraInputRef = useRef();
  const inputRef = useRef(null);

  // handle text input & auto-resize
  const handleInputChange = v => {
    setInput(v);
    onType?.(!!v.trim());
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (inputRef.current) inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
  };
  const handleBlur = () => {
    setIsFocused(false);
    if (inputRef.current) inputRef.current.style.height = '';
  };

  // send text message
  const sendText = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend?.({ type: 'text', text: trimmed });
      setInput('');
      onType?.(false);
      if (inputRef.current) inputRef.current.style.height = '';
    } catch (err) {
      console.error('Failed to send text message:', err);
    }
    setSending(false);
  };

  // open gallery or camera
  const openGallery = () => galleryInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  // handle selected image
  const onImageSelected = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, ev => {
        setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
      });
      await onSend?.({ type: 'image', mediaSrc: url });
    } catch (err) {
      console.error('Image upload/send failed:', err);
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
      e.target.value = '';
      setShowMediaOptions(false);
    }
  };

  return (
    <>
      {uploadingImage && <ImageUploadLoader progress={uploadProgress} />}

      <AnimatePresence>
        {showCanvas && (
          <CanvasDrawer
            onSend={msg => { onSend?.(msg); setShowCanvas(false); }}
            onClose={() => setShowCanvas(false)}
          />
        )}
        {showVoice && (
          <VoiceMessage
            onSend={msg => { onSend?.(msg); setShowVoice(false); }}
            onClose={() => setShowVoice(false)}
          />
        )}
      </AnimatePresence>

      <div className={styles.floatingBar}>
        {/* Hidden inputs for gallery & camera */}
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          style={{ display: 'none' }}
          onChange={onImageSelected}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          style={{ display: 'none' }}
          onChange={onImageSelected}
        />

        {/* Icons */}
        <motion.button
          className={styles.iconBtn}
          onClick={() => setShowMediaOptions(true)}
          whileHover={{ scale: 1.1 }}
        >
          <i className="fa-solid fa-image"></i>
        </motion.button>
        
        <motion.button
          className={styles.iconBtn}
          style={{ backgroundColor: '#eee', borderRadius: '7px' }}
          onClick={() => setShowCanvas(s => !s)}
          whileHover={{ scale: 1.1 }}
        >
          🖌️
        </motion.button>
        <motion.button
          className={styles.iconBtn}
          onClick={() => setShowVoice(s => !s)}
          whileHover={{ scale: 1.1 }}
        >
          <i className="fa-solid fa-microphone"></i>
        </motion.button>

        {/* Textarea */}
        <motion.textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Type here..."
          className={`${styles.inputBox} ${isFocused ? styles.inputFocused : ''}`}
          style={{ overflow: 'auto' }}
        />

        {/* Send button with loader disabling */}
        <motion.button
          onClick={sendText}
          className={styles.sendBtn}
          whileHover={{ scale: 1.1 }}
          disabled={sending}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </motion.button>
      </div>

      {/* Bottom-sheet media options */}
      <AnimatePresence>
        {showMediaOptions && (
          <motion.div
            className={styles.mediaSheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <button className={styles.sheetBtn} onClick={openCamera}>
              📷 Take Photo
            </button>
            <button className={styles.sheetBtn} onClick={openGallery}>
              🖼️ Choose from Gallery
            </button>
            <button
              className={styles.sheetCancel}
              onClick={() => setShowMediaOptions(false)}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
