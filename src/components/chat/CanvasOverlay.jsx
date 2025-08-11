import React from 'react';
import { motion } from 'framer-motion';
import CanvasDrawer from './Canvas';
import styles from '../../styles/overlay.module.css'; 

export default function CanvasOverlay({ onSend, onClose } ) {

  return (

    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.canvasContainer}>

        <CanvasDrawer onSend={onSend} />
        <button className={styles.closeBtn} onClick={onClose}>✖</button>
        
      </div>
    </motion.div>
  );
}