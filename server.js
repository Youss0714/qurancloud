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

let quranCache = null;

function normalize(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u0652\u0670\u06E1\u06D6-\u06ED]/g, "")
    .replace(/[\u0671]/g, "ا")
    .replace(/[أإآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/[ئى]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ء/g, "")
    .replace(/\u0640/g, "")
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

try {
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
  console.log('Arabic Quran data pre-loaded');
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

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      results: results.slice(0, 100), 
      totalOccurrences, 
      totalResults: results.length,
      wordValue,
      totalCalculation
    }));
    return;
  }
  
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const html = `<!DOCTYPE html>
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
      --col-verses: #3498db;
      --col-value: #e67e22;
      --col-total: #27ae60;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      overflow-x: hidden;
    }
    #splash-screen {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: white;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      z-index: 1000;
      transition: opacity 0.8s ease-out, visibility 0.8s;
    }
    .splash-logo { font-size: 4rem; color: var(--primary-color); margin-bottom: 20px; }
    .splash-text { font-size: 1.8rem; font-weight: 600; }
    .splash-loader { margin-top: 30px; width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .hide-splash { opacity: 0 !important; visibility: hidden !important; }
    .app-content { opacity: 0; transform: translateY(20px); transition: all 0.8s ease-out; }
    .show-content { opacity: 1; transform: translateY(0); }
    header { background: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); flex-direction: row-reverse; }
    .logo { display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 1.2rem; flex-direction: row-reverse; }
    .logo i { color: var(--primary-color); }
    .container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; text-align: center; }
    .search-section { margin-bottom: 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #7f8c8d; margin-bottom: 2rem; }
    .search-box { display: flex; gap: 15px; background: white; padding: 8px; border-radius: 50px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 850px; margin: 0 auto; position: relative; align-items: center; border: 1px solid #f0f0f0; transition: all 0.3s ease; flex-direction: row-reverse; }
    .search-box:focus-within { box-shadow: 0 6px 25px rgba(46, 204, 113, 0.15); border-color: var(--primary-color); }
    .search-box input { flex: 1; border: none; padding: 15px 30px; border-radius: 50px; font-size: 1.1rem; outline: none; background: transparent; text-align: right; }
    .clear-btn { position: absolute; left: 170px; background: #f8f9fa; border: none; color: #95a5a6; cursor: pointer; font-size: 1rem; display: none; padding: 0; width: 28px; height: 28px; border-radius: 50%; line-height: 28px; }
    .search-btn { background: var(--primary-color); color: white; border: none; padding: 0 35px; height: 50px; border-radius: 40px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .stats-table-wrapper { margin-bottom: 2rem; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eee; }
    .stats-table { width: 100%; border-collapse: collapse; direction: rtl; }
    .stats-table th { background: #fdfdfd; padding: 18px 15px; text-align: center; color: #555; font-size: 0.95rem; font-weight: 600; border-bottom: 2px solid #f0f0f0; }
    .stats-table td { padding: 20px 15px; text-align: center; font-size: 1.5rem; font-weight: 700; }
    .stats-table td:nth-child(1) { color: var(--col-verses); background-color: rgba(52, 152, 219, 0.05); }
    .stats-table td:nth-child(2) { color: var(--col-value); background-color: rgba(230, 126, 34, 0.05); }
    .stats-table td:nth-child(3) { color: var(--col-total); background-color: rgba(39, 174, 96, 0.05); }
    .results-container { max-height: 600px; overflow-y: auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-top: 1rem; }
    .results-table { width: 100%; border-collapse: collapse; direction: rtl; }
    .table-header-fixed { position: sticky; top: 0; background: #f1f3f5; z-index: 10; }
    .results-table th { padding: 15px; text-align: right; font-size: 0.8rem; color: #7f8c8d; }
    .results-table td { padding: 20px 15px; border-bottom: 1px solid #eee; text-align: right; }
    .arabic-text { font-family: 'Amiri', serif; font-size: 1.8rem; direction: rtl; line-height: 2.5; }
    .highlight { background-color: #ffeb3b; padding: 0 2px; border-radius: 2px; font-weight: bold; }
    .scroll-nav { position: fixed; right: 20px; bottom: 80px; display: flex; flex-direction: column; gap: 12px; z-index: 100; }
    .scroll-btn { background: white; color: var(--primary-color); border: none; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
    @import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
  </style>
</head>
<body>
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
      <button class="scroll-btn" onclick="scrollToTop()"><i class="fas fa-arrow-up"></i></button>
      <button class="scroll-btn" onclick="scrollToBottom()"><i class="fas fa-arrow-down"></i></button>
    </div>
    <div class="container">
      <div class="search-section">
        <h1>القرآن الكريم</h1>
        <div class="subtitle">ابحث في 6236 آية</div>
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="ابحث عن كلمة أو جملة..." oninput="toggleClearBtn()">
          <button id="clearBtn" class="clear-btn" onclick="clearSearch()"><i class="fas fa-times"></i></button>
          <button class="search-btn" onclick="performSearch()">بحث</button>
        </div>
      </div>
      <div id="loading" style="display:none; color: var(--primary-color); margin: 2rem;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>
      <div id="resultsArea"></div>
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hide-splash');
        document.querySelector('.app-content').classList.add('show-content');
      }, 2000);
    });
    function toggleClearBtn() {
      const input = document.getElementById('searchInput');
      document.getElementById('clearBtn').style.display = input.value ? 'block' : 'none';
    }
    function clearSearch() {
      const input = document.getElementById('searchInput');
      input.value = ''; toggleClearBtn(); input.focus();
    }
    function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    function scrollToBottom() { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
    async function performSearch() {
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return;
      document.getElementById('loading').style.display = 'block';
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(query));
        const data = await res.json();
        document.getElementById('loading').style.display = 'none';
        if (data.results.length === 0) {
          document.getElementById('resultsArea').innerHTML = "<p>لم يتم العثور على نتائج.</p>";
          return;
        }
        let html = '<div class="stats-table-wrapper"><table class="stats-table"><thead><tr><th>عدد الآيات</th><th>القيمة العددية</th><th>الإجمالي الحسابي</th></tr></thead><tbody><tr><td>' + data.totalOccurrences + '</td><td>' + data.wordValue + '</td><td>' + data.totalCalculation.toLocaleString() + '</td></tr></tbody></table></div>';
        html += '<div class="results-container"><table class="results-table"><thead class="table-header-fixed"><tr><th style="width:50px">رقم</th><th style="width:100px">السورة</th><th style="width:50px">الآية</th><th>النص</th></tr></thead><tbody>';
        data.results.forEach(r => {
          html += '<tr><td>' + r.chapterId + '</td><td>' + r.chapterName + '</td><td>' + r.verseId + '</td><td class="arabic-text">' + r.text + '</td></tr>';
        });
        html += '</tbody></table></div>';
        document.getElementById('resultsArea').innerHTML = html;
      } catch (e) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('resultsArea').innerHTML = "<p>خطأ في البحث.</p>";
      }
    }
    document.getElementById('searchInput').addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
  </script>
</body>
</html>`;
    res.end(html);
  }
});

server.listen(PORT, HOST, () => {
  console.log('Server running at http://' + HOST + ':' + PORT);
});
