import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { callsService } from '../services/calls';
import type { CallRecord } from '../types';
import { Phone, PhoneCall, PhoneMissed, Clock } from 'lucide-react-native';

export function CallsScreen() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, missed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState(30);

  const load = async () => {
    try {
      const [callsRes, statsRes] = await Promise.all([
        callsService.getAll({ periodo, limit: 50 }),
        callsService.getStats(periodo),
      ]);
      setCalls(callsRes.calls || []);
      setStats({
        total: statsRes.total || 0,
        completed: statsRes.completed || 0,
        missed: statsRes.missed || 0,
      });
    } catch {
      // silent
    }
  };

  useEffect(() => { load(); }, [periodo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const formatDuration = (s?: number) => {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}min ${s % 60}s` : `${s}s`;
  };

  const renderItem = ({ item }: { item: CallRecord }) => {
    const isCompleted = item.type === 'CALL_COMPLETED';
    const isMissed = item.type === 'CALL_MISSED';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {isCompleted ? (
            <PhoneCall size={18} color="#16a34a" />
          ) : isMissed ? (
            <PhoneMissed size={18} color="#dc2626" />
          ) : (
            <Phone size={18} color="#d97706" />
          )}
          <View style={[
            styles.statusBadge,
            { backgroundColor: isCompleted ? '#dcfce7' : isMissed ? '#fee2e2' : '#fef3c7' },
          ]}>
            <Text style={[
              styles.statusText,
              { color: isCompleted ? '#166534' : isMissed ? '#991b1b' : '#92400e' },
            ]}>
              {isCompleted ? 'Atendida' : isMissed ? 'Perdida' : 'Tentativa'}
            </Text>
          </View>
        </View>
        <Text style={styles.oppName}>{item.opportunity?.name || 'Nao vinculada'}</Text>
        {item.metadata && (
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Phone size={12} color="#9ca3af" />
              <Text style={styles.metaText}>{item.metadata.telefone}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color="#9ca3af" />
              <Text style={styles.metaText}>{formatDuration(item.metadata.duracao_segundos)}</Text>
            </View>
          </View>
        )}
        <Text style={styles.desc}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chamadas</Text>
        <View style={styles.periodRow}>
          {[1, 7, 30, 90].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, periodo === p && styles.periodBtnActive]}
              onPress={() => setPeriodo(p)}
            >
              <Text style={[styles.periodText, periodo === p && styles.periodTextActive]}>
                {p === 1 ? 'Hoje' : `${p}d`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Atendidas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.missed}</Text>
          <Text style={styles.statLabel}>Perdidas</Text>
        </View>
      </View>

      <FlatList
        data={calls}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Phone size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhuma chamada registrada</Text>
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
  periodRow: { flexDirection: 'row', marginTop: 10, gap: 6 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f3f4f6' },
  periodBtnActive: { backgroundColor: '#2563eb' },
  periodText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  oppName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  metaRow: { flexDirection: 'row', marginTop: 6, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  desc: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
