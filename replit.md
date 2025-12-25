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
- December 25, 2025: Initial setup on Replit environment
