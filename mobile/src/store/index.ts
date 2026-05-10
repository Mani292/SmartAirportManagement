import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserRole } from "../types";

interface AuthState {
    isLoggedIn: boolean;
    role: UserRole;
    username: string;
    userId: string;
    displayName: string;
    accessToken: string;
    refreshToken: string;
}

const authSlice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
        role: "manager" as UserRole,
        username: "",
        userId: "",
        displayName: "",
        accessToken: "",
        refreshToken: "",
    } as AuthState,
    reducers: {
        login: (
            state,
            action: PayloadAction<{
                role: UserRole;
                username: string;
                userId: string;
                displayName?: string;
                accessToken?: string;
                refreshToken?: string;
            }>
        ) => {
            state.isLoggedIn = true;
            state.role = action.payload.role;
            state.username = action.payload.username;
            state.userId = action.payload.userId;
            state.displayName = action.payload.displayName || action.payload.username;
            state.accessToken = action.payload.accessToken || "";
            state.refreshToken = action.payload.refreshToken || "";
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.role = "manager";
            state.username = "";
            state.userId = "";
            state.displayName = "";
            state.accessToken = "";
            state.refreshToken = "";
        },
        setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
            state.accessToken = action.payload.accessToken;
            if (action.payload.refreshToken) {
                state.refreshToken = action.payload.refreshToken;
            }
        },
    },
});

export const { login, logout, setTokens } = authSlice.actions;

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;