import React from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import styles from "../../styles/StartupLoader.module.css";
import LottieLoader from "../../data/lottieLoader.json";

export default function StartupLoader() {

  return (

    <div className={styles.loaderWrapper} role="status" aria-live="polite">
      <div className={styles.stars} aria-hidden="true" />
      <div className={styles.nebula} aria-hidden="true" />
      <div className={styles.foregroundGlow} aria-hidden="true" />

      <div className={styles.card}>
        <div className={styles.lottieWrap}>
          <Player
            autoplay
            loop
            src={LottieLoader}
            style={{ height: "260px", width: "260px" }}
          />

        </div>
      </div>
    </div>
  );
}
