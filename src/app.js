const h = React.createElement;

const COUNTRY_ALIASES = {
  'cabo verde': 'cape verde',
  'congo': 'republic of congo',
  'czechia': 'czech republic',
  'eswatini': 'swaziland',
  'gambia': 'the gambia',
  'hong kong': 'china',
  'korea, north': 'dem. rep. korea',
  'korea, south': 'republic of korea',
  'laos': 'lao pdr',
  'north macedonia': 'macedonia',
  'russia': 'russian federation',
  'sao tome and principe': 'são tomé and principe',
  'singapore': 'singapore'
};

const STORAGE_KEY = 'map-compliance-state-v1';

function normalizeName(name){
  return name ? name.trim().toLowerCase() : '';
}

function usePersistentState(key, initial){
  const [value, setValue] = React.useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return typeof initial === 'function' ? initial() : initial;
  });

  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }, [value]);

  return [value, setValue];
}

function buildDefaultLegend(data, countryLookup){
  const groups = [
    { id: 'excellent', label: '80 - 100', color: '#1E8449', range: [80, 100] },
    { id: 'strong', label: '65 - 79', color: '#27AE60', range: [65, 79] },
    { id: 'solid', label: '50 - 64', color: '#52BE80', range: [50, 64] },
    { id: 'watch', label: '35 - 49', color: '#F39C12', range: [35, 49] },
    { id: 'critical', label: '0 - 34', color: '#C0392B', range: [0, 34] }
  ];

  const fields = [
    { id: 'score', label: 'Score 2024', type: 'number', showInTooltip: true, showInModal: true, defaultValue: '' },
    { id: 'notes', label: 'Note interne', type: 'text', showInTooltip: false, showInModal: true, defaultValue: '' }
  ];

  const perCountry = {};
  data.forEach(row => {
    const rawName = normalizeName(row['Country / Territory']);
    const mappedName = countryLookup(rawName);
    if (!mappedName) return;
    const score = Number(row['CPI 2024 score']);
    const group = groups.find(g => score >= g.range[0] && score <= g.range[1]);
    perCountry[mappedName] = {
      groupId: group ? group.id : null,
      value: isNaN(score) ? null : score,
      fields: { score: row['CPI 2024 score'] || '', notes: '' }
    };
  });

  return {
    id: 'cpi-2024',
    name: 'Légende CPI 2024',
    description: 'Indice de perception de la corruption 2024',
    groups,
    fields,
    createdAt: Date.now(),
    perCountry
  };
}

function LegendSelector({ legends, selectedId, onChange }){
  return h('div', { class: 'control-card' },
    h('div', { class: 'control-header' },
      h('h3', null, 'Légende active'),
      h('p', null, 'Basculez en un clic entre vos palettes.')
    ),
    h('select', {
      value: selectedId || '',
      onChange: e => onChange(e.target.value)
    },
      [h('option', { value: '', key: 'none' }, 'Choisir...')].concat(legends.map(l => h('option', { value: l.id, key: l.id }, l.name)))
    )
  );
}

