 
// Service worker for e-Mam System V7.7 Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: 'edusync-manager',
  appId: '1:776387068593:web:8f024782ae15b5adf09890',
  apiKey: 'AIzaSyC37zLo3YDZx498AIx-IUo9Xsk-L8TFNlM',
  authDomain: 'edusync-manager.firebaseapp.com',
  storageBucket: 'edusync-manager.firebasestorage.app',
  messagingSenderId: '776387068593',
  measurementId: 'G-KD6LYEHXNX',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Fungsi untuk memicu notifikasi cerdas
const showSmartNotification = (payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || 'Notifikasi e-Mam';

  const options = {
    body: notification.body || data.message,
    icon: '/icons/logo-192x192.png', // Ikon utama aplikasi (e-Mam v7.7)
    badge: '/icons/lencana-monokrom.png', // Ikon kecil di status bar (Penting!)
    color: '#151E32', // Warna latar belakang notifikasi (Navy Slate e-Mam)
    vibrate: [200, 100, 200], // Pola getar agar terasa seperti aplikasi native
    tag: data.idUnik || 'emam-notification', // Mencegah notifikasi menumpuk
    renotify: true, // Bergetar lagi jika ada pesan baru
    data: {
      url: data.link || '/', // URL tujuan saat diklik
    },
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi',
        icon: '/icons/aksi-buka.png',
      },
      {
        action: 'close',
        title: 'Abaikan',
        icon: '/icons/aksi-tutup.png',
      },
    ],
  };

  self.registration.showNotification(title, options);
};

// Menangani notifikasi saat aplikasi di latar belakang (Metode Compat)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  showSmartNotification(payload);
});

// Menangani event klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Tutup balon notifikasi

  // Logika untuk membuka halaman spesifik
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow(event.notification.data.url || '/');
    }),
  );
});

// Service worker untuk menangani notifikasi saat aplikasi di latar belakang
// Pastikan file ini bisa diakses di https://your-domain.com/firebase-messaging-sw.js
