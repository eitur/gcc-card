// Register datalabels plugin if available
if (typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}

const isGitHubPages = window.location.hostname.includes('github.io');
const BASE_PATH = isGitHubPages ? '/gcc-card' : '';
const POINT_RANGE_0 = '1-50';
const POINT_RANGE_1 = '51-95';
const POINT_RANGE_2 = '96-140';
const POINT_RANGE_3 = '141-186';
const POINT_RANGE_4 = '187-230';
const POINT_RANGE_5 = '231-276';
const POINT_RANGE_6 = '277-347';
const POINT_RANGE_7 = '348-383';
const POINT_RANGE_8 = '384-408';
const POINT_RANGE_9 = '409-500';

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
const selected = new Map(); // Map<cardId, { level: number, copies: number }>

// Undo/Redo functionality
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 30; // Limit history size

function saveState() {
  // Save current state to undo stack
  undoStack.push(new Map(selected));

  // Limit stack size
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  
  // Clear redo stack when new action is made
  redoStack.length = 0;
  
  updateUndoRedoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  
  // Save current state to redo stack
  redoStack.push(new Map(selected));
  
  // Restore previous state
  const previousState = undoStack.pop();
  selected.clear();
  previousState.forEach((data, id) => selected.set(id, data));
  
  saveSelections();
  renderTable();
  updateUndoRedoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  
  // Save current state to undo stack
  undoStack.push(new Map(selected));
  
  // Restore next state
  const nextState = redoStack.pop();
  selected.clear();
  nextState.forEach((data, id) => selected.set(id, data));
  
  saveSelections();
  renderTable();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  
  if (undoBtn) {
    undoBtn.disabled = undoStack.length === 0;
  }
  if (redoBtn) {
    redoBtn.disabled = redoStack.length === 0;
  }
}

function resetAll() {
  // Save state for undo
  saveState();
  
  // Clear all selections and copies
  selected.clear();
  
  // Clear all filters
  document.getElementById("searchBox").value = '';
  document.getElementById("filterAcquiredFrom").value = '';
  document.getElementById("filterGroup").value = '';
  
  // Clear sort
  sortColumn = null;
  sortDirection = 'asc';
  document.querySelectorAll('.sort-indicator').forEach(el => {
    el.className = 'sort-indicator';
  });
  
  // Save and render
  saveSelections();
  renderTable();
}

// Get base path for asset loading
const basePath = window.BASE_PATH || '.';
const imageBasePath = `${basePath}/images/cards-webp`; // Image folder path

function getCardName(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return `Card ${cardId}`;
  
  const currentLang = window.CURRENT_LANG || 'en';
  
  // If card has names object with translations, use it
  if (card.names && card.names[currentLang]) {
    return card.names[currentLang];
  }
  
  // Fallback to English if current language not found
  if (card.names && card.names.en) {
    return card.names.en;
  }
  
  // Final fallback to card ID
  return `Card ${cardId}`;
}

function getCardAcquiredFrom(acquiredFrom) {
  // if it's a string and contains only letters and spaces (no numbers or special characters).
  if (typeof acquiredFrom === "string" && /^[a-zA-Z\s]+$/.test(acquiredFrom)) {
    return i18n.t(`acquiredFrom.${acquiredFrom}`);
  }
  return acquiredFrom;
}

function getCardGroup(cardGroup) {
  if (typeof cardGroup === "number" && !isNaN(cardGroup)) {
    return cardGroup
  }
  return i18n.t(`ui.${cardGroup}`);
}

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
      `${basePath}/cards-data/group-uncollectible.json`,
      `${basePath}/cards-data/group-exclusive.json`
    ];
    
    const responses = await Promise.all(jsonFiles.map(file => fetch(file)));
    const dataArrays = await Promise.all(responses.map(r => r.json()));
    
    cards = dataArrays.flat();
    // Sort by ID by default (without setting sortColumn/sortDirection)
    cards.sort((a, b) => a.id - b.id);
    
    loadSelections();
    renderTable();
    updateUndoRedoButtons();
  } catch (error) {
    console.error('Error loading cards:', error);
  }
}

