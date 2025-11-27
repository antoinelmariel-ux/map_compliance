import React from 'react';

export default function CountryForm({ fields, countryCode, values, onChange }) {
  if (!countryCode) {
    return <p className="hint">Choisissez un code pays (ISO-3) pour éditer sa fiche.</p>;
  }

  return (
    <div className="country-form">
      {fields.map((field) => (
        <label key={field.id} className="form-control">
          <span>{field.label}</span>
          {field.type === 'textarea' ? (
            <textarea
              value={values?.[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              rows={3}
            />
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={values?.[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
