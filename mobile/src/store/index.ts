import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserRole } from "../types";

interface AuthState {
    isLoggedIn: boolean;
    role: UserRole;
    username: string;
    userId: string;
}

const authSlice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
        role: "manager" as UserRole,
        username: "",
        userId: "",
    } as AuthState,
    reducers: {
        login: (state, action: PayloadAction<{ role: UserRole; username: string; userId: string }>) => {
            state.isLoggedIn = true;
            state.role = action.payload.role;
            state.username = action.payload.username;
            state.userId = action.payload.userId;
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.role = "manager";
            state.username = "";
            state.userId = "";
        },
    },
});

export const { login, logout } = authSlice.actions;

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;