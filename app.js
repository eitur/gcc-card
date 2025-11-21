let cards = [];
let sortColumn = null;
let sortDirection = 'asc';
const selected = new Set();

// Get base path for asset loading
const basePath = window.BASE_PATH || '.';

async function loadCards() {
  try {
    const jsonFiles = [
      `${basePath}/cards-data/group-1.json`,
      `${basePath}/cards-data/group-2.json`,
      `${basePath}/cards-data/group-3.json`,
      `${basePath}/cards-data/group-4.json`,
      `${basePath}/cards-data/group-5.json`,
      `${basePath}/cards-data/group-6.json`,
      `${basePath}/cards-data/group-7.json`
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

function renderTable() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const filterRegion = document.getElementById("filterRegion").value;
  const filterGroup = document.getElementById("filterGroup").value;

  let list = cards.filter(c => {
    const cardName = i18n.getCardName(c.nameKey).toLowerCase();
    return cardName.includes(search) &&
      (filterRegion ? c.region === filterRegion : true) &&
      (filterGroup ? c.group == filterGroup : true);
  });
  
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
    <tr>
      <td><input type="checkbox" ${selected.has(c.id) ? "checked" : ""} 
          onclick="toggle(${c.id})"></td>
      <td><div class='card-pic'></div></td>
      <td>${i18n.getCardName(c.nameKey)}</td>
      <td>${c.point}</td>
      <td>${c.group}</td>
      <td>${c.region}</td>
      <td>${c.id}</td>
    </tr>
  `).join("");

  updateSummary();
}

function toggle(id) {
  selected.has(id) ? selected.delete(id) : selected.add(id);
  saveSelections();
  updateSummary();
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
  cards.forEach(c => selected.add(c.id));
  saveSelections();
  renderTable();
}

function reverseSelect() {
  cards.forEach(c => selected.has(c.id) ? selected.delete(c.id) : selected.add(c.id));
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
      content += `${i18n.t('ui.group')} ${i}: ${groupStat.missing} ${i18n.t('ui.missing') || 'missing'} (${groupStat.selected}/${groupStat.total}) - ${groupStat.missingRate}%<br>`;
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

async function initApp() {
  await i18n.init();
  await loadCards();
  i18n.updateUI();
}

initApp();