function LegendEditor({ legend, onSave }){
  const [groupDraft, setGroupDraft] = React.useState({ label: '', color: '#4B89DC' });
  const [fieldDraft, setFieldDraft] = React.useState({ label: '', type: 'text', showInTooltip: true, showInModal: true, defaultValue: '' });

  if (!legend) return h('div', { class: 'control-card muted' }, 'Aucune légende sélectionnée.');

  const addGroup = () => {
    if (!groupDraft.label) return;
    const newGroup = { id: `${legend.id}-${Date.now()}`, label: groupDraft.label, color: groupDraft.color };
    onSave({ ...legend, groups: [...legend.groups, newGroup] });
    setGroupDraft({ label: '', color: '#4B89DC' });
  };

  const addField = () => {
    if (!fieldDraft.label) return;
    const id = `${legend.id}-field-${legend.fields.length + 1}`;
    onSave({ ...legend, fields: [...legend.fields, { ...fieldDraft, id }] });
    setFieldDraft({ label: '', type: 'text', showInTooltip: true, showInModal: true, defaultValue: '' });
  };

  return h('div', { class: 'control-card' },
    h('div', { class: 'control-header' }, h('h3', null, 'Backoffice légende'), h('p', null, 'Ajoutez des groupes ou des champs personnalisés.')),
    h('div', { class: 'stack gap-sm' },
      h('div', { class: 'stack gap-xs' },
        h('label', null, 'Nouveau groupe'),
        h('div', { class: 'inline' },
          h('input', {
            placeholder: 'Nom du groupe',
            value: groupDraft.label,
            onInput: e => setGroupDraft({ ...groupDraft, label: e.target.value })
          }),
          h('input', {
            type: 'color',
            value: groupDraft.color,
            onInput: e => setGroupDraft({ ...groupDraft, color: e.target.value })
          }),
          h('button', { class: 'primary', onClick: addGroup }, 'Ajouter')
        ),
        h('div', { class: 'legend-grid' }, legend.groups.map(g => h('div', { key: g.id, class: 'legend-pill' },
          h('span', { class: 'swatch', style: { background: g.color } }),
          h('span', { class: 'pill-text' }, g.label)
        )))
      ),
      h('div', { class: 'stack gap-xs' },
        h('label', null, 'Nouveau champ de fiche'),
        h('div', { class: 'inline wrap' },
          h('input', {
            placeholder: 'Libellé',
            value: fieldDraft.label,
            onInput: e => setFieldDraft({ ...fieldDraft, label: e.target.value })
          }),
          h('select', {
            value: fieldDraft.type,
            onChange: e => setFieldDraft({ ...fieldDraft, type: e.target.value })
          }, [
            h('option', { value: 'text' }, 'Texte'),
            h('option', { value: 'number' }, 'Nombre'),
            h('option', { value: 'multiline' }, 'Paragraphe')
          ]),
          h('label', { class: 'checkbox' },
            h('input', {
              type: 'checkbox',
              checked: fieldDraft.showInTooltip,
              onChange: e => setFieldDraft({ ...fieldDraft, showInTooltip: e.target.checked })
            }),
            'Infobulle'
          ),
          h('label', { class: 'checkbox' },
            h('input', {
              type: 'checkbox',
              checked: fieldDraft.showInModal,
              onChange: e => setFieldDraft({ ...fieldDraft, showInModal: e.target.checked })
            }),
            'Modal'
          ),
          h('button', { onClick: addField }, 'Ajouter')
        ),
        h('div', { class: 'field-chips' }, legend.fields.map(f => h('span', { key: f.id, class: 'chip' }, `${f.label} · ${f.type}`)))
      )
    )
  );
}

function CountryEditor({ legend, selection, countryData, onChange }){
  if (!legend || !selection) return h('div', { class: 'control-card muted' }, 'Sélectionnez un pays sur la carte.');
  const detail = countryData || {};

  const updateDetail = (payload) => {
    onChange({ ...detail, ...payload });
  };

  return h('div', { class: 'control-card' },
    h('div', { class: 'control-header' },
      h('h3', null, selection.displayName || selection.key),
      h('p', null, 'Affectez ce pays à un groupe et personnalisez sa fiche.')
    ),
    h('div', { class: 'stack gap-sm' },
      h('label', null, 'Groupe coloré'),
      h('select', {
        value: detail.groupId || '',
        onChange: e => updateDetail({ groupId: e.target.value || null })
      }, [h('option', { value: '' }, 'Aucun')] .concat(legend.groups.map(g => h('option', { value: g.id }, g.label))))
    ),
    h('div', { class: 'stack gap-sm' },
      h('label', null, 'Valeur clé'),
      h('input', {
        type: 'text',
        value: detail.value ?? '',
        onInput: e => updateDetail({ value: e.target.value })
      })
    ),
    h('div', { class: 'stack gap-sm' },
      h('label', null, 'Fiche personnalisée'),
      legend.fields.map(field => {
        const val = detail.fields?.[field.id] ?? field.defaultValue ?? '';
        const commonProps = {
          value: val,
          onInput: e => updateDetail({ fields: { ...(detail.fields || {}), [field.id]: e.target.value } })
        };
        let input;
        if (field.type === 'multiline'){
          input = h('textarea', { ...commonProps, rows: 3 });
        } else {
          input = h('input', { ...commonProps, type: field.type === 'number' ? 'number' : 'text' });
        }
        return h('div', { class: 'field-row', key: field.id },
          h('label', null, field.label),
          input,
          h('div', { class: 'flags' },
            h('span', { class: field.showInTooltip ? 'flag active' : 'flag' }, 'Infobulle'),
            h('span', { class: field.showInModal ? 'flag active' : 'flag' }, 'Modal')
          )
        );
      })
    )
  );
}

function LegendSummary({ legend }){
  if (!legend) return null;
  return h('div', { class: 'legend-summary' }, legend.groups.map(g => h('div', { key: g.id, class: 'legend-pill large' },
    h('span', { class: 'swatch', style: { background: g.color } }),
    h('div', { class: 'pill-meta' },
      h('strong', null, g.label)
    )
  )));
}

