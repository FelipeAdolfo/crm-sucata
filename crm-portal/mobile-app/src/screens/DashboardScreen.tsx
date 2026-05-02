import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import { opportunitiesService } from '../services/opportunities';
import { callsService } from '../services/calls';
import { visitsService } from '../services/visits';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Briefcase, Phone, Calendar, TrendingUp, Target, Users,
} from 'lucide-react-native';

type RootStackParamList = {
  OpportunityDetail: { id: string };
};

export function DashboardScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    callsToday: 0,
    visitsThisWeek: 0,
    conversionRate: 0,
  });
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [oppRes, callsRes, visitsRes] = await Promise.all([
        opportunitiesService.getAll({ limit: 5 }),
        callsService.getStats(1),
        visitsService.getAll(),
      ]);
      setStats({
        totalOpportunities: oppRes.total || 0,
        callsToday: callsRes.total || 0,
        visitsThisWeek: visitsRes.length || 0,
        conversionRate: callsRes.conversionRate || 0,
      });
      setRecentOpportunities(oppRes.opportunities || []);
    } catch {
      // silent
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const statCards = [
    { label: 'Oportunidades', value: stats.totalOpportunities, icon: Briefcase, color: '#2563eb' },
    { label: 'Chamadas Hoje', value: stats.callsToday, icon: Phone, color: '#16a34a' },
    { label: 'Visitas Semana', value: stats.visitsThisWeek, icon: Calendar, color: '#9333ea' },
    { label: 'Conversao', value: `${stats.conversionRate}%`, icon: TrendingUp, color: '#ea580c' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Ola, {user?.name?.split(' ')[0] || 'Usuario'}</Text>
          <Text style={styles.role}>{user?.role || 'Comprador'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((card, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: card.color + '15' }]}>
                <card.icon size={20} color={card.color} />
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Pipeline */}
        <Text style={styles.sectionTitle}>Seu Funil</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pipelineScroll}>
          {['PRIMEIRO_CONTATO', 'SEGUNDO_CONTATO', 'VISITA', 'EM_NEGOCIACAO', 'CONTRA_PROPOSTA', 'EM_FECHAMENTO'].map((stage, i) => (
            <View key={stage} style={styles.pipelineColumn}>
              <View style={styles.pipelineHeader}>
                <Text style={styles.pipelineStage}>{stage.replace(/_/g, ' ')}</Text>
                <Text style={styles.pipelineCount}>{Math.max(0, 3 - i)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Recent */}
        <Text style={styles.sectionTitle}>Oportunidades Recentes</Text>
        {recentOpportunities.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhuma oportunidade ainda</Text>
          </View>
        ) : (
          recentOpportunities.map((opp) => (
            <TouchableOpacity
              key={opp.id}
              style={styles.oppCard}
              onPress={() => navigation.navigate('OpportunityDetail', { id: opp.id })}
            >
              <View style={styles.oppHeader}>
                <Text style={styles.oppName}>{opp.name}</Text>
                <View style={[
                  styles.oppBadge,
                  { backgroundColor: opp.stage === 'CONCLUIDA_SUCESSO' ? '#dcfce7' : '#f3f4f6' },
                ]}>
                  <Text style={[
                    styles.oppBadgeText,
                    { color: opp.stage === 'CONCLUIDA_SUCESSO' ? '#166534' : '#374151' },
                  ]}>
                    {opp.stage?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.oppType}>{opp.type?.replace(/_/g, ' ')}</Text>
              {opp.city && <Text style={styles.oppLocation}>{opp.city}/{opp.state}</Text>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a365d' },
  role: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#e5e7eb',
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a365d', marginBottom: 12, marginTop: 8 },
  pipelineScroll: { marginBottom: 20 },
  pipelineColumn: {
    width: 130, backgroundColor: '#fff', borderRadius: 10,
    padding: 12, marginRight: 8, borderWidth: 1, borderColor: '#e5e7eb',
  },
  pipelineHeader: { alignItems: 'center' },
  pipelineStage: { fontSize: 10, fontWeight: '600', color: '#6b7280', textAlign: 'center', textTransform: 'uppercase' },
  pipelineCount: { fontSize: 20, fontWeight: '700', color: '#2563eb', marginTop: 4 },
  oppCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb',
  },
  oppHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oppName: { fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1 },
  oppBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 },
  oppBadgeText: { fontSize: 10, fontWeight: '600' },
  oppType: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  oppLocation: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
});
