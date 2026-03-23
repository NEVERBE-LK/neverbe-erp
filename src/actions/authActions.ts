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
    await signOut(auth);
    // Let Firebase handle logout, we don't strictly need the server for it
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
    const response = await api.post(`/api/v1/auth/login`, {
      uid: credential.user.uid,
    });
    return response.data;
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const checkUserAction = async (uid: string) => {
  try {
    const response = await api.post(`/api/v1/auth/login`, {
      uid: uid,
    });
    return response.data;
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const sendPasswordResetLinkAction = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};

export const signInWithGoogleAction = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const response = await api.post(`/api/v1/auth/login`, {
      uid: credential.user.uid,
    });
    return response.data;
  } catch (e: unknown) {
    throw new Error((e as Error).message);
  }
};
