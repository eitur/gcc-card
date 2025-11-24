const isGitHubPages = window.location.hostname.includes('github.io');
const BASE_PATH = isGitHubPages ? '/gcc-card' : '';

function getLangUrl(lang) {
  if (lang === 'en') {
    return `${BASE_PATH}/`;
  }
  return `${BASE_PATH}/${lang}/`;
}

// Update links on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('[href="/"]').href = getLangUrl('en');
  document.querySelector('[href="/kr/"]').href = getLangUrl('kr');
  document.querySelector('[href="/br/"]').href = getLangUrl('br');
  document.querySelector('[href="/tw/"]').href = getLangUrl('tw');
});

let cards = [];
let sortColumn = null;
let sortDirection = 'asc';
const selected = new Set();

// Get base path for asset loading
const basePath = window.BASE_PATH || '.';
const imageBasePath = `${basePath}/images/cards-webp`; // Image folder path

async function loadCards() {
  try {
    const jsonFiles = [
      `${basePath}/cards-data/group-1.json`,
      `${basePath}/cards-data/group-2.json`,
      `${basePath}/cards-data/group-3.json`,
      `${basePath}/cards-data/group-4.json`,
      `${basePath}/cards-data/group-5.json`,
      `${basePath}/cards-data/group-6.json`,
      `${basePath}/cards-data/group-7.json`,
      `${basePath}/cards-data/group-none.json`
    ];
    
    const responses = await Promise.all(jsonFiles.map(file => fetch(file)));
    const dataArrays = await Promise.all(responses.map(r => r.json()));
    
    cards = dataArrays.flat();
    loadSelections();
    renderTable();
  } catch (error) {
    console.error('Error loading cards:', error);
  }
}

function loadSelections() {
  const saved = localStorage.getItem('cardSelections');
  if (saved) {
    const selections = JSON.parse(saved);
    selections.forEach(id => selected.add(id));
  }
}

function saveSelections() {
  localStorage.setItem('cardSelections', JSON.stringify([...selected]));
}

function sortTable(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }
  
  document.querySelectorAll('.sort-indicator').forEach(el => {
    el.className = 'sort-indicator';
  });
  
  const indicator = document.getElementById(`sort-${column}`);
  if (indicator) {
    indicator.className = `sort-indicator ${sortDirection}`;
  }
  
  renderTable();
}

// Get currently filtered/visible cards
function getFilteredCards() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const filterRegion = document.getElementById("filterRegion").value;
  const filterGroup = document.getElementById("filterGroup").value;

  return cards.filter(c => {
    const cardName = i18n.getCardName(c.id).toLowerCase();
    return cardName.includes(search) &&
      (filterRegion ? c.region === filterRegion : true) &&
      (filterGroup ? c.group == filterGroup : true);
  });
}

function renderTable() {
  let list = getFilteredCards();
  
  if (sortColumn) {
    list.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? 
          valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });
  }

  document.getElementById("cardTable").innerHTML = list.map(c => `
    <tr class="card-row" onclick="toggleRow(${c.id}, event)">
      <td><input type="checkbox" ${selected.has(c.id) ? "checked" : ""} 
          onclick="event.stopPropagation(); toggle(${c.id})"></td>
      <td>
        <div class='card-pic' 
             data-src='${imageBasePath}/${c.image}'
             title='${i18n.getCardName(c.id)}'>
        </div>
      </td>
      <td>${i18n.getCardName(c.id)}</td>
      <td>${c.point}</td>
      <td>${c.group}</td>
      <td style="display:none;">${c.region}</td>
      <td>${c.id}</td>
    </tr>
  `).join("");

  // Initialize lazy loading for newly rendered images
  initLazyLoading();
  updateSummary();
}

function initLazyLoading() {
  // Observe all card images with data-src attribute
  document.querySelectorAll('.card-pic[data-src]').forEach(img => {
    lazyLoader.observe(img);
  });
}

function toggle(id) {
  selected.has(id) ? selected.delete(id) : selected.add(id);
  saveSelections();
  updateSummary();
}

// New function to handle row clicks
function toggleRow(id, event) {
  // Don't toggle if clicking on the checkbox itself (handled by its own onclick)
  if (event.target.type === 'checkbox') {
    return;
  }
  
  toggle(id);
  
  // Update the checkbox state
  const checkbox = event.currentTarget.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.checked = selected.has(id);
  }
}

function resetCards() {
  selected.clear();
  saveSelections();
  document.getElementById("searchBox").value = "";
  document.getElementById("filterRegion").value = "";
  document.getElementById("filterGroup").value = "";
  sortColumn = null;
  sortDirection = 'asc';
  document.querySelectorAll('.sort-indicator').forEach(el => {
    el.className = 'sort-indicator';
  });
  renderTable();
}

