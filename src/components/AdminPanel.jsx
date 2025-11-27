import React, { useEffect, useMemo, useState } from 'react';
import CountryForm from './CountryForm';

const emptyGroup = { name: '', color: '#10b981', countries: '' };
const emptyField = { label: '', type: 'text', inTooltip: false, inModal: true };

export default function AdminPanel({
  dataset,
  datasets,
  onDatasetChange,
  onSave,
  onAddDataset,
  onDeleteDataset,
  onImport,
  onExport,
  onReset
}) {
  const [draft, setDraft] = useState(dataset);
  const [newGroup, setNewGroup] = useState(emptyGroup);
  const [newField, setNewField] = useState(emptyField);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [jsonBuffer, setJsonBuffer] = useState('');

  useEffect(() => {
    setDraft(dataset);
  }, [dataset]);

  const groupCount = useMemo(() => draft.groups.length, [draft.groups]);

  const updateDraft = (partial) => setDraft((prev) => ({ ...prev, ...partial }));

  const handleGroupUpdate = (id, patch) => {
    const groups = draft.groups.map((g) => (g.id === id ? { ...g, ...patch } : g));
    updateDraft({ groups });
    onSave({ ...draft, groups });
  };

  const handleAddGroup = () => {
    if (!newGroup.name.trim()) return;
    const countries = newGroup.countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    const group = { id: crypto.randomUUID(), name: newGroup.name, color: newGroup.color, countries };
    const groups = [...draft.groups, group];
    updateDraft({ groups });
    onSave({ ...draft, groups });
    setNewGroup(emptyGroup);
  };

  const handleDeleteGroup = (id) => {
    const groups = draft.groups.filter((g) => g.id !== id);
    updateDraft({ groups });
    onSave({ ...draft, groups });
  };

  const handleValueChange = (code, value) => {
    const countryValues = { ...draft.countryValues, [code]: value };
    updateDraft({ countryValues });
    onSave({ ...draft, countryValues });
  };

  const handleFieldToggle = (id, key) => {
    const fields = draft.fields.map((f) => (f.id === id ? { ...f, [key]: !f[key] } : f));
    updateDraft({ fields });
    onSave({ ...draft, fields });
  };

  const handleFieldUpdate = (id, patch) => {
    const fields = draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f));
    updateDraft({ fields });
    onSave({ ...draft, fields });
  };

  const handleAddField = () => {
    if (!newField.label.trim()) return;
    const fields = [...draft.fields, { ...newField, id: crypto.randomUUID(), defaultValue: newField.defaultValue || '' }];
    updateDraft({ fields });
    onSave({ ...draft, fields });
    setNewField(emptyField);
  };

  const selectedCountryValues = draft.countryDetails[selectedCountryCode] || {};

  const handleCountryFieldChange = (fieldId, value) => {
    const countryDetails = {
      ...draft.countryDetails,
      [selectedCountryCode]: { ...selectedCountryValues, [fieldId]: value }
    };
    updateDraft({ countryDetails });
    onSave({ ...draft, countryDetails });
  };

  const handleDatasetName = (name) => {
    const updated = { ...draft, name };
    setDraft(updated);
    onSave(updated);
  };

  return (
    <div className="admin">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Back-office</p>
          <h3>Configurer les légendes et fiches</h3>
          <p className="subtitle">Groupes, valeurs, structure des fiches et export JSON.</p>
        </div>
        <div className="dataset-actions">
          <label className="form-control inline">
            <span>Nom du jeu</span>
            <input value={draft.name} onChange={(e) => handleDatasetName(e.target.value)} />
          </label>
          <select value={dataset.id} onChange={(e) => onDatasetChange(e.target.value)}>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button className="ghost" onClick={() => onAddDataset('Nouveau jeu')}>Dupliquer</button>
          <button className="ghost" onClick={() => onDeleteDataset(dataset.id)} disabled={datasets.length === 1}>
            Supprimer
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Groupes</p>
            <h4>{groupCount} groupes colorés</h4>
            <p className="legend-sub">Affectez une couleur et une liste de pays à chaque groupe.</p>
          </div>
          <div className="inline-form">
            <input
              placeholder="Nom du groupe"
              value={newGroup.name}
              onChange={(e) => setNewGroup((g) => ({ ...g, name: e.target.value }))}
            />
            <input
              type="color"
              value={newGroup.color}
              onChange={(e) => setNewGroup((g) => ({ ...g, color: e.target.value }))}
            />
            <input
              placeholder="Codes pays (FRA,DEU...)"
              value={newGroup.countries}
              onChange={(e) => setNewGroup((g) => ({ ...g, countries: e.target.value }))}
            />
            <button className="primary" onClick={handleAddGroup}>Ajouter</button>
          </div>
        </div>
        <div className="group-grid">
          {draft.groups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-title">
                <span className="badge" style={{ background: group.color }} />
                <input
                  value={group.name}
                  onChange={(e) => handleGroupUpdate(group.id, { name: e.target.value })}
                />
              </div>
              <label className="form-control">
                <span>Couleur</span>
                <input
                  type="color"
                  value={group.color}
                  onChange={(e) => handleGroupUpdate(group.id, { color: e.target.value })}
                />
              </label>
              <label className="form-control">
                <span>Codes pays</span>
                <textarea
                  rows={2}
                  value={group.countries.join(', ')}
                  onChange={(e) =>
                    handleGroupUpdate(group.id, {
                      countries: e.target.value
                        .split(',')
                        .map((c) => c.trim().toUpperCase())
                        .filter(Boolean)
                    })
                  }
                />
              </label>
              <button className="ghost danger" onClick={() => handleDeleteGroup(group.id)}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Valeurs par pays</p>
            <h4>Scores / statuts</h4>
            <p className="legend-sub">Définissez un statut texte pour chaque pays suivi.</p>
          </div>
        </div>
        <div className="values-grid">
          {Object.entries(draft.countryValues).map(([code, value]) => (
            <label key={code} className="form-control">
              <span>{code}</span>
              <input value={value} onChange={(e) => handleValueChange(code, e.target.value)} />
            </label>
          ))}
          <label className="form-control">
            <span>Ajouter</span>
            <input
              placeholder="USA: A surveiller"
              onBlur={(e) => {
                const [code, val] = e.target.value.split(':');
                if (code && val) {
                  handleValueChange(code.trim().toUpperCase(), val.trim());
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Structure de fiche</p>
            <h4>Champs personnalisés</h4>
            <p className="legend-sub">Choisissez les champs visibles dans l’infobulle et le modal.</p>
          </div>
          <div className="inline-form">
            <input
              placeholder="Libellé"
              value={newField.label}
              onChange={(e) => setNewField((f) => ({ ...f, label: e.target.value }))}
            />
            <select value={newField.type} onChange={(e) => setNewField((f) => ({ ...f, type: e.target.value }))}>
              <option value="text">Texte</option>
              <option value="number">Nombre</option>
              <option value="textarea">Paragraphe</option>
            </select>
            <input
              placeholder="Valeur par défaut"
              value={newField.defaultValue || ''}
              onChange={(e) => setNewField((f) => ({ ...f, defaultValue: e.target.value }))}
            />
            <button className="primary" onClick={handleAddField}>Ajouter</button>
          </div>
        </div>
        <div className="field-grid">
          {draft.fields.map((field) => (
            <div key={field.id} className="field-card">
              <input
                value={field.label}
                onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
              />
              <select value={field.type} onChange={(e) => handleFieldUpdate(field.id, { type: e.target.value })}>
                <option value="text">Texte</option>
                <option value="number">Nombre</option>
                <option value="textarea">Paragraphe</option>
              </select>
              <div className="toggle-row">
                <label>
                  <input
                    type="checkbox"
                    checked={field.inTooltip}
                    onChange={() => handleFieldToggle(field.id, 'inTooltip')}
                  />
                  Infobulle
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={field.inModal}
                    onChange={() => handleFieldToggle(field.id, 'inModal')}
                  />
                  Modal
                </label>
              </div>
              <label className="form-control">
                <span>Par défaut</span>
                <input
                  value={field.defaultValue || ''}
                  onChange={(e) => handleFieldUpdate(field.id, { defaultValue: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Fiche pays</p>
            <h4>Valeurs personnalisées</h4>
            <p className="legend-sub">Sélectionnez un pays et renseignez ses champs.</p>
          </div>
          <div className="inline-form">
            <input
              placeholder="Code pays (ISO-3)"
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <CountryForm
          fields={draft.fields}
          countryCode={selectedCountryCode}
          values={selectedCountryValues}
          onChange={handleCountryFieldChange}
        />
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Sauvegarde</p>
            <h4>Import / Export</h4>
            <p className="legend-sub">Toutes les données restent dans le navigateur via localStorage.</p>
          </div>
          <div className="inline-buttons">
            <button className="ghost" onClick={() => setJsonBuffer(onExport())}>Exporter JSON</button>
            <button className="primary" onClick={() => onImport(jsonBuffer)} disabled={!jsonBuffer}>
              Importer JSON
            </button>
            <button className="ghost danger" onClick={onReset}>Réinitialiser</button>
          </div>
        </div>
        <textarea
          className="code-block"
          rows={6}
          placeholder="Collez ici un JSON de configuration"
          value={jsonBuffer}
          onChange={(e) => setJsonBuffer(e.target.value)}
        />
      </section>
    </div>
  );
}
