# Gc Card Fusion Calculator

A web-based tool to calculate card fusion probabilities and manage your card collection with multi-language support.

 **Live Demo:** [https://eitur.github.io/gcc-card/](https://eitur.github.io/gcc-card/)


## Features
* Browse and select cards from your collection
* Find cards by search, filter, or sort
* Calculate fusion success rates
* Fast performance with optimized image loading
* Daily automatic card data updates
* Support multiple languages and dark mode
* User selections persist across sessions


## Deployment
### 1. Generate multi-language files:
```bash
npm run build
```
**Generates:**
- `index.html` (English)
- `kr/index.html` (Korean)
- `br/index.html` (Portuguese)
- `tw/index.html` (Traditional Chinese)


### 2. Update Card Data
Fetch latest card information from online spreadsheet and generate JSON files:
```bash
python scripts/xls-converter.py
```
**Generates:**
- `cards-data/all-cards.json`
- `cards-data/group-1.json`
- `cards-data/group-2.json`
- ...

### 3. Deploy to GitHub Pages
```bash
# Commit generated files
git add .
git commit -m "Build for deployment"
git push origin main
```

GitHub Pages will automatically deploy from the `main` branch root.