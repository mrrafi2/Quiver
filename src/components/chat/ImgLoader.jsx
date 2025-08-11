import React from 'react';
import { createPortal } from 'react-dom';
import styles from '../../styles/ImageUploadLoader.module.css';

export default function ImageUploadLoader({ progress = null }) {

  const fillHeight = progress != null ? `${progress}%` : '40%';  // default idle look

  const container = document.getElementById ('portal-root') || document.body;

  const liquidStyle = {
    '--fill': fillHeight,
    // flag used by CSS to disable indeterminate when real progress provided
    '--indeterminate': progress == null ? 1 : 0
  };

  return createPortal(

    <div 
    className= {styles.overlay}
     role="status" 
     aria-live="polite" 
     aria-busy={progress == null}
     >

      <div className={styles.loaderWrapper}>

        <div className={styles.glassContainer} aria-hidden="false">

          {/* Liquid layer */}
          <div className={styles.liquid} style={liquidStyle}>

            <div className={styles.surface} />
            <div className={styles.blobGroup}>
              <span className={styles.blob} />
              <span className={styles.blob} />
              <span className={styles.blob} />
            </div>

            <div className={styles.bubbles}>
              <span />
              <span />
              <span />
            </div>
          </div>
          {/* subtle glass glare */}
          <div className={styles.glare} />
        </div>

        {/* determinate progress indicator */}
        { progress != null && (
          <div className={styles.progressCircle}
           aria-hidden="true"
           >
            
            <svg viewBox="0 0 36 36" className={styles.progressSvg}>
              <path
                className={styles.circleBg}
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.circleFill}
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}
      </div>
    </div>,
    container
  );
}
