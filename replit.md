# Quran JSON API

## Overview
This project serves Quran data in JSON format as a REST API, providing access to Quranic text with translations in multiple languages.

## Current State
- Project is fully functional and running
- Serves static JSON files via a Node.js HTTP server on port 5000

## Project Architecture
- **server.js**: Simple Node.js HTTP server that serves JSON files
- **quran_*.json**: Root-level Quran data files with translations
- **chapters/**: Chapter data organized by language code (bn, en, es, fr, id, ru, sv, tr, ur, zh)
- **verses/**: Individual verse files with all translations

## Available Languages
- English (en), Spanish (es), French (fr), Indonesian (id), Russian (ru)
- Swedish (sv), Turkish (tr), Urdu (ur), Bengali (bn), Chinese (zh)

## API Endpoints
- `/` - API documentation homepage
- `/quran.json` - Full Quran (Arabic)
- `/quran_{lang}.json` - Translations (en, es, fr, id, ru, sv, tr, ur, bn, zh)
- `/chapters/{lang}/{id}.json` - Chapter by language
- `/verses/{id}.json` - Individual verse with all translations

## Technology Stack
- Node.js 20
- Native HTTP module (no external dependencies)

## Recent Changes
- December 26, 2025: Added letter count display at bottom of results showing Arabic alphabet composition of search query
- December 26, 2025: Made app installable as PWA on Android/iOS with manifest.json and service worker
- December 26, 2025: Made app fully offline-capable by serving Font Awesome and Amiri fonts locally
- December 26, 2025: Enhanced table styling with proper borders and clear column/row separation

## Offline Functionality
✅ **App now works completely offline:**
- All resources (CSS, fonts) are served locally
- Font Awesome icons: `/css/all-local.min.css` + `/fonts/fa-*.woff2`
- Amiri Arabic font: `/fonts/amiri.woff2`
- Quranic data: `quran.json` (cached at startup)
- No external CDN dependencies required

## Features
- **Gematria Calculation**: Calculates numeric values for Arabic words based on letter values
- **Letter Count Analysis**: Shows the composition of search term by Arabic letters at bottom of results table
- **Search Functionality**: Full-text search across all Quranic verses with normalization
- **Modulo Operations**: T/98, T/66, T/92 calculations for numerical analysis
- **PWA Installation**: Install as app on Android, iOS, Windows, and macOS
- **Modulo 98 Calculation (T/98)**: Computes (wordValue * occurrences) mod 98
  - Formula: D = P - (floor(P/98) * 98), where P = N * O
- **Modulo 66 Calculation (T/66)**: Computes (wordValue * occurrences) mod 66
  - Formula: D = P - (floor(P/66) * 66), where P = N * O
- **Modulo 92 Calculation (T/92)**: Computes (wordValue * occurrences) mod 92
  - Formula: D = P - (floor(P/92) * 92), where P = N * O

## Statistics Displayed in Search Results
- Number of verses (عدد الآيات)
- Numeric word value (القيمة العددية)
- Total calculation: wordValue × occurrences (الإجمالي الحسابي)
- T/98: Modulo 98 result
- T/66: Modulo 66 result
- T/92: Modulo 92 result
