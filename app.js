const SEASON_ORDER = ['s1', 's2', 's3', 's4', 's5', 's6'];
const ILUA_ORDER = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'];
const SEASON_COLORS = {
  s1: '#d86d4f',
  s2: '#f0b23c',
  s3: '#d9a15b',
  s4: '#9bb98a',
  s5: '#b6cfe2',
  s6: '#d9a6b1'
};
const CATEGORY_INFO = {
  bush_food: { label: 'Bush Food', emoji: '🌿' },
  bush_medicine: { label: 'Bush Medicine', emoji: '🌼' },
  wildflower: { label: 'Wildflower', emoji: '🌺' }
};

const STATE = {
  navStack: ['season'],
  selectedSeason: '',
  selectedILUA: '',
  selectedCategory: '',
  checked: loadCheckedState()
};

let seasonLookup = {};
let iluaLookup = {};
let speciesCatalog = [];

async function initApp() {
  try {
    const [seasonRows, iluaRows, foodRows, medRows, wildRows] = await Promise.all([
      fetchCSV('season_data_master.csv'),
      fetchCSV('ilua_data_master.csv'),
      fetchCSV('bush_food_data_master.csv'),
      fetchCSV('bush_med_data_master.csv'),
      fetchCSV('wildflower_data_master.csv')
    ]);

    seasonLookup = buildSeasonLookup(seasonRows);
    iluaLookup = buildIluaLookup(iluaRows);
    speciesCatalog = buildSpeciesCatalog(foodRows, medRows, wildRows);

    render();
    document.getElementById('backButton').addEventListener('click', goBack);
  } catch (error) {
    console.error(error);
    document.getElementById('appView').innerHTML = `
      <div class="view">
        <div class="empty-state">
          <h2>Data could not be loaded.</h2>
          <p>Please ensure the CSV files are present in the project folder and run this app from a local web server.</p>
        </div>
      </div>
    `;
  }
}

function render() {
  const view = STATE.navStack[STATE.navStack.length - 1];
  const appView = document.getElementById('appView');
  const backButton = document.getElementById('backButton');

  backButton.classList.toggle('hidden', STATE.navStack.length <= 1);

  if (view === 'season') {
    appView.innerHTML = renderSeasonView();
    bindSeasonEvents();
    return;
  }

  if (view === 'ilua') {
    appView.innerHTML = renderIluaView();
    bindIluaEvents();
    return;
  }

  if (view === 'category') {
    appView.innerHTML = renderCategoryView();
    bindCategoryEvents();
    return;
  }

  if (view === 'species') {
    appView.innerHTML = renderSpeciesView();
    bindSpeciesEvents();
  }
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

function describeAnnularSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
    'Z'
  ].join(' ');
}

