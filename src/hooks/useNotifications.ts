import { useEffect, useState } from "react";
import { messaging, fcmGetToken, onMessage, db, auth } from "@/firebase/firebaseClient";
import { doc, updateDoc, arrayUnion, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import toast from "react-hot-toast";

export interface Notification {
  id: string;
  type: "ORDER" | "STOCK" | "SYSTEM" | "AI";
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  createdAt: any;
}

export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Request Permission and Get Token
  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.warn("[useNotifications] Missing VITE_FIREBASE_VAPID_KEY. Push notifications will not work.");
          return;
        }

        // Explicitly register service worker to prevent AbortError
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          const registration = await navigator.serviceWorker.ready; // Wait for it to be ready
          console.log("[useNotifications] Service Worker ready with scope:", registration.scope);
          
          const token = await fcmGetToken(messaging, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: registration,
          });
          
          if (token) {
            setFcmToken(token);
            saveTokenToUser(token);
            toast.success("Push notifications enabled!");
          }
        }
      }
    } catch (error: any) {
      console.error("[useNotifications] Error requesting permission:", error);
      if (error.name === 'AbortError') {
        toast.error("Notification registration failed. Please refresh and try again.");
      }
    }
  };

  // 2. Save Token to User Profile
  const saveTokenToUser = async (token: string) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          notificationsEnabled: true,
          updatedAt: new Date()
        });
        console.log("[useNotifications] FCM Token saved to user profile.");
      } catch (error) {
        console.warn("[useNotifications] Failed to save token (user doc might not exist yet):", error);
      }
    }
  };

  // 3. Listen for Background/Foreground Messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[useNotifications] Foreground message received:", payload);
      toast.success(`${payload.notification?.title}: ${payload.notification?.body}`, {
        icon: "🔔",
        duration: 5000,
      });
    });

    return () => unsubscribe();
  }, []);

  // 4. Live Firestore Notifications Listener
  useEffect(() => {
    // Only listen if user is authenticated to avoid permission-denied
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setNotifications([]);
        return;
      }

      const q = query(
        collection(db, "erp_notifications"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Notification[];
        
        setNotifications(docs);
        setUnreadCount(docs.filter(n => !n.read).length);
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn("[useNotifications] Firestore permission denied. Check your security rules.");
        }
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  return {
    notifications,
    unreadCount,
    fcmToken,
    requestPermission,
  };
};
