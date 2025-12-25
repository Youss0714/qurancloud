const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

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

  const url = req.url.split('?')[0];
  let filePath = '.' + url;
  
  if (url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Al-Qur'an</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    :root {
      --primary-color: #2ecc71;
      --bg-color: #f8f9fa;
      --text-color: #2c3e50;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    header {
      background: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: bold;
      font-size: 1.2rem;
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
    }
    .search-box:focus-within {
      box-shadow: 0 6px 25px rgba(46, 204, 113, 0.15);
      border-color: var(--primary-color);
    }
    .search-box input {
      flex: 1;
      border: none;
      padding: 15px 45px 15px 30px;
      border-radius: 50px;
      font-size: 1.1rem;
      outline: none;
      background: transparent;
    }
    .clear-btn {
      position: absolute;
      right: 170px;
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

    .results-table {
      width: 100%;
      background: white;
      border-collapse: collapse;
      border-radius: 10px;
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
      text-align: left;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #7f8c8d;
    }
    .results-table td {
      padding: 20px 15px;
      border-bottom: 1px solid #eee;
      text-align: left;
    }
    .arabic-text {
      font-family: 'Amiri', serif;
      font-size: 1.8rem;
      direction: rtl;
      line-height: 2.5;
    }
    .french-text {
      font-size: 0.95rem;
      color: #7f8c8d;
      margin-top: 8px;
    }
    .loading { margin: 2rem; color: var(--primary-color); display: none; }
    
    .scroll-nav {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 100;
    }
    .scroll-btn {
      background: white;
      color: var(--primary-color);
      border: 1px solid #eee;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
  <header>
    <div class="logo"><i class="fas fa-book-open"></i> Al-Qur'an</div>
    <div class="nav-right"><i class="fas fa-search"></i> Recherche</div>
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
      <h1>Al-Quran</h1>
      <div class="subtitle">Recherchez dans 6 236 versets</div>
      
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Rechercher un mot, une phrase..." value="ض" oninput="toggleClearBtn()">
        <button id="clearBtn" class="clear-btn" onclick="clearSearch()" title="Effacer"><i class="fas fa-times"></i></button>
        <button class="search-btn" onclick="performSearch()">Rechercher</button>
      </div>
    </div>

    <div id="loading" class="loading"><i class="fas fa-spinner fa-spin"></i> Chargement...</div>
    
    <div id="resultsArea">
      <div style="margin-top: 5rem;">
        <div style="background: #e8f8f0; width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto; margin-bottom: 1rem;">
           <i class="fas fa-book-open" style="font-size: 2rem; color: var(--primary-color);"></i>
        </div>
        <h3>Prêt à rechercher</h3>
        <p style="color: #7f8c8d;">Le Coran complet (6236 versets) est chargé. Entrez un mot clé ci-dessus pour l'explorer instantanément, même hors ligne.</p>
      </div>
    </div>
  </div>

  <script>
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
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return;

      const loading = document.getElementById('loading');
      const resultsArea = document.getElementById('resultsArea');
      
      loading.style.display = 'block';
      resultsArea.innerHTML = '';

      try {
        // En mode réel, nous devrions indexer les fichiers ou utiliser une API de recherche.
        // Ici, pour la démo, nous allons charger quran.json et filtrer.
        const response = await fetch('/quran_fr.json');
        const data = await response.json();
        
        const searchLower = query.toLowerCase();
        let results = [];
        data.forEach(chapter => {
          chapter.verses.forEach(verse => {
            const translationFr = (verse.translation || '').toLowerCase();
            const verseText = (verse.text || '').toLowerCase();

            if (translationFr.includes(searchLower) || verseText.includes(searchLower)) {
              results.push({
                chapterId: chapter.id,
                chapterName: chapter.name,
                verseId: verse.id,
                text: verse.text,
                translation: verse.translation
              });
            }
          });
        });

        loading.style.display = 'none';

        if (results.length === 0) {
          resultsArea.innerHTML = '<p>Aucun résultat trouvé.</p>';
          return;
        }

        let html = \`
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Résultats</h2>
            <div style="background: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; color: #7f8c8d; border: 1px solid #eee;">
              \${results.length} occurrences trouvées
            </div>
          </div>
          <div class="results-container">
            <table class="results-table">
              <thead class="table-header-fixed">
                <tr>
                  <th>Num</th>
                  <th>Sourat</th>
                  <th>Verset</th>
                  <th>Texte</th>
                </tr>
              </thead>
              <tbody>
        \`;

        results.slice(0, 50).forEach(res => {
          html += \`
            <tr>
              <td style="font-weight: bold; width: 50px;">\${res.chapterId}</td>
              <td style="width: 100px;">\${res.chapterName}</td>
              <td style="width: 50px;">\${res.verseId}</td>
              <td>
                <div class="arabic-text">\${res.text}</div>
                <div class="french-text">\${res.translation}</div>
              </td>
            </tr>
          \`;
        });

        html += '</tbody></table></div>';
        if (results.length > 50) {
          html += '<p style="margin-top: 1rem; color: #7f8c8d;">Affichage des 50 premiers résultats...</p>';
        }
        resultsArea.innerHTML = html;

      } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        resultsArea.innerHTML = '<p>Erreur lors de la recherche.</p>';
      }
    }
  </script>
</body>
</html>
    `);
    return;
  }

  if (!filePath.endsWith('.json') && !filePath.includes('.')) {
    filePath = filePath + '.json';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found', path: req.url }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Quran JSON API server running at http://${HOST}:${PORT}`);
});
