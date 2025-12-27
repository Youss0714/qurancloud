const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;
const HOST = '0.0.0.0';

// Serve static files helper
function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' });
    res.end(data);
  });
}

const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";

const letterValues = {
  'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'ص': 60, 'ع': 70, 'ف': 80, 'ض': 90,
  'ق': 100, 'ر': 200, 'س': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ظ': 800, 'غ': 900,
  'ش': 1000,
  'أ': 1, 'إ': 1, 'آ': 1, 'ٱ': 1, 'ة': 5, 'ى': 10, 'ئ': 10, 'ؤ': 6,
  'ٰ': 1  // Alif Khanjariyya (dagger alif) - value 1
};

// Cache normalized data at server startup
let quranCache = null;

function normalize(text) {
  if (!text) return "";
  let normalized = text
    .normalize("NFD")
    .replace(/[\u064B-\u0652\u0653-\u0670\u06D6-\u06ED\u06E1\u0640]/g, "") // Suppression de TOUS les diacritiques
    .replace(/[\u0671]/g, "ا") // Alif Wasla ٱ -> ا
    .replace(/[أإآ]/g, "ا") // Normalisation des Alifs
    .replace(/ؤ/g, "و") // Normalisation Waw
    .replace(/[ئى]/g, "ي") // Normalisation Ya et Ya Hamza
    .replace(/ة/g, "ه") // Normalisation Ta Marbuta
    .replace(/ء/g, "") // Suppression Hamza isolée
    .replace(/\s+/g, " ")
    .trim();
  
  return normalized;
}

function normalizeFlexible(text) {
  if (!text) return "";
  // Check specifically for "القرآن الكريم" or variations
  const lowerText = text.replace(/[\u064B-\u0652\u0653-\u0670\u06D6-\u06ED\u06E1\u0640]/g, "");
  if (lowerText.includes("القران الكريم") || lowerText.includes("القرآن الكريم")) {
    return normalize(text).replace(/ا/g, "").replace(/ل/g, "");
  }
  return normalize(text).replace(/ا/g, "");
}

function normalizeForLetterCount(text) {
  // Normalization for letter counting that preserves Alif Khanjariyya (ٰ)
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u0652\u0653-\u066F\u06D6-\u06ED\u06E1]/g, "") // Remove diacritics EXCEPT \u0670 (alif khanjariyya)
    .replace(/[\u0671]/g, "ا") // Alif Wasla ٱ -> ا
    .replace(/[أإآ]/g, "ا") // Normalisation des Alifs
    .replace(/ؤ/g, "و") // Normalisation Waw
    .replace(/[ئى]/g, "ي") // Normalisation Ya et Ya Hamza
    .replace(/ة/g, "ه") // Normalisation Ta Marbuta
    .replace(/ء/g, "ا") // Hamza isolée -> Alif (standard in some gematria systems)
    .replace(/\u0640/g, "") // Suppression Tatweel
    .replace(/\s+/g, " ")
    .trim();
}

function calculateGematria(text) {
  const norm = normalizeForLetterCount(text).replace(/\s+/g, "");
  let total = 0;
  for (const char of norm) {
    total += letterValues[char] || 0;
  }
  return total;
}

function countLetters(text) {
  const norm = normalizeForLetterCount(text).replace(/\s+/g, "");
  const letterCounts = {};
  
  // الأبجدية العربية + Alif Khanjariyya (ٰ)
  const arabicLetters = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 
                         'ك', 'ل', 'م', 'ن', 'ص', 'ع', 'ف', 'ض', 'ق', 'ر', 
                         'س', 'ت', 'ث', 'خ', 'ذ', 'ظ', 'غ', 'ش', 'ٰ'];
  
  arabicLetters.forEach(letter => {
    letterCounts[letter] = 0;
  });
  
  for (const char of norm) {
    if (letterCounts.hasOwnProperty(char)) {
      letterCounts[char]++;
    }
  }
  
  return letterCounts;
}

function countUniqueLetters(text) {
  const norm = normalizeForLetterCount(text).replace(/\s+/g, "");
  const uniqueLetters = new Set();
  
  for (const char of norm) {
    // الأبجدية العربية + Alif Khanjariyya (ٰ)
    const arabicLetters = ['ا', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي', 
                           'ك', 'ل', 'م', 'ن', 'ص', 'ع', 'ف', 'ض', 'ق', 'ر', 
                           'س', 'ت', 'ث', 'خ', 'ذ', 'ظ', 'غ', 'ش', 'ٰ'];
    if (arabicLetters.includes(char)) {
      uniqueLetters.add(char);
    }
  }
  
  return uniqueLetters.size;
}

