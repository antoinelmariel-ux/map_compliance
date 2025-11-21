import { createElement as h, render } from './react-lite.js';

const VERSION = '1.3.0';
const STORAGE_KEY = 'map-config-v1';

const DEFAULT_FIELDS = [
  { id: 'cpi2024', label: 'CPI 2024', type: 'number', display: 'quick' },
  { id: 'quickNote', label: 'Note rapide', type: 'text', display: 'quick' },
  { id: 'details', label: 'Détails', type: 'textarea', display: 'modal' },
];

const NAME_ALIASES = {
  "United States": 'United States of America',
  "United States of America": 'United States of America',
  "Cabo Verde": 'Cape Verde',
  "Côte d'Ivoire": "Cote d'Ivoire",
  "Côte d’Ivoire": "Cote d'Ivoire",
  "Czechia": 'Czech Republic',
  "Congo, Democratic Republic of the": 'Congo, Dem. Rep.',
  "Congo, Rep.": 'Congo',
  "Korea, Dem. People's Rep.": 'North Korea',
  "Korea, Rep.": 'South Korea',
  "Lao PDR": 'Laos',
  "Russian Federation": 'Russia',
  "Syrian Arab Republic": 'Syria',
  "Turkiye": 'Turkey',
  "Türkiye": 'Turkey',
  "United Kingdom": 'United Kingdom',
  "Viet Nam": 'Vietnam',
  "Bahamas, The": 'Bahamas',
  "Gambia, The": 'Gambia',
  "Swaziland": 'Eswatini',
};

function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Impossible de charger la configuration', error);
  }

  return {
    groups: [],
    fields: DEFAULT_FIELDS,
    values: {},
    version: VERSION,
  };
}

function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, version: VERSION }));
  } catch (error) {
    console.warn('Impossible de sauvegarder la configuration', error);
  }
}

function normalizeName(name) {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’]/g, "'")
    .toLowerCase()
    .trim();
}

function buildCountryIndex(svg) {
  const nodes = Array.from(svg.querySelectorAll('[id][name]'));
  const nameIndex = new Map();
  nodes.forEach((node) => {
    const readable = node.getAttribute('name') || node.id;
    const normalized = normalizeName(readable);
    nameIndex.set(normalized, node.id);
  });
  return { nodes, nameIndex };
}

function buildGroupIndex(groups) {
  const index = new Map();
  groups.forEach((group) => {
    const ids = (group.countries || []).map((code) => code.trim().toUpperCase()).filter(Boolean);
    ids.forEach((id) => index.set(id, group));
  });
  return index;
}

function applyGroupsToMap(groups, countries) {
  const groupIndex = buildGroupIndex(groups);

  countries.forEach(({ id, element, name }) => {
    const group = groupIndex.get(id);
    const color = group?.color;
    element.classList.add('country-path');
    element.style.transition = 'fill 200ms ease, stroke 200ms ease';
    element.style.fill = color || '#1f2937';
    element.style.stroke = color ? 'rgba(255,255,255,0.35)' : '#0f172a';
    element.style.cursor = 'pointer';
    element.setAttribute('aria-label', `${name} (${id})${group ? `, groupe ${group.name}` : ''}`);
  });

  return groupIndex;
}

function Tooltip() {
  const node = h('div', { className: 'tooltip hidden' });
  return node;
}

function InfoModal() {
  const container = h('div', { className: 'modal hidden', role: 'dialog', ariaModal: 'true' },
    h('div', { className: 'modal-content' },
      h('header', { className: 'modal-header' },
        h('h3', { className: 'modal-title' }, 'Fiche pays'),
        h('button', { type: 'button', className: 'ghost', ariaLabel: 'Fermer', onClick: () => container.classList.add('hidden') }, '×')
      ),
      h('div', { className: 'modal-body' })
    )
  );
  return container;
}

function MapSurface({ onStageReady }) {
  const fallback = h('div', { className: 'map-fallback' }, 'Chargement de la carte...');
  const stage = h('div', { id: 'map-stage', role: 'img', ariaLabel: 'Carte du monde' }, fallback);
  const container = h('div', { className: 'map-surface' }, stage);

  const injectSvg = async () => {
    try {
      const response = await fetch('./world.svg');
      if (!response.ok) throw new Error('Chargement impossible');
      const markup = await response.text();
      const parser = new DOMParser();
      const parsed = parser.parseFromString(markup, 'image/svg+xml');
      const svg = parsed.querySelector('svg');
      if (!svg) throw new Error('Fichier SVG invalide');

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('role', 'presentation');

      stage.replaceChildren(svg);
      onStageReady?.(stage, svg);
    } catch (error) {
      const errorFallback = fallback.cloneNode(true);
      errorFallback.textContent = 'Carte indisponible.';
      stage.replaceChildren(errorFallback);
      console.error(error);
    }
  };

  injectSvg();

  return container;
}

