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
  const [isRegistering, setIsRegistering] = useState(false);

  // 1. Robust Service Worker Registration and Token Retrieval
  const registerAndGetToken = async (vapidKey: string, isRetry = false): Promise<string | null> => {
    if (!('serviceWorker' in navigator) || isRegistering) return null;
    
    setIsRegistering(true);
    try {
      // Nuclear Cleanup: Unsubscribe from push AND unregister worker
      const existingRegs = await navigator.serviceWorker.getRegistrations();
      for (const reg of existingRegs) {
        try {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
            console.log("[useNotifications] Cleared stale push subscription");
          }
        } catch (e) {
          // Ignore unsub errors
        }
        await reg.unregister();
      }

      // Wait for the browser to release the push channel slot
      await new Promise(resolve => setTimeout(resolve, isRetry ? 1500 : 800));

      // Fresh registration
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        updateViaCache: 'none'
      });

      // Wait specifically for this registration to be ACTIVE
      await new Promise<void>((resolve, reject) => {
        if (registration.active) return resolve();
        
        const timeout = setTimeout(() => reject(new Error("SW activation timeout")), 10000);
        const worker = registration.installing || registration.waiting;
        
        if (!worker) {
          clearTimeout(timeout);
          return resolve();
        }

        worker.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            clearTimeout(timeout);
            resolve();
          }
        });
      });

      try {
        const token = await fcmGetToken(messaging, {
          vapidKey: vapidKey.trim(),
          serviceWorkerRegistration: registration,
        });
        return token;
      } catch (error: any) {
        if (error.name === 'AbortError' && !isRetry) {
          console.warn("[useNotifications] Retrying push registration...");
          setIsRegistering(false); // Reset to allow retry
          return registerAndGetToken(vapidKey, true);
        }
        throw error;
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;

        const token = await registerAndGetToken(vapidKey);
        
        if (token) {
          setFcmToken(token);
          saveTokenToUser(token);
          // SILENT: No success toast as requested
        }
      }
    } catch (error: any) {
      console.error("[useNotifications] Registration failed:", error.name);
      if (error.name === 'AbortError') {
        toast.error("Push registration connection failed. Please refresh.");
      }
    }
  };

  // 2. Save Token to User Profile
  const saveTokenToUser = async (token: string) => {
    const user = auth.currentUser;
    if (user && token) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          notificationsEnabled: true,
          updatedAt: new Date()
        });
      } catch (error) {
        // Fail silently for user doc existence
      }
    }
  };

  // 3. Listen for Background/Foreground Messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[useNotifications] Message received");
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
