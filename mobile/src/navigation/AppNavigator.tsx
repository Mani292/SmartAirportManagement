import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Text } from "react-native";
import { Colors } from "../theme";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";

// Passenger
import ReportIssueScreen from "../screens/passenger/ReportIssueScreen";
import TrackIssueScreen from "../screens/passenger/TrackIssueScreen";
import ChatBotScreen from "../screens/passenger/ChatBotScreen";
import QRScanScreen from "../screens/passenger/QRScanScreen";

// Technician
import MyTasksScreen from "../screens/technician/MyTasksScreen";
import TaskDetailScreen from "../screens/technician/TaskDetailScreen";

// Manager
import DashboardScreen from "../screens/manager/DashboardScreen";
import IncidentListScreen from "../screens/manager/IncidentListScreen";
import AssetManagementScreen from "../screens/manager/AssetManagementScreen";
import PreventiveScreen from "../screens/manager/PreventiveScreen";

// Admin
import QRGeneratorScreen from "../screens/admin/QRGeneratorScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabScreenOptions = {
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.textMuted,
    headerShown: false,
    tabBarStyle: {
        backgroundColor: Colors.bgCard,
        borderTopColor: Colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: "600" as any,
        marginTop: 4,
    },
};

function PassengerTabs() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen
                name="Report" component={ReportIssueScreen}
                options={{ tabBarLabel: "Report", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◈</Text> }}
            />
            <Tab.Screen
                name="Track" component={TrackIssueScreen}
                options={{ tabBarLabel: "Track", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◎</Text> }}
            />
            <Tab.Screen
                name="ChatBot" component={ChatBotScreen}
                options={{ tabBarLabel: "AeroBot", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚡</Text> }}
            />
            <Tab.Screen
                name="QRScan" component={QRScanScreen}
                options={{ tabBarLabel: "Scan", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>▣</Text> }}
            />
        </Tab.Navigator>
    );
}

function TechnicianStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MyTasks" component={MyTasksScreen} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        </Stack.Navigator>
    );
}

function ManagerTabs() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen
                name="Dashboard" component={DashboardScreen}
                options={{ tabBarLabel: "Dashboard", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◉</Text> }}
            />
            <Tab.Screen
                name="Incidents" component={IncidentListScreen}
                options={{ tabBarLabel: "Incidents", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }}
            />
            <Tab.Screen
                name="Assets" component={AssetManagementScreen}
                options={{ tabBarLabel: "Assets", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏗</Text> }}
            />
            <Tab.Screen
                name="Preventive" component={PreventiveScreen}
                options={{ tabBarLabel: "Preventive", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗓</Text> }}
            />
        </Tab.Navigator>
    );
}

function AdminTabs() {
    return (
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen
                name="QRGenerator" component={QRGeneratorScreen}
                options={{ tabBarLabel: "QR Gen", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>▣</Text> }}
            />
            <Tab.Screen
                name="Dashboard2" component={DashboardScreen}
                options={{ tabBarLabel: "Dashboard", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◉</Text> }}
            />
        </Tab.Navigator>
    );
}

function RoleNavigator() {
    const role = useSelector((state: RootState) => state.auth.role);
    if (role === "passenger") return <PassengerTabs />;
    if (role === "technician") return <TechnicianStack />;
    if (role === "manager") return <ManagerTabs />;
    if (role === "admin") return <AdminTabs />;
    return <PassengerTabs />;
}

export default function AppNavigator() {
    const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.bg } }}>
                {!isLoggedIn ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <Stack.Screen name="Main" component={RoleNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}