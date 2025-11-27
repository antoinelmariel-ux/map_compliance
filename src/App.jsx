import React, { useEffect, useMemo, useState } from 'react';
import storageService from './services/storageService';
import MapView from './components/MapView';
import LegendPanel from './components/LegendPanel';
import AdminPanel from './components/AdminPanel';
import CountryModal from './components/CountryModal';

const formatDataset = (dataset) => ({
  ...dataset,
  groups: dataset.groups || [],
  countryValues: dataset.countryValues || {},
  fields: dataset.fields || [],
  countryDetails: dataset.countryDetails || {}
});

export default function App() {
  const [data, setData] = useState(storageService.load());
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [tooltipCountry, setTooltipCountry] = useState(null);

  const activeDataset = useMemo(() => {
    const found = data.datasets.find((d) => d.id === data.activeDatasetId) || data.datasets[0];
    return formatDataset(found);
  }, [data]);

  useEffect(() => {
    storageService.save(data);
  }, [data]);

  const updateDataset = (updater) => {
    setData((prev) => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      return { ...updated };
    });
  };

  const handleDatasetChange = (id) => {
    updateDataset({ ...data, activeDatasetId: id });
  };

  const handleUpdateDataset = (updatedDataset) => {
    const datasets = data.datasets.map((d) => (d.id === updatedDataset.id ? updatedDataset : d));
    updateDataset({ ...data, datasets });
  };

  const handleAddDataset = (label) => {
    const id = crypto.randomUUID();
    const base = formatDataset(storageService.defaults.datasets[0]);
    const clone = {
      ...base,
      id,
      name: label || `Jeu ${data.datasets.length + 1}`,
      groups: base.groups.map((g) => ({ ...g, id: crypto.randomUUID() })),
      countryValues: { ...base.countryValues },
      fields: base.fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
      countryDetails: JSON.parse(JSON.stringify(base.countryDetails))
    };
    updateDataset({ ...data, activeDatasetId: id, datasets: [...data.datasets, clone] });
  };

  const handleDeleteDataset = (id) => {
    if (data.datasets.length === 1) return;
    const filtered = data.datasets.filter((d) => d.id !== id);
    updateDataset({
      ...data,
      activeDatasetId: filtered[0].id,
      datasets: filtered
    });
  };

  const handleImport = (json) => {
    try {
      const imported = storageService.import(json);
      setData(imported);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReset = () => {
    const reset = storageService.reset();
    setData(reset);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Carte de conformité</p>
          <h1>Compliance map &amp; admin</h1>
          <p className="subtitle">
            Visualisez la maturité par pays, ajustez vos légendes et vos fiches en temps réel – 100% local.
          </p>
        </div>
        <div className="header-actions">
          <div className="dataset-select">
            <label>Jeu de données</label>
            <select value={activeDataset.id} onChange={(e) => handleDatasetChange(e.target.value)}>
              {data.datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>
          <button className="ghost" onClick={() => handleAddDataset()}>Nouveau jeu</button>
          <button className="primary" onClick={() => setAdminOpen((v) => !v)}>
            {adminOpen ? 'Fermer le back-office' : 'Ouvrir le back-office'}
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="map-panel">
          <MapView
            groups={activeDataset.groups}
            countryValues={activeDataset.countryValues}
            fields={activeDataset.fields}
            countryDetails={activeDataset.countryDetails}
            onCountryClick={(country) => setSelectedCountry(country)}
            onHover={(payload) => setTooltipCountry(payload)}
          />
          <LegendPanel groups={activeDataset.groups} countryValues={activeDataset.countryValues} />
        </section>

        {adminOpen && (
          <aside className="admin-panel">
            <AdminPanel
              dataset={activeDataset}
              datasets={data.datasets}
              onDatasetChange={handleDatasetChange}
              onSave={handleUpdateDataset}
              onAddDataset={handleAddDataset}
              onDeleteDataset={handleDeleteDataset}
              onImport={handleImport}
              onExport={() => storageService.export()}
              onReset={handleReset}
            />
          </aside>
        )}
      </main>

      <footer className="app-footer">
        <span>Compliance Studio • Version 1.0.2</span>
        <span>Les données sont stockées uniquement dans votre navigateur.</span>
      </footer>

      {selectedCountry && (
        <CountryModal
          country={selectedCountry}
          groups={activeDataset.groups}
          countryValues={activeDataset.countryValues}
          fields={activeDataset.fields}
          countryDetails={activeDataset.countryDetails}
          onClose={() => setSelectedCountry(null)}
        />
      )}
      {tooltipCountry && tooltipCountry.visible && (
        <div className="tooltip" style={{ top: tooltipCountry.y, left: tooltipCountry.x }}>
          <p className="tooltip-title">{tooltipCountry.name}</p>
          {tooltipCountry.fields?.map((field) => (
            <div key={field.label} className="tooltip-line">
              <span>{field.label}</span>
              <strong>{field.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