function ZoomControls({ getScale, onScaleChange, onReset, onFocusEurope }) {
  const format = (value) => `${Math.round(value * 100)}%`;
  const level = h('span', { className: 'zoom-level', ariaLive: 'polite' }, format(getScale()));

  const update = (delta) => {
    const value = onScaleChange(delta);
    level.textContent = format(value);
  };

  const reset = () => {
    const value = onReset();
    level.textContent = format(value);
  };

  const focus = () => {
    const value = onFocusEurope();
    level.textContent = format(value);
  };

  const zoomIn = h('button', { type: 'button', onClick: () => update(0.1), ariaLabel: 'Zoom avant' }, '+');
  const zoomOut = h('button', { type: 'button', onClick: () => update(-0.1), ariaLabel: 'Zoom arrière' }, '−');
  const resetButton = h('button', { type: 'button', onClick: reset, ariaLabel: 'Réinitialiser le zoom' }, 'Reset');
  const focusButton = h('button', { type: 'button', onClick: focus, ariaLabel: 'Centrer sur l’Europe' }, 'Focus Europe');

  return h('div', { className: 'zoom-controls', role: 'group', ariaLabel: 'Commandes de zoom' }, zoomOut, level, zoomIn, resetButton, focusButton);
}

function Footer() {
  return h('footer', { className: 'footer' }, h('div', { className: 'footer-content' }, h('span', null, 'Interface cartographique immersive'), h('span', null, h('em', null, `Version ${VERSION}`))));
}

function Section({ title, description, children }) {
  return h('section', { className: 'panel block' }, h('header', { className: 'panel-header' }, h('div', null, h('h3', null, title), description && h('p', { className: 'muted' }, description))), children);
}

