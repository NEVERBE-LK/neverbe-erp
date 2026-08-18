import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/model/User";

interface AuthState {
  currentUser: User | null;
  loading: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  loading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.currentUser = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.currentUser = null;
      state.loading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = userSlice.actions;
export default userSlice.reducer;
