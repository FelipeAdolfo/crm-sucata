import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/auth';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OpportunitiesScreen } from '../screens/OpportunitiesScreen';
import { OpportunityDetailScreen } from '../screens/OpportunityDetailScreen';
import { CallsScreen } from '../screens/CallsScreen';
import { VisitsScreen } from '../screens/VisitsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { DocumentSignScreen } from '../screens/DocumentSignScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import { Home, Briefcase, Phone, Calendar, FileText, Settings } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4, paddingTop: 4 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="OpportunitiesTab"
        component={OpportunitiesScreen}
        options={{
          tabBarLabel: 'Oport.',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CallsTab"
        component={CallsScreen}
        options={{
          tabBarLabel: 'Chamadas',
          tabBarIcon: ({ color, size }) => <Phone size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="VisitsTab"
        component={VisitsScreen}
        options={{
          tabBarLabel: 'Visitas',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="DocumentsTab"
        component={DocumentsScreen}
        options={{
          tabBarLabel: 'Docs',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="OpportunityDetail"
              component={OpportunityDetailScreen}
              options={{ headerShown: true, title: 'Detalhes' }}
            />
            <Stack.Screen
              name="DocumentSign"
              component={DocumentSignScreen}
              options={{ headerShown: true, title: 'Assinar Documento' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