function Tooltip({ visible, position, title, lines }){
  if (!visible) return null;
  const style = { left: `${position.x + 12}px`, top: `${position.y + 12}px` };
  return h('div', { class: 'tooltip-card', style },
    h('strong', null, title),
    lines && lines.length ? h('ul', null, lines.map((l, i) => h('li', { key: i }, l))) : h('p', { class: 'muted' }, 'Aucune information')
  );
}

function Modal({ open, onClose, title, children }){
  if (!open) return null;
  return h('div', { class: 'modal-backdrop', onClick: onClose },
    h('div', { class: 'modal', onClick: e => e.stopPropagation() },
      h('div', { class: 'modal-header' },
        h('h3', null, title),
        h('button', { class: 'ghost', onClick: onClose }, 'Fermer')
      ),
      children
    )
  );
}

function App(){
  const [mapMarkup, setMapMarkup] = React.useState('');
  const [countryPaths, setCountryPaths] = React.useState({});
  const [dataset, setDataset] = React.useState([]);
  const [state, setState] = usePersistentState(STORAGE_KEY, { legends: [], selectedLegendId: null, countryDetails: {} });
  const [selection, setSelection] = React.useState(null);
  const [hoverInfo, setHoverInfo] = React.useState({ visible: false, position: { x: 0, y: 0 }, title: '', lines: [] });
  const [zoom, setZoom] = React.useState(1);
  const mapRef = React.useRef(null);
  const [modalContent, setModalContent] = React.useState(null);

  const countryLookup = (rawName) => {
    const name = normalizeName(rawName);
    const alias = COUNTRY_ALIASES[name];
    const key = alias ? normalizeName(alias) : name;
    if (countryPaths[key]) return key;
    return null;
  };

  React.useEffect(() => {
    fetch('world.svg').then(r => r.text()).then(setMapMarkup);
    fetch('ICP2024.json').then(r => r.json()).then(setDataset);
  }, []);

  React.useEffect(() => {
    if (!mapMarkup || !mapRef.current) return;
    mapRef.current.innerHTML = mapMarkup;
    const svgEl = mapRef.current.querySelector('svg');
    if (svgEl){
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    const mapping = {};
    mapRef.current.querySelectorAll('path').forEach(path => {
      const raw = path.getAttribute('name') || path.getAttribute('class') || path.getAttribute('id');
      if (!raw) return;
      const key = normalizeName(raw);
      mapping[key] = mapping[key] || [];
      mapping[key].push(path);
      path.style.cursor = 'pointer';
      path.addEventListener('mouseenter', (e) => handleHover(key, e));
      path.addEventListener('mousemove', (e) => handleHover(key, e));
      path.addEventListener('mouseleave', () => setHoverInfo(prev => ({ ...prev, visible: false })));
      path.addEventListener('click', () => selectCountry(key, raw));
    });
    setCountryPaths(mapping);
  }, [mapMarkup]);

  React.useEffect(() => {
    if (!dataset.length || state.legends.length || !Object.keys(countryPaths).length) return;
    const legend = buildDefaultLegend(dataset, countryLookup);
    setState(prev => ({ ...prev, legends: [legend], selectedLegendId: legend.id, countryDetails: { [legend.id]: legend.perCountry } }));
  }, [dataset, countryPaths]);

  React.useEffect(() => {
    applyColors();
  }, [state, selection, countryPaths]);

  const applyColors = () => {
    const legend = state.legends.find(l => l.id === state.selectedLegendId);
    const details = legend ? state.countryDetails[legend.id] || {} : {};
    Object.entries(countryPaths).forEach(([key, paths]) => {
      const detail = details[key];
      let color = '#e1e6ed';
      if (detail && detail.groupId){
        const group = legend.groups.find(g => g.id === detail.groupId);
        color = group ? group.color : color;
      }
      const isActive = selection && selection.key === key;
      paths.forEach(p => {
        p.style.fill = color;
        p.style.stroke = isActive ? '#222' : '#fff';
        p.style.strokeWidth = isActive ? '2' : '0.8';
      });
    });
  };

  const handleHover = (key, event) => {
    const legend = state.legends.find(l => l.id === state.selectedLegendId);
    if (!legend) return;
    const details = state.countryDetails[legend.id] || {};
    const detail = details[key];
    const tooltipLines = [];
    if (detail){
      const fields = legend.fields.filter(f => f.showInTooltip);
      fields.forEach(f => {
        const val = detail.fields?.[f.id] ?? detail.value ?? '-';
        tooltipLines.push(`${f.label}: ${val || '-'}`);
      });
    }
    setHoverInfo({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      title: selection && selection.key === key ? (selection.displayName || key) : key,
      lines: tooltipLines
    });
  };

  const selectCountry = (key, label) => {
    setSelection({ key, displayName: label });
    const legend = state.legends.find(l => l.id === state.selectedLegendId);
    if (!legend) return;
    const details = state.countryDetails[legend.id] || {};
    const detail = details[key];
    if (detail){
      const modalLines = legend.fields.filter(f => f.showInModal).map(f => ({ label: f.label, value: detail.fields?.[f.id] || detail.value || '-' }));
      setModalContent({ title: label || key, lines: modalLines });
    }
  };

  const updateCountry = (payload) => {
    const legendId = state.selectedLegendId;
    if (!legendId) return;
    const prevCountries = state.countryDetails[legendId] || {};
    const nextCountries = { ...prevCountries, [selection.key]: { ...(prevCountries[selection.key] || { fields: {} }), ...payload, fields: { ...(prevCountries[selection.key]?.fields || {}), ...(payload.fields || {}) } } };
    setState(prev => ({ ...prev, countryDetails: { ...prev.countryDetails, [legendId]: nextCountries } }));
  };

  const createLegend = () => {
    const id = `legend-${Date.now()}`;
    const newLegend = {
      id,
      name: 'Nouvelle légende',
      description: 'Palette personnalisée',
      groups: [{ id: `${id}-g1`, label: 'Groupe principal', color: '#4B89DC' }],
      fields: [{ id: `${id}-field-1`, label: 'Valeur', type: 'text', showInTooltip: true, showInModal: true, defaultValue: '' }],
      perCountry: {}
    };
    setState(prev => ({ ...prev, legends: [...prev.legends, newLegend], selectedLegendId: id, countryDetails: { ...prev.countryDetails, [id]: {} } }));
  };

  const saveLegend = (legend) => {
    setState(prev => ({
      ...prev,
      legends: prev.legends.map(l => l.id === legend.id ? legend : l),
      countryDetails: { ...prev.countryDetails, [legend.id]: prev.countryDetails[legend.id] || {} }
    }));
  };

  const legend = state.legends.find(l => l.id === state.selectedLegendId);
  const countryDetail = legend && selection ? (state.countryDetails[legend.id] || {})[selection.key] : null;

  const zoomToEurope = () => {
    setZoom(2.2);
    if (mapRef.current){
      mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  const resetView = () => setZoom(1);

  return h('div', { class: 'page' },
    h('header', { class: 'app-header' },
      h('div', { class: 'title-block' },
        h('h1', null, 'Compliance map studio'),
        h('p', null, 'Infographies interactives 100% locales')
      ),
      h('div', { class: 'controls' },
        h('button', { class: 'secondary', onClick: resetView }, 'Vue globale'),
        h('button', { class: 'primary', onClick: zoomToEurope }, 'Zoom Europe XXL'),
        h('button', { class: 'ghost', onClick: createLegend }, 'Nouvelle légende')
      )
    ),
    h('main', { class: 'layout' },
      h('section', { class: 'map-panel' },
        h('div', { class: 'map-container', style: { transform: `scale(${zoom})` } }, h('div', { class: 'svg-holder', ref: mapRef })),
        h(Tooltip, hoverInfo)
      ),
      h('aside', { class: 'side-panel' },
        h(LegendSelector, {
          legends: state.legends,
          selectedId: state.selectedLegendId,
          onChange: id => setState(prev => ({ ...prev, selectedLegendId: id }))
        }),
        h(LegendEditor, { legend, onSave: saveLegend }),
        h(CountryEditor, { legend, selection, countryData: countryDetail, onChange: updateCountry })
      )
    ),
    h('footer', { class: 'app-footer' },
      h('div', null, 'Carte immersive avec backoffice'),
      h('div', { class: 'version' }, 'v1.0.0')
    ),
    h('div', { class: 'legend-bar' },
      h('div', { class: 'legend-bar-inner' },
        legend ? h(LegendSummary, { legend }) : h('span', null, 'Ajoutez une légende pour activer la carte'),
        selection ? h('div', { class: 'legend-selection' }, 'Pays sélectionné : ', selection.displayName || selection.key) : null
      )
    ),
    h(Modal, {
      open: !!modalContent,
      onClose: () => setModalContent(null),
      title: modalContent?.title
    }, modalContent ? h('div', { class: 'stack gap-sm' }, modalContent.lines.map((line, i) => h('div', { key: i },
      h('strong', null, line.label),
      h('p', null, line.value || '-')
    ))) : null)
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