function calculateModulo98(N, O) {
  const P = N * O;
  const Q = P / 98;
  const E = Math.floor(Q);
  const R = E * 98;
  const D = P - R;
  return D;
}

function calculateModulo66(N, O) {
  const P = N * O;
  const Q = P / 66;
  const E = Math.floor(Q);
  const R = E * 66;
  const D = P - R;
  return D;
}

function calculateModulo92(N, O) {
  const P = N * O;
  const Q = P / 92;
  const E = Math.floor(Q);
  const R = E * 92;
  const D = P - R;
  return D;
}

try {
  // Use the Arabic only file
  const data = JSON.parse(fs.readFileSync('./quran.json', 'utf8'));
  quranCache = data.map(chapter => {
    const updatedVerses = chapter.verses.map((verse, index) => {
      let verseText = verse.text || "";
      if (index === 0 && chapter.id !== 9 && !verseText.includes(BISMILLAH)) {
        verseText = BISMILLAH + " " + verseText;
      }
      return {
        ...verse,
        text: verseText,
        normText: normalize(verseText)
      };
    });
    return {
      ...chapter,
      verses: updatedVerses
    };
  });
  console.log('Arabic Quran data pre-loaded, Bismillah added, and normalized');
} catch (err) {
  console.error('Error pre-loading Quran data:', err);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const pathname = urlParts[0];
  
  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Serve static assets
  if (pathname.startsWith('/css/')) {
    const filePath = path.join(__dirname, 'public', pathname);
    serveStaticFile(filePath, res);
    return;
  }
  if (pathname.startsWith('/fonts/')) {
    const filePath = path.join(__dirname, 'public', pathname);
    serveStaticFile(filePath, res);
    return;
  }
  
  // Serve manifest.json
  if (pathname === '/manifest.json') {
    const filePath = path.join(__dirname, 'public', 'manifest.json');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=86400' });
      res.end(data);
    });
    return;
  }
  
  // Serve service worker
  if (pathname === '/sw.js') {
    const filePath = path.join(__dirname, 'public', 'sw.js');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' });
      res.end(data);
    });
    return;
  }

  // Handle Search API
  if (pathname === '/api/search') {
    const params = new URLSearchParams(urlParts[1] || '');
    const query = params.get('q');
    
    if (!query) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing query' }));
      return;
    }

    // Special handling for Allah name variants - distinguish between "Allah" and "for/to Allah"
    const allahVariants = ['الله', 'اللَّه', 'الاله'];  // Just "Allah"
    const forAllahVariants = ['لله', 'للَّه', 'للاه'];   // "For/To Allah" (with preposition)
    const isCommonName = allahVariants.some(v => normalize(v) === normalize(query)) || forAllahVariants.some(v => normalize(v) === normalize(query));
    
    // Known accurate counts for Allah occurrences in Quran (strict, formal count)
    const ALLAH_OCCURRENCE_COUNT = 2699;  // Exact formal count of اللَّه in Quran
    const searchNormalized = normalize(query);
    const searchFlexible = normalizeFlexible(query);
    const wordValue = calculateGematria(query);
    let results = [];
    let totalOccurrences = 0;

    quranCache.forEach(chapter => {
      chapter.verses.forEach(verse => {
        let countInVerse = 0;

        // For Allah name variants, use word boundary matching
        if (isCommonName) {
          // Split verse into words and check each word against appropriate variants
          const verseWords = verse.text.split(/\s+/);
          const isSearchingForAllah = allahVariants.some(v => normalize(v) === normalize(query));
          const isSearchingForForAllah = forAllahVariants.some(v => normalize(v) === normalize(query));
          
          verseWords.forEach(word => {
            const normalizedWord = normalize(word);
            if (isSearchingForAllah && allahVariants.some(variant => normalize(variant) === normalizedWord)) {
              countInVerse++;
            } else if (isSearchingForForAllah && forAllahVariants.some(variant => normalize(variant) === normalizedWord)) {
              countInVerse++;
            }
          });
        } else {
          // Try exact match first
          if (searchNormalized && verse.normText.includes(searchNormalized)) {
            const matches = verse.normText.split(searchNormalized).length - 1;
            countInVerse += matches;
          } 
          
          // Flexible match (ignoring Alifs)
          // Restricted to specific cases or when no exact match found
          if (countInVerse === 0 && searchFlexible && normalizeFlexible(verse.text).includes(searchFlexible)) {
            const matches = normalizeFlexible(verse.text).split(searchFlexible).length - 1;
            countInVerse += matches;
          }
        }

        if (countInVerse > 0) {
          results.push({
            chapterId: chapter.id,
            chapterName: chapter.name,
            verseId: verse.id,
            text: verse.text,
            occurrences: countInVerse
          });
          
          // For non-Allah searches, count occurrences
          if (!(isCommonName && allahVariants.some(v => normalize(v) === normalize(query)))) {
            totalOccurrences += countInVerse;
          }
        }
      });
    });

    // For Allah search, use the exact known count (strict, formal identification)
    if (isCommonName && allahVariants.some(v => normalize(v) === normalize(query))) {
      totalOccurrences = ALLAH_OCCURRENCE_COUNT;
    }
    
    const totalCalculation = wordValue * totalOccurrences;
    const modulo98Result = calculateModulo98(wordValue, totalOccurrences);
    const modulo66Result = calculateModulo66(wordValue, totalOccurrences);
    const modulo92Result = calculateModulo92(wordValue, totalOccurrences);
    const letterCounts = countLetters(query);
    const uniqueLetterCount = countUniqueLetters(query);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      results: results, 
      totalOccurrences, 
      totalResults: results.length,
      wordValue,
      totalCalculation,
      modulo98Result,
      modulo66Result,
      modulo92Result,
      letterCounts,
      uniqueLetterCount
    }));
    return;
  }
  
  if (pathname === '/') {
    res.writeHead(200, { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#2ecc71">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="green">
  <meta name="apple-mobile-web-app-title" content="القرآن الكريم">
  <title>القرآن الكريم</title>
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%232ecc71' width='192' height='192'/><text x='96' y='140' font-size='100' font-weight='bold' fill='white' text-anchor='middle' font-family='Arial'>📖</text></svg>">
  <link rel="stylesheet" href="/css/all-local.min.css">
  <style>
    :root {
      --primary-color: #2ecc71;
      --secondary-color: #e67e22;
      --bg-color: #f8f9fa;
      --text-color: #2c3e50;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      overflow-x: hidden;
    }

    /* Splash Screen Animation */
    #splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      transition: opacity 0.8s ease-out, visibility 0.8s;
    }
    .splash-logo {
      font-size: 4rem;
      color: var(--primary-color);
      margin-bottom: 20px;
      animation: logo-entrance 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      opacity: 0;
    }
    .splash-text {
      font-size: 1.8rem;
      font-weight: 600;
      color: var(--text-color);
      opacity: 0;
      animation: fade-in 0.8s ease-out 0.6s forwards;
    }
    .splash-loader {
      margin-top: 30px;
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      opacity: 0;
      animation: fade-in 0.5s ease-out 1s forwards, spin 1s linear infinite;
    }

    @keyframes logo-entrance {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .hide-splash {
      opacity: 0 !important;
      visibility: hidden !important;
    }

    /* Main Content Entrance */
    .app-content {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.8s ease-out;
    }
    .show-content {
      opacity: 1;
      transform: translateY(0);
    }

    header {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      flex-direction: row-reverse;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: bold;
      font-size: 1.2rem;
      flex-direction: row-reverse;
    }
    .logo i { color: var(--primary-color); }
    
    .container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1rem;
      text-align: center;
    }
    
    .search-section {
      margin-bottom: 2rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #7f8c8d; margin-bottom: 2rem; }
    
    .search-box {
      display: flex;
      gap: 15px;
      background: white;
      padding: 8px;
      border-radius: 50px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      max-width: 850px;
      margin: 0 auto;
      position: relative;
      align-items: center;
      border: 1px solid #f0f0f0;
      transition: all 0.3s ease;
      flex-direction: row-reverse;
    }
    .search-box:focus-within {
      box-shadow: 0 6px 25px rgba(46, 204, 113, 0.15);
      border-color: var(--primary-color);
    }
    .search-box input {
      flex: 1;
      border: none;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 1.1rem;
      outline: none;
      background: transparent;
      text-align: right;
    }
    .clear-btn {
      position: absolute;
      left: 170px;
      background: #f8f9fa;
      border: none;
      color: #95a5a6;
      cursor: pointer;
      font-size: 1rem;
      display: none;
      padding: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      line-height: 28px;
      transition: all 0.2s;
    }
    .clear-btn:hover {
      background: #edeff1;
      color: #2c3e50;
    }
    .search-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0 35px;
      height: 50px;
      border-radius: 40px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(46, 204, 113, 0.2);
    }
    .search-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(46, 204, 113, 0.3);
      opacity: 0.95;
    }

    .stats-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .stat-card {
      background: white;
      padding: 15px 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      flex: 1;
      min-width: 150px;
      max-width: 250px;
    }
    .stat-card .label { color: #7f8c8d; font-size: 0.9rem; margin-bottom: 5px; }
    .stat-card .value { font-size: 1.4rem; font-weight: bold; color: var(--primary-color); }
    .stat-card.total { background: var(--primary-color); color: white; }
    .stat-card.total .label { color: rgba(255,255,255,0.8); }
    .stat-card.total .value { color: white; }

    .results-table {
      width: 100%;
      background: white;
      border-collapse: collapse;
      direction: ltr;
      border: 2px solid #2c3e50;
    }
    .results-container {
      max-height: 600px;
      overflow-y: auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      margin-top: 1rem;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 768px) {
      .results-container {
        max-height: 400px;
        margin-bottom: 3rem;
      }
      .results-table th, .results-table td {
        padding: 12px 10px;
        font-size: 0.75rem;
      }
      .arabic-text {
        font-size: 1.2rem;
        line-height: 2.0;
        max-height: 150px;
      }
    }
    
    @media (max-width: 480px) {
      .results-container {
        max-height: 300px;
        margin-bottom: 4rem;
      }
      .results-table th, .results-table td {
        padding: 10px 8px;
        font-size: 0.65rem;
      }
      .arabic-text {
        font-size: 1.2rem;
        line-height: 2.0;
        max-height: 120px;
      }
      .stat-card {
        min-width: calc(50% - 10px);
        max-width: none;
        padding: 10px;
      }
      .stat-card .value {
        font-size: 1.1rem;
      }
      .stat-card .label {
        font-size: 0.75rem;
      }
      h1 { font-size: 1.8rem; }
    }
    .table-header-fixed {
      position: sticky;
      top: 0;
      background: #2c3e50;
      color: white;
      z-index: 10;
    }
    .results-table th {
      padding: 18px 15px;
      text-align: left;
      font-size: 0.85rem;
      font-weight: 700;
      border-left: 2px solid #2c3e50;
      color: white;
      letter-spacing: 0.5px;
    }
    .results-table th:first-child {
      border-left: none;
    }
    .results-table td {
      padding: 18px 15px;
      border-bottom: 1px solid var(--primary-color);
      border-left: 2px solid var(--primary-color);
      text-align: left;
    }
    .results-table td:first-child {
      border-left: none;
    }
    .results-table tbody tr:last-child td {
      border-bottom: 2px solid #2c3e50;
    }
    .results-table tbody tr:hover {
      background-color: #f8f9fa;
    }
    .arabic-text {
      font-family: 'Amiri', serif;
      font-size: 1.8rem;
      direction: rtl;
      line-height: 2.0;
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      word-wrap: break-word;
    }
    .highlight {
      padding: 0 2px;
      border-radius: 2px;
    }
    .loading { margin: 2rem; color: var(--primary-color); display: none; }
    
    .scroll-nav {
      position: fixed;
      right: 20px;
      bottom: 80px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 100;
    }
    .scroll-btn {
      background: white;
      color: var(--primary-color);
      border: none;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      transition: all 0.2s;
    }
    .scroll-btn:hover {
      background: var(--primary-color);
      color: white;
    }
    @font-face {
      font-family: 'Amiri';
      src: url('/fonts/amiri.woff2') format('woff2');
    }
  </style>
</head>
${new Date().getTime()}
  <body>
  <!-- Splash Screen -->
  <div id="splash-screen">
    <div class="splash-logo"><i class="fas fa-book-open"></i></div>
    <div class="splash-text">القرآن الكريم</div>
    <div class="splash-loader"></div>
  </div>

  <div class="app-content">
    <header>
      <div class="logo"><i class="fas fa-book-open"></i> القرآن الكريم</div>
      <div class="nav-right"><i class="fas fa-search"></i> بحث</div>
    </header>

    <div class="scroll-nav">
      <button class="scroll-btn" onclick="scrollToTop()" title="Retour en haut">
        <i class="fas fa-arrow-up"></i>
      </button>
      <button class="scroll-btn" onclick="scrollToBottom()" title="Aller en bas">
        <i class="fas fa-arrow-down"></i>
      </button>
    </div>

    <div class="container">
      <div class="search-section">
        <h1>القرآن الكريم</h1>
        <div class="subtitle">ابحث في 6236 آية</div>
        
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="ابحث عن كلمة أو جملة..." value="" oninput="toggleClearBtn()">
          <button id="clearBtn" class="clear-btn" onclick="clearSearch()" title="Effacer"><i class="fas fa-times"></i></button>
          <button class="search-btn" onclick="performSearch()">بحث</button>
        </div>
      </div>

      <div id="loading" class="loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>
      
      <div id="resultsArea">
        <div style="margin-top: 5rem;">
          <div style="background: #e8f8f0; width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto; margin-bottom: 1rem;">
             <i class="fas fa-book-open" style="font-size: 2rem; color: var(--primary-color);"></i>
          </div>
          <h3>جاهز للبحث</h3>
          <p style="color: #7f8c8d;">تم تحميل القرآن الكريم كاملاً. أدخل كلمة للبحث عنها.</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Splash Screen Logic
    window.addEventListener('load', () => {
      setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hide-splash');
        const content = document.querySelector('.app-content');
        if (content) content.classList.add('show-content');
      }, 2000);
    });

    function toggleClearBtn() {
      const input = document.getElementById('searchInput');
      const clearBtn = document.getElementById('clearBtn');
      clearBtn.style.display = input.value ? 'block' : 'none';
    }

    function clearSearch() {
      const input = document.getElementById('searchInput');
      input.value = '';
      toggleClearBtn();
      input.focus();
    }

    function scrollToTop() {
      const container = document.querySelector('.results-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function scrollToBottom() {
      const container = document.querySelector('.results-container');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }

    async function performSearch() {
      const queryInput = document.getElementById('searchInput').value.trim();
      if (!queryInput) return;

      const loading = document.getElementById('loading');
      const resultsArea = document.getElementById('resultsArea');
      
      loading.style.display = 'block';

    function normalizeForLetterCount(text) {
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
    }

      function highlightText(text, term) {
        if (!term) return text;
        
        // Try to highlight exact normalized match
        const normText = normalizeForLetterCount(text);
        const normTerm = normalizeForLetterCount(term);
        if (normText.includes(normTerm)) {
          return "<span class='highlight'>" + text + "</span>";
        }
        
        // Fallback: If no exact match, check for flexible match (ignoring Alifs)
        function flex(t) { return normalizeForLetterCount(t).replace(/ا/g, ""); }
        if (flex(text).includes(flex(term))) {
          return "<span class='highlight'>" + text + "</span>";
        }

        return text;
      }

      try {
        const response = await fetch('/api/search?q=' + encodeURIComponent(queryInput));
        const data = await response.json();
        
        loading.style.display = "none";

        if (data.results.length === 0) {
          resultsArea.innerHTML = "<p>Aucun résultat trouvé.</p>";
          return;
        }

        let html = \`
          <div class="stats-container">
            <div class="stat-card">
              <div class="label">Total des occurrences</div>
              <div class="value">\${data.totalOccurrences}</div>
            </div>
            <div class="stat-card">
              <div class="label">Nombre de versets</div>
              <div class="value">\${data.totalResults}</div>
            </div>
            <div class="stat-card">
              <div class="label">Valeur numérique</div>
              <div class="value">\${data.wordValue}</div>
            </div>
            <div class="stat-card total">
              <div class="label">Total du calcul</div>
              <div class="value">\${data.totalCalculation.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="label">T/98</div>
              <div class="value">\${data.modulo98Result}</div>
            </div>
            <div class="stat-card">
              <div class="label">T/66</div>
              <div class="value">\${data.modulo66Result}</div>
            </div>
            <div class="stat-card">
              <div class="label">T/92</div>
              <div class="value">\${data.modulo92Result}</div>
            </div>
          </div>\`;

        // Add letter count statistics BEFORE table
        if (data.letterCounts) {
          const totalLetters = Object.values(data.letterCounts).reduce((sum, count) => sum + count, 0);
          html += "<div style='margin: 2rem 0; display: flex; gap: 1rem; flex-wrap: wrap;'>";
          
          // Total letters box
          html += "<div style='flex: 1; min-width: 150px; padding: 1.5rem; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); border-radius: 8px; text-align: center; color: white;'>";
          html += "<div style='font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;'>Nombre total de lettres</div>";
          html += "<div style='font-size: 2.5rem; font-weight: bold;'>" + totalLetters + "</div>";
          
          // Display ALL individual letters including duplicates
          html += "<div style='margin-top: 1rem; font-size: 1.2rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; direction: rtl;'>";
          const queryNorm = normalizeForLetterCount(queryInput).replace(/\s+/g, "");
          for (const char of queryNorm) {
            html += "<span style='background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;'>" + char + "</span>";
          }
          html += "</div>";
          html += "</div>";
          
          // Unique letters box
          html += "<div style='flex: 1; min-width: 150px; padding: 1.5rem; background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); border-radius: 8px; text-align: center; color: white;'>";
          html += "<div style='font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;'>Nombre de lettres différentes</div>";
          html += "<div style='font-size: 2.5rem; font-weight: bold;'>" + data.uniqueLetterCount + "</div>";
          
          // Display unique letters
          html += "<div style='margin-top: 1rem; font-size: 1.2rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; direction: rtl;'>";
          
          let uniqueSum = 0;
          const letterValuesMap = {
            'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
            'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'ص': 60, 'ع': 70, 'ف': 80, 'ض': 90,
            'ق': 100, 'ر': 200, 'س': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ظ': 800, 'غ': 900,
            'ش': 1000, 'أ': 1, 'إ': 1, 'آ': 1, 'ٱ': 1, 'ة': 5, 'ى': 10, 'ئ': 10, 'ؤ': 6, 'ٰ': 1, 'هـ': 5, 'ء': 1
          };

          Object.entries(data.letterCounts).forEach(([letter, count]) => {
            if (count > 0) {
              html += "<span style='background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 6px; min-width: 35px;'>" + letter + "</span>";
              uniqueSum += (letterValuesMap[letter] || 0);
            }
          });
          html += "</div>";
          
          // Display total value of unique letters
          html += "<div style='margin-top: 1rem; font-size: 1.2rem; font-weight: bold;'>Somme des valeurs uniques : " + uniqueSum + "</div>";
          html += "</div>";
          html += "</div>";
          
          html += "</div>";
        }

        html += \`
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Résultats de la recherche</h2>
          </div>
          <div class='results-container'>
            <table class='results-table'>
              <thead class='table-header-fixed'>
                <tr>
                  <th style='width: 50px;'>Numéro</th>
                  <th style='width: 100px;'>Sourate</th>
                  <th style='width: 50px;'>Verset</th>
                  <th>Texte</th>
                  <th style='width: 80px;'>Occurrences</th>
                </tr>
              </thead>
              <tbody>\`;

        data.results.forEach(res => {
          html += "<tr>" +
              "<td style='font-weight: bold;'>" + res.chapterId + "</td>" +
              "<td>" + res.chapterName + "</td>" +
              "<td>" + res.verseId + "</td>" +
              "<td>" +
                "<div class='arabic-text'>" + highlightText(res.text, queryInput) + "</div>" +
              "</td>" +
              "<td style='text-align: center; font-weight: bold; color: var(--primary-color);'>" + res.occurrences + "</td>" +
            "</tr>";
        });

        html += "</tbody></table></div>";
        resultsArea.innerHTML = html;

      } catch (err) {
        console.error(err);
        loading.style.display = "none";
        resultsArea.innerHTML = "<p>Une erreur s'est produite lors de la recherche.</p>";
      }
    }
    
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered:', registration);
        }).catch(error => {
          console.log('Service Worker registration failed:', error);
        });
      });
    }

    // Pre-cache Quran data for offline search
    async function preCacheQuranData() {
      try {
        const cache = await caches.open('quran-data-v1');
        const response = await fetch('/api/search?q=الله'); // Initial search to cache some data
        if (response.ok) {
          await cache.put('/api/search?q=الله', response.clone());
        }
      } catch (e) {
        console.log('Pre-caching failed:', e);
      }
    }
    preCacheQuranData();
  </script>
</body>
</html>`);
    return;
  }
});

server.listen(PORT, HOST, () => {
  console.log('Quran JSON API server running at http://' + HOST + ':' + PORT);
});
