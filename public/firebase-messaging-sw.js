importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCj9w9EnT4mYFZUekJ7RUYsV3I5Zy976UE",
  authDomain: "app.neverbe.lk",
  projectId: "neverbe-18307",
  storageBucket: "neverbe-18307.appspot.com",
  messagingSenderId: "953976115315",
  appId: "1:953976115315:web:dda163f06336ee6972da06",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.png",
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
