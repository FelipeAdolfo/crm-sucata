import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, PanResponder,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { documentsService } from '../services/documents';
import { Pen, RotateCcw, CheckCircle } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

export function DocumentSignScreen() {
  const route = useRoute();
  const { documentId, documentTitle } = route.params as { documentId: string; documentTitle: string };
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signed, setSigned] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setIsDrawing(true);
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath([]);
      },
    }),
  ).current;

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath([]);
    setSigned(false);
  };

  const handleSign = async () => {
    if (paths.length === 0 && currentPath.length === 0) {
      Alert.alert('Atenção', 'Desenhe sua assinatura antes de confirmar');
      return;
    }

    // Converte os paths para SVG string
    const allPaths = currentPath.length > 0 ? [...paths, currentPath] : paths;
    const svgPaths = allPaths.map((path) => {
      if (path.length === 0) return '';
      let d = `M ${path[0].x} ${path[0].y}`;
      for (let i = 1; i < path.length; i++) {
        d += ` L ${path[i].x} ${path[i].y}`;
      }
      return d;
    }).filter(Boolean);

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg">${svgPaths.map((d) => `<path d="${d}" stroke="#000" stroke-width="2" fill="none"/>`).join('')}</svg>`;

    try {
      await documentsService.sign(documentId, svgString);
      setSigned(true);
      Alert.alert('Sucesso', 'Documento assinado com sucesso');
    } catch {
      Alert.alert('Erro', 'Falha ao assinar documento');
    }
  };

  const allPaths = currentPath.length > 0 ? [...paths, currentPath] : paths;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Assinar Documento</Text>
        <Text style={styles.subtitle}>{documentTitle}</Text>
      </View>

      {/* Signature Area */}
      <View style={styles.signBox} {...panResponder.panHandlers}>
        <Text style={styles.signLabel}>Desenhe sua assinatura aqui</Text>
        <Svg style={StyleSheet.absoluteFill}>
          {allPaths.map((path, i) => {
            if (path.length === 0) return null;
            let d = `M ${path[0].x} ${path[0].y}`;
            for (let j = 1; j < path.length; j++) {
              d += ` L ${path[j].x} ${path[j].y}`;
            }
            return <Path key={i} d={d} stroke="#1a365d" strokeWidth={2.5} fill="none" />;
          })}
        </Svg>
        {signed && (
          <View style={styles.signedOverlay}>
            <CheckCircle size={48} color="#16a34a" />
            <Text style={styles.signedText}>Assinado</Text>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.clearBtn]} onPress={clearSignature}>
          <RotateCcw size={16} color="#6b7280" />
          <Text style={[styles.btnText, { color: '#6b7280' }]}>Limpar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.signBtn, (!paths.length && !currentPath.length) && styles.signBtnDisabled]}
          onPress={handleSign}
          disabled={signed}
        >
          <Pen size={16} color="#fff" />
          <Text style={styles.btnText}>{signed ? 'Assinado' : 'Confirmar Assinatura'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        Ao assinar, voce confirma que leu e concorda com o conteudo deste documento.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a365d' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  signBox: {
    flex: 1, margin: 16, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb',
    borderStyle: 'dashed', position: 'relative', overflow: 'hidden',
  },
  signLabel: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    textAlign: 'center', color: '#d1d5db', fontSize: 16, fontWeight: '500',
    zIndex: -1,
  },
  signedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  signedText: { fontSize: 18, fontWeight: '700', color: '#16a34a', marginTop: 8 },
  actions: {
    flexDirection: 'row', padding: 16, gap: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, height: 48, gap: 6 },
  clearBtn: { flex: 1, backgroundColor: '#f3f4f6' },
  signBtn: { flex: 2, backgroundColor: '#2563eb' },
  signBtnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  terms: { textAlign: 'center', fontSize: 11, color: '#9ca3af', padding: 12 },
});