function Backoffice({ state, onUpdate }) {
  const { config, countries } = state;
  const tab = state.activeTab || 'groups';

  const setTab = (next) => {
    state.activeTab = next;
    onUpdate();
  };

  const updateConfig = (draftUpdater) => {
    draftUpdater();
    saveConfig(config);
    onUpdate(true);
  };

  const addGroup = () => {
    updateConfig(() => {
      config.groups.push({ name: 'Nouveau groupe', color: '#38bdf8', countries: [] });
    });
  };

  const updateGroupField = (index, key, value) => {
    updateConfig(() => {
      config.groups[index] = { ...config.groups[index], [key]: value };
    });
  };

  const updateGroupCountries = (index, value) => {
    const entries = value
      .split(/[ ,;\n]+/)
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
    updateGroupField(index, 'countries', entries);
  };

  const removeGroup = (index) => {
    updateConfig(() => {
      config.groups.splice(index, 1);
    });
  };

  const addField = () => {
    updateConfig(() => {
      config.fields.push({
        id: `champ_${Date.now()}`,
        label: 'Nouveau champ',
        type: 'text',
        display: 'modal',
      });
    });
  };

  const updateField = (index, key, value) => {
    updateConfig(() => {
      const next = { ...config.fields[index], [key]: value };
      config.fields[index] = next;
    });
  };

  const removeField = (index) => {
    updateConfig(() => {
      const fieldId = config.fields[index].id;
      config.fields.splice(index, 1);
      Object.values(config.values).forEach((entry) => delete entry[fieldId]);
    });
  };

  const renderGroupsTab = () =>
    h(
      Section,
      {
        title: 'Groupes de pays',
        description: 'Créez des familles colorées pour segmenter les zones géographiques.',
      },
      h('div', { className: 'group-actions' }, h('button', { type: 'button', onClick: addGroup }, 'Ajouter un groupe')),
      h(
        'div',
        { className: 'group-grid' },
        config.groups.map((group, index) =>
          h(
            'div',
            { className: 'group-card' },
            h('div', { className: 'group-row' },
              h('input', {
                value: group.name,
                onInput: (e) => updateGroupField(index, 'name', e.target.value),
                placeholder: 'Nom du groupe',
              }),
              h('input', {
                type: 'color',
                value: group.color || '#38bdf8',
                onInput: (e) => updateGroupField(index, 'color', e.target.value),
                ariaLabel: 'Couleur du groupe',
              }),
              h('button', { type: 'button', className: 'ghost', onClick: () => removeGroup(index) }, 'Supprimer')
            ),
            h('label', { className: 'muted small' }, 'Pays (ISO2, séparés par virgule ou espace)'),
            h('textarea', {
              value: (group.countries || []).join(', '),
              onInput: (e) => updateGroupCountries(index, e.target.value),
              rows: 3,
              placeholder: 'FR, DE, IT...'
            })
          )
        )
      )
    );

  const renderFieldsTab = () =>
    h(
      Section,
      {
        title: 'Champs personnalisés',
        description: 'Définissez les champs affichés dans les infobulles et fiches détaillées.',
      },
      h('div', { className: 'group-actions' }, h('button', { type: 'button', onClick: addField }, 'Ajouter un champ')),
      h(
        'div',
        { className: 'field-grid' },
        config.fields.map((field, index) =>
          h(
            'div',
            { className: 'field-card' },
            h('div', { className: 'field-row' },
              h('input', {
                value: field.label,
                onInput: (e) => updateField(index, 'label', e.target.value),
                placeholder: 'Libellé',
              }),
              h('select', {
                value: field.display,
                onInput: (e) => updateField(index, 'display', e.target.value),
              },
                h('option', { value: 'quick' }, 'Infobulle'),
                h('option', { value: 'modal' }, 'Fiche détaillée')
              ),
              h('select', {
                value: field.type,
                onInput: (e) => updateField(index, 'type', e.target.value),
              },
                h('option', { value: 'text' }, 'Texte'),
                h('option', { value: 'number' }, 'Nombre'),
                h('option', { value: 'textarea' }, 'Paragraphe'),
                h('option', { value: 'url' }, 'URL')
              ),
              h('button', { type: 'button', className: 'ghost', onClick: () => removeField(index) }, 'Supprimer')
            ),
            h('input', {
              value: field.id,
              onInput: (e) => updateField(index, 'id', e.target.value.trim()),
              placeholder: 'Identifiant technique',
            })
          )
        )
      )
    );

  const renderCountryForm = () => {
    const selected = state.selectedCountry || countries[0]?.id;
    const entry = config.values[selected] || {};

    const updateValue = (fieldId, value) => {
      updateConfig(() => {
        config.values[selected] = { ...(config.values[selected] || {}), [fieldId]: value };
      });
    };

    return h(
      'form',
      { className: 'country-form', onSubmit: (e) => e.preventDefault() },
      h('label', { className: 'muted small' }, 'Pays'),
      h(
        'select',
        {
          value: selected,
          onInput: (e) => {
            state.selectedCountry = e.target.value;
            onUpdate();
          },
        },
        countries.map((country) => h('option', { value: country.id }, `${country.name} (${country.id})`))
      ),
      h('div', { className: 'field-stack' },
        config.fields.map((field) => {
          const commonProps = {
            value: entry[field.id] ?? '',
            onInput: (e) => updateValue(field.id, e.target.value),
            placeholder: field.label,
          };

          if (field.type === 'textarea') {
            return h('label', { className: 'field-control' },
              h('span', null, `${field.label} (${field.display === 'quick' ? 'infobulle' : 'fiche'})`),
              h('textarea', { ...commonProps, rows: 3 })
            );
          }

          return h('label', { className: 'field-control' },
            h('span', null, `${field.label} (${field.display === 'quick' ? 'infobulle' : 'fiche'})`),
            h('input', { ...commonProps, type: field.type === 'number' ? 'number' : 'text', inputmode: field.type === 'number' ? 'decimal' : 'text' })
          );
        })
      )
    );
  };

  const renderValuesTab = () =>
    h(
      Section,
      {
        title: 'Valeurs par pays',
        description: 'Saisissez les informations affichées dans les infobulles et fiches pays.',
      },
      countries.length === 0
        ? h('p', { className: 'muted' }, 'Carte en cours de chargement...')
        : renderCountryForm()
    );

  return h(
    'div',
    { className: 'backoffice' },
    h('div', { className: 'tablist', role: 'tablist' },
      h('button', { className: tab === 'groups' ? 'active' : '', onClick: () => setTab('groups'), role: 'tab' }, 'Groupes/Couleurs'),
      h('button', { className: tab === 'values' ? 'active' : '', onClick: () => setTab('values'), role: 'tab' }, 'Valeurs par pays'),
      h('button', { className: tab === 'fields' ? 'active' : '', onClick: () => setTab('fields'), role: 'tab' }, 'Fiches pays')
    ),
    tab === 'groups' && renderGroupsTab(),
    tab === 'values' && renderValuesTab(),
    tab === 'fields' && renderFieldsTab()
  );
}

