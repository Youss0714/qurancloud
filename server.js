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

  let filePath = '.' + req.url;
  
  if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (filePath === './') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quran JSON API</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #2c3e50; }
    h2 { color: #34495e; margin-top: 30px; }
    ul { line-height: 2; }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Quran JSON API</h1>
  <p>This API provides Quran data in JSON format with multiple language translations.</p>
  
  <h2>Available Endpoints</h2>
  <ul>
    <li><a href="/quran.json">/quran.json</a> - Full Quran (Arabic)</li>
    <li><a href="/quran_en.json">/quran_en.json</a> - English translation</li>
    <li><a href="/quran_bn.json">/quran_bn.json</a> - Bengali translation</li>
    <li><a href="/quran_es.json">/quran_es.json</a> - Spanish translation</li>
    <li><a href="/quran_fr.json">/quran_fr.json</a> - French translation</li>
    <li><a href="/quran_id.json">/quran_id.json</a> - Indonesian translation</li>
    <li><a href="/quran_ru.json">/quran_ru.json</a> - Russian translation</li>
    <li><a href="/quran_sv.json">/quran_sv.json</a> - Swedish translation</li>
    <li><a href="/quran_tr.json">/quran_tr.json</a> - Turkish translation</li>
    <li><a href="/quran_ur.json">/quran_ur.json</a> - Urdu translation</li>
    <li><a href="/quran_zh.json">/quran_zh.json</a> - Chinese translation</li>
    <li><a href="/quran_transliteration.json">/quran_transliteration.json</a> - Transliteration</li>
  </ul>
  
  <h2>Chapters</h2>
  <ul>
    <li><code>/chapters/index.json</code> - List of all chapters</li>
    <li><code>/chapters/{lang}/{chapter_id}.json</code> - Chapter by language (en, es, fr, etc.)</li>
    <li>Example: <a href="/chapters/en/1.json">/chapters/en/1.json</a></li>
  </ul>
  
  <h2>Verses</h2>
  <ul>
    <li><code>/verses/{verse_id}.json</code> - Individual verse with all translations</li>
    <li>Example: <a href="/verses/1.json">/verses/1.json</a></li>
  </ul>
</body>
</html>
    `);
    return;
  }

  if (!filePath.endsWith('.json')) {
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
