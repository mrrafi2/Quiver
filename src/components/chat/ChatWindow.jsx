import React, { useEffect, useState, useRef } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { realtimeDB } from '../../services/Firebase';
import { useAuth } from '../../contexts/AuthContext';
import ChatSidebar from './Sidebar';
import Message from './Massage'; 
import ParticleThemes from './particleTheme';
import FloatingActionBar from './FloatingActionBar';
import styles from '../../styles/ChatWindow.module.css';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [theme, setTheme] = useState('sunny');
  const [currentMood, setCurrentMood] = useState(null);
  const [isWhisper, setIsWhisper] = useState(false);
  const [friendSeenTs, setFriendSeenTs] = useState(0);
  const [topBarOffset, setTopBarOffset] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);




  const typingRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  let lastScrollTop = 0;

  useEffect(() => {
    const h = new Date().getHours();
    setTheme(
      h >= 6 && h < 12 ? 'dawn' :
      h >= 12 && h < 18 ? 'sunny' :
      h >= 18 && h < 21 ? 'dusk' :
      'starry'
    );
  }, []);

  useEffect(() => {
    if (!WEATHER_API_KEY) return;
    (async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Chittagong&appid=${WEATHER_API_KEY}`
        );
        const data = await res.json();
        if (data.weather[0].main.toLowerCase().includes('rain')) {
          setTheme('rainy');
        }
      } catch (err) {
        console.error('Weather API error:', err);
      }
    })();
  }, []);

  const conversationId = selectedFriend
    ? [currentUser.uid, selectedFriend.uid].sort().join('_')
    : null;

  useEffect(() => {
    if (!conversationId) return;
    const msgsRef = ref(realtimeDB, `conversations/${conversationId}/messages`);
    return onValue(msgsRef, snap => {
      const val = snap.val() || {};
      setMessages(Object.entries(val).map(([id, msg]) => ({ id, ...msg })));
    });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !selectedFriend) return;
    const tRef = ref(realtimeDB, `conversations/${conversationId}/typing/${selectedFriend.uid}`);
    return onValue(tRef, snap => setTyping(!!snap.val()));
  }, [conversationId, selectedFriend]);

  useEffect(() => {
    if (!conversationId || !selectedFriend) return;
    const seenRef = ref(realtimeDB, `conversations/${conversationId}/seen/${selectedFriend.uid}`);
    return onValue(seenRef, snap => {
      setFriendSeenTs(snap.val() || 0);
    });
  }, [conversationId, selectedFriend]);

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const lastTs = messages[messages.length - 1].timestamp;
    set(ref(realtimeDB, `conversations/${conversationId}/seen/${currentUser.uid}`), lastTs);
  }, [conversationId, messages, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedFriend]);

  const handleScroll = e => {
    const y = e.target.scrollTop;
    window.dispatchEvent(new CustomEvent('messagesAreaScroll', {
      detail: { scrollTop: y }
    }));
    if (y >= 20 && topBarOffset === 0) {
      setTopBarOffset(50);
    } else if (y < 20 && topBarOffset !== 0) {
      setTopBarOffset(0);
    }
    lastScrollTop = y;
  };

  const handleSendMessage = async newMessage => {
    if (!conversationId) return;
    const msgsRef = ref(realtimeDB, `conversations/${conversationId}/messages`);
    await push(msgsRef, {
      ...newMessage,
      user: currentUser.uid,
      timestamp: Date.now(),
      mood: currentMood,
      whisper: isWhisper
    });
    handleTyping(false);
    setIsWhisper(false);
  };

  const handleDelete = async (msgId, msgUser) => {
    if (msgUser !== currentUser.uid) return;
    await remove(ref(realtimeDB, `conversations/${conversationId}/messages/${msgId}`));
  };

  const handleReact = async (msgId, emo) => {
    await set(ref(realtimeDB, `conversations/${conversationId}/messages/${msgId}/reaction`), emo);
  };

  const handleTyping = isTyping => {
    if (!conversationId) return;
    const tRef = ref(realtimeDB, `conversations/${conversationId}/typing/${currentUser.uid}`);
    set(tRef, isTyping);
    if (typingRef.current) clearTimeout(typingRef.current);
    if (isTyping) {
      typingRef.current = setTimeout(() => set(tRef, false), 2000);
    }
  };

  const moodOptions = [
    { label: 'happy', emoji: '😀' },
    { label: 'stressed', emoji: '😟' },
    { label: 'focused', emoji: '🎯' },
    { label: 'angry', emoji: '😠' }
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  return (
    <div className={`${styles.chatContainer} ${styles[theme]}`}>
      <ParticleThemes theme={theme} />
  
      {isMobile ? (
        // —— MOBILE LAYOUT ——
        <div className={styles.chatMain}>
          {isSidebarOpen ? (
            // Friends list
            <ChatSidebar
              onSelectFriend={friend => {
                setSelectedFriend(friend);
                setIsSidebarOpen(false);
              }}
              selectedFriend={selectedFriend}
            />
          ) : selectedFriend ? (
            // Chat view
            <>
              <div
                className={`${styles.topBar} ${showControls ? styles.showControls : ''}`}
                style={{ position: 'sticky', top: `${topBarOffset}px`, zIndex: 2 }}
              >
                {/* Back button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={styles.backButton}
                  aria-label="Back to friends list"
                >
                  <i className="fa-solid fa-left-long"></i>
                </button>
  
                {/* Friend’s name */}
                <span className={styles.topName}>
                  {selectedFriend.displayName}
                </span>
  
                {/* Typing indicator */}
                {typing && (
                  <div className={styles.typingIndicator}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className={styles.dot}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                )}
  
                {/* Hamburger for controls */}
                <button
                  className={styles.hamburger}
                  onClick={() => setShowControls(v => !v)}
                  aria-label="Toggle controls"
                >
                  <Menu />
                </button>
  
                <div className={styles.controlPanel}>
                  {/* Mood Selector */}
                  <div className={styles.moodSelector}>
                    <label style={{ color: "#eee" }}>Mood:</label>
                    <select
                      value={currentMood?.label || ""}
                      onChange={e => {
                        const sel = moodOptions.find(m => m.label === e.target.value);
                        setCurrentMood(sel || null);
                      }}
                    >
                      <option value="">None</option>
                      {moodOptions.map(m => (
                        <option key={m.label} value={m.label}>
                          {m.emoji} {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
  
                  {/* Whisper Toggle */}
                  <button
                    type="button"
                    className={`${styles.whisperToggle} ${isWhisper ? styles.active : ""}`}
                    onClick={() => setIsWhisper(w => !w)}
                    aria-pressed={isWhisper}
                    title="Whisper"
                  >
                    {isWhisper ? "🤫" : "🗣️"}
                  </button>
  
                  {/* Theme Selector */}
                  <div className={styles.themeSelector}>
                    <label style={{ color: "#eee" }}>Theme:</label>
                    <select value={theme} onChange={e => setTheme(e.target.value)}>
                      <option value="dawn">Dawn</option>
                      <option value="sunny">Sunny</option>
                      <option value="dusk">Dusk</option>
                      <option value="starry">Starry</option>
                      <option value="rainy">Rainy</option>
                      <option value="forest">Forest</option>
                      <option value="ocean">Ocean</option>
                    </select>
                  </div>
                </div>
              </div>
  
              {/* Messages */}
              <div
                id="messagesArea"
                ref={messagesAreaRef}
                className={styles.messagesArea}
                onScroll={handleScroll}
              >
                {messages.map(msg => (
                  <Message
                    key={msg.id}
                    {...msg}
                    isOwn={msg.user === currentUser.uid}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    reaction={msg.reaction}
                    friendPhotoURL={
                      selectedFriend.avatarIcon ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedFriend.displayName
                      )}&background=ddd&color=555`
                    }
                    seen={msg.timestamp <= friendSeenTs}
                    theme={theme}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
  
              {/* Send bar */}
              <FloatingActionBar onSend={handleSendMessage} onType={handleTyping} />
            </>
          ) : (
            // No friend selected on mobile
            <div className={styles.noSelection}>
              Please select a friend to start chatting.
            </div>
          )}
        </div>
      ) : (
        <>
          <ChatSidebar
            onSelectFriend={setSelectedFriend}
            selectedFriend={selectedFriend}
          />
  
          <div className={styles.chatMain}>
            {selectedFriend ? (
              <>
                <div
                  className={`${styles.topBar} ${showControls ? styles.showControls : ''}`}
                  style={{ position: 'sticky', top: `${topBarOffset}px`, zIndex: 2 }}
                >
                  <span className={styles.topName}>
                    {selectedFriend.displayName}
                  </span>
                  {typing && (
                    <div className={styles.typingIndicator}>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className={styles.dot}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  )}
                  <button
                    className={styles.hamburger}
                    onClick={() => setShowControls(v => !v)}
                    aria-label="Toggle controls"
                  >
                    <Menu />
                  </button>
  
                  <div className={styles.controlPanel}>
                    {/* Mood Selector */}
                    <div className={styles.moodSelector}>
                      <label style={{ color: "#eee" }}>Mood:</label>
                      <select
                        value={currentMood?.label || ""}
                        onChange={e => {
                          const sel = moodOptions.find(m => m.label === e.target.value);
                          setCurrentMood(sel || null);
                        }}
                      >
                        <option value="">None</option>
                        {moodOptions.map(m => (
                          <option key={m.label} value={m.label}>
                            {m.emoji} {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    {/* Whisper Toggle */}
                    <button
                      type="button"
                      className={`${styles.whisperToggle} ${isWhisper ? styles.active : ""}`}
                      onClick={() => setIsWhisper(w => !w)}
                      aria-pressed={isWhisper}
                      title="Whisper"
                    >
                      {isWhisper ? "🤫" : "🗣️"}
                    </button>
  
                    {/* Theme Selector */}
                    <div className={styles.themeSelector}>
                      <label style={{ color: "#eee" }}>Theme:</label>
                      <select value={theme} onChange={e => setTheme(e.target.value)}>
                        <option value="dawn">Dawn</option>
                        <option value="sunny">Sunny</option>
                        <option value="dusk">Dusk</option>
                        <option value="starry">Starry</option>
                        <option value="rainy">Rainy</option>
                        <option value="forest">Forest</option>
                        <option value="ocean">Ocean</option>
                      </select>
                    </div>
                  </div>
                </div>
  
                {/* Messages */}
                <div
                  id="messagesArea"
                  ref={messagesAreaRef}
                  className={styles.messagesArea}
                  onScroll={handleScroll}
                >
                  {messages.map(msg => (
                    <Message
                      key={msg.id}
                      {...msg}
                      isOwn={msg.user === currentUser.uid}
                      onDelete={handleDelete}
                      onReact={handleReact}
                      reaction={msg.reaction}
                      friendPhotoURL={
                        selectedFriend.avatarIcon ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          selectedFriend.displayName
                        )}&background=ddd&color=555`
                      }
                      seen={msg.timestamp <= friendSeenTs}
                      theme={theme}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
  
                {/* Send bar */}
                <FloatingActionBar onSend={handleSendMessage} onType={handleTyping} />
              </>
            ) : (
              <div className={styles.noSelection}>
                Please select a friend to start chatting.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
    }
