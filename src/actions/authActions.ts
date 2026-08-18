import { auth } from "@/firebase/firebaseClient";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import api from "@/lib/api";

export const logoutUserAction = async () => {
  try {
    window.localStorage.removeItem("nvrUser");
    await signOut(auth);
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const authenticateUserAction = async (
  email: string,
  password: string,
) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const formData = new FormData();
    formData.append("data", JSON.stringify({ uid: credential.user.uid }));
    const response = await api.post(`/api/v1/auth/login`, formData);
    return response.data;
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const checkUserAction = async (uid: string) => {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify({ uid: uid }));
    const response = await api.post(`/api/v1/auth/login`, formData);
    return response.data;
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const sendPasswordResetLinkAction = async (email: string) => {
  try {
    const actionCodeSettings = {
      // Directs the user back to the ERP login after they complete the reset
      url: `${window.location.origin}/auth/login`,
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const signInWithGoogleAction = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const formData = new FormData();
    formData.append("data", JSON.stringify({ uid: credential.user.uid }));
    const response = await api.post(`/api/v1/auth/login`, formData);
    return response.data;
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};
