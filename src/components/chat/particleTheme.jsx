// src/components/particleThemes.jsx
import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

const dawnConfig = {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 50, density: { enable: true, area: 800 } },
      shape: { type: "circle" },
      size: {
        value: { min: 4, max: 12 },
        animation: { enable: true, speed: 1, minimumValue: 3, sync: false },
      },
      color: {
        value: ["#FFDEE9", "#B5FFFC", "#FFF1EB", "#E3F2FD"], // dreamy dawn hues: pink mist, sky blue, early light
      },
      opacity: {
        value: { min: 0.2, max: 0.5 },
        animation: { enable: true, speed: 0.3, minimumValue: 0.1, sync: false },
      },
      move: {
        enable: true,
        speed: 0.25,
        direction: "top",
        random: true,
        straight: false,
        gravity: { enable: false, acceleration:-0.05 }, 
        outModes: { default: "out" },
      },
    },
    detectRetina: true,
  };
  
  const sunnyConfig = {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 60, density: { enable: true, area: 800 } },
      shape: {
        type: "image",
        image: [{ src: "/sunny.svg", width: 48, height: 48 }],
      },
      size: {
        value: { min: 10, max: 16 },
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 8,
          sync: false,
        },
      },
      opacity: {
        value: { min: 0.5, max: 0.9 },
        animation: {
          enable: true,
          speed: 0.5,
          minimumValue: 0.3,
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: "top-right",
        random: true,
        straight: false,
        outModes: { default: "out" },
        trail: {
          enable: false,
        },
        gravity: {
          enable: false,
        },
      },
    },
    detectRetina: true,
  };
  

const duskConfig = {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 40, density: { enable: true, area: 800 } },
      shape: {
        type: "circle", // soft glowing orbs instead of polygon edges
      },
      size: {
        value: { min: 3, max: 7 },
        animation: { enable: true, speed: 1, minimumValue: 2, sync: false },
      },
      color: {
        value: ["#6D597A", "#B56576", "#E56B6F", "#355070"], 
      },
      opacity: {
        value: { min: 0.2, max: 0.5 },
        animation: { enable: true, speed: 0.5, minimumValue: 0.1, sync: false },
      },
      move: {
        enable: true,
        speed: 0.3,
        direction: "bottom-left",
        random: true,
        straight: false,
        gravity: { enable: true, acceleration: 0.2 },
        outModes: { default: "out" },
      },
    },
    detectRetina: true,
  };
  
const starryConfig = {
  background: { color: { value: "transparent" } },
  particles: {
    number: { value: 90, density: { enable: true, area: 800 } },
    shape: { type: "image", image: [{ src: "/starry.svg", width: 24, height: 24 }] },
    size: { value: { min: 4, max: 6 } },
    opacity: { value: { min: 0.1, max: 0.4 }, animation: { enable: true, speed: 0.5, sync: false } },
    move: {
      enable: true,
      speed: 0.2,
      direction: "none",
      straight: false,
      random: true,
      outModes: { default: "out" },
    },
  },
  detectRetina: true,
};

const rainyConfig = {
  background: { color: { value: "transparent" } },
  particles: {
    number: { value: 80, density: { enable: true, area: 700 } },
    shape: { type: "image", image: [{ src: "/rainy.svg", width: 5, height: 7 }] },
    size: { value: { min: 4, max: 6 } },
    opacity: { value: 0.6 },
    move: {
      enable: true,
      speed: 1.4,
      direction: "bottom",
      straight: true,
      gravity: { enable: true, acceleration: 1 },
      outModes: { default: "out" },
    },
  },
  detectRetina: true,
};

const forestConfig = {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 40, density: { enable: true, area: 900 } },
      shape: {
        type: "image",
        image: [{ src: "/forest.svg", width: 32, height: 32 }],
      },
      size: {
        value: { min: 6, max: 12 },
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 5,
          sync: false,
        },
      },
      opacity: {
        value: { min: 0.5, max: 0.8 },
        animation: {
          enable: true,
          speed: 0.5,
          minimumValue: 0.3,
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: 0.6,
        direction: "bottom-right",
        random: true,
        straight: false,
        outModes: { default: "out" },
        gravity: {
          enable: true,
          acceleration: 0.15,
          maxSpeed: 1.5,
        },
        trail: {
          enable: false,
        },
      },
    },
    detectRetina: true,
  };

  
const oceanConfig = {
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 60, density: { enable: true, area: 800 } },
      shape: { type: "circle" },
      color: {
        value: ["#48cae4", "#00b4d8", "#0077b6", "#90e0ef"], // ocean hues
      },
      size: {
        value: { min: 4, max: 10 },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 3,
          sync: false,
        },
      },
      opacity: {
        value: { min: 0.4, max: 0.8 },
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.2,
          sync: false,
        },
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: "right",
        random: true,
        straight: false,
        outModes: { default: "out" },
        trail: {
          enable: false,
        },
        attract: {
          enable: true,
          rotateX: 1000,
          rotateY: 800,
        },
      },
    },
    detectRetina: true,
  };
    

const defaultConfig = {
  particles: { number: { value: 0 } },
};

export function getConfigForTheme(theme) {
  switch (theme) {
    case "dawn": return dawnConfig;
    case "sunny": return sunnyConfig;
    case "dusk": return duskConfig;
    case "starry": return starryConfig;
    case "rainy": return rainyConfig;
    case "forest": return forestConfig;
    case "ocean": return oceanConfig;
    default: return defaultConfig;
  }
}

export default function ParticleThemes({ theme }) {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = getConfigForTheme(theme);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={options}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
