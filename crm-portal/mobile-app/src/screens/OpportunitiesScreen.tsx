import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { opportunitiesService } from '../services/opportunities';
import { Search, Briefcase, MapPin, ChevronRight } from 'lucide-react-native';
import type { Opportunity } from '../types';

type RootStackParamList = {
  OpportunityDetail: { id: string };
};

const stageColors: Record<string, { bg: string; text: string }> = {
  PRIMEIRO_CONTATO: { bg: '#f3f4f6', text: '#374151' },
  SEGUNDO_CONTATO: { bg: '#dbeafe', text: '#1e40af' },
  VISITA: { bg: '#f3e8ff', text: '#6b21a8' },
  EM_NEGOCIACAO: { bg: '#fef3c7', text: '#92400e' },
  CONTRA_PROPOSTA: { bg: '#ffedd5', text: '#c2410c' },
  EM_FECHAMENTO: { bg: '#dcfce7', text: '#166534' },
  CONCLUIDA_SUCESSO: { bg: '#dcfce7', text: '#166534' },
  FORA_DE_PERFIL: { bg: '#fee2e2', text: '#991b1b' },
  BAIXA_GERACAO_DIR: { bg: '#fce7f3', text: '#9d174d' },
};

export function OpportunitiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await opportunitiesService.getAll({
        limit: 20,
        search: search || undefined,
      });
      setOpportunities(res.opportunities || []);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Opportunity }) => {
    const colors = stageColors[item.stage] || stageColors.PRIMEIRO_CONTATO;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OpportunityDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Briefcase size={18} color="#2563eb" />
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {item.stage?.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.type}>{item.type?.replace(/_/g, ' ')}</Text>
        {(item.city || item.phone) && (
          <View style={styles.meta}>
            {item.city && (
              <View style={styles.metaItem}>
                <MapPin size={12} color="#9ca3af" />
                <Text style={styles.metaText}>{item.city}/{item.state}</Text>
              </View>
            )}
          </View>
        )}
        <ChevronRight size={16} color="#d1d5db" style={styles.arrow} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Oportunidades</Text>
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={load}
          />
        </View>
      </View>
      <FlatList
        data={opportunities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? 'Carregando...' : 'Nenhuma oportunidade encontrada'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a365d', marginBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  type: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  meta: { flexDirection: 'row', marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  metaText: { fontSize: 11, color: '#9ca3af', marginLeft: 3 },
  arrow: { position: 'absolute', right: 14, top: '50%' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});