function selectAll() {
  // Only select currently visible/filtered cards
  const filteredCards = getFilteredCards();
  filteredCards.forEach(c => selected.add(c.id));
  saveSelections();
  renderTable();
}

function invertSelect() {
  // Only invert selection for currently visible/filtered cards
  const filteredCards = getFilteredCards();
  filteredCards.forEach(c => {
    selected.has(c.id) ? selected.delete(c.id) : selected.add(c.id);
  });
  saveSelections();
  renderTable();
}

function calculateStats() {
  const groupStats = {};
  for (let i = 1; i <= 7; i++) {
    const groupCards = cards.filter(c => c.group === i);
    const selectedInGroup = groupCards.filter(c => selected.has(c.id));
    const missingCount = groupCards.length - selectedInGroup.length;
    const groupRate = groupCards[0]?.rate || 0;
    
    groupStats[i] = {
      total: groupCards.length,
      selected: selectedInGroup.length,
      missing: missingCount,
      rate: groupRate,
      missingRate: ((missingCount * groupRate) * 100).toFixed(2)
    };
  }

  const fusionRates = [
    { range: '1-50', rates: { 1: 100.00, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 } },
    { range: '51-95', rates: { 1: 20.00, 2: 70.00, 3: 10.00, 4: 0, 5: 0, 6: 0, 7: 0 } },
    { range: '96-140', rates: { 1: 10.00, 2: 70.00, 3: 20.00, 4: 0, 5: 0, 6: 0, 7: 0 } },
    { range: '141-186', rates: { 1: 0, 2: 20.00, 3: 70.00, 4: 10.00, 5: 0, 6: 0, 7: 0 } },
    { range: '187-230', rates: { 1: 0, 2: 0, 3: 20.00, 4: 70.00, 5: 10.00, 6: 0, 7: 0 } },
    { range: '231-276', rates: { 1: 0, 2: 0, 3: 10.00, 4: 70.00, 5: 20.00, 6: 0, 7: 0 } },
    { range: '277-347', rates: { 1: 0, 2: 0, 3: 0, 4: 20.00, 5: 70.00, 6: 10.00, 7: 0 } },
    { range: '348-383', rates: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 20.00, 6: 70.00, 7: 10.00 } },
    { range: '384-408', rates: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10.00, 6: 70.00, 7: 20.00 } },
    { range: '409-500', rates: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 100.00 } }
  ];

  const pointStats = {};
  for (const fusionRatesData of fusionRates) {
    let totalProbability = 0;
    
    for (let group = 1; group <= 7; group++) {
      const fusionRate = fusionRatesData.rates[group];
      if (fusionRate > 0 && groupStats[group]) {
        totalProbability += (groupStats[group].missingRate / 100) * (fusionRate / 100);
      }
    }
    
    pointStats[fusionRatesData.range] = {
      point: fusionRatesData.range,
      probabilityPoints: (totalProbability * 100).toFixed(2)
    };
  }

  let sortedPointStats = Object.values(pointStats)
    .sort((a, b) => {
      const probDiff = parseFloat(b.probabilityPoints) - parseFloat(a.probabilityPoints);
      if (probDiff !== 0) return probDiff;
      
      const [aMin] = a.point.split('-').map(Number);
      const [bMin] = b.point.split('-').map(Number);
      return aMin - bMin;
    })
    .slice(0, 3);

  return { groupStats, pointStats, sortedPointStats };
}

function updateSummary() {
  const summaryEl = document.getElementById("summaryText");
  
  if (selected.size === 0) {
    summaryEl.innerHTML = i18n.t('ui.noCards');
  } else {
    const sortedStats = calculateStats().sortedPointStats;
    const lines = sortedStats.map(stat => 
      `<strong>${stat.point}</strong>: ${stat.probabilityPoints}%`
    );
    summaryEl.innerHTML = lines.join('<br>');
  }
}

function showHelp() {
  document.getElementById("helpModal").style.display = "block";
}

