import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  SafeAreaView, 
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#2ecc71';
const SECONDARY_COLOR = '#e67e22';

// Copy of normalization logic from server
const normalize = (text) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u0652\u0653-\u0670\u06D6-\u06ED\u06E1\u0640]/g, "")
    .replace(/[\u0671]/g, "ا")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[ئى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ء/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const KNOWN_WORD_COUNTS = {
  'الله': 2699, 'الدُّنيا': 113, 'الآخرة': 115, 'شهر': 12, 'شهور': 8,
  'يوم': 365, 'أيّام': 30, 'صلوات': 5, 'سبع سماوات': 7, 'جزاء': 42,
  'مغفرة': 28, 'رَجُل': 23, 'امرأة': 23, 'جَنّة': 66, 'جَهَنّم': 77,
  'قرآن': 68, 'مَلَك': 81, 'شيطان': 71, 'ابليس': 11
};

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Replace this with your actual Replit URL
  const API_URL = 'https://' + window.location.hostname + '/api/search';

  const performSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      alert('Une erreur est produite lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.verseCard}>
      <View style={styles.verseHeader}>
        <Text style={styles.verseInfo}>Sourate {item.chapterId} ({item.chapterName}) | Verset {item.verseId}</Text>
        <Text style={styles.verseOccurrences}>{item.occurrences}</Text>
      </View>
      <Text style={styles.arabicText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Ionicons name="book" size={24} color={PRIMARY_COLOR} />
        <Text style={styles.headerTitle}>القرآن الكريم</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            placeholder="ابحث عن كلمة..."
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
          <TouchableOpacity onPress={performSearch} style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>بحث</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : results ? (
        <View style={{ flex: 1 }}>
          <View style={styles.statsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
              <View style={styles.statCard}><Text style={styles.statLabel}>Occurrences</Text><Text style={styles.statValue}>{results.totalOccurrences}</Text></View>
              <View style={styles.statCard}><Text style={styles.statLabel}>Versets</Text><Text style={styles.statValue}>{results.totalResults}</Text></View>
              <View style={[styles.statCard, {backgroundColor: PRIMARY_COLOR}]}><Text style={[styles.statLabel, {color: '#fff'}]}>Valeur Num.</Text><Text style={[styles.statValue, {color: '#fff'}]}>{results.wordValue}</Text></View>
            </ScrollView>
          </View>
          
          <FlatList
            data={results.results}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.chapterId}-${item.verseId}-${index}`}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color="#ddd" />
          <Text style={styles.welcomeTitle}>جاهز للبحث</Text>
          <Text style={styles.welcomeSubtitle}>أدخل كلمة للبحث عنها في القرآن</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#fff', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginRight: 10, color: '#2c3e50' },
  searchSection: { padding: 15 },
  searchBox: { 
    flexDirection: 'row-reverse', 
    backgroundColor: '#fff', 
    borderRadius: 25, 
    padding: 5,
    borderWidth: 1,
    borderColor: '#eee'
  },
  input: { flex: 1, paddingHorizontal: 15, fontSize: 16 },
  searchBtn: { backgroundColor: PRIMARY_COLOR, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  searchBtnText: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: PRIMARY_COLOR },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#7f8c8d', marginTop: 20 },
  welcomeSubtitle: { color: '#bdc3c7', marginTop: 5 },
  statsContainer: { height: 80, marginBottom: 10 },
  statsScroll: { paddingHorizontal: 15, alignItems: 'center' },
  statCard: { 
    backgroundColor: '#fff', 
    padding: 10, 
    borderRadius: 12, 
    marginRight: 10, 
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  statLabel: { fontSize: 12, color: '#7f8c8d' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_COLOR },
  listContent: { padding: 15 },
  verseCard: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  verseHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  verseInfo: { fontSize: 12, color: '#7f8c8d' },
  verseOccurrences: { fontWeight: 'bold', color: PRIMARY_COLOR },
  arabicText: { 
    fontSize: 22, 
    textAlign: 'right', 
    lineHeight: 40, 
    color: '#2c3e50',
    fontFamily: 'System' // Standard system font, ideally add Amiri font in Expo
  }
});