function App() {
  const stageRef = { current: null };
  const config = loadConfig();
  const state = {
    config,
    countries: [],
    activeTab: 'groups',
    selectedCountry: null,
    tooltipNode: null,
    modalNode: null,
    nameIndex: new Map(),
  };

  const mapState = { scale: 1, translateX: 0, translateY: 0 };
  const clamp = (value) => Math.min(4, Math.max(0.25, value));

  const applyTransform = () => {
    if (!stageRef.current) return mapState.scale;
    stageRef.current.style.transform = `translate(${mapState.translateX}px, ${mapState.translateY}px) scale(${mapState.scale})`;
    stageRef.current.dataset.scale = mapState.scale.toFixed(2);
    return mapState.scale;
  };

  const handleScaleChange = (delta) => {
    mapState.scale = clamp(mapState.scale + delta);
    return applyTransform();
  };

  const handleReset = () => {
    mapState.scale = 1;
    mapState.translateX = 0;
    mapState.translateY = 0;
    return applyTransform();
  };

  const handleFocusEurope = () => {
    mapState.scale = 2.4;
    mapState.translateX = -180;
    mapState.translateY = -40;
    return applyTransform();
  };

  const redrawBackoffice = (applyMap = false) => {
    if (!state.backofficeHost) return;
    render(
      h(Backoffice, {
        state,
        onUpdate: (shouldRefresh = false) => redrawBackoffice(shouldRefresh),
      }),
      state.backofficeHost
    );
    if (applyMap) {
      state.groupIndex = applyGroupsToMap(config.groups, state.countries);
    }
    syncSelectedHighlight();
  };

  const syncSelectedHighlight = () => {
    state.countries.forEach((country) => {
      country.element.classList.toggle('selected', country.id === state.selectedCountry);
    });
  };

  const handleSelectCountry = (country) => {
    state.selectedCountry = country.id;
    syncSelectedHighlight();
    redrawBackoffice();
  };

  const showTooltip = (event, country) => {
    const node = state.tooltipNode;
    if (!node) return;
    const values = config.values[country.id] || {};
    const quickFields = config.fields.filter((field) => field.display === 'quick');
    const group = state.groupIndex?.get(country.id);

    const primaryField = config.fields.find((field) => field.id === 'cpi2024') || quickFields[0];
    const primaryValue = primaryField ? values[primaryField.id] ?? '—' : '—';
    node.innerHTML = '';
    node.appendChild(h('strong', null, `${country.name} (${country.id})`));

    node.appendChild(
      h('div', { className: 'tooltip-row' }, h('span', { className: 'label' }, 'Groupe'), h('span', { className: 'value' }, group?.name || 'Non assigné'))
    );

    node.appendChild(
      h('div', { className: 'tooltip-row' }, h('span', { className: 'label' }, 'Valeur'), h('span', { className: 'value' }, primaryValue))
    );

    if (quickFields.length === 0) {
      node.appendChild(h('p', { className: 'muted small' }, 'Aucun champ rapide configuré.'));
    } else {
      quickFields.forEach((field) => {
        const rawValue = values[field.id];
        const content = rawValue ?? '—';
        node.appendChild(h('div', { className: 'tooltip-row' }, h('span', { className: 'label' }, field.label), h('span', { className: 'value' }, content)));
      });
    }

    node.classList.remove('hidden');
    node.style.left = `${event.clientX + 12}px`;
    node.style.top = `${event.clientY + 12}px`;
  };

  const hideTooltip = () => state.tooltipNode?.classList.add('hidden');

  const openModal = (country) => {
    if (!state.modalNode) return;
    handleSelectCountry(country);
    const values = config.values[country.id] || {};
    const modalBody = state.modalNode.querySelector('.modal-body');
    modalBody.innerHTML = '';
    modalBody.appendChild(h('h4', null, `${country.name} (${country.id})`));

    const fields = config.fields;
    fields.forEach((field) => {
      const value = values[field.id];
      modalBody.appendChild(h('div', { className: 'modal-row' }, h('span', { className: 'label' }, field.label), h('span', { className: 'value' }, value ?? '—')));
    });

    state.modalNode.classList.remove('hidden');
  };

  const attachCountryEvents = () => {
    state.countries.forEach((country) => {
      const element = country.element;
      element.addEventListener('mouseenter', (event) => {
        element.classList.add('hovered');
        showTooltip(event, country);
      });
      element.addEventListener('mousemove', (event) => showTooltip(event, country));
      element.addEventListener('mouseleave', () => {
        element.classList.remove('hovered');
        hideTooltip();
      });
      element.addEventListener('click', () => openModal(country));
    });
  };

  const tryPrefillData = async () => {
    try {
      const response = await fetch('./ICP2024.json');
      if (!response.ok) return;
      const dataset = await response.json();
      const nameIndex = state.nameIndex;
      let updated = false;

      dataset.forEach((entry) => {
        const name = entry['Country / Territory'];
        const alias = NAME_ALIASES[name] || name;
        const normalized = normalizeName(alias);
        const iso2 = nameIndex.get(normalized);
        if (!iso2) return;
        const score = entry['CPI 2024 score'];
        if (!config.values[iso2]) config.values[iso2] = {};
        if (config.values[iso2].cpi2024 === undefined) {
          config.values[iso2].cpi2024 = score;
          updated = true;
        }
      });

      if (updated) {
        saveConfig(config);
        redrawBackoffice();
      }
    } catch (error) {
      console.warn('Pré-remplissage impossible', error);
    }
  };

  const handleStageReady = (stage, svg) => {
    stageRef.current = stage;
    applyTransform();
    const { nodes, nameIndex } = buildCountryIndex(svg);
    state.countries = nodes.map((node) => ({ id: node.id, name: node.getAttribute('name') || node.id, element: node }));
    state.nameIndex = nameIndex;
    state.selectedCountry = state.countries[0]?.id || null;

    attachCountryEvents();
    state.groupIndex = applyGroupsToMap(config.groups, state.countries);
    tryPrefillData();
    redrawBackoffice();
  };

  const tooltip = Tooltip();
  state.tooltipNode = tooltip;
  const modal = InfoModal();
  state.modalNode = modal;

  const backofficeMount = h('div', { className: 'backoffice-host' });
  state.backofficeHost = backofficeMount;

  const layout = h(
    'div',
    { className: 'page' },
    h(
      'main',
      { className: 'map-area', role: 'main', tabIndex: 0, ariaLabel: 'Carte interactive du monde', ariaDescribedby: 'map-instructions' },
      h(MapSurface, { onStageReady: handleStageReady }),
      h('div', { className: 'overlay-dock', role: 'complementary' },
        h('div', { className: 'panel' }, h('h3', null, 'Légende'), h('p', null, 'Zones colorées selon le statut de conformité des pays.')),
        h('div', { className: 'panel' }, h('h3', null, 'Backoffice'), h('p', null, 'Utilisez les onglets pour gérer groupes, champs rapides et fiches pays. Les flèches déplacent la carte, +/- pour zoomer, 0 pour réinitialiser.'))
      ),
      h(ZoomControls, {
        getScale: () => mapState.scale,
        onScaleChange: handleScaleChange,
        onReset: handleReset,
        onFocusEurope: handleFocusEurope,
      }),
      tooltip,
      modal
    ),
    backofficeMount,
    h('div', { className: 'sr-only', id: 'map-instructions' },
      'Navigation clavier : flèches pour déplacer la carte, plus ou égal pour zoomer, moins pour dézoomer, zéro pour réinitialiser, F pour centrer sur l’Europe. Les infobulles affichent nom, groupe, valeur et champs rapides configurés.'
    ),
    h(Footer)
  );

  const handleKeyControls = (event) => {
    const step = 40;
    let handled = false;
    switch (event.key) {
      case 'ArrowUp':
        mapState.translateY += step;
        handled = true;
        break;
      case 'ArrowDown':
        mapState.translateY -= step;
        handled = true;
        break;
      case 'ArrowLeft':
        mapState.translateX += step;
        handled = true;
        break;
      case 'ArrowRight':
        mapState.translateX -= step;
        handled = true;
        break;
      case '+':
      case '=':
        mapState.scale = clamp(mapState.scale + 0.1);
        handled = true;
        break;
      case '-':
        mapState.scale = clamp(mapState.scale - 0.1);
        handled = true;
        break;
      case '0':
        handleReset();
        handled = true;
        break;
      case 'f':
      case 'F':
        handleFocusEurope();
        handled = true;
        break;
      default:
        break;
    }

    if (handled) {
      applyTransform();
      event.preventDefault();
    }
  };

  window.addEventListener('keydown', handleKeyControls);

  setTimeout(() => {
    redrawBackoffice();
  }, 0);

  window.addEventListener('beforeunload', () => {
    window.removeEventListener('keydown', handleKeyControls);
  });

  return layout;
}

function bootstrap() {
  const root = document.getElementById('root');
  if (!root) return;
  render(h(App), root);
}

bootstrap();