function showDetails() {
  let content = '';
  
  if (selected.size === 0) {
    content = `<div class="no-cards">${i18n.t('ui.noCards')}</div>`;
  } else {
    const stats = calculateStats();
    content += `<div class="missing-summary"><strong>${i18n.t('ui.probabilitiesByRange') || 'Probabilities by Point Ranges'}</strong><br>`;
    
    for (const pointStatsData of Object.values(stats.pointStats)) {
      content += `${i18n.t('ui.pointRange') || 'Point Range'} ${pointStatsData.point}: ${pointStatsData.probabilityPoints}%<br>`;
    }

    content += `</div><div class="missing-summary"><strong>${i18n.t('ui.missingCardsByGroup') || 'Missing Cards by Group'}</strong><br>`;
    for (let i = 1; i <= 7; i++) {
      const groupStat = stats.groupStats[i];
      content += `${i18n.t('ui.group')} ${i}: ${groupStat.missing} ${i18n.t('ui.missing') || 'missing'} (${groupStat.selected}/${groupStat.total}) - ${i18n.t('ui.progress')} ${(100 - groupStat.missingRate).toFixed(2)}%<br>`;
    }
    content += '</div>';
  }
  
  document.getElementById("detailsContent").innerHTML = content;
  document.getElementById("detailsModal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = "none";
  }
}

// Dark mode toggle functionality
function toggleTheme() {
  const body = document.body;
  const feedbackIcon = document.querySelector('.feedback-icon');
  const themeIcon = document.querySelector('.theme-icon');
  
  body.classList.toggle('dark-mode');
  
  // Update icon
  if (body.classList.contains('dark-mode')) {
    feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-light.png`;
    themeIcon.src = `${window.BASE_PATH}/images/theme/light-mode.png`;
    themeIcon.alt = 'Light Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-dark.png`;
    themeIcon.src = `${window.BASE_PATH}/images/theme/dark-mode.png`;
    themeIcon.alt = 'Dark Mode';
    localStorage.setItem('theme', 'light');
  }
}

// Load saved theme on page load
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  const feedbackIcon = document.querySelector('.feedback-icon');
  const themeIcon = document.querySelector('.theme-icon');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) {
      feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-light.png`;
      themeIcon.src = `${window.BASE_PATH}/images/theme/light-mode.png`;
      themeIcon.alt = 'Light Mode';
    }
  } else {
    if (themeIcon) {
      feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-dark.png`;
      themeIcon.src = `${window.BASE_PATH}/images/theme/dark-mode.png`;
      themeIcon.alt = 'Dark Mode';
    }
  }
}
// Feedback functionality
function showFeedback() {
  document.getElementById("feedbackModal").style.display = "block";
  document.getElementById("feedbackStatus").style.display = "none";
}

async function sendFeedback(event) {
  event.preventDefault();
  
  const email = document.getElementById("feedbackEmail").value;
  const message = document.getElementById("feedbackMessage").value;
  const submitBtn = event.target.querySelector('.submit-btn');
  const statusDiv = document.getElementById("feedbackStatus");
  
  // Store original button text
  const originalBtnText = submitBtn.textContent;
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = i18n.t('ui.sending') || 'Sending...';
  statusDiv.style.display = 'none';

  let locationInfo = 'Unknown';
  try {
    const geoResponse = await fetch('https://ipapi.co/json/');
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      locationInfo = `${geoData.city || 'Unknown'}, ${geoData.region || ''}, ${geoData.country_name || 'Unknown'} (${geoData.ip || ''})`;
    }
  } catch (geoError) {
    console.log('Could not fetch location:', geoError);
  }
  
  try {
    const response = await fetch('https://formspree.io/f/xzzwknop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email || 'anonymous@feedback.com',
        message: email ? message : `[Anonymous Submission]\n\n${message}`,
        page: window.location.href,
        language: window.CURRENT_LANG || 'en',
        location: locationInfo,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      statusDiv.className = 'feedback-status success';
      statusDiv.textContent = i18n.t('ui.feedbackSuccess') || 'Thank you! Your feedback has been sent successfully.';
      statusDiv.style.display = 'block';

      // Clear form AFTER successful submission
      document.getElementById("feedbackForm").reset();
      
      // Clear form and close modal after 2 seconds
      setTimeout(() => {
        closeModal('feedbackModal');
      }, 2000);
    } else {
      throw new Error('Failed to send feedback');
    }
  } catch (error) {
    statusDiv.className = 'feedback-status error';
    statusDiv.textContent = i18n.t('ui.feedbackError') || 'Sorry, there was an error sending your feedback. Please try again.';
    statusDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

// Scroll to Top functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Show/hide scroll to top button based on scroll position
function handleScrollButton() {
  const scrollButton = document.getElementById('scrollToTop');
  if (scrollButton) {
    if (window.pageYOffset > 300) {
      scrollButton.classList.add('visible');
    } else {
      scrollButton.classList.remove('visible');
    }
  }
}

// Add scroll event listener
window.addEventListener('scroll', handleScrollButton);

// Call loadTheme immediately when script loads
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  handleScrollButton();
});

async function initApp() {
  await i18n.init();
  await loadCards();
  i18n.updateUI();
}

initApp();