function renderSeasonView() {
  const cx = 340;
  const cy = 340;
  const innerRadius = 165;
  const outerRadius = 305;

  const seasonCards = SEASON_ORDER.map((id, index) => {
    const season = seasonLookup[id];
    const isSelected = STATE.selectedSeason === id;
    const startAngle = index * 60;
    const endAngle = startAngle + 60;
    const path = describeAnnularSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
    const midAngle = startAngle + 30;
    const labelRadius = 235;
    const labelPoint = polarToCartesian(cx, cy, labelRadius, midAngle);
    const isBirak = id === 's1';
    const isBunuru = id === 's2';
    const isDjeran = id === 's3';
    const isMakuru = id === 's4';
    const isDjilba = id === 's5';
    const isKambarang = id === 's6';
    const extraRotation = isBirak || isBunuru || isDjilba || isKambarang ? -90 : isDjeran || isMakuru ? 90 : 0;
    const seasonInfo1 = season.season_info1 || '';
    const seasonInfo2 = season.season_info2 || '';

    return `
      <g class="season-wedge ${isSelected ? 'selected' : ''}" data-season="${id}" data-angle="${midAngle}">
        <path d="${path}" fill="${SEASON_COLORS[id]}" stroke="${SEASON_COLORS[id]}" stroke-width="4" />
        <g transform="translate(${labelPoint.x} ${labelPoint.y}) rotate(${midAngle + 90 + extraRotation})">
          <text class="season-text season-name" x="0" y="-22" text-anchor="middle" transform="rotate(${midAngle > 90 && midAngle < 270 ? 180 : 0})">${season.season_name}</text>
          <text class="season-text season-month" x="0" y="0" text-anchor="middle" transform="rotate(${midAngle > 90 && midAngle < 270 ? 180 : 0})">${season.season_months}</text>
          <text class="season-text season-weather" x="0" y="24" text-anchor="middle" transform="rotate(${midAngle > 90 && midAngle < 270 ? 180 : 0})">${season.season_weather}</text>
          <text class="season-text season-info1" x="0" y="48" text-anchor="middle" transform="rotate(${midAngle > 90 && midAngle < 270 ? 180 : 0})">${seasonInfo1}</text>
          <text class="season-text season-info2" x="0" y="72" text-anchor="middle" transform="rotate(${midAngle > 90 && midAngle < 270 ? 180 : 0})">${seasonInfo2}</text>
        </g>
      </g>
    `;
  }).join('');

  const selectedSeason = STATE.selectedSeason ? seasonLookup[STATE.selectedSeason] : null;

  return `
    <div class="view">
      <div class="view-header">
        <h2>Select a season</h2>
        <p>Choose the Noongar season to begin your plant search.</p>
      </div>

      <div class="season-wheel" aria-label="Season selection wheel">
        <svg class="season-svg" viewBox="0 0 680 680" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <circle cx="340" cy="340" r="165" fill="rgba(255,255,255,0.82)" stroke="rgba(39,64,53,0.12)" stroke-width="2" />
          <circle cx="340" cy="340" r="72" fill="rgba(255,255,255,0.94)" stroke="rgba(39,64,53,0.12)" stroke-width="2" />
          ${seasonCards}
        </svg>
        <div class="season-wheel-center">
          <div>
            <div class="main-label">SIX</div>
            <div class="mini-title">SEASONS</div>
          </div>
        </div>
      </div>

      ${selectedSeason ? `
        <div class="season-details">
          <h3>${selectedSeason.season_name}</h3>
          <p><strong>Months:</strong> ${selectedSeason.season_months}</p>
          <p><strong>Weather:</strong> ${selectedSeason.season_weather}</p>
          <p><strong>Information:</strong> ${selectedSeason.season_info}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function renderIluaView() {
  const iluaCards = ILUA_ORDER.map((id, index) => `
    <button class="ilua-node ${STATE.selectedILUA === id ? 'selected' : ''}" type="button" data-ilua="${id}" style="--angle:${(index * 360) / ILUA_ORDER.length}deg;">
      ${iluaLookup[id].ilua_name}
    </button>
  `).join('');

  return `
    <div class="view">
      <div class="view-header">
        <h2>Select an ILUA area</h2>
        <p>Choose the Noongar ILUA area for the current season.</p>
      </div>

      <div class="selection-summary">
        <span class="summary-pill">Season: ${STATE.selectedSeason ? seasonLookup[STATE.selectedSeason].season_name : 'Not selected'}</span>
      </div>

      <div class="map-panel">
        <div class="ilua-map" aria-label="ILUA map selection">
          <div class="map-center">
            <h3>ILUA Areas</h3>
          </div>
          ${iluaCards}
        </div>

        <div class="ilua-info-grid">
          ${ILUA_ORDER.map((id) => `
            <article class="info-card">
              <h3>${iluaLookup[id].ilua_name}</h3>
              <p>${iluaLookup[id].ilua_info}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCategoryView() {
  return `
    <div class="view">
      <div class="view-header">
        <h2>Select a plant category</h2>
        <p>See which species are available in ${seasonLookup[STATE.selectedSeason].season_name} within ${iluaLookup[STATE.selectedILUA].ilua_name}.</p>
      </div>

      <div class="selection-summary">
        <span class="summary-pill">Season: ${seasonLookup[STATE.selectedSeason].season_name}</span>
        <span class="summary-pill">Area: ${iluaLookup[STATE.selectedILUA].ilua_name}</span>
      </div>

      <div class="category-grid">
        ${Object.entries(CATEGORY_INFO).map(([key, item]) => `
          <button class="category-card" type="button" data-category="${key}">
            <div class="category-emoji">${item.emoji}</div>
            <div>${item.label}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSpeciesView() {
  const species = getFilteredSpecies();

  return `
    <div class="view">
      <div class="view-header">
        <h2>${CATEGORY_INFO[STATE.selectedCategory].label} species</h2>
        <p>${seasonLookup[STATE.selectedSeason].season_name} • ${iluaLookup[STATE.selectedILUA].ilua_name}</p>
      </div>

      <div class="selection-summary">
        <span class="summary-pill">Season: ${seasonLookup[STATE.selectedSeason].season_name}</span>
        <span class="summary-pill">Area: ${iluaLookup[STATE.selectedILUA].ilua_name}</span>
        <span class="summary-pill">Category: ${CATEGORY_INFO[STATE.selectedCategory].label}</span>
      </div>

      <div class="species-list">
        ${species.length ? species.map((item) => {
          const checked = Boolean(STATE.checked[item.id]);
          const seasonsFound = getSeasonSummary(item);
          const areasFound = getIluaSummary(item);
          const photoSrc = item.photo_hlink || placeholderImage(item.common_name || item.species_name);

          return `
            <article class="species-card">
              <img class="species-photo" src="${photoSrc}" alt="${item.species_name}" onerror="this.onerror=null;this.src='${placeholderImage(item.common_name || item.species_name)}'" />
              <div class="species-body">
                <h3>${item.species_name}</h3>
                <p class="subtitle">${item.common_name || 'No common name recorded'}</p>
                <p>${item.species_info || 'No additional species information available.'}</p>
                <div class="species-meta">
                  <span class="meta-tag">Seasons: ${seasonsFound}</span>
                  <span class="meta-tag">Areas: ${areasFound}</span>
                </div>
                <a class="species-link" href="${item.photo_hlink}" target="_blank" rel="noreferrer">View species photo</a>
              </div>
              <label class="found-toggle">
                <input type="checkbox" data-species-id="${item.id}" ${checked ? 'checked' : ''} />
                <span>Found</span>
              </label>
            </article>
          `;
        }).join('') : `
          <div class="empty-state">
            No species match this combination of season, ILUA area, and category.
          </div>
        `}
      </div>
    </div>
  `;
}

function bindSeasonEvents() {
  document.querySelectorAll('.season-wedge').forEach((wedge) => {
    wedge.style.cursor = 'pointer';
    wedge.addEventListener('click', () => {
      STATE.selectedSeason = wedge.dataset.season;
      STATE.navStack.push('ilua');
      render();
    });
  });
}

function bindIluaEvents() {
  document.querySelectorAll('.ilua-node').forEach((button) => {
    button.addEventListener('click', () => {
      STATE.selectedILUA = button.dataset.ilua;
      STATE.navStack.push('category');
      render();
    });
  });
}

function bindCategoryEvents() {
  document.querySelectorAll('.category-card').forEach((button) => {
    button.addEventListener('click', () => {
      STATE.selectedCategory = button.dataset.category;
      STATE.navStack.push('species');
      render();
    });
  });
}

function bindSpeciesEvents() {
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const speciesId = event.target.dataset.speciesId;
      STATE.checked[speciesId] = event.target.checked;
      localStorage.setItem('noongarPlantFinderChecked', JSON.stringify(STATE.checked));
    });
  });
}

