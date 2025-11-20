// Language strings
const LANG = {
    EN: {
      group: "Group",
      points: "Points",
      rate: "Rate",
      details: "See details",
      help: `<p><strong>Welcome to the Card Fusion Calculator!</strong></p>
             <p>This tool helps you calculate card fusion probabilities and manage your card collection.</p>
             <h3>How to use:</h3>
             <ul>
               <li><strong>Select cards:</strong> Click the checkboxes to select cards you want to fuse</li>
               <li><strong>Sort columns:</strong> Click on Point, Group, or No. headers to sort</li>
               <li><strong>View summary:</strong> The top panel shows total groups, points, and success rate</li>
               <li><strong>Filter:</strong> Use region and group filters to narrow down your search</li>
               <li><strong>Search:</strong> Type card names in the search box to find specific cards</li>
               <li><strong>Reset:</strong> Clear all selections, filters, and search</li>
               <li><strong>Select All:</strong> Select all visible cards</li>
               <li><strong>Reverse:</strong> Invert your current selection</li>
             </ul>
             <p>Your selections are automatically saved and will persist on your next visit.</p>`
    },
    KR: {
      group: "그룹",
      points: "포인트",
      rate: "확률",
      details: "자세히 보기",
      help: `<p><strong>카드 합성 계산기에 오신 것을 환영합니다!</strong></p>
             <p>이 도구는 카드 합성 확률을 계산하고 카드 컬렉션을 관리하는 데 도움을 줍니다.</p>
             <h3>사용 방법:</h3>
             <ul>
               <li><strong>카드 선택:</strong> 체크박스를 클릭하여 합성할 카드를 선택하세요</li>
               <li><strong>열 정렬:</strong> 포인트, 그룹 또는 번호 헤더를 클릭하여 정렬하세요</li>
               <li><strong>요약 보기:</strong> 상단 패널에 총 그룹, 포인트, 성공률이 표시됩니다</li>
               <li><strong>필터:</strong> 지역 및 그룹 필터를 사용하여 검색 범위를 좁히세요</li>
               <li><strong>검색:</strong> 검색 상자에 카드 이름을 입력하여 특정 카드를 찾으세요</li>
               <li><strong>초기화:</strong> 모든 선택, 필터 및 검색을 지웁니다</li>
               <li><strong>전체 선택:</strong> 보이는 모든 카드를 선택합니다</li>
               <li><strong>반전:</strong> 현재 선택을 반전시킵니다</li>
             </ul>
             <p>선택 사항은 자동으로 저장되며 다음 방문 시에도 유지됩니다.</p>`
    },
    PT: {
      group: "Grupo",
      points: "Pontos",
      rate: "Taxa",
      details: "Ver detalhes",
      help: `<p><strong>Bem-vindo à Calculadora de Fusão de Cartas!</strong></p>
             <p>Esta ferramenta ajuda a calcular probabilidades de fusão de cartas e gerenciar sua coleção.</p>
             <h3>Como usar:</h3>
             <ul>
               <li><strong>Selecionar cartas:</strong> Clique nas caixas de seleção para escolher as cartas que deseja fundir</li>
               <li><strong>Ordenar colunas:</strong> Clique nos cabeçalhos de Pontos, Grupo ou Nº para ordenar</li>
               <li><strong>Ver resumo:</strong> O painel superior mostra grupos totais, pontos e taxa de sucesso</li>
               <li><strong>Filtrar:</strong> Use filtros de região e grupo para refinar sua pesquisa</li>
               <li><strong>Pesquisar:</strong> Digite nomes de cartas na caixa de pesquisa para encontrar cartas específicas</li>
               <li><strong>Redefinir:</strong> Limpa todas as seleções, filtros e pesquisas</li>
               <li><strong>Selecionar Tudo:</strong> Seleciona todas as cartas visíveis</li>
               <li><strong>Reverter:</strong> Inverte sua seleção atual</li>
             </ul>
             <p>Suas seleções são salvas automaticamente e persistirão na próxima visita.</p>`
    }
  };
  
  let currentLang = "EN";
  let cards = [];
  let sortColumn = null;
  let sortDirection = 'asc';
  
  const selected = new Set();
  
  // Load card data from JSON file
  async function loadCards() {
    try {
      // Array of your JSON file paths
      const jsonFiles = [
        'cards-data/group-1.json',
        'cards-data/group-2.json',
        'cards-data/group-3.json',
        'cards-data/group-4.json',
        'cards-data/group-5.json',
        'cards-data/group-6.json',
        'cards-data/group-7.json'
      ];
      
      // Fetch all files simultaneously
      const responses = await Promise.all(
        jsonFiles.map(file => fetch(file))
      );
      
      // Parse all JSON responses
      const dataArrays = await Promise.all(
        responses.map(response => response.json())
      );
      
      console.log('Fetched data from all files:', dataArrays);
      
      // Combine all cards arrays into one
      cards = dataArrays.flat();
      
      loadSelections();
      renderTable();
    } catch (error) {
      console.error('Error loading cards:', error);
      // Fallback to sample data if JSON files not found
      cards = [
        { id: 1, name: "Mushmon Card", point: 1, group: 1, region: "A", dropRate: "2.78%" },
        { id: 10, name: "Orc Card", point: 1, group: 1, region: "A", dropRate: "2.78%" },
        { id: 6, name: "Stone Goblin Card", point: 2, group: 1, region: "A", dropRate: "2.78%" }
      ];
      loadSelections();
      renderTable();
    }
  }
  
  // Load saved selections from localStorage
  function loadSelections() {
    const saved = localStorage.getItem('cardSelections');
    if (saved) {
      const selections = JSON.parse(saved);
      selections.forEach(id => selected.add(id));
    }
  }
  
  // Save selections to localStorage
  function saveSelections() {
    localStorage.setItem('cardSelections', JSON.stringify([...selected]));
  }
  
  function setLanguage(lang) {
    currentLang = lang;
    updateSummary();
    renderTable();
  }
  
  function sortTable(column) {
    // Toggle sort direction if clicking same column
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    
    // Update sort indicators
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
  
    let list = cards.filter(c =>
      c.name.toLowerCase().includes(search) &&
      (filterRegion ? c.region === filterRegion : true) &&
      (filterGroup ? c.group == filterGroup : true)
    );
    
    // Apply sorting
    if (sortColumn) {
      list.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        
        // Handle numeric vs string comparison
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          if (sortDirection === 'asc') {
            return valA.localeCompare(valB);
          } else {
            return valB.localeCompare(valA);
          }
        }
      });
    }
  
    document.getElementById("cardTable").innerHTML = list.map(c => `
      <tr>
        <td><input type="checkbox" ${selected.has(c.id) ? "checked" : ""} onclick="toggle(${c.id})"></td>
        <td><div class='card-pic'></div></td>
        <td>${c.name}</td>
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
    // Calculate missing cards per group
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
  
    // Fusion rate table
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
  
    // Calculate probability per point ranges
    const pointStats = {};
    for (const fusionRatesData of fusionRates) {
      let totalProbability = 0;
      
      // Calculate probability for this point range across all groups
      for (let group = 1; group <= 7; group++) {
        const fusionRate = fusionRatesData.rates[group]; // P1-1
        if (fusionRate > 0 && groupStats[group]) {          
          // Add to total probability for this point range: (G1*P1-1)+(G2*P1-2)+...
          totalProbability += (groupStats[group].missingRate / 100) * (fusionRate / 100);
        }
      }
      
      pointStats[fusionRatesData.range] = {
        point: fusionRatesData.range,
        probabilityPoints: (totalProbability * 100).toFixed(2)
      };
    }

    // Get top 3 probabilities, sorted by probability (descending) then by point range (ascending)
    let sortedPointStats = Object.values(pointStats)
    .sort((a, b) => {
      const probDiff = parseFloat(b.probabilityPoints) - parseFloat(a.probabilityPoints);
      if (probDiff !== 0) return probDiff; // Sort by probability descending
      
      // If probabilities are equal, sort by lower point range
      const [aMin] = a.point.split('-').map(Number);
      const [bMin] = b.point.split('-').map(Number);
      return aMin - bMin; // Sort by point ascending
    })
    .slice(0, 3); // Get top 3
  
    return {
      groupStats,
      pointStats,
      sortedPointStats,
    };
  }

  function updateSummary() {
    const summaryEl = document.getElementById("summaryText");
    
    if (selected.size === 0) {
      summaryEl.innerHTML = '<span class="no-selection">Please select the cards you have from the table below.</span>';
    } else {
      const sortedStats = calculateStats().sortedPointStats;
      const lines = sortedStats.map(stat => 
        `${stat.point}: ${stat.probabilityPoints}%`
      );
      summaryEl.innerHTML = `${lines.join('<br>')}`;
    }
  }
  
  function showHelp() {
    document.getElementById("helpContent").innerHTML = LANG[currentLang].help;
    document.getElementById("helpModal").style.display = "block";
  }
  
  function showDetails() {
    let content = '';
    
    if (selected.size === 0) {
      content = '<div class="no-cards">No cards selected. Please select cards from the table below.</div>';
    } else {
      const stats = calculateStats();
      content += '<div class="missing-summary"><strong>Probabilities by Point Ranges:</strong><br>';
      // Use Object.values() to iterate over the object
      for (const pointStatsData of Object.values(stats.pointStats)) {
        content += `Point Range ${pointStatsData.point}: ${pointStatsData.probabilityPoints}%<br>`;
      }

      content += '</div><div class="missing-summary"><strong>Missing Cards by Group:</strong><br>';
      for (let i = 1; i <= 7; i++) {
        const groupStat = stats.groupStats[i];
        content += `Group ${i}: ${groupStat.missing} missing (${groupStat.selected}/${groupStat.total}) - ${groupStat.missingRate}%<br>`;
      }
      content += '</div>';
    }
    
    document.getElementById("detailsContent").innerHTML = content;
    document.getElementById("detailsModal").style.display = "block";
  }
  
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }
  
  // Close modal when clicking outside
  window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = "none";
    }
  }
  
  // Initialize
  loadSelections();
  loadCards();
  renderTable();