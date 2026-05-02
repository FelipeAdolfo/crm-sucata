import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { opportunitiesService } from '../services/opportunities';
import type { Opportunity } from '../types';
import { Phone, Mail, MapPin, Globe, User, ChevronDown } from 'lucide-react-native';

export function OpportunityDetailScreen() {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadOpportunity();
  }, [id]);

  const loadOpportunity = async () => {
    try {
      const data = await opportunitiesService.getById(id);
      setOpportunity(data);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar a oportunidade');
    }
    setLoading(false);
  };

  const tabs = [
    { key: 'info', label: 'Info' },
    { key: 'contacts', label: 'Contatos' },
    { key: 'activities', label: 'Atividades' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!opportunity) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Oportunidade nao encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.name}>{opportunity.name}</Text>
        <View style={styles.typeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{opportunity.type?.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{opportunity.stage?.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        {(opportunity.city || opportunity.phone) && (
          <View style={styles.metaRow}>
            {opportunity.city && (
              <View style={styles.metaItem}>
                <MapPin size={14} color="#6b7280" />
                <Text style={styles.metaText}>{opportunity.city}/{opportunity.state}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'info' && (
          <View style={styles.infoSection}>
            {opportunity.documentNumber && (
              <InfoRow icon={User} label="CNPJ/CPF" value={opportunity.documentNumber} />
            )}
            {opportunity.phone && (
              <InfoRow icon={Phone} label="Telefone" value={opportunity.phone} />
            )}
            {opportunity.email && (
              <InfoRow icon={Mail} label="E-mail" value={opportunity.email} />
            )}
            {opportunity.website && (
              <InfoRow icon={Globe} label="Website" value={opportunity.website} />
            )}
            {opportunity.responsibleName && (
              <InfoRow icon={User} label="Responsavel" value={`${opportunity.responsibleName}${opportunity.responsibleRole ? ` (${opportunity.responsibleRole})` : ''}`} />
            )}
            {opportunity.estimatedVolume && (
              <InfoRow icon={ChevronDown} label="Volume Estimado" value={`${opportunity.estimatedVolume} ton/mes`} />
            )}
            {opportunity.observations && (
              <View style={styles.obsBox}>
                <Text style={styles.obsLabel}>Observacoes</Text>
                <Text style={styles.obsText}>{opportunity.observations}</Text>
              </View>
            )}
          </View>
        )}
        {activeTab === 'contacts' && (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyTabText}>Contatos serao listados aqui</Text>
          </View>
        )}
        {activeTab === 'activities' && (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyTabText}>Atividades serao listadas aqui</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Ligar', `Ligando para ${opportunity.phone}`)}>
          <Phone size={18} color="#fff" />
          <Text style={styles.actionText}>Ligar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => Alert.alert('Registrar', 'Nova atividade registrada')}>
          <Text style={[styles.actionText, styles.actionTextSecondary]}>Registrar Atividade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon size={16} color="#6b7280" style={styles.infoIcon} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerCard: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  name: { fontSize: 20, fontWeight: '700', color: '#1a365d' },
  typeRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  typeBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  stageBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stageText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  metaRow: { flexDirection: 'row', marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: '#6b7280', marginLeft: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#2563eb' },
  content: { flex: 1, padding: 16 },
  infoSection: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginTop: 2, marginRight: 10 },
  infoLabel: { fontSize: 12, color: '#9ca3af' },
  infoValue: { fontSize: 15, color: '#1f2937', marginTop: 1 },
  obsBox: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 8 },
  obsLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  obsText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  emptyTab: { alignItems: 'center', paddingVertical: 40 },
  emptyTabText: { color: '#9ca3af' },
  actions: {
    flexDirection: 'row', padding: 12, gap: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563eb', borderRadius: 10, height: 44, gap: 6,
  },
  actionBtnSecondary: { backgroundColor: '#f3f4f6' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  actionTextSecondary: { color: '#374151' },
});
