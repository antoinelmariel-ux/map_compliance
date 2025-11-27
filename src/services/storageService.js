const STORAGE_KEY = 'compliance-map-data';

const defaultData = {
  version: '1.0.3',
  activeDatasetId: 'default',
  datasets: [
    {
      id: 'default',
      name: 'Jeu principal',
      description: 'Configuration de référence pour le suivi de conformité par pays.',
      groups: [
        {
          id: 'grp-eu',
          name: 'Europe conforme',
          color: '#22d3ee',
          countries: ['FRA', 'DEU', 'ESP', 'ITA', 'BEL', 'NLD', 'LUX', 'PRT']
        },
        {
          id: 'grp-northam',
          name: 'Amériques à surveiller',
          color: '#f97316',
          countries: ['USA', 'CAN', 'MEX']
        },
        {
          id: 'grp-apac',
          name: 'APAC en construction',
          color: '#a855f7',
          countries: ['AUS', 'NZL', 'JPN', 'KOR', 'SGP']
        }
      ],
      countryValues: {
        FRA: 'Conforme',
        DEU: 'Conforme',
        ESP: 'Conforme',
        ITA: 'Conforme',
        USA: 'A surveiller',
        CAN: 'A surveiller',
        MEX: 'A surveiller',
        JPN: 'En projet',
        AUS: 'En projet',
        SGP: 'Pilote en cours'
      },
      fields: [
        {
          id: 'field-status',
          label: 'Statut de conformité',
          type: 'text',
          inTooltip: true,
          inModal: true,
          defaultValue: 'Non renseigné'
        },
        {
          id: 'field-risk',
          label: 'Niveau de risque',
          type: 'text',
          inTooltip: false,
          inModal: true,
          defaultValue: 'Moyen'
        },
        {
          id: 'field-notes',
          label: 'Notes pays',
          type: 'textarea',
          inTooltip: false,
          inModal: true,
          defaultValue: 'A compléter'
        }
      ],
      countryDetails: {
        FRA: {
          'field-status': 'Conforme',
          'field-risk': 'Faible',
          'field-notes': 'RGPD aligné, politiques internes validées.'
        },
        USA: {
          'field-status': 'A surveiller',
          'field-risk': 'Modéré',
          'field-notes': 'Adaptation en cours sur les clauses de transfert.'
        },
        AUS: {
          'field-status': 'En projet',
          'field-risk': 'Modéré',
          'field-notes': 'Cartographie des données en cours.'
        }
      }
    }
  ]
};

const storageService = {
  load() {
    if (typeof localStorage === 'undefined') {
      return defaultData;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Impossible de parser les données, réinitialisation.', error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
  },
  save(payload) {
    if (typeof localStorage === 'undefined') return payload;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  },
  reset() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    }
    return defaultData;
  },
  export() {
    return JSON.stringify(this.load(), null, 2);
  },
  import(json) {
    try {
      const parsed = JSON.parse(json);
      this.save(parsed);
      return parsed;
    } catch (error) {
      throw new Error('Format JSON invalide');
    }
  },
  defaults: defaultData
};

export default storageService;
