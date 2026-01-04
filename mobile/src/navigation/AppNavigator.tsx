// d:\AHMAD MUZAYYIN\ChikoAttendance\mobile\src\navigation\AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, colors } from '../theme/theme';
import { useAuth } from '../hooks/useAuth';

import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AttendanceInputScreen from '../screens/AttendanceInputScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import RecapScreen from '../screens/RecapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddBranchScreen from '../screens/AddBranchScreen';
import PointsScreen from '../screens/PointsScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import EmployeeDetailScreen from '../screens/EmployeeDetailScreen';
import BranchListScreen from '../screens/BranchListScreen';
import UserListScreen from '../screens/UserListScreen';
import UserFormScreen from '../screens/UserFormScreen';
import RecapDetailScreen from '../screens/RecapDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import OwnerRecapBranchScreen from '../screens/OwnerRecapBranchScreen';
import OwnerRecapEmployeesScreen from '../screens/OwnerRecapEmployeesScreen';
import OwnerRecapDetailScreen from '../screens/OwnerRecapDetailScreen';

export type RootStackParamList = {
    Loading: undefined;
    Login: undefined;
    MainTabs: { screen?: string } | undefined;
    AttendanceCalendar: undefined;
    BranchList: undefined;
    AddBranch: { branch?: any } | undefined;
    Points: undefined;
    EmployeeList: undefined;
    EmployeeDetail: { employee: any };
    UserList: undefined;
    UserForm: { user?: any } | undefined;
    RecapDetail: { month: string; monthCode: string };
    Settings: undefined;
    Notifications: undefined;
    OwnerRecapBranch: undefined;
    OwnerRecapEmployees: { branchId: any; branchName: string };
    OwnerRecapDetail: { userId: any; userName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
    const { user } = useAuth();
    const isOwner = user?.role === 'OWNER';
    const insets = useSafeAreaInsets();

    // Default paddingBottom if insets.bottom is 0 (e.g. physical buttons outside screen)
    // If insets.bottom > 0 (e.g. iPhone X or Android with gestures), we use that.
    const paddingBottom = insets.bottom > 0 ? insets.bottom : 8;
    const height = 60 + (insets.bottom > 0 ? insets.bottom - 8 : 0); // Adjust height accordingly

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 10,
                    height: height,
                    paddingBottom: paddingBottom,
                    paddingTop: 8,
                    backgroundColor: colors.surface,
                },
                // ... rest remains same
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                }
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Beranda',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home-variant" color={color} size={size} />
                    ),
                }}
            />
            {!isOwner && (
                <>
                    <Tab.Screen
                        name="AbsenTab"
                        component={AttendanceInputScreen}
                        options={{
                            tabBarLabel: 'Absensi',
                            tabBarIcon: ({ color, size }) => (
                                <MaterialCommunityIcons name="camera-iris" color={color} size={size} />
                            ),
                        }}
                    />
                    <Tab.Screen
                        name="HistoryTab"
                        component={RecapScreen}
                        options={{
                            tabBarLabel: 'Riwayat',
                            tabBarIcon: ({ color, size }) => (
                                <MaterialCommunityIcons name="history" color={color} size={size} />
                            ),
                        }}
                    />
                </>
            )}

            {user?.role === 'HEAD' && (
                <Tab.Screen
                    name="TeamTab"
                    component={UserListScreen}
                    options={{
                        tabBarLabel: 'Tim',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialCommunityIcons name="account-group" color={color} size={size} />
                        ),
                    }}
                />
            )}

            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-circle" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <NavigationContainer>
                    <Stack.Navigator
                        initialRouteName="Loading"
                        screenOptions={{
                            headerShown: false,
                            animation: 'slide_from_right',
                            contentStyle: { backgroundColor: colors.background }
                        }}
                    >
                        <Stack.Screen name="Loading" component={LoadingScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

                        {/* Attendance Calendar View */}
                        <Stack.Screen name="AttendanceCalendar" component={AttendanceScreen} options={{ headerShown: true, title: 'Kalender Absensi' }} />

                        {/* Admin / Owner Screens */}
                        <Stack.Screen name="BranchList" component={BranchListScreen} options={{ headerShown: true, title: 'Daftar Outlet' }} />
                        <Stack.Screen name="AddBranch" component={AddBranchScreen} options={{ headerShown: true, title: 'Pengaturan Outlet' }} />
                        <Stack.Screen name="UserList" component={UserListScreen} options={{ headerShown: true, title: 'Manajemen Pengguna' }} />
                        <Stack.Screen name="UserForm" component={UserFormScreen} options={{ headerShown: true, title: 'Form Pengguna' }} />
                        <Stack.Screen name="EmployeeList" component={EmployeeListScreen} options={{ headerShown: true, title: 'Monitoring Karyawan' }} />
                        <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={{ headerShown: true, title: 'Laporan Kehadiran' }} />

                        {/* Recap Detail */}
                        <Stack.Screen name="RecapDetail" component={RecapDetailScreen} options={{ headerShown: false }} />

                        {/* Owner Recap Flow */}
                        <Stack.Screen name="OwnerRecapBranch" component={OwnerRecapBranchScreen} options={{ headerShown: true, title: 'Pilih Outlet' }} />
                        <Stack.Screen name="OwnerRecapEmployees" component={OwnerRecapEmployeesScreen} options={{ headerShown: true, title: 'Pilih Karyawan' }} />
                        <Stack.Screen name="OwnerRecapDetail" component={OwnerRecapDetailScreen} options={{ headerShown: true, title: 'Detail Rekap' }} />

                        {/* Shared Screens */}
                        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Pengaturan Akun' }} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Points" component={PointsScreen} options={{ headerShown: true, title: 'Poin & Sanksi' }} />
                    </Stack.Navigator>
                </NavigationContainer>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
