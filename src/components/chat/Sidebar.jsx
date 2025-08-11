//your friendly neighborhood chat navigator

import React, { useEffect, useState } from 'react';
import {
  ref,
  onValue,
  get,
  query,
  orderByChild,
  limitToLast
} from 'firebase/database';
import { realtimeDB } from '../../services/Firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import styles from '../../styles/sidebar.module.css';
import Navbar from '../layout/Navbar';


export default function ChatSidebar({ onSelectFriend, selectedFriend }) {

  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);  // enriched friend objects
  const [friendIds, setFriendIds] = useState([]);    //just the UIDs  
  const [loading, setLoading] = useState(true);

    // mapping mood emojis to border colors
  const moodColorMap = {
    '😀': '#f1c40f',
    '😟': '#3498db',
    '🎯': '#2ecc71',
    '😠' : '#e74c3c',
  };

// fetch friend ids & basic infos

  useEffect(( ) => {
    if (!currentUser) return;

    setLoading(true)

    const friendsRef = ref(realtimeDB, `friends/${currentUser.uid}`)

    const unsub = onValue ( friendsRef, async snapshot => {

      const data = snapshot.val() || {}
      const ids = Object.keys(data);
      setFriendIds(ids);                              

    // Todo: batch these in one go if performance becomes an issue
      const list = await Promise.all(

        ids.map(async uid => {

          const userSnap = await get(ref(realtimeDB, `users/${uid}`) )

          if (!userSnap.exists()) return null

          return {
            uid,
            ...userSnap.val(),
            lastMsg: null,
            lastTs: 0,
            unread: false
          }
        })
      );

      setFriends(list.filter(Boolean));
      setLoading(false);
    });

    return () => unsub();  // cleanup listener to prevent zombie listeners
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || friendIds.length === 0) return;
  
    // for each friend ID, set up listeners
    const unsubs = friendIds.map (uid => {
      const convId = [currentUser.uid, uid].sort().join('_');
  
      //  last‐message listener
      const msgQ = query(
        ref(realtimeDB, `conversations/${convId}/messages`),
        orderByChild('timestamp'),
        limitToLast(1)
      );

      const unsubMsg = onValue(msgQ, snap => {
        const msgs = snap.val();
        if (msgs) {
          const msg = Object.values(msgs)[0];

          setFriends(prev =>
            prev.map(f =>
              f.uid === uid
                ? { ...f, lastMsg: msg, lastTs: msg.timestamp }
                : f
            )
          )
        }
      })
  
      //  mark unread if lastTs > seenTs
      const seenRef = ref(
        realtimeDB,
        `conversations/${convId}/seen/${currentUser.uid}`
      );
      const unsubSeen = onValue(seenRef, snap => {
        const seenTs = snap.val() || 0;
        setFriends(prev =>
          prev.map(f =>
            f.uid === uid
              ? { ...f, unread: f.lastTs > seenTs }
              : f
          )
        );
      });
  
      
      const moodEmojiRef = ref(
        realtimeDB,
        `conversations/${convId}/mood/${uid}/emoji`
      );
      const unsubMood = onValue(moodEmojiRef, snap => {
        const emoji = snap.val() || null;
        setFriends(prev =>
          prev.map(f =>
            f.uid === uid
              ? { ...f, moodEmoji: emoji }
              : f
          )
        );
      });
  
      // return teardown for this friend
      return () => {
        unsubMsg();
        unsubSeen();
        unsubMood();
      };
    }
  );
  
    // cleanup all friend listeners on unmount or deps change
 return () => unsubs.forEach(fn => fn());
  }, [currentUser, friendIds]);


    // sort friends by latest timestamp
  const sorted = React.useMemo (
    () => [...friends].sort((a, b) => b.lastTs - a.lastTs),

    [friends]
  );

  const summary = msg => {

    if (!msg) return 'No messages yet'

      // create a one-liner summary for the last message
    switch (msg.type) {
      case 'text':   return 'Sent a text';
      case 'image':  return 'Sent an image';
      case 'voice':  return 'Sent a voice msg';
      case 'canvas': return 'Sent a sketch';
      default: return 'Sent something';
    }
  };


  return (
    <>
    
    <Navbar/>
   
    <motion.div
      className={styles.sidebar}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h3 className={styles.logo}>Chats</h3>

      <div className={styles.chatList}>
        {loading ? (
          <ParticleLoader />  // cool swirling/floating bubbles while loading

        ) : sorted.length === 0 ? (
          <div className={styles.noFriends}>
            You have no friends yet. Press the Add button at Nav to make some
          </div>

        ) : (
          sorted.map(friend => (

            <motion.div
              key={friend.uid}
              className={`${styles.chatItem} ${
                selectedFriend?.uid === friend.uid ? styles.active : ''
              }`}
              onClick={() => onSelectFriend(friend)}
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >

              <div className={styles.avatarWrapper}>
                <div
                  className={styles.chatAvatar}
                  style={{
                    border: `2px solid ${
                      moodColorMap[friend.moodEmoji] || '#66fcf1'
                    }`}}             
                     >
                        
                  <img
                    src={
                      friend.avatarIcon ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}&background=34495e&color=f1fffe`
                    }
                    alt={friend.displayName}
                  />
                </div>

                {friend.moodEmoji && (
                  <span className={styles.moodBadge}>
                    {friend.moodEmoji}
                    </span>

                )}

                {friend.unread && <span className={styles.unreadBadge} />}
              </div>

              <div className={styles.chatDetails}>

                <p className={styles.chatName}>
                  {friend.displayName}
                  </p>

                <span className={styles.chatStatus}>
                  {summary(friend.lastMsg)}
                </span>

              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
    </>
  );
}

function ParticleLoader() {
  const count = 40;
  return (
    <div className={styles.particleContainer}>

      {Array.from({ length: count }).map((_, i) => {
        const sx = Math.random() * 100 + '%'
        const sy = Math.random() * 100 + '%'

        return (
          <span
            key={i}
            className={styles.particle}
            style={{
              '--start-x': sx,
              '--start-y': sy,
              '--delay': `${(i / count) * 1.2}s`
            }}
          />
        );
      }
      )}
    </div>
  );
}
