# GCC Card Fusion Calculator

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


## Result Calculations
### 1. Probabilities of Getting a Missing Card by Point Range

$P(\text{missing cards rate in that group}) = (\text{number of missing cards in that group}) \times P(\text{individual card})$

$P(\text{missing card}) = Σ [P(\text{missing cards rate in that group}) \times P(\text{fusion rate gives that group})]$

### 2. Expected Collection Level Gain per Fusion by Point Range

Each level up adds 1 to collection level: $\text{level gain} = 1$

$\text{expected card value} = (\text{level gain} / \text{copies needed to next level}) \times P(\text{individual card})$

$\text{group expected card value} = Σ(\text{expected card value in that group})$

$\text{expected level gain per fusion} = Σ [P(\text{group expected card value}) \times P(\text{fusion rate gives that group})]$


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