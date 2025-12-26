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
- December 26, 2025: Added modulo 98 calculation function (T/98) to display remainder of (N*O) divided by 98
- December 25, 2025: Initial setup on Replit environment

## Features
- **Gematria Calculation**: Calculates numeric values for Arabic words based on letter values
- **Search Functionality**: Full-text search across all Quranic verses with normalization
- **Modulo 98 Calculation (T/98)**: Computes (wordValue * occurrences) mod 98
  - Formula: D = P - (floor(P/98) * 98), where P = N * O
  - Example: N=66, O=2667 → P=176022 → D=14

## Statistics Displayed in Search Results
- Number of verses (عدد الآيات)
- Numeric word value (القيمة العددية)
- Total calculation: wordValue × occurrences (الإجمالي الحسابي)
- T/98: Modulo 98 result
