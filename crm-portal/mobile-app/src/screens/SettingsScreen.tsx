import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import {
  User, Lock, Smartphone, LogOut, Linkedin, Facebook, Instagram,
  ChevronRight, Globe,
} from 'lucide-react-native';

export function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    {
      section: 'Conta',
      items: [
        { icon: User, label: 'Nome', value: user?.name || '—' },
        { icon: Globe, label: 'E-mail', value: user?.email || '—' },
        { icon: Smartphone, label: 'Telefone', value: user?.phone || '—' },
      ],
    },
    {
      section: 'Redes Sociais',
      items: [
        { icon: Linkedin, label: 'LinkedIn', value: user?.linkedinUrl ? 'Conectado' : 'Nao configurado', connected: !!user?.linkedinUrl },
        { icon: Facebook, label: 'Facebook', value: user?.facebookUrl ? 'Conectado' : 'Nao configurado', connected: !!user?.facebookUrl },
        { icon: Instagram, label: 'Instagram', value: user?.instagramUrl ? 'Conectado' : 'Nao configurado', connected: !!user?.instagramUrl },
      ],
    },
    {
      section: 'Dispositivo',
      items: [
        {
          icon: Smartphone,
          label: 'Status',
          value: user?.deviceStatus === 'LINKED' ? `Vinculado (${user?.deviceModel || 'Android'})` : 'Nao vinculado',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.replace(/_/g, ' ') || 'Usuario'}</Text>
          </View>
          {user?.status && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: user.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7' },
            ]}>
              <Text style={[
                styles.statusText,
                { color: user.status === 'ACTIVE' ? '#166534' : '#92400e' },
              ]}>
                {user.status === 'ACTIVE' ? 'Ativo' : user.status}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Sections */}
        {menuItems.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.items.map((item, i) => (
              <View key={i} style={styles.menuItem}>
                <View style={[styles.menuIcon, item.connected && styles.menuIconConnected]}>
                  <item.icon size={18} color={item.connected ? '#2563eb' : '#6b7280'} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={[styles.menuValue, item.connected && styles.menuValueConnected]}>
                    {item.value}
                  </Text>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </View>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CRM Sucata Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  profile: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a365d', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '600', color: '#1f2937', marginTop: 12 },
  roleBadge: {
    backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, marginTop: 6,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: '#e5e7eb',
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuIconConnected: { backgroundColor: '#dbeafe' },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  menuValue: { fontSize: 13, color: '#9ca3af', marginTop: 1 },
  menuValueConnected: { color: '#2563eb', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fee2e2', borderRadius: 12, height: 48, gap: 8, marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  version: { textAlign: 'center', fontSize: 11, color: '#d1d5db', marginTop: 16 },
});
