import React from 'react';

export default function CountryModal({ country, groups, countryValues, fields, countryDetails, onClose }) {
  const group = groups.find((g) => g.countries.includes(country.code));
  const detail = countryDetails?.[country.code] || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <p className="eyebrow">{group ? group.name : 'Aucun groupe'}</p>
            <h2>{country.name || country.code}</h2>
            {countryValues?.[country.code] && <p className="subtitle">{countryValues[country.code]}</p>}
          </div>
          <button className="ghost" onClick={onClose}>
            Fermer
          </button>
        </header>

        <div className="modal-body">
          <section className="detail-grid">
            {fields
              .filter((field) => field.inModal)
              .map((field) => (
                <div key={field.id} className="detail-card">
                  <p className="legend-sub">{field.label}</p>
                  <p className="detail-value">{detail[field.id] || field.defaultValue}</p>
                </div>
              ))}
          </section>
        </div>
      </div>
    </div>
  );
}
