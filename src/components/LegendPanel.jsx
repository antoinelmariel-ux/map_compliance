import React from 'react';

export default function LegendPanel({ groups, countryValues }) {
  const totalCountries = Object.keys(countryValues || {}).length;

  return (
    <div className="legend-panel">
      <div className="legend-header">
        <h3>Légende active</h3>
        <p>{totalCountries} pays suivis</p>
      </div>
      <div className="legend-grid">
        {groups.map((group) => (
          <div key={group.id} className="legend-item">
            <span className="badge" style={{ background: group.color }} />
            <div>
              <p className="legend-title">{group.name}</p>
              <p className="legend-sub">{group.countries.length} pays</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
