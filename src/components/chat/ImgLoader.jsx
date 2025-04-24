import React from 'react';
import ReactDOM from 'react-dom';
import styles from '../../styles/ImageUploadLoader.module.css';

export default function ImageUploadLoader({ progress = null }) {
  // Determine fill height (0–100%)
  const fillHeight = progress != null ? `${progress}%` : '0%';
  // Disable indeterminate animation when real progress is provided
  const liquidStyle = {
    '--fill': fillHeight,
    animation: progress != null ? 'none' : undefined
  };

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.loaderWrapper}>
        <div
          className={styles.glassContainer}
        >
          <div
            className={styles.liquid}
            style={liquidStyle}
          />
          {/* SVG wave for that wavy top edge */}
          <svg
            className={styles.wave}
            viewBox="0 0 500 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,10 C150,20 350,0 500,10 L500,00 L0,0 Z"
              fill="rgba(102, 252, 241, 0.8)"
            >
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="translate"
                from="0 0"
                to="-500 0"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>

        {/* Centered progress indicator below the glass */}
        {progress != null && (
          <div className={styles.progressCircle}>
            <svg viewBox="0 0 36 36">
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
    document.body
  );
}