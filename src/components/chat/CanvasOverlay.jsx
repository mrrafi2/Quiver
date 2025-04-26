import ReactDOM from 'react-dom';
import CanvasDrawer from './CanvasDrawer';

export default function CanvasOverlay({ onSend, onClose }) {
  return ReactDOM.createPortal(
    <div>
      <CanvasDrawer onSend={onSend} />
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 10000,
          background: 'black',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ❌ 
      </button>
    </div>,
    document.body
  );
}