// handle backward compatibility with the old localStorage format
function loadSelections() {
  const saved = localStorage.getItem('cardSelections');
  if (saved) {
    try {
      const selections = JSON.parse(saved);
      
      // Check if it's the old format (array of numbers) or new format (array of [id, level] pairs)
      if (selections.length > 0) {
        // Old format: array of card IDs (numbers), e.g. [1, 2, 3, 4]
        if (typeof selections[0] === 'number') {
          // Convert old format to new format - assign all to Lv3
          selections.forEach(id => selected.set(id, {level: 3, copies: 0}));
          
          // Save in new format
          saveSelections();
        } 
        // New format: array of [id, {level, copies}] pairs
        else if (Array.isArray(selections[0]) && selections[0].length === 2 && typeof selections[0][1] === 'object') {
          selections.forEach(([id, data]) => selected.set(id, data));
        }
      }
    } catch (error) {
      console.error('Error loading selections:', error);
      // If there's an error, clear the corrupted data
      localStorage.removeItem('cardSelections');
    }
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
  const filterAcquiredFrom = document.getElementById("filterAcquiredFrom").value;
  const filterGroup = document.getElementById("filterGroup").value;

  return cards.filter(c => {
    const cardName = getCardName(c.id).toLowerCase(); // Use new function
    return cardName.includes(search) &&
      (filterAcquiredFrom ? c.acquiredFrom === filterAcquiredFrom : true) &&
      (filterGroup ? c.group == filterGroup : true);
  });
}

function renderTable() {
  let list = getFilteredCards();
  
  if (sortColumn) {
    list.sort((a, b) => {
      // Special handling for checkbox (selected) column
      if (sortColumn === 'selected') {
        const aSelected = selected.has(a.id) ? 1 : 0;
        const bSelected = selected.has(b.id) ? 1 : 0;
        return sortDirection === 'asc' ? bSelected - aSelected : aSelected - bSelected;
      }

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

  document.getElementById("cardTable").innerHTML = list.map(c => {
    const currentData = selected.get(c.id) || { level: null, copies: 0 };
    const currentLevel = currentData.level;
    const currentCopies = currentData.copies;

    // Calculate max copies for current level
    const nextLevel = currentLevel !== null ? Math.min(currentLevel + 1, 3) : 1;
    const maxCopies = currentLevel !== null && currentLevel < 3 
      ? c.copy.interval[nextLevel] 
      : 0;
    
    const isMaxLevel = currentLevel === 3;
    
    // Check if card is uncollectible
    const isUncollectible = c.group === 'uncollectible';
    
    return `
    <tr class="card-row">
      <td>${c.id}</td>
      <td>
        <div class='card-pic' 
             data-src='${imageBasePath}/${c.image}'
             title='${getCardName(c.id)}'
            onclick='showCardDetails(${c.id})'>
        </div>
      </td>
      <td>${getCardName(c.id)}</td>
      <!-- <td>${c.point}</td> -->
      <td>${getCardGroup(c.group)}</td>
      <td>${getCardAcquiredFrom(c.acquiredFrom)}</td>
      <td>
        <input type="radio" 
               name="level-${c.id}" 
               value="0" 
               data-level="0"
               ${currentLevel === 0 ? "checked" : ""} 
               ${isUncollectible ? "disabled" : ""}
               onclick="toggleLevel(${c.id}, 0)"
               class="level-radio">
      </td>
      <td>
        <input type="radio" 
               name="level-${c.id}" 
               value="1" 
               data-level="1"
               ${currentLevel === 1 ? "checked" : ""} 
               ${isUncollectible ? "disabled" : ""}
               onclick="toggleLevel(${c.id}, 1)"
               class="level-radio">
      </td>
      <td>
        <input type="radio" 
               name="level-${c.id}" 
               value="2" 
               data-level="2"
               ${currentLevel === 2 ? "checked" : ""} 
               ${isUncollectible ? "disabled" : ""}
               onclick="toggleLevel(${c.id}, 2)"
               class="level-radio">
      </td>
      <td>
        <input type="radio" 
               name="level-${c.id}" 
               value="3" 
               data-level="3"
               ${currentLevel === 3 ? "checked" : ""} 
               ${isUncollectible ? "disabled" : ""}
               onclick="toggleLevel(${c.id}, 3)"
               class="level-radio">
      </td>
      <td>
        <div class="copies-control">
          <button class="copy-btn minus-btn" 
                  onclick="updateCopies(${c.id}, -1)"
                  ${isMaxLevel || currentLevel === null || isUncollectible ? 'disabled' : ''}>−</button>
          <input type="number" 
                 class="copies-input" 
                 value="${currentCopies}"
                 min="0"
                 max="${maxCopies}"
                 ${isMaxLevel || currentLevel === null || isUncollectible ? 'disabled' : ''}
                 onchange="setCopies(${c.id}, this.value)">
          <button class="copy-btn plus-btn" 
                  onclick="updateCopies(${c.id}, 1)"
                  ${isMaxLevel || currentLevel === null || currentCopies >= maxCopies || isUncollectible ? 'disabled' : ''}>+</button>
        </div>
        ${isUncollectible 
          ? `<div class="copies-hint">${i18n.t('ui.notApplicable') || 'N/A'}</div>` 
          : (!isMaxLevel && currentLevel !== null 
            ? `<div class="copies-hint">${maxCopies - currentCopies} ${i18n.t('ui.needed') || 'needed'}</div>` 
            : '')
        }
        </td>
    </tr>
  `;
  }).join("");

  initLazyLoading();
  updateSummary();
  updateSelectAllButtons();
}

function toggleLevel(id, level) {
  saveState();
  
  const current = selected.get(id);
  
  // If clicking the same level, deselect it
  if (current && current.level === level) {
    selected.delete(id);
  } else {
    selected.set(id, { 
      level: level, 
      copies: 0  // Reset copies when user changes level
    });
  }
  
  saveSelections();
  renderTable();
}

function updateCopies(cardId, change) {
  saveState();
  
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  
  const current = selected.get(cardId) || { level: 0, copies: 0 };
  const newCopies = Math.max(0, current.copies + change);
  
  // Don't allow more copies than needed if at Lv3
  if (current.level === 3) {
    return;
  }

  // Get max copies needed for next level
  const nextLevel = Math.min(current.level + 1, 3);
  const maxCopies = card.copy.interval[nextLevel];
  
  // Cap at max needed for next level
  const cappedCopies = Math.min(newCopies, maxCopies);
  
  selected.set(cardId, { 
    level: current.level, 
    copies: cappedCopies 
  });
  
  saveSelections();
  renderTable();
}

function setCopies(cardId, value) {
  saveState();
  
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  
  const current = selected.get(cardId) || { level: 0, copies: 0 };
  const newCopies = Math.max(0, parseInt(value) || 0);
  
  // Get max copies needed for next level
  const nextLevel = Math.min(current.level + 1, 3);
  const maxCopies = card.copy.interval[nextLevel];
  
  // Don't allow changes if at Lv3
  if (current.level === 3) {
    renderTable();
    return;
  }
  
  // Cap at max needed for next level
  const cappedCopies = Math.min(newCopies, maxCopies);
  
  selected.set(cardId, { 
    level: current.level, 
    copies: cappedCopies 
  });
  
  saveSelections();
  renderTable();
}

function selectAllLevel(level) {
  saveState();
  
  // Get filtered cards excluding uncollectible
  const filteredCards = getFilteredCards().filter(c => c.group !== 'uncollectible');
  if (filteredCards.length === 0) return;
  
  // Check if all filtered cards are already at this level
  const allAtLevel = filteredCards.every(c => {
    const data = selected.get(c.id);
    return data && data.level === level;
  });
    
  if (allAtLevel) {
    filteredCards.forEach(c => {
      const data = selected.get(c.id);
      if (data && data.level === level) {
        selected.delete(c.id);
      }
    });
  } else {
    filteredCards.forEach(c => {
      selected.set(c.id, { 
        level: level, 
        copies: 0 
      });
    });
  }
  
  saveSelections();
  renderTable();
}

function updateSelectAllButtons() {
  const filteredCards = getFilteredCards();
  
  // Filter out uncollectible cards for checking
  const collectibleCards = filteredCards.filter(c => c.group !== 'uncollectible');
  const hasCollectibleCards = collectibleCards.length > 0;

  // Check each level
  for (let level = 0; level <= 3; level++) {
    const allAtLevel = collectibleCards.length > 0 && 
                       collectibleCards.every(c => {
                         const data = selected.get(c.id);
                         return data && data.level === level;
                       });
    
    const radioButton = document.querySelector(`th input[onclick="selectAllLevel(${level})"]`);
    if (radioButton) {
      radioButton.checked = allAtLevel;

      // Disable the button if no collectible cards are visible
      radioButton.disabled = !hasCollectibleCards;

      // Update cursor style based on disabled state
      if (!hasCollectibleCards) {
        radioButton.style.cursor = 'not-allowed';
      } else {
        radioButton.style.cursor = 'pointer';
      }
    }
  }
}

function initLazyLoading() {
  // Observe all card images with data-src attribute
  document.querySelectorAll('.card-pic[data-src]').forEach(img => {
    lazyLoader.observe(img);
  });
}

// Toggle hint box expansion (auto-collapse others with smooth animation)
function toggleHint(element) {
  const isCurrentlyExpanded = element.classList.contains('expanded');
  const allItems = document.querySelectorAll('.point-range-item');
  
  // Collapse all items
  allItems.forEach(item => {
    if (item !== element) {
      item.classList.remove('expanded');
    }
  });
  
  // Toggle the clicked item after a brief delay for smooth animation
  if (isCurrentlyExpanded) {
    element.classList.remove('expanded');
  } else {
    // Small delay to ensure other items collapse first
    setTimeout(() => {
      element.classList.add('expanded');

      // Smooth scroll to the expanded item after animation
      setTimeout(() => {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 200);
    }, 50);
  }
}

// Get recommended card combinations for each point range
function getRecommendedCombinations(pointRange) {
  const combinations = {
    [POINT_RANGE_1]: [
      '8 + 8 + 8 + 9 + 9 + 9',
      '7 + 7 + 7 + 10 + 10 + 10',
      '6 + 6 + 6 + 11 + 11 + 11',
    ],
    [POINT_RANGE_2]: [
      '16 + 16 + 16 + 16 + 16 + 16',
      '15 + 15 + 17 + 17 + 16 + 16',
      '18 + 18 + 14 + 14 + 16 + 16',
    ],
    [POINT_RANGE_3]: [
      '35 + 35 + 35 + 36',
      '36 + 36 + 34 + 35',
      '33 + 34 + 37 + 37',
      '32 + 32 + 38 + 39',
    ],
    [POINT_RANGE_4]: [
      '47 + 47 + 47 + 46',
      '46 + 48 + 48 + 45',
      '37 + 37 + 37 + 38 + 38',
      '36 + 36 + 39 + 39 + 37',
      '44 + 47 + 48 + 48',
    ],
    [POINT_RANGE_5]: [
      '46 + 46 + 46 + 46 + 47',
      '45 + 45 + 45 + 48 + 48',
      '38 + 38 + 38 + 39 + 39 + 39',
    ],
    [POINT_RANGE_6]: [
      '46 + 46 + 46 + 46 + 46 + 47',
      '45 + 45 + 45 + 47 + 47 + 48',
      '39 + 39 + 40 + 40 + 59 + 60',
      '39 + 39 + 43 + 43 + 56 + 57',
    ],
    [POINT_RANGE_7]: [
      '58 + 58 + 58 + 58 + 58 + 58',
      '57 + 57 + 58 + 58 + 59 + 59',
      '56 + 56 + 60 + 60 + 58 + 58',
    ],
    [POINT_RANGE_8]: [
      '64 + 64 + 64 + 64 + 64 + 64',
      '63 + 63 + 64 + 64 + 65 + 65',
      '62 + 64 + 64 + 64 + 64 + 66',
    ],
    [POINT_RANGE_9]: [
      '68 + 68 + 68 + 68 + 68 + 69',
      '67 + 67 + 67 + 69 + 69 + 70',
      '66 + 66 + 66 + 70 + 70 + 71',
      '65 + 65 + 66 + 71 + 71 + 71',
      '61 + 61 + 62 + 75 + 75 + 75',
    ]
  };

  return combinations[pointRange] || [
    { cards: 'No data', description: 'Combination data not available for this range' }
  ];
}

// Calculate expected collection level gain per card obtained
function calculateCardValue(card, currentData) {
  const currentLevel = currentData.level;
  const currentCopies = currentData.copies;
  const nextLevel = Math.min(currentLevel + 1, 3);
  
  // Copies needed to reach next level
  const copiesNeeded = currentLevel === 3 ? 0 : card.copy.interval[nextLevel];
  if (copiesNeeded === 0) return {expectedValue: 0}; // Already maxed
  
  // Remaining copies needed (accounting for what user already has)
  const remainingCopies = Math.max(0, copiesNeeded - currentCopies);

  if (remainingCopies === 0) {
    // User has enough to level up but hasn't done so yet
    return {
      cardId: card.id,
      currentLevel: currentLevel,
      nextLevel: nextLevel,
      copiesNeeded: 0,
      remainingCopies: 0,
      levelGain: 1,
      cardRate: card.rate,
      expectedValue: 0, // Already ready to level up
      group: card.group
    };
  }

  // Collection level gain per level up
  const levelGain = 1; // Each level up adds 1 to collection level
  
  // Expected value = gain / copies needed, weighted by card rate
  // Higher rate = easier to get this specific card
  const expectedValue = (levelGain / remainingCopies) * card.individualProbability;
  
  return {
    cardId: card.id,
    currentLevel: currentLevel,
    nextLevel: nextLevel,
    copiesNeeded: copiesNeeded,
    currentCopies: currentCopies,
    remainingCopies: remainingCopies,
    levelGain: levelGain,
    cardRate: card.individualProbability,
    expectedValue: expectedValue,
    group: card.group
  };
}


function calculateStats() {
  const groupStats = {};
  const groups = [1, 2, 3, 4, 5, 6, 7, 'exclusive'];
  for (const group of groups) {
    const groupCards = cards.filter(c => c.group === group);
    const selectedInGroup = groupCards.filter(c => selected.has(c.id) && selected.get(c.id).level === 3);
    const missingCardsInGroup = groupCards.filter(c => !selected.has(c.id) || selected.get(c.id).level < 3)
    const missingCount = groupCards.length - selectedInGroup.length;
    const groupRate = groupCards[0]?.individualProbability || 0;
    
    let expectedValueByLevel = {
      level0to1: 0,  // Cards at Lv0 trying to reach Lv1
      level1to2: 0,  // Cards at Lv1 trying to reach Lv2
      level2to3: 0,  // Cards at Lv2 trying to reach Lv3
      maxed: 0       // Cards already at Lv3
    };
    
    for (const card of groupCards) {
      const currentData = selected.get(card.id) || { level: 0, copies: 0 };
      const cardValue = calculateCardValue(card, currentData);
      const currentLevel = currentData.level;
      
      if (currentLevel === 0 && cardValue.remainingCopies > 0) {
        expectedValueByLevel.level0to1 += cardValue.expectedValue;
      } else if (currentLevel === 1 && cardValue.remainingCopies > 0) {
        expectedValueByLevel.level1to2 += cardValue.expectedValue;
      } else if (currentLevel === 2 && cardValue.remainingCopies > 0) {
        expectedValueByLevel.level2to3 += cardValue.expectedValue;
      } else if (currentLevel === 3) {
        expectedValueByLevel.maxed += 1;
      }
    }
    
    // Total expected value for this group (sum across all level transitions)
    const totalExpectedValue = 
      expectedValueByLevel.level0to1 + 
      expectedValueByLevel.level1to2 + 
      expectedValueByLevel.level2to3;

    
    groupStats[group] = {
      total: groupCards.length,
      selected: selectedInGroup.length,
      missingCardsInGroup: missingCardsInGroup,
      missing: missingCount,
      rate: groupRate,
      missingRate: ((missingCount * groupRate) * 100).toFixed(2),

      expectedValue: totalExpectedValue,
      byLevel: expectedValueByLevel,
    };
  }

  const fusionRates = [
    { range: POINT_RANGE_0, rates: { 1: 100.00, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 } },
    { range: POINT_RANGE_1, rates: { 1: 20.00, 2: 70.00, 3: 10.00, 4: 0, 5: 0, 6: 0, 7: 0 } },
    { range: POINT_RANGE_2, rates: { 1: 10.00, 2: 70.00, 3: 20.00, 4: 0, 5: 0, 6: 0, 7: 0 } },
    { range: POINT_RANGE_3, rates: { 1: 0, 2: 20.00, 3: 70.00, 4: 10.00, 5: 0, 6: 0, 7: 0 } },
    { range: POINT_RANGE_4, rates: { 1: 0, 2: 0, 3: 20.00, 4: 70.00, 5: 10.00, 6: 0, 7: 0 } },
    { range: POINT_RANGE_5, rates: { 1: 0, 2: 0, 3: 10.00, 4: 70.00, 5: 20.00, 6: 0, 7: 0 } },
    { range: POINT_RANGE_6, rates: { 1: 0, 2: 0, 3: 0, 4: 20.00, 5: 70.00, 6: 10.00, 7: 0 } },
    { range: POINT_RANGE_7, rates: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 20.00, 6: 70.00, 7: 10.00 } },
    { range: POINT_RANGE_8, rates: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10.00, 6: 70.00, 7: 20.00 } },
    { range: POINT_RANGE_9, rates: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 100.00 } }
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

  // Calculate expected collection level gain per fusion for each point range
  const rangeAnalysis = fusionRates.map(fusionData => {
    let expectedGainPerFusion = 0;
    
    for (let group = 1; group <= 7; group++) {
      const fusionProbability = fusionData.rates[group] / 100;
      
      if (fusionProbability > 0 && groupStats[group]) {
        // Expected gain from this group = P(getting this group) × Expected value of cards in this group
        expectedGainPerFusion += fusionProbability * groupStats[group].expectedValue;
      }
    }
    
    return {
      range: fusionData.range,
      expectedGain: expectedGainPerFusion,
      expectedGainPercent: (expectedGainPerFusion * 100).toFixed(2),
      groupDistribution: fusionData.rates
    };
  });
    
  return {groupStats, pointStats, rangeAnalysis};
}

function getCardCollectionLevel() {
  let collectionLevel = 0
  if (selected.size !== 0) {
    selected.forEach((data, id) => {
      const card = cards.find(c => c.id === id);
      if (card.group !== 'uncollectible' && typeof data.level === "number" && !isNaN(data.level)) {
        collectionLevel += data.level
      }
    })
    return collectionLevel;
  }
  return;
}

function updateSummary() {
  const summaryEl = document.getElementById("summaryText");
  
  if (selected.size === 0) {
    summaryEl.innerHTML = i18n.t('ui.noCards');
  } else {
    summaryEl.innerHTML = i18n.t('ui.yourCardCollectionLevel') + `: ${getCardCollectionLevel()}`;
  }
}

function showHelp() {
  let content = i18n.t('help.content');
  
  // Replace placeholders with actual translations
  content = content
    .replace(/\{uncollectible\}/g, i18n.t('ui.uncollectible'))
    .replace(/\{exclusive\}/g, i18n.t('ui.exclusive'));
  
  document.getElementById('helpContent').innerHTML = content;
  document.getElementById("helpModal").style.display = "block";
  
}

function showInfo() {
  document.getElementById("infoModal").style.display = "block";
}

function showDetails() {
  let content = '';
  
  if (selected.size === 0) {
    content = `<div class="no-cards">${i18n.t('ui.noCards')}</div>`;
  } else {
    const stats = calculateStats();
    
    // Create chart wrapper
    content += `
      <div class="chart-wrapper">
        <div class="chart-title">${i18n.t('ui.chartTitle') || 'Card Fusion Analysis by Point Range'}</div>
        <div class="chart-container">
          <canvas id="fusionChart"></canvas>
        </div>
        <div class="chart-legend">
          <div class="legend-content">
            <div class="legend-item">
              <div class="legend-color" style="background: rgba(164, 216, 166, 0.8);"></div>
              <span>${i18n.t('ui.missingProbability') || 'Missing Card Probability (%)'}: ${i18n.t('ui.probabilitiesByRange')}</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: rgba(68, 158, 72, 0.8);"></div>
              <span>${i18n.t('ui.expectedGain') || 'Expected Collection Gain (%)'}: ${i18n.t('ui.expectedGainPerFusion')}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add expandable point range items with combinations
    content += `<div class="missing-summary"><div class="chart-title">${i18n.t('ui.missingProbability')} | ${i18n.t('ui.expectedGain')}</div>`;
    for (const pointStatsData of Object.values(stats.pointStats)) {
      const combinations = getRecommendedCombinations(pointStatsData.point);
      const rangeData = stats.rangeAnalysis.find(r => r.range === pointStatsData.point);
      if (pointStatsData.point === POINT_RANGE_0) {
        content += `
          <div class="point-range-header">
            <span>${i18n.t('ui.pointRange') || 'Point Range'} ${pointStatsData.point}: ${pointStatsData.probabilityPoints}% | +${rangeData?.expectedGainPercent || '0.00'}%</span>
          </div>
        `;
      } else {
        content += `
          <div class="point-range-item" onclick="toggleHint(this)">
            <div class="point-range-header">
              <span>${i18n.t('ui.pointRange') || 'Point Range'} ${pointStatsData.point}: ${pointStatsData.probabilityPoints}% | +${rangeData?.expectedGainPercent || '0.00'}%</span>
              <span class="expand-icon">▼</span>
            </div>
            <div class="hint-box">
              <div class="hint-content">
                <div class="hint-content-header">
                  ${i18n.t('ui.recommendedCombinations') || 'Recommended Combinations'}:
                </div>
                <ul class="combination-list">
                  ${combinations.map(combo => `
                    <li>
                      ${combo}
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </div>
        `;
      }
    }
    content += `</div>`;

    // Add missing cards summary
    content += `<div class="missing-summary"><div class="chart-title">${i18n.t('ui.missingCardsByGroup') || 'Missing Cards by Group'}</div>`;
    const groups = [1, 2, 3, 4, 5, 6, 7, 'exclusive'];

    let totalCards = 0;
    let totalSelected = 0;
    let totalMissing = 0;

    for (const group of groups) {
      const groupStat = stats.groupStats[group];
      if (groupStat) {
        const groupLabel = group === 'exclusive' 
          ? i18n.t('ui.exclusive') 
          : `${group}`;
        if (groupStat.missing === 0) {
          content += `
            <div class="point-range-header">
              <span>${i18n.t('ui.group')} ${groupLabel}: ${groupStat.missing} ${i18n.t('ui.missing') || 'missing'} (${groupStat.selected}/${groupStat.total}) - ${i18n.t('ui.progress')} ${(100 - groupStat.missingRate).toFixed(2)}%</span>
            </div>
          `;
          } else {
          content += `
            <div class="point-range-item" onclick="toggleHint(this)">
              <div class="point-range-header">
                <span>${i18n.t('ui.group')} ${groupLabel}: ${groupStat.missing} ${i18n.t('ui.missing') || 'missing'} (${groupStat.selected}/${groupStat.total}) - ${i18n.t('ui.progress')} ${(100 - groupStat.missingRate).toFixed(2)}%</span>
                <span class="expand-icon">▼</span>
              </div>
              <div class="hint-box">
                <div class="hint-content">
                  <ul class="combination-list">
                    ${groupStat.missingCardsInGroup.map((c, i) => {
                      const currentLevel = selected.get(c.id)?.level || 0;
                      const currentCopies = selected.get(c.id)?.copies || 0;
                      const nextLevel = Math.min(currentLevel + 1, 3);
                      const requiredCopies = c.copy.interval[nextLevel];
                      const showCopies = typeof requiredCopies === 'number' && !isNaN(requiredCopies);
                      
                      return `<li>
                        ${i+1}. 
                        ${getCardName(c.id)}: 
                        Lv${currentLevel} → Lv${nextLevel} 
                        ${showCopies ? ` (${currentCopies}/${requiredCopies})` : ''}
                      </li>`;
                    }).join('')}
                  </ul>
                </div>
              </div>
            </div>
          `;
        }
        totalCards += groupStat.total;
        totalSelected += groupStat.selected;
        totalMissing += groupStat.missing;
      }
    }

    content += `<hr class="summary-divider">`;
    const totalProgress = totalCards > 0 ? ((totalSelected / totalCards) * 100).toFixed(2) : 0;
    content += `${i18n.t('ui.total') || 'Total'}: ${totalMissing} ${i18n.t('ui.missing') || 'missing'} (${totalSelected}/${totalCards}) - ${i18n.t('ui.progress')} ${totalProgress}%`;
    content += `<br>${i18n.t('ui.collectionLevel') || 'Collection Level'}: ${(totalCards*3) - getCardCollectionLevel()} ${i18n.t('ui.levelMissing') || 'level missing'} (${getCardCollectionLevel()}/${totalCards*3}) - ${i18n.t('ui.progress')} ${((getCardCollectionLevel()/(totalCards*3))*100).toFixed(2)}%`;
    content += '</div>';
  }
  
  document.getElementById("detailsContent").innerHTML = content;
  document.getElementById("detailsModal").style.display = "block";
  
  // Create chart after modal is visible
  if (selected.size > 0) {
    createFusionChart(calculateStats());
  }
}

// Show card details modal
function showCardDetails(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (!card) return;
  
  const currentData = selected.get(cardId) || { level: null, copies: 0 };
  const requiredCopies = card.copy.interval[1];
  const showPoint = typeof card.point === 'number' && !isNaN(card.point);
  const showProbablity = typeof card.group === 'number' && !isNaN(card.group);
  const showCopies = typeof requiredCopies === 'number' && !isNaN(requiredCopies) && card.group !== 'uncollectible';
  const content = `
    <h2>${getCardName(cardId)}</h2>
    <div class="card-details-container">
      <div class="card-details-image-section">
        <div class="card-details-image" 
             style="background-image: url('${imageBasePath}/${card.image}')">
        </div>
      </div>
      
      <div class="card-details-info">
        ${showPoint ?
          `<div class="card-info-line">
            <span class="card-info-label">${i18n.t('ui.point') || 'Point'}:</span>
            <span class="card-info-value">${card.point}</span>
          </div>`
        : ''}
        
        <div class="card-info-line">
          ${showProbablity ?
          `<span class="card-info-label">${i18n.t('ui.probability') || 'Probability'}:</span>
          <span class="card-info-value">${(card.individualProbability * 100).toFixed(4)}%</span>
          </div>`
        : ''}

        ${showCopies ? 
          `<div class="card-info-line">
          <span class="card-info-label">${i18n.t('ui.copiesNeeded') || 'Copies Needed'}:</span>
          <span class="card-info-value">
            Lv0→1: ${card.copy.interval[1]} ${i18n.t('ui.cardCounter')}<br>
            Lv1→2: ${card.copy.interval[2]} ${i18n.t('ui.cardCounter')}<br>
            Lv2→3: ${card.copy.interval[3]} ${i18n.t('ui.cardCounter')}
          </span>
        </div>`
        : ''}
      </div>
    </div>
  `;
  
  document.getElementById('cardDetailsContent').innerHTML = content;
  document.getElementById('cardDetailsModal').style.display = 'block';
}

// New function to create the chart
function createFusionChart(stats) {
  const ctx = document.getElementById('fusionChart');
  if (!ctx) return;

  // Prepare data
  const pointRanges = Object.values(stats.pointStats)
    .map(p => p.point);
  
  const missingProbabilities = Object.values(stats.pointStats)
    .map(p => parseFloat(p.probabilityPoints));
  
  const expectedGains = stats.rangeAnalysis
    .map(r => parseFloat(r.expectedGainPercent));

  // Destroy existing chart if it exists
  if (window.fusionChartInstance) {
    window.fusionChartInstance.destroy();
  }

  // Get current theme
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#e0e0e0' : '#666';
  const gridColor = isDarkMode ? '#404040' : '#e0e0e0';

  // Create new chart (horizontal bar)
  window.fusionChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: pointRanges,
      datasets: [
        {
          label: i18n.t('ui.missingProbability') || 'Missing Card Probability (%)',
          data: missingProbabilities,
          backgroundColor: 'rgba(164, 216, 166, 0.8)', // Light green
          hoverBackgroundColor: 'rgba(164, 216, 166, 0.8)',
          borderRadius: 4,
        },
        {
          label: i18n.t('ui.expectedGain') || 'Expected Collection Gain (%)',
          data: expectedGains,
          backgroundColor: 'rgba(68, 158, 72, 0.8)', // Dark green
          hoverBackgroundColor: 'rgba(68, 158, 72, 0.8)',
          borderRadius: 4,
        }
      ]
    },
    options: {
      indexAxis: 'y', // This makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 70 // Increased padding for larger font labels
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false // We have custom legend
        },
        tooltip: {
          enabled: false // Disable tooltips
        },
        datalabels: {
          display: true,
          color: textColor,
          anchor: 'end',
          align: 'end',
          offset: 4,
          formatter: (value) => value.toFixed(2) + '%',
          font: {
            size: 13,
            style: 'italic'
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100, // Fixed max at 100%
          grid: {
            color: gridColor,
            display: false
          },
          ticks: {
            display: false,
            color: textColor,
            font: {
              size: 13
            },
            callback: function(value) {
              return value + '%';
            },
            stepSize: 20 // Show ticks at 0, 20, 40, 60, 80, 100
          },
          title: {
            display: false
          }
        },
        y: {
          grid: {
            color: gridColor,
            display: false
          },
          ticks: {
            color: textColor,
            font: {
              size: 13
            }
          }
        }
      }
    }
  });
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
  const undoIcon = document.querySelector('.undo-icon');
  const redoIcon = document.querySelector('.redo-icon');
  const searchIcon = document.querySelector('.search-icon');
  const feedbackIcon = document.querySelector('.feedback-icon');
  const infoIcon = document.querySelector('.info-icon');
  const themeIcon = document.querySelector('.theme-icon');
  
  body.classList.toggle('dark-mode');
  
  // Update icon
  if (body.classList.contains('dark-mode')) {
    undoIcon.src = `${window.BASE_PATH}/images/theme/undo-light.png`;
    redoIcon.src = `${window.BASE_PATH}/images/theme/redo-light.png`;
    searchIcon.src = `${window.BASE_PATH}/images/theme/magnifier-light.png`;
    feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-light.png`;
    infoIcon.src = `${window.BASE_PATH}/images/theme/info-light.png`;
    themeIcon.src = `${window.BASE_PATH}/images/theme/light-mode.png`;
    themeIcon.alt = 'Light Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    undoIcon.src = `${window.BASE_PATH}/images/theme/undo-dark.png`;
    redoIcon.src = `${window.BASE_PATH}/images/theme/redo-dark.png`;
    searchIcon.src = `${window.BASE_PATH}/images/theme/magnifier-dark.png`;
    feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-dark.png`;
    infoIcon.src = `${window.BASE_PATH}/images/theme/info-dark.png`;
    themeIcon.src = `${window.BASE_PATH}/images/theme/dark-mode.png`;
    themeIcon.alt = 'Dark Mode';
    localStorage.setItem('theme', 'light');
  }
}

