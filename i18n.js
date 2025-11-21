class I18n {
    constructor() {
      this.currentLang = window.CURRENT_LANG || 'en';
      this.basePath = window.BASE_PATH || '.';
      this.translations = {};
      this.cardNames = {};
    }
  
    async init() {
      await this.loadTranslations(this.currentLang);
      await this.loadCardNames();
    }
  
    async loadTranslations(lang) {
      try {
        const response = await fetch(`${this.basePath}/locales/${lang}.json`);
        this.translations = await response.json();
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    }
  
    async loadCardNames() {
      try {
        const response = await fetch(`${this.basePath}/locales/card-names.json`);
        this.cardNames = await response.json();
      } catch (error) {
        console.error('Error loading card names:', error);
      }
    }
  
    t(path) {
      const keys = path.split('.');
      let value = this.translations;
      
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) return path;
      }
      
      return value;
    }
  
    getCardName(nameKey) {
      return this.cardNames[this.currentLang]?.[nameKey] || nameKey;
    }
  
    updateUI() {
      // Update text content
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = this.t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translated;
        } else if (el.tagName === 'OPTION') {
          el.textContent = translated;
        } else {
          el.textContent = translated;
        }
      });
  
      // Update HTML content
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        el.innerHTML = this.t(key);
      });
  
      // Update page title
      document.title = this.t('ui.title');
  
      // Update lang attribute
      document.documentElement.lang = this.currentLang;
  
      // Re-render dynamic content
      if (window.renderTable) renderTable();
      if (window.updateSummary) updateSummary();
    }
  }
  
  const i18n = new I18n();