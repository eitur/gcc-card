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

$P(missing\_cards\_rate\_in\_that\_group) = (number\_of\_missing\_cards\_in\_that\_group) × P(individual\_card)$

$P(missing\_card) = Σ [P(missing\_cards\_rate\_in\_that\_group) × P(fusion\_rate\_gives\_that\_group)]$

### 2. Expected Collection Level Gain per Fusion by Point Range

Each level up adds 1 to collection level: $level\_gain = 1$

$expected\_card\_value = (level\_gain / copies\_needed\_to\_next\_level) × P(individual\_card)$

$group\_expected\_card\_value = Σ(expected\_card\_value\_in\_that\_group)$

$expected\_level\_gain\_per\_fusion = Σ [P(group\_expected\_card\_value) × P(fusion\_rate\_gives\_that\_group)]$


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