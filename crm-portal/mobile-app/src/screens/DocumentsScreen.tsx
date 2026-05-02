import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { documentsService } from '../services/documents';
import type { Document } from '../types';
import { FileText, Download, Trash2, Pen, CheckCircle, Clock } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

type RootStackParamList = {
  DocumentSign: { documentId: string; documentTitle: string };
};

export function DocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await documentsService.getAll();
      setDocuments(res.documents || []);
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

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'text/plain', 'image/*'],
      });
      if (result.canceled) return;

      const file = result.assets[0];
      await documentsService.upload({
        title: file.name,
        type: 'DECLARACAO',
        file: { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' },
      });
      Alert.alert('Sucesso', 'Documento enviado');
      load();
    } catch {
      Alert.alert('Erro', 'Falha ao enviar documento');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirmar', 'Remover este documento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentsService.delete(id);
            load();
          } catch {
            Alert.alert('Erro', 'Nao foi possivel remover');
          }
        },
      },
    ]);
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: '#fef3c7', text: '#92400e', label: 'Pendente' },
    SIGNED: { bg: '#dcfce7', text: '#166534', label: 'Assinado' },
    ARCHIVED: { bg: '#f3f4f6', text: '#374151', label: 'Arquivado' },
  };

  const renderItem = ({ item }: { item: Document }) => {
    const colors = statusColors[item.status] || statusColors.PENDING;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={20} color="#2563eb" />
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{colors.label}</Text>
          </View>
        </View>
        <Text style={styles.title2}>{item.title}</Text>
        <Text style={styles.meta}>{item.fileName} — {(item.fileSize / 1024).toFixed(1)} KB</Text>
        <Text style={styles.date}>Enviado por {item.uploadedBy?.name} em {new Date(item.createdAt).toLocaleDateString('pt-BR')}</Text>

        <View style={styles.actions}>
          {item.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.signBtn]}
              onPress={() => navigation.navigate('DocumentSign', { documentId: item.id, documentTitle: item.title })}
            >
              <Pen size={14} color="#fff" />
              <Text style={styles.actionText}>Assinar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.downloadBtn]} onPress={() => documentsService.download(item.id)}>
            <Download size={14} color="#2563eb" />
            <Text style={[styles.actionText, { color: '#2563eb' }]}>Baixar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
            <Trash2 size={14} color '#dc2626' />
            <Text style={[styles.actionText, { color: '#dc2626' }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
          <FileText size={18} color="#fff" />
          <Text style={styles.uploadText}>Enviar Documento</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FileText size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Nenhum documento</Text>
            <Text style={styles.emptySub}>Toque em "Enviar Documento" para adicionar</Text>
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
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2563eb', borderRadius: 10, height: 44, gap: 8,
  },
  uploadText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  title2: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 10, gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  signBtn: { backgroundColor: '#16a34a' },
  downloadBtn: { backgroundColor: '#dbeafe' },
  deleteBtn: { backgroundColor: '#fee2e2' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#d1d5db', marginTop: 4 },
});
