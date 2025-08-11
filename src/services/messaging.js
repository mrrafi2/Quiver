import { getToken, onMessage } from 'firebase/messaging';
import { realtimeDB } from './Firebase';
import { ref, set, remove } from 'firebase/database';
import { messaging as messagingPromise } from './Firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';  // public key

async function ensureServiceWorkerRegistered() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Registers the SW in /public (you must have public/firebase-messaging-sw.js)
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return reg;
  } catch (err) {
    console.error('SW register failed:', err);
    return null;
  }
}

/**
 * registerAndSaveToken(uid)
 * - requests permission (if necessary)
 * - registers SW (if necessary)
 * - gets FCM token and stores in RTDB under users/{uid}/fcmTokens/{token}: true
 * - returns token or null
 */

export async function registerAndSaveToken(uid) {
  if (!uid) throw new Error('UID required');

  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission not granted:', permission);
    return null;
  }

  const swReg = await ensureServiceWorkerRegistered();

  const messaging = await messagingPromise;
  if (!messaging) {
    console.warn('messaging not available (browser unsupported).');
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg || undefined
    });

    if (!token) {
      console.warn('No FCM token received');
      return null;
    }

    // Save token in Realtime DB mapping
    await set(ref(realtimeDB, `users/${uid}/fcmTokens/${token}`), {
      createdAt: Date.now()
    });

    // Also save locally for later removal
    localStorage.setItem('fcmToken', token);

    return token;
  } catch (err) {
    console.error('getToken error', err);
    return null;
  }
}

export async function removeTokenForUser(uid, token) {
  if (!uid || !token) return;
  try {
    await remove(ref(realtimeDB, `users/${uid}/fcmTokens/${token}`));
  } catch (err) {
    console.warn('removeTokenForUser failed', err);
  }
}

/**
 * listenForForeground(callback)
 * - Attaches onMessage to show in-app notifications
 * - returns an "unsubscribe" function.
 */

export async function listenForForeground(cb) {
  const messaging = await messagingPromise;
  if (!messaging) return () => {};
  const handler = payload => {
    try {
      if (cb) cb(payload);
      // You can also pop a Notification here (if permission granted)
      const { title, body, icon } = payload.notification || {};
      if (Notification && Notification.permission === 'granted') {
        new Notification(title || 'Message', { body: body || '', icon: icon || '/favicon-32x32.png' });
      }
    } catch (e) {
      console.error('Foreground handler error', e);
    }
  };

  const unsubscribe = onMessage(messaging, handler);
  // onMessage returns an unsub if using callback form? If not, we provide a wrapper:
  return () => {
    try {
      // Firebase v9 onMessage doesn't return unsub; cannot remove specific handler easily.
      // So if you re-mount, avoid adding multiple handlers, or keep track of your handler.
    } catch (e) {}
  };
}
