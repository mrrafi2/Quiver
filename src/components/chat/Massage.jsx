// src/components/Message.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Massage.module.css';

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today - ${time}`;
  } else if (isYesterday) {
    return `Yesterday - ${time}`;
  } else {
    const dateString = date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${dateString} - ${time}`;
  }
}


export default function Message({
  id,
  text,
  type,
  mediaSrc,
  visualizerSrc,
  effectUsed,
  timestamp,
  user,
  mood,
  whisper,
  isOwn,
  reaction,
  onDelete,
  onReact,
  friendPhotoURL,
  seen,
  theme
}) {
  const [reacted, setReacted]       = useState(reaction || null);
  const [showPicker, setShowPicker] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom]             = useState(1);
  const fsRef                       = useRef();

  useEffect(() => {
    if (!whisper) return;
    const t = setTimeout(() => onDelete(id, user), 8000);
    return () => clearTimeout(t);
  }, [whisper, id, user, onDelete]);

  const timeString = formatTimestamp(timestamp);

  const isMedia = type === 'image' || type === 'canvas';
  const wrapperClasses = [
    isMedia ? styles.mediaWrapper : styles.messageWrapper,
    isOwn ? styles.own : styles.theirs,
    styles[`${theme}${isOwn ? 'Own' : 'Theirs'}`],
    whisper ? styles.whisperMsg : '',
    mood?.label ? styles['mood-' + mood.label] : ''
  ].join(' ');

  const handleReact = emo => {
    setReacted(emo);
    setShowPicker(false);
    onReact(id, emo);
  };

  const handleWheel = e => {
    e.stopPropagation();
    const d = -e.deltaY / 500;
    setZoom(Math.min(Math.max(zoom + d, 1), 5));
  };

  const openFS = () => {
    setZoom(1);
    setFullscreen(true);
  };

  const closeFS = () => setFullscreen(false);

  const ReactionUI = (
    <div className={styles.reactionContainer}>
      <motion.div
        className={`${styles.reactionTrigger} ${reacted ? styles.active : ''}`}
        onClick={() => setShowPicker(p => !p)}
        whileHover={{ scale: 1.2 }}
        animate={{ y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      >
        {reacted || '💬'}
      </motion.div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            className={styles.reactionPicker}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {['❤️','👍','😢','😮','🤗','💔','🤣','😡'].map(emo => (
              <motion.span
                key={emo}
                onClick={() => handleReact(emo)}
                whileHover={{ scale: 1.4 }}
                className={styles.reactionEmoji}
              >
                {emo}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const bubble = (
    <motion.div
      className={wrapperClasses}
      initial={{ opacity: whisper ? 1 : 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.content}>
        {type === 'text' && <p className={styles.text}>{text}</p>}

        {(type === 'image' || type === 'canvas') && (
          <div className={styles.imageContainer} onClick={openFS}>
            {imgLoading && (
              <div className={styles.imageLoader}>
                <div className={styles.loaderDots}><span /><span /><span /></div>
              </div>
            )}
            <img
              src={mediaSrc}
              alt="sent media"
              className={styles.image}
              onLoad={() => setImgLoading(false)}
              style={{ display: imgLoading ? 'none' : 'block' }}
            />
          </div>
        )}

        {type === 'voice' && (
          <div className={styles.voiceContainer}>
            {visualizerSrc && (
              <img src={visualizerSrc} alt="waveform" className={styles.waveform} />
            )}
            <audio controls src={mediaSrc} className={styles.audioPlayer} />
            {effectUsed && effectUsed !== 'none' && (
              <div className={styles.effectTag}>Effect: {effectUsed}</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.meta}>
        {mood?.emoji && <span className={styles.moodTag}>{mood.emoji}</span>}

        <span className={styles.time}>{timeString}</span>
        {isOwn && seen && <span className={styles.seenIndicator}>✓ Seen</span>}

        {isOwn && reaction && (
  <span className={styles.friendReaction}> {/* ✨ ADDED */}
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={styles.friendReactionEmoji}
    >
      {reaction}
    </motion.span>
  </span>
)}


        {isOwn && (
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(id, user)}
          >🗑️</button>
        )}
        {!isOwn && ReactionUI}
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {!isOwn ? (
          <div className={styles.messageRow}>
            <img src={friendPhotoURL} alt="avatar" className={styles.avatar} />
            {bubble}
          </div>
        ) : bubble}
      </AnimatePresence>

      {fullscreen && ReactDOM.createPortal(
        <div className={styles.fsOverlay} onClick={closeFS}>
          <button className={styles.fsClose} onClick={closeFS}>×</button>
          <div
            className={styles.fsContent}
            onClick={e => e.stopPropagation()}
            onWheel={handleWheel}
            ref={fsRef}
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={mediaSrc}
              alt={type === 'canvas' ? 'canvas' : 'full-size'}
              className={styles.image}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function ChattyLoader() {
  return (
    <div className={styles.chattyLoader}>
      <div className={styles.loaderBubble}>
        <span className={styles.loaderDot} />
        <span className={styles.loaderDot} /> 
        <span className={styles.loaderDot} /> 
      </div>
    </div>
  );
}
