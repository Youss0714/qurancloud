const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";

const letterValues = {
  'ا': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'ص': 60, 'ع': 70, 'ف': 80, 'ض': 90,
  'ق': 100, 'ر': 200, 'س': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ظ': 800, 'غ': 900,
  'ش': 1000,
  'أ': 1, 'إ': 1, 'آ': 1, 'ٱ': 1, 'ة': 5, 'ى': 10, 'ئ': 10, 'ؤ': 6
};

// Cache normalized data at server startup
let quranCache = null;

function normalize(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u0652\u0670\u06E1\u06D6-\u06ED]/g, "") // Suppression des diacritiques (Tashkeel)
    .replace(/[\u0671]/g, "ا") // Alif Wasla ٱ -> ا
    .replace(/[أإآ]/g, "ا") // Normalisation des Alifs
    .replace(/ؤ/g, "و") // Normalisation Waw
    .replace(/[ئى]/g, "ي") // Normalisation Ya et Ya Hamza
    .replace(/ة/g, "ه") // Normalisation Ta Marbuta
    .replace(/ء/g, "") // Suppression Hamza isolée
    .replace(/\u0640/g, "") // Suppression Tatweel
    .replace(/\s+/g, " ")
    .trim();
}

function calculateGematria(text) {
  const norm = normalize(text).replace(/\s+/g, "");
  let total = 0;
  for (const char of norm) {
    total += letterValues[char] || 0;
  }
  return total;
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
  const url = urlParts[0];
  
  if (url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle Search API
  if (url === '/api/search') {
    const params = new URLSearchParams(urlParts[1] || '');
    const query = params.get('q');
    
    if (!query) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing query' }));
      return;
    }

    const searchNormalized = normalize(query);
    const wordValue = calculateGematria(query);
    let results = [];
    let totalOccurrences = 0;

    quranCache.forEach(chapter => {
      chapter.verses.forEach(verse => {
        let countInVerse = 0;

        if (searchNormalized && verse.normText.includes(searchNormalized)) {
          const matches = verse.normText.split(searchNormalized).length - 1;
          countInVerse += matches;
        }

        if (countInVerse > 0) {
          totalOccurrences += countInVerse;
          results.push({
            chapterId: chapter.id,
            chapterName: chapter.name,
            verseId: verse.id,
            text: verse.text
          });
        }
      });
    });

    const totalCalculation = wordValue * totalOccurrences;
    const modulo98Result = calculateModulo98(wordValue, totalOccurrences);
    const modulo66Result = calculateModulo66(wordValue, totalOccurrences);
    const modulo92Result = calculateModulo92(wordValue, totalOccurrences);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      results: results.slice(0, 100), 
      totalOccurrences, 
      totalResults: results.length,
      wordValue,
      totalCalculation,
      modulo98Result,
      modulo66Result,
      modulo92Result
    }));
    return;
  }
  
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>القرآن الكريم</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
      border-radius: 10px;
      direction: rtl;
    }
    .results-container {
      max-height: 600px;
      overflow-y: auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      margin-top: 1rem;
    }
    .table-header-fixed {
      position: sticky;
      top: 0;
      background: #f1f3f5;
      z-index: 10;
    }
    .results-table th {
      padding: 15px;
      text-align: right;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #7f8c8d;
    }
    .results-table td {
      padding: 20px 15px;
      border-bottom: 1px solid #eee;
      text-align: right;
    }
    .arabic-text {
      font-family: 'Amiri', serif;
      font-size: 1.8rem;
      direction: rtl;
      line-height: 2.5;
    }
    .highlight {
      background-color: #ffeb3b;
      color: #000;
      padding: 0 2px;
      border-radius: 2px;
      font-weight: bold;
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
    @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
  </style>
</head>
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

      function normalize(text) {
        if (!text) return "";
        return text
          .normalize("NFD")
          .replace(/[\\\\u064B-\\\\u0652\\\\u0670\\\\u06E1\\\\u06D6-\\\\u06ED]/g, "")
          .replace(/[\\\\u0671]/g, "ا")
          .replace(/[أإآ]/g, "ا")
          .replace(/ؤ/g, "و")
          .replace(/[ئى]/g, "ي")
          .replace(/ة/g, "ه")
          .replace(/ء/g, "")
          .replace(/\\\\u0640/g, "")
          .replace(/\\\\s+/g, " ")
          .trim();
      }

      function highlightText(text, term) {
        if (!term) return text;
        const normText = normalize(text);
        const normTerm = normalize(term);
        if (!normText.includes(normTerm)) return text;
        return "<span class='highlight'>" + text + "</span>";
      }

      try {
        const response = await fetch('/api/search?q=' + encodeURIComponent(queryInput));
        const data = await response.json();
        
        loading.style.display = "none";

        if (data.results.length === 0) {
          resultsArea.innerHTML = "<p>لم يتم العثور على نتائج.</p>";
          return;
        }

        let html = \`
          <div class="stats-container">
            <div class="stat-card">
              <div class="label">عدد الآيات</div>
              <div class="value">\${data.totalOccurrences}</div>
            </div>
            <div class="stat-card">
              <div class="label">القيمة العددية</div>
              <div class="value">\${data.wordValue}</div>
            </div>
            <div class="stat-card total">
              <div class="label">الإجمالي الحسابي</div>
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
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-direction: row-reverse;">
            <h2 style="margin: 0;">نتائج البحث</h2>
          </div>
          <div class='results-container'>
            <table class='results-table'>
              <thead class='table-header-fixed'>
                <tr>
                  <th style='width: 50px;'>رقم</th>
                  <th style='width: 100px;'>السورة</th>
                  <th style='width: 50px;'>الآية</th>
                  <th>النص</th>
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
            "</tr>";
        });

        html += "</tbody></table></div>";
        if (data.totalResults > 100) {
          html += "<p style='margin-top: 1rem; color: #7f8c8d;'>عرض أول 100 نتيجة فقط...</p>";
        }
        resultsArea.innerHTML = html;

      } catch (err) {
        console.error(err);
        loading.style.display = "none";
        resultsArea.innerHTML = "<p>حدث خطأ أثناء البحث.</p>";
      }
    }
    
    document.getElementById('searchInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  </script>
</body>
</html>
`);
    return;
  }
});

server.listen(PORT, HOST, () => {
  console.log('Quran JSON API server running at http://' + HOST + ':' + PORT);
});
