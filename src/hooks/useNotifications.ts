import { useEffect, useState } from "react";
import { messaging, fcmGetToken, onMessage, db, auth } from "@/firebase/firebaseClient";
import { doc, updateDoc, arrayUnion, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import toast from "react-hot-toast";

export interface Notification {
  id: string;
  type: "ORDER" | "STOCK" | "SYSTEM";
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  createdAt: any;
}

export const isOrderAlertTarget = (n: Partial<Notification>) => {
  if (n.type !== "ORDER") return true;
  const meta = n.metadata || {};
  const title = (n.title || "").toLowerCase();
  const body = (n.message || "").toLowerCase();

  // 1. Paid Online Orders
  const isPaid =
    meta.paymentStatus === "Paid" ||
    meta.paymentStatus === "Completed" ||
    title.includes("paid") ||
    body.includes("paid");

  // 2. COD Payment Pending Orders
  const isCod =
    meta.paymentMethod === "COD" ||
    meta.paymentMethodId === "PM-001" ||
    title.includes("cod") ||
    body.includes("cash on delivery");

  const isPending =
    meta.paymentStatus === "Pending" ||
    meta.status === "Pending Approval" ||
    title.includes("pending") ||
    body.includes("pending");

  const isCodPending = isCod && isPending;

  return isPaid || isCodPending;
};

export const useNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // ... (rest of code)
  const registerAndGetToken = async (vapidKey: string, isRetry = false): Promise<string | null> => {
    if (!('serviceWorker' in navigator) || isRegistering) return null;
    
    setIsRegistering(true);
    try {
      if (isRetry) {
        const existingRegs = await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegs) {
          try {
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              await sub.unsubscribe();
              console.log("[useNotifications] Cleared stale push subscription");
            }
          } catch (e) {}
          await reg.unregister();
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        updateViaCache: 'none'
      });

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
          setIsRegistering(false);
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
      if (Notification.permission === "denied") return;
      let permission: NotificationPermission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission === "granted") {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;
        const token = await registerAndGetToken(vapidKey);
        if (token) {
          setFcmToken(token);
          saveTokenToUser(token);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error("Push registration connection failed. Please refresh.");
      }
    }
  };

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
      } catch (error) {}
    }
  };

  // 3. Listen for Background/Foreground Messages (Targeted Alert Filter)
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "";
      const body = payload.notification?.body || "";
      const meta = payload.data || {};

      const isTarget = isOrderAlertTarget({ title, message: body, metadata: meta, type: "ORDER" });
      if (isTarget) {
        toast.success(`${title}: ${body}`, {
          icon: "🔔",
          duration: 6000,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Live Firestore Notifications Listener
  useEffect(() => {
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

        const validAlerts = docs.filter(isOrderAlertTarget);
        setNotifications(validAlerts);
        setUnreadCount(validAlerts.filter(n => !n.read).length);
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn("[useNotifications] Firestore permission denied.");
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
