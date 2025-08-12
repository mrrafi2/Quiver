import React from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import styles from "../../styles/StartupLoader.module.css";
import cosmicBg from "../../assets/cosmicBg.webp"; 
import LottieLoader from "../../data/lottieLoader.json"; 

export default function StartupLoader() {
  return (
    <div
      className={styles.loaderWrapper}
      style={{
        backgroundImage: `url(${cosmicBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Player
        autoplay
        loop
        src={LottieLoader}
        style={{ height: "270px", width: "270px" }}
      />
    </div>
  );
}
