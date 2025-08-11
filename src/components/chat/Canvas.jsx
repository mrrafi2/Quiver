import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { uploadToCloudinary } from "../../services/Cloudinary";
import ImageUploadLoader from "./ImgLoader";
import styles from "../../styles/canvas.module.css";

/* small helper */
function hexToRGBA(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
  b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha} )`;
}

export default function CanvasDrawer({ onSend }) {

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  // Tools & state
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#0b0b0b");
  const [width, setWidth] = useState(5);

  // Background handling
  const [bgMode, setBgMode] = useState("solid"); // 'solid' | 'gradient'
  const [bgSolid, setBgSolid] = useState("#ffffff");
  const [bgGradA, setBgGradA] = useState("#0b84ff");
  const [bgGradB, setBgGradB] = useState("#7be3c7");
  const [bgAngle, setBgAngle] = useState(180);
  const [bgImage, setBgImage] = useState(null); // dataURL for gradient background
  const [preserveDrawing, setPreserveDrawing] = useState(true);

  // UI / mobile
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 720 : false
  );
  const [showMore, setShowMore] = useState(false);

  // Upload state
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);


  // color presets
  const strokePresets = [ "#000000", "#0b84ff", "#4caf50", "#ff6b6b", "#ef9f1f", "#9b59b6"]

  const bgPresets = [
    { type: "solid", value: "#ffffff", label: "White" },
    { type: "solid", value: "#0b0b0b", label: "Black" },
    { type: "solid", value: "#f7f7f9", label: "Paper" },
    { type: "gradient", value: ["#0b84ff", "#7be3c7"], label: "Aqua" },
    { type: "gradient", value: ["#ff7a7a", "#ffd08a"], label: "Sunset" },
  ];

  useEffect(( ) => {
    const onResize = () => setIsMobile(window.innerWidth <= 720)

    window.addEventListener("resize", onResize)

    return () => window.removeEventListener("resize", onResize);
  }, [ ])


  // computed stroke settings
  let strokeW = width
  let strokeC = color

  if ( tool === "pen" ) strokeW = width * 1.5

  else if ( tool === "marker" )  (strokeW = width * 2 ),  (strokeC = hexToRGBA(color, 0.6) )

  else if ( tool === "brush" )  (strokeW = width * 3), ( strokeC = hexToRGBA(color, 0.4) )

  else if ( tool === "eraser" ) strokeC = bgSolid;  // eraser uses current solid fallback


  // helper: create offscreen gradient image (returns dataURL)
  const makeGradientDataURL = (w, h, colorA, colorB, angleDeg = 180) => {
  
    const cx = document.createElement("canvas")
    cx.width = Math.max(1, Math.floor (w))
    cx.height = Math.max(1, Math.floor (h) )
    const ctx = cx.getContext("2d");

    // calculate gradient endpoints from angle
    const angle = ((angleDeg % 360) * Math.PI) / 180

    const x0 = cx.width / 2 + Math.cos(angle) * cx.width

  const y0 = cx.height / 2 + Math.sin (angle) * cx.height

    const x1 = cx.width / 2 - Math.cos(angle) * cx.width;
     const y1 = cx.height / 2 - Math.sin(angle) * cx.height;

    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cx.width, cx.height);

    return cx.toDataURL("image/png")

  };

  // Apply background while optionally preserving drawing (exportPaths/loadPaths)
  const applyBackground = async () => {
  try {
    
    console.log('applyBackground start', { bgMode, bgSolid, bgGradA, bgGradB, bgAngle, preserveDrawing }
    );

    // optionally save current paths
    let savedPaths = null

    if ( preserveDrawing && canvasRef.current?.exportPaths ) {
      try { savedPaths = await canvasRef.current.exportPaths( )
       }
      catch (err) { console.warn('exportPaths failed', err)
        savedPaths = null; 
      }
    }

    if ( bgMode === 'solid' ) {
      setBgImage(null);
     
    } else {
      const w = wrapperRef.current?.clientWidth || 800;
      const h = wrapperRef.current?.clientHeight || 600

      const dataUrl = makeGradientDataURL (w, h, bgGradA, bgGradB, bgAngle)

      setBgImage (dataUrl);
    }

    // clear canvas then reload paths (so canvas re-renders with new background)

  if ( canvasRef.current?.clearCanvas ) {
      await canvasRef.current.clearCanvas ()
    }

    if ( savedPaths && canvasRef.current?.loadPaths ) {
      setTimeout (async () => {
        try { await canvasRef.current.loadPaths(savedPaths)
         }
        catch (err) { console.warn('loadPaths failed', err)

         }
      }, 60);
    }
    console.log('applyBackground done')
  } catch (err) {
    console.error('applyBackground error', err)
  }
};

/* quick apply solid color (useful for live color input) */
const applySolidQuick = ( hex ) => {
  setBgSolid(hex)
  setBgMode('solid')
  setBgImage(null)
  if (preserveDrawing) applyBackground ();
  else canvasRef.current?.clearCanvas ();
};
  // upload/save
  const handleSave = async () => {
    setSaving(true);
    setProgress(0);
    try {
      const png = await canvasRef.current.exportImage("png")

  const blob = await fetch(png).then((r) => r.blob ( ))

      const file = new File([blob], "drawing.png", { type: blob.type } )

      const url = await uploadToCloudinary(
        file,
        (e) => e.lengthComputable && setProgress(Math.round((e.loaded * 100) / e.total)),
        "canvas_drawings"
      );

      await onSend({ type: "image", mediaSrc: url });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };


  const handleUndo = ( ) => {
    try {
      canvasRef.current.undo();
    } catch (e) {
      console.warn("undo failed", e);
    }
  };

  const handleRedo = () => {
    try {
      canvasRef.current.redo && canvasRef.current.redo ()
    } catch (e) {
      console.warn("redo failed", e)
    }
  };

  const handleClear = ( ) => canvasRef.current.clearCanvas();

  // clicking the canvas for text - small fallback
  const handleCanvasClick = (e) => {
    if (tool !== "text") return

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top

    const txt = prompt("Enter text:");
    if (txt) {
      const ctx = canvasRef.current.canvas.drawingCanvas.getContext("2d");
      ctx.fillStyle = color;
      ctx.font = `${width * 4}px sans-serif`;
      ctx.fillText(txt, x, y);
    }
    setTool("pencil");
  }

  

  // UI early exit to show loader when saving
  if (saving) return <ImageUploadLoader progress={progress} />;

  return (

    <div
      className={styles.canvasContainer}
      data-mobile={isMobile}
      ref={wrapperRef}
       style={{
        background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bgSolid,
       backgroundSize: bgImage ? 'cover' : undefined
      } }
    >

      {/* Left sidebar - hidden on mobile */}
      <aside className={styles.sidebar}>

        <div className={styles.topActions}>
          <button className={styles.actionBtn} onClick={handleSave} aria-label="Send drawing">

            <span className={styles.icon}>📤</span>
            <span className={styles.label}>Send</span>
          </button>

          <button className={styles.actionBtn} onClick={handleUndo} aria-label="Undo">
            <span className={styles.icon}>↩️</span>
            <span className={styles.label}>Undo</span>
          </button>

          <button className={styles.actionBtn} onClick={handleRedo} aria-label="Redo">
            <span className={styles.icon}>↪️</span>
            <span className={styles.label}>Redo</span>
          </button>

      <button className={styles.actionBtn} onClick={handleClear} aria-label="Clear">
            <span className={styles.icon}>🧹</span>
            <span className={styles.label}>Clear</span>
        </button>
        </div>

      <div className={styles.toolsGroup}>
          {["pencil", "pen", "marker", "brush", "eraser", "text"].map((t) => (

            <button
              key={t}
              className={`${styles.toolBtn} ${tool === t ? styles.activeTool : ""}`}
              onClick={() => setTool(t)}
              title={t}
            >

              <span className={styles.toolEmoji}>
                {{
                  pencil: "✏️",
                  pen: "🖋️",
                  marker: "🖊️",
                  brush: "🖌️",
                  eraser: "🧽",
                  text: "🔤",
                }[t]}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <div className={styles.strokePreview}>
            <div
              className={styles.previewDot}
              style={{
                width: Math.max(6, width) + "px",
                height: Math.max(6, width) + "px",
                background: tool === "eraser" ? bgSolid : color,
                boxShadow: tool === "eraser" ? "none" : "0 6px 18px rgba(0,0,0,0.2)",
              }}
         />
            <span className={styles.previewLabel}>
              Size
              </span>
          </div>

          <input
            className={styles.slider}
            type="range"
            min="1"
            max="40"
            value={width}
            onChange={(e) => setWidth(+e.target.value)}
            aria-label="Stroke size"
          />

          <div className={styles.colorPickRow}>
            <input
              type="color"
              className={styles.colorPicker}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Stroke color"
            />
            <div className={styles.presets}>
              {strokePresets.map((p) => (

                <button
                  key={p}
                  className={styles.presetBtn}
                  style={{ background: p }}
                  onClick={() => setColor(p)}
                  aria-label={`Pick ${p}`}
                />

              ))}
            </div>
          </div>

          {/* Background controls (presets + manual) */}
          <div className={styles.bgControls}>

            <div className={styles.bgRowTop}>
              <div className={styles.bgMode}>
                <button
                  className={`${styles.smallBtn} ${bgMode === "solid" ? styles.activeSmall : ""}`}
                  onClick={() => setBgMode("solid")}
                >
                  Solid
                </button>

                <button
                  className={`${styles.smallBtn} ${bgMode === "gradient" ? styles.activeSmall : ""}`}
                  onClick={() => setBgMode("gradient")}
                >
                  Gradient
                </button>

              </div>

              <label className={styles.preserveLabel}>
                <input
                  type="checkbox"
                  checked={preserveDrawing}
                  onChange={(e) => setPreserveDrawing(e.target.checked)}
                />
                Preserve
              </label>

            </div>

            <div className={styles.presetsRow}>
              { bgPresets.map((p, idx) => (

                <button
                  key={idx}
                  title={p.label}
                  className={styles.presetBtn}
                  onClick={() => {
                    if (p.type === "solid") {
                      setBgMode("solid");
                      setBgSolid(p.value);
                      setBgImage(null);
                      if (preserveDrawing) applyBackground();
                      else canvasRef.current?.clearCanvas();
                    } else {
                      setBgMode("gradient")
                      setBgGradA(p.value[0])
                      setBgGradB(p.value[1])

                      applyBackground()
                    }
                  }}
                  style={{
                    background: p.type === "solid" ? p.value : `linear-gradient(90deg, ${p.value[0]}, ${p.value[1]})`,
                  }}
                />
              ))}
      </div>

            { bgMode === "solid" ? (

              <div className={styles.manualRow}>
                <input
                  type="color"
                  value={bgSolid}
                  onChange={(e) => applySolidQuick(e.target.value)}
                  className={styles.colorPicker}
                />

                <button className={styles.applySmall} onClick={() => applyBackground()}>
                  Apply
                </button>

              </div>
            ) : (
              <div className={styles.manualRow}>

                <input
                  type="color"
                  value={bgGradA}
                  onChange={(e) => setBgGradA(e.target.value)}
                  className={styles.colorPicker}
                />

                <input
                  type="color"
                  value={bgGradB}
                  onChange={(e) => setBgGradB(e.target.value)}
                  className={styles.colorPicker}
                />

                <input
                  type="range"
                  min="0"
                  max="360"
                  value={bgAngle}
                  onChange={(e) => setBgAngle(+e.target.value)}
                  aria-label="Gradient angle"
                />

                <button className={styles.applySmall} onClick={() => applyBackground()}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.spacer} />
      </aside>


      {/* Main canvas */}
      <main className={styles.canvasWrapper} onClick={handleCanvasClick}>

        <ReactSketchCanvas
          ref={canvasRef}
          width="100%"
          height="100%"
          strokeWidth={strokeW}
          strokeColor={strokeC}
          canvasColor="transparent"  
          strokeCap="round"
          style={{ cursor: isMobile ? "default" : "crosshair", touchAction: "none", backgroundColor: 'transparent' }}
            backgroundImage={ bgImage || undefined}
        />

      </main>

{/* mobile botom bar */}
{ isMobile && (

  <nav className={styles.mobileBar} role="navigation" aria-label="Canvas mobile bar">

    <button className={styles.mbBtn} onClick={handleSave} aria-label="Send">
      📤
      </button>

    <button className={styles.mbBtn} onClick={handleUndo} aria-label="Undo">
      ↩️
      </button>

    <button 
    className={styles.mbBtn}
     onClick={ () => setShowMore((s) => !s)} 
     aria-label="More">
     ⚙️
     </button>

    {/* sliding panel with full features: tools, stroke, presets, AND background controls */}

    <div className={`${styles.mbMore} ${showMore ? styles.mbMoreOpen : ""}`}>

      <div className={styles.mbInner}>
        {/* Tools row */}
      <div className={styles.mbTools}>
        {["pencil","pen","marker","brush","eraser","text"].map(t => (
            <button
              key={t}
              className={`${styles.mbToolBtn} ${tool === t ? styles.activeTool : ""}`}
              onClick={() => setTool(t)}
            >

              {{
                pencil: "✏️", pen: "🖋️", marker: "🖊️", brush: "🖌️", eraser: "🧽", text: "🔤"
              }[t]}

            </button>
          ))
          }
        </div>

        {/* Stroke slider + presets */}
        <div className={styles.mbControls}>

          <input
            type="range"
            min="1"
            max="40"
            value={width}
            onChange={(e) => setWidth(+e.target.value)}
            className={styles.mbSlider}
            aria-label="Stroke size"
          />

          <div className={styles.presets}>

            { strokePresets.map(p => (
              <button
                key={p}
                className={styles.presetBtn}
                style={{ background: p }}
                onClick={() => setColor(p)}
              />
            ))}
          </div>
        </div>

        <div className={styles.mbBgControls}>

          <div className={styles.bgRowTop}>
            <div className={styles.bgMode}>

              <button
                className={`${styles.smallBtn} ${bgMode === 'solid' ? styles.activeSmall : ''}`}
                onClick={() => setBgMode('solid')}
              >
                Solid
                </button>

              <button
                className={`${styles.smallBtn} ${bgMode === 'gradient' ? styles.activeSmall : ''}`}
                onClick={() => setBgMode('gradient')}
              >
                Gradient
              </button>

            </div>

            <label className={styles.preserveLabel}>

              <input
                type="checkbox"
                checked={preserveDrawing}
                onChange={(e) => setPreserveDrawing(e.target.checked)}
              />
              Preserve
            </label>
          </div>

          {/* presets row */}
          <div className={styles.presetsRow}>
            { bgPresets.map((p, idx) => (

              <button
                key={idx}
                title={p.label}
                className={styles.presetBtn}
                onClick={() => {
                  if (p.type === 'solid') {
                    setBgMode('solid'); setBgSolid(p.value); setBgImage(null);
                    if (preserveDrawing) applyBackground(); else canvasRef.current?.clearCanvas();
                  } else {
                    setBgMode('gradient'); setBgGradA(p.value[0]); setBgGradB(p.value[1]);
                    applyBackground();
                  }
                }}
                style={{
                  background: p.type === 'solid' ? p.value : `linear-gradient(90deg, ${p.value[0]}, ${p.value[1]})`
                }}
              />
            ))}
          </div>

          {/* manual controls */}
          { bgMode === 'solid' ? (
            <div className={styles.manualRow}>
              <input type="color" value={bgSolid} onChange={(e) => applySolidQuick(e.target.value)} className={styles.colorPicker} />

              <button className={styles.applySmall} onClick={() => applyBackground()}>
                Apply
                </button>

            </div>
          ) : (

            <div className={styles.manualRow}>

              <input 
              type="color"
               value={bgGradA} 
               onChange={(e) => setBgGradA(e.target.value)} 
               className={styles.colorPicker} />

              <input
               type="color"
                value={bgGradB}
                onChange={(e) => setBgGradB(e.target.value)}
                 className={styles.colorPicker} />

              <input 
              type="range" 
              min="0"
              max="360"
              value={bgAngle} 
              onChange={(e) => setBgAngle(+e.target.value)}
               />

              <button className={styles.applySmall} 
              onClick={() => applyBackground()}>
                Apply
                </button>
                
            </div>
          )}
        </div>
      </div>
    </div>
  </nav>
)}
    </div>
  );
}