// Load saved theme on page load
function loadTheme() {
  const undoIcon = document.querySelector('.undo-icon');
  const redoIcon = document.querySelector('.redo-icon');
  const searchIcon = document.querySelector('.search-icon');
  const savedTheme = localStorage.getItem('theme');
  const feedbackIcon = document.querySelector('.feedback-icon');
  const infoIcon = document.querySelector('.info-icon');
  const themeIcon = document.querySelector('.theme-icon');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) {
      undoIcon.src = `${window.BASE_PATH}/images/theme/undo-light.png`;
      redoIcon.src = `${window.BASE_PATH}/images/theme/redo-light.png`;
      searchIcon.src = `${window.BASE_PATH}/images/theme/magnifier-light.png`;
      feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-light.png`;
      infoIcon.src = `${window.BASE_PATH}/images/theme/info-light.png`;
      themeIcon.src = `${window.BASE_PATH}/images/theme/light-mode.png`;
      themeIcon.alt = 'Light Mode';
    }
  } else {
    if (themeIcon) {
      undoIcon.src = `${window.BASE_PATH}/images/theme/undo-dark.png`;
      redoIcon.src = `${window.BASE_PATH}/images/theme/redo-dark.png`;
      searchIcon.src = `${window.BASE_PATH}/images/theme/magnifier-dark.png`;
      feedbackIcon.src = `${window.BASE_PATH}/images/theme/mail-dark.png`;
      infoIcon.src = `${window.BASE_PATH}/images/theme/info-dark.png`;
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

// Language dropdown toggle
function toggleLangDropdown() {
  const dropdown = document.querySelector('.lang-dropdown');
  const menu = document.getElementById('langDropdownMenu');
  
  dropdown.classList.toggle('active');
  menu.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.querySelector('.lang-dropdown');
  const menu = document.getElementById('langDropdownMenu');
  
  if (dropdown && !dropdown.contains(event.target)) {
    dropdown.classList.remove('active');
    menu.classList.remove('show');
  }
});

// Update current language display
function updateCurrentLangDisplay() {
  const langMap = {
    'en': 'English',
    'kr': '한국어',
    'br': 'Português',
    'tw': '繁體中文'
  };
  
  const currentLangSpan = document.getElementById('currentLang');
  if (currentLangSpan && window.CURRENT_LANG) {
    currentLangSpan.textContent = langMap[window.CURRENT_LANG] || 'EN';
  }
}

// Scroll to Top functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
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
  updateCurrentLangDisplay();
  loadTheme();
  handleScrollButton();
});

async function initApp() {
  await i18n.init();
  await loadCards();
  i18n.updateUI();
}

initApp();