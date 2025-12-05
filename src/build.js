const fs = require('fs');
const path = require('path');

// Read from src/, write to root (or docs/)
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const outputDir = path.join(__dirname, '..'); // or '../docs' if using docs folder

const configs = [
  { 
    lang: 'en', 
    basePath: '.', 
    output: path.join(outputDir, 'index.html'),
    activeEn: 'active',
    activeKr: '',
    activeBr: '',
    activeTw: '',

    title: 'Card Fusion Calculator',
    description: 'Calculate optimal card fusion strategies for GrandChase Classic. Track your card collection, analyze probabilities, and plan your upgrades with official rate tables.',
    keywords: 'GrandChase Classic, card fusion, card fuse, card system, calculator, card collection, fusion probability, GCC cards, Grand Chase',
    ogTitle: 'Card Fusion Calculator - GrandChase Classic',
    ogDescription: 'Calculate optimal card fusion strategies for GrandChase Classic',
  },
  { 
    lang: 'kr', 
    basePath: '..', 
    output: path.join(outputDir, 'kr/index.html'),
    activeEn: '',
    activeKr: 'active',
    activeBr: '',
    activeTw: '',

    title: '카드 합성 계산기',
    description: 'GrandChase Classic의 최적 카드 합성 전략을 계산하세요. 카드 컬렉션을 추적하고 확률을 분석하며 공식 확률표로 업그레이드를 계획하세요.',
    keywords: 'GrandChase Classic, 그랜드체이스 클래식, 카드 합성, 카드 조합, 카드 시스템, 계산기, 카드 컬렉션, 합성 확률, 그랜드체이스 카드, 그체, 그체클',
    ogTitle: '카드 합성 계산기 - 그랜드체이스 클래식',
    ogDescription: '그랜드체이스 클래식의 최적 카드 합성 전략을 계산',
  },
  { 
    lang: 'br', 
    basePath: '..', 
    output: path.join(outputDir, 'br/index.html'),
    activeEn: '',
    activeKr: '',
    activeBr: 'active',
    activeTw: '',

    title: 'Calculadora de Fusão de Cartas',
    description: 'Calcule estratégias ideais de fusão de cartas para GrandChase Classic. Acompanhe sua coleção de cartas, analise probabilidades e planeje seus upgrades com tabelas de taxas oficiais.',
    keywords: 'GrandChase Classic, fusão de cartas, fusão de card, sistema de cartas, calculadora, coleção de cartas, probabilidade de fusão, cartas GCC, Grand Chase',
    ogTitle: 'Calculadora de Fusão de Cartas - GrandChase Classic',
    ogDescription: 'Calcule estratégias ideais de fusão de cartas para GrandChase Classic',
  },
  { 
    lang: 'tw', 
    basePath: '..', 
    output: path.join(outputDir, 'tw/index.html'),
    activeEn: '',
    activeKr: '',
    activeBr: '',
    activeTw: 'active',

    title: '卡片合成計算器',
    description: '計算永恆冒險GrandChase Classic的最佳卡片合成策略。追蹤您的卡片收藏，分析機率，並使用官方機率表規劃升級。',
    keywords: 'GrandChase Classic, 永恆冒險, 卡片合成, 卡片融合, 卡片系統, 計算器, 卡片收藏, 合成機率, GCC卡片, Grand Chase',
    ogTitle: '卡片合成計算器 - 永恆冒險GrandChase Classic',
    ogDescription: '計算永恆冒險GrandChase Classic的最佳卡片合成策略',
  }
];

configs.forEach(config => {
  let content = template
    .replace(/\{\{LANG\}\}/g, config.lang)
    .replace(/\{\{BASE_PATH\}\}/g, config.basePath)
    .replace(/\{\{ACTIVE_EN\}\}/g, config.activeEn)
    .replace(/\{\{ACTIVE_KR\}\}/g, config.activeKr)
    .replace(/\{\{ACTIVE_BR\}\}/g, config.activeBr)
    .replace(/\{\{ACTIVE_TW\}\}/g, config.activeTw)
    .replace(/\{\{TITLE\}\}/g, config.title)
    .replace(/\{\{DESCRIPTION\}\}/g, config.description)
    .replace(/\{\{KEYWORDS\}\}/g, config.keywords)
    .replace(/\{\{OG_TITLE\}\}/g, config.ogTitle)
    .replace(/\{\{OG_DESCRIPTION\}\}/g, config.ogDescription);
  
  const dir = path.dirname(config.output);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(config.output, content);
  console.log(`✓ Generated ${path.relative(outputDir, config.output)}`);
});

console.log('\nBuild complete!');