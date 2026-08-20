import React, { ReactNode, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setUser, setLoading } from "@/lib/authSlice/authSlice";
import { onAuthStateChanged } from "@firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { checkUserAction } from "@/actions/authActions";
import { User } from "@/model/User";

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Instant hydration from localStorage if available
    try {
      const cached = window.localStorage.getItem("nvrUser");
      if (cached) {
        const cachedUser: User = JSON.parse(cached);
        if (cachedUser && (cachedUser.userId || (cachedUser as any).uid)) {
          currentUidRef.current = cachedUser.userId || (cachedUser as any).uid;
          dispatch(setUser(cachedUser));
        }
      }
    } catch (err) {
      console.warn("Failed to parse cached nvrUser", err);
    }

    // 2. Safety timeout fallback (3 seconds) to prevent infinite spinner loop if Firebase iframe message channel fails
    const safetyTimer = setTimeout(() => {
      dispatch(setLoading(false));
    }, 3000);

    // 3. Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(safetyTimer);

      if (user) {
        if (currentUidRef.current === user.uid) {
          dispatch(setLoading(false));
          return;
        }

        try {
          const newVar: User = await checkUserAction(user.uid);
          if (newVar) {
            currentUidRef.current = user.uid;
            window.localStorage.setItem("nvrUser", JSON.stringify(newVar));
            dispatch(setUser(newVar));
          } else {
            currentUidRef.current = null;
            window.localStorage.removeItem("nvrUser");
            dispatch(setUser(null));
          }
        } catch (e) {
          console.error("Error fetching user session", e);
          // If network error happens but we had cached user, preserve cached user
          const cached = window.localStorage.getItem("nvrUser");
          if (!cached) {
            currentUidRef.current = null;
            dispatch(setUser(null));
          } else {
            dispatch(setLoading(false));
          }
        }
      } else {
        currentUidRef.current = null;
        window.localStorage.removeItem("nvrUser");
        dispatch(setUser(null));
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default GlobalProvider;
