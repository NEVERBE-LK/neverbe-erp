import { useEffect, useState, useCallback } from "react";
import { messaging, fcmGetToken, onMessage, db, auth } from "@/firebase/firebaseClient";
import { doc, updateDoc, arrayUnion, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import toast from "react-hot-toast";
import api from "@/lib/api";

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

  const paymentStatus = (meta.paymentStatus || "").toLowerCase();
  const paymentMethod = (meta.paymentMethod || "").toLowerCase();
  const paymentMethodId = (meta.paymentMethodId || "").toUpperCase();

  // 1. Suppress explicitly failed payments
  if (paymentStatus === "failed" || title.includes("failed") || body.includes("failed")) {
    return false;
  }

  // 2. Identify COD orders
  const isCod =
    paymentMethod === "cod" ||
    paymentMethodId === "PM-001" ||
    title.includes("cod") ||
    body.includes("cash on delivery");

  // 3. Identify Paid orders
  const isPaid =
    paymentStatus === "paid" ||
    paymentStatus === "completed" ||
    title.includes("paid") ||
    body.includes("paid");

  // 4. PayHere / Online Gateway order that is UNPAID / Pending: Suppress from confirmed alerts
  const isOnlinePayment =
    paymentMethod.includes("payhere") ||
    paymentMethod.includes("card") ||
    paymentMethod.includes("online") ||
    paymentMethod.includes("koko") ||
    paymentMethodId === "PM-002" ||
    paymentMethodId === "PM-003" ||
    paymentMethodId === "PM-006";

  if (isOnlinePayment && !isPaid) {
    return false;
  }

  // 5. If paymentStatus is explicitly Pending and not COD: Suppress
  if (paymentStatus === "pending" && !isCod) {
    return false;
  }

  // 6. Confirmed targets: Paid online orders, COD orders
  if (isPaid || isCod) {
    return true;
  }

  // 7. Orders matching orderId or general order creation (for legacy docs without payment metadata)
  if (meta.orderId || title.includes("order") || body.includes("placed by")) {
    return true;
  }

  return false;
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

  const fetchFromApi = useCallback(async () => {
    try {
      const res = await api.get("/api/v1/erp/notifications");
      const list = Array.isArray(res.data) ? res.data : [];
      const valid = list.filter(isOrderAlertTarget);
      setNotifications(valid);
      setUnreadCount(valid.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error("[useNotifications] Failed to fetch notifications via API:", err);
    }
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

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Notification[];

          const validAlerts = docs.filter(isOrderAlertTarget);
          setNotifications(validAlerts);
          setUnreadCount(validAlerts.filter((n) => !n.read).length);
        },
        (error) => {
          console.warn("[useNotifications] Firestore onSnapshot issue, falling back to API:", error.message || error);
          fetchFromApi();
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [fetchFromApi]);

  return {
    notifications,
    unreadCount,
    fcmToken,
    requestPermission,
    refreshNotifications: fetchFromApi,
  };
};
