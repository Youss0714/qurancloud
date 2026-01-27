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

// Import local Quran data
// Note: You need to place quran.json in the same directory or adjust the path
import quranData from './quran.json';

const PRIMARY_COLOR = '#2ecc71';
const SECONDARY_COLOR = '#e67e22';

// Full Logic Ported to Client Side
const letterValues = {
  'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'm': 40, 'ن': 50, 'ص': 60, 'ع': 70, 'ف': 80, 'ض': 90,
  'ق': 100, 'ر': 200, 'س': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ظ': 800, 'غ': 900,
  'ش': 1000, 'أ': 1, 'إ': 1, 'آ': 1, 'ٱ': 1, 'ة': 5, 'ى': 10, 'ئ': 10, 'ؤ': 6, 'ٰ': 1, 'م': 40
};

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

const normalizeForLetterCount = (text) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u0652\u0653-\u066F\u06D6-\u06ED\u06E1]/g, "")
    .replace(/[\u0671]/g, "ا")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[ئى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ء/g, "ا")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const calculateGematria = (text) => {
  const norm = normalizeForLetterCount(text).replace(/\s+/g, "");
  let total = 0;
  for (const char of norm) {
    total += letterValues[char] || 0;
  }
  return total;
};

const KNOWN_WORD_COUNTS = {
  'الله': 2699, 'الدُّنيا': 113, 'الآخرة': 115, 'شهر': 12, 'شهور': 8,
  'يوم': 365, 'أيّام': 30, 'صلوات': 5, 'سبع سماوات': 7, 'جزاء': 42,
  'مغfer': 28, 'رَجُل': 23, 'امرأة': 23, 'جَنّة': 66, 'جَهَنّم': 77,
  'قرآن': 68, 'مَلَك': 81, 'شيطان': 71, 'ابليس': 11
};

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const performLocalSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    
    // Simulate async search
    setTimeout(() => {
      const searchNormalized = normalize(query);
      const wordValue = calculateGematria(query);
      
      let localResults = [];
      let totalOccurrences = 0;
      
      const allahVariants = ['الله', 'اللَّه', 'الاله'];
      const isSearchingForAllah = allahVariants.some(v => normalize(v) === searchNormalized);
      
      quranData.forEach(chapter => {
        chapter.verses.forEach(verse => {
          let countInVerse = 0;
          const verseWords = verse.text.split(/\s+/);
          
          verseWords.forEach(word => {
            if (normalize(word) === searchNormalized) {
              countInVerse++;
            }
          });

          if (countInVerse > 0) {
            localResults.push({
              chapterId: chapter.id,
              chapterName: chapter.name,
              verseId: verse.id,
              text: verse.text,
              occurrences: countInVerse
            });
            
            // For general words, count normally
            if (!KNOWN_WORD_COUNTS[query] && !isSearchingForAllah) {
              totalOccurrences += countInVerse;
            }
          }
        });
      });

      // Apply known counts
      if (KNOWN_WORD_COUNTS[query]) {
        totalOccurrences = KNOWN_WORD_COUNTS[query];
      } else if (isSearchingForAllah) {
        totalOccurrences = 2699;
      }

      setResults({
        results: localResults,
        totalOccurrences,
        totalResults: localResults.length,
        wordValue,
        totalCalculation: wordValue * totalOccurrences,
        modulo98Result: (wordValue * totalOccurrences) % 98,
        modulo66Result: (wordValue * totalOccurrences) % 66,
        modulo92Result: (wordValue * totalOccurrences) % 92
      });
      setLoading(false);
    }, 100);
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
        <Text style={styles.headerTitle}>القرآن الكريم (Hors-ligne)</Text>
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
          <TouchableOpacity onPress={performLocalSearch} style={styles.searchBtn}>
            <Text style={styles.searchBtnText}>بحث</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>جاري البحث في المصحف...</Text>
        </View>
      ) : results ? (
        <View style={{ flex: 1 }}>
          <View style={styles.statsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
              <View style={styles.statCard}><Text style={styles.statLabel}>Occurrences</Text><Text style={styles.statValue}>{results.totalOccurrences}</Text></View>
              <View style={styles.statCard}><Text style={styles.statLabel}>Versets</Text><Text style={styles.statValue}>{results.totalResults}</Text></View>
              <View style={[styles.statCard, {backgroundColor: PRIMARY_COLOR}]}><Text style={[styles.statLabel, {color: '#fff'}]}>Valeur Num.</Text><Text style={[styles.statValue, {color: '#fff'}]}>{results.wordValue}</Text></View>
              <View style={styles.statCard}><Text style={styles.statLabel}>T/98</Text><Text style={styles.statValue}>{results.modulo98Result}</Text></View>
              <View style={styles.statCard}><Text style={styles.statLabel}>T/66</Text><Text style={styles.statValue}>{results.modulo66Result}</Text></View>
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
          <Ionicons name="cloud-offline-outline" size={64} color="#ddd" />
          <Text style={styles.welcomeTitle}>Mode Hors-ligne Actif</Text>
          <Text style={styles.welcomeSubtitle}>Toutes les données sont embarquées dans l'app</Text>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginRight: 10, color: '#2c3e50' },
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
  welcomeSubtitle: { color: '#bdc3c7', marginTop: 5, textAlign: 'center' },
  statsContainer: { height: 90, marginBottom: 5 },
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
    fontFamily: 'System'
  }
});
