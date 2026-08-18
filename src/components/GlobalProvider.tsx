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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Skip re-fetching if the same user is already loaded
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
          console.error("Error fetching user", e);
          currentUidRef.current = null;
          window.localStorage.removeItem("nvrUser");
          dispatch(setUser(null));
        }
      } else {
        currentUidRef.current = null;
        window.localStorage.removeItem("nvrUser");
        dispatch(setUser(null));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};

export default GlobalProvider;
