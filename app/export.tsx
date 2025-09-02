import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { useExpenseStore } from '@/hooks/expense-store';
import { Share2 } from 'lucide-react-native';

export default function ExportScreen() {
  const { generateCSV } = useExpenseStore();
  const [busy, setBusy] = useState<boolean>(false);
  const csv = useMemo(() => generateCSV(), [generateCSV]);

  const onShare = async () => {
    try {
      setBusy(true);
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'heeshahbee-export.csv';
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Export', 'CSV downloaded');
        return;
      }

      const FileSystem = await import('expo-file-system');
      const Sharing = await import('expo-sharing');
      const uri = FileSystem.cacheDirectory + 'heeshahbee-export.csv';
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export CSV' });
      } else {
        Alert.alert('Export', 'Sharing not available on this device. File saved to cache.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to export CSV');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export CSV</Text>
      <Text style={styles.subtitle}>Share or save a CSV of all your expenses.</Text>
      <TouchableOpacity testID="export-share" onPress={onShare} style={styles.button} activeOpacity={0.8} disabled={busy}>
        {busy ? <ActivityIndicator color="#001F3F" /> : <Share2 color="#001F3F" />}
        <Text style={styles.buttonText}>{busy ? 'Working...' : 'Share / Save CSV'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001F3F', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  subtitle: { color: '#B0B0B0', marginBottom: 16 },
  button: { flexDirection: 'row', gap: 8 as unknown as number, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#001F3F', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});