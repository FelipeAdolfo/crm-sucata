import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { visitsService } from '../services/visits';
import type { VisitRecord } from '../types';
import { Calendar, MapPin, Navigation, CheckCircle } from 'lucide-react-native';
import * as Location from 'expo-location';

export function VisitsScreen() {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await visitsService.getAll();
      setVisits(res.visits || res || []);
    } catch {
      // silent
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCheckIn = async (visitId: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao negada', 'Ative a localizacao para fazer check-in');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await visitsService.checkIn(visitId, location.coords.latitude, location.coords.longitude);
      Alert.alert('Sucesso', 'Check-in realizado com sucesso');
      load();
    } catch {
      Alert.alert('Erro', 'Falha no check-in');
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    SCHEDULED: { bg: '#fef3c7', text: '#92400e' },
    IN_PROGRESS: { bg: '#dbeafe', text: '#1e40af' },
    COMPLETED: { bg: '#dcfce7', text: '#166534' },
    CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  };

  const renderItem = ({ item }: { item: VisitRecord }) => {
    const colors = statusColors[item.status] || statusColors.SCHEDULED;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Calendar size={18} color="#2563eb" />
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.oppName}>{item.opportunity?.name || 'Visita'}</Text>
        <Text style={styles.date}>
          {item.scheduledDate ? new Date(item.scheduledDate).toLocaleString('pt-BR') : ''}
        </Text>
        {item.objective && <Text style={styles.objective}>{item.objective}</Text>}

        {item.status === 'SCHEDULED' && (
          <TouchableOpacity style={styles.checkInBtn} onPress={() => handleCheckIn(item.id)}>
            <Navigation size={16} color="#fff" />
            <Text style={styles.checkInText}>Check-in GPS</Text>
          </TouchableOpacity>
        )}
        {item.status === 'COMPLETED' && (
          <View style={styles.completedRow}>
            <CheckCircle size={16} color="#16a34a" />
            <Text style={styles.completedText}>Concluida</Text>
            {item.distance !== undefined && (
              <Text style={styles.distanceText}> ({Math.round(item.distance)}m)</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visitas</Text>
      </View>
      <FlatList
        data={visits}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MapPin size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhuma visita agendada</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a365d' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  oppName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  objective: { fontSize: 13, color: '#4b5563', marginTop: 6 },
  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563eb', borderRadius: 10, height: 40, marginTop: 10, gap: 6,
  },
  checkInText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  completedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  completedText: { fontSize: 13, color: '#16a34a', marginLeft: 4 },
  distanceText: { fontSize: 12, color: '#6b7280' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
