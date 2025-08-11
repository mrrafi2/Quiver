// service worker for notification

importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCUrDtxW3SU5vQ_eo_zL_YKKYMYTYUaPR4",
  authDomain: "quiver-message.firebaseapp.com",
  projectId: "quiver-message",
  messagingSenderId: "840110975717",
  appId: "1:840110975717:web:badaef71530e50e65b420c",
};

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
   console.warn('SW firebase init', e);
}

const messaging = firebase.messaging && firebase.messaging();

messaging?.onBackgroundMessage(function(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'New message';
  const options = {
    body: notification.body || data.body || '',
    icon: notification.icon || '/favicon-32x32.png',
    badge: notification.badge || '/favicon-32x32.png',
    data: {
      url: data.url || '/',
      ...data
    }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === url && 'focus' in client) return client.focus();
      }

      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