function goBack() {
  if (STATE.navStack.length > 1) {
    STATE.navStack.pop();
    render();
  }
}

function getFilteredSpecies() {
  if (!STATE.selectedSeason || !STATE.selectedILUA || !STATE.selectedCategory) {
    return [];
  }

  return speciesCatalog.filter((species) => {
    return (
      species.category === STATE.selectedCategory &&
      species.seasonPresence[STATE.selectedSeason] === 'y' &&
      species.iluaPresence[STATE.selectedILUA] === 'y'
    );
  });
}

function getSeasonSummary(species) {
  return SEASON_ORDER.filter((id) => species.seasonPresence[id] === 'y')
    .map((id) => seasonLookup[id].season_name)
    .slice(0, 3)
    .join(', ');
}

function getIluaSummary(species) {
  return ILUA_ORDER.filter((id) => species.iluaPresence[id] === 'y')
    .map((id) => iluaLookup[id].ilua_name)
    .slice(0, 3)
    .join(', ');
}

function buildSeasonLookup(rows) {
  return rows.reduce((acc, row) => {
    acc[row.season_id] = row;
    return acc;
  }, {});
}

function buildIluaLookup(rows) {
  return rows.reduce((acc, row) => {
    acc[row.ilua_id] = row;
    return acc;
  }, {});
}

function buildSpeciesCatalog(foodRows, medRows, wildRows) {
  const allRows = [...foodRows, ...medRows, ...wildRows];

  return allRows.map((row) => {
    const seasonPresence = {};
    const iluaPresence = {};

    SEASON_ORDER.forEach((id) => {
      seasonPresence[id] = row[id] ? row[id].toLowerCase() : 'n';
    });

    ILUA_ORDER.forEach((id) => {
      iluaPresence[id] = row[id] ? row[id].toLowerCase() : 'n';
    });

    return {
      id: row.species_id,
      species_name: row.species_name || 'Unknown species',
      common_name: row.common_name || '',
      category: row.category || 'wildflower',
      species_info: row.species_info || 'No information supplied.',
      photo_hlink: row.photo_hlink || '',
      seasonPresence,
      iluaPresence
    };
  });
}

function fetchCSV(filePath) {
  return fetch(filePath)
    .then((response) => response.text())
    .then((text) => parseCSV(text));
}

function parseCSV(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }

      row.push(current);
      current = '';

      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
    } else {
      current += char;
    }
  }

  if (current.length || row.length) {
    row.push(current);
    if (row.some((cell) => cell !== '')) {
      rows.push(row);
    }
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] || '').trim();
    });
    return record;
  });
}

function loadCheckedState() {
  try {
    const value = localStorage.getItem('noongarPlantFinderChecked');
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

function placeholderImage(label) {
  const safeLabel = (label || 'Plant').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
      <rect width="600" height="420" fill="#e5edd8"/>
      <circle cx="300" cy="150" r="72" fill="#9ec28a"/>
      <path d="M300 220 L300 310" stroke="#4d6c3d" stroke-width="18" stroke-linecap="round"/>
      <path d="M260 245 L300 225 L340 245" fill="none" stroke="#4d6c3d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="300" y="360" text-anchor="middle" font-size="32" font-family="Arial" fill="#2c4d38">${safeLabel}</text>
    </svg>
  `)}`;
}

initApp();
