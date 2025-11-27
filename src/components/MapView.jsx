import React, { useEffect, useMemo, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function MapView({ groups, countryValues, fields, countryDetails, onCountryClick, onHover }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const tooltipFields = useMemo(() => fields.filter((f) => f.inTooltip), [fields]);

  useEffect(() => {
    const svgPath = `${import.meta.env.BASE_URL}world.svg`;

    fetch(svgPath)
      .then((res) => res.text())
      .then((text) => setSvgContent(text))
      .catch(() => setSvgContent('<p>Carte indisponible</p>'));
  }, []);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return undefined;
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return undefined;

    const countryElements = svgElement.querySelectorAll('path[id], g[id]');
    const cleanups = [];

    countryElements.forEach((el) => {
      const code = (el.getAttribute('id') || '').toUpperCase();
      const group = groups.find((g) => g.countries.includes(code));
      const color = group?.color || '#0f172a';
      el.style.fill = color;
      el.style.stroke = '#0b1220';
      el.style.strokeWidth = '0.5';
      el.style.transition = 'fill 0.2s ease, transform 0.2s ease';

      const onEnter = (event) => {
        const name = el.getAttribute('name') || el.getAttribute('data-name') || code;
        const detail = countryDetails?.[code] || {};
        const fieldValues = tooltipFields.map((field) => ({
          label: field.label,
          value: detail[field.id] || field.defaultValue
        }));
        el.style.transform = 'scale(1.02)';
        onHover?.({
          visible: true,
          code,
          name,
          x: event.clientX + 12,
          y: event.clientY + 12,
          fields: fieldValues
        });
      };

      const onMove = (event) => {
        onHover?.((prev) => ({
          ...prev,
          x: event.clientX + 12,
          y: event.clientY + 12
        }));
      };

      const onLeave = () => {
        el.style.transform = 'scale(1)';
        onHover?.({ visible: false });
      };

      const onClick = () => {
        const name = el.getAttribute('name') || el.getAttribute('data-name') || code;
        const value = countryValues?.[code];
        const detail = countryDetails?.[code];
        onCountryClick?.({ code, name, value, detail });
      };

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      el.addEventListener('click', onClick);

      cleanups.push(() => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('click', onClick);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [svgContent, groups, countryValues, countryDetails, tooltipFields, onCountryClick, onHover]);

  const zoom = (direction) => {
    setScale((prev) => clamp(prev + direction * 0.2, 0.6, 3));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const focusEurope = () => {
    setScale(1.8);
    setOffset({ x: -180, y: -40 });
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    zoom(delta);
  };

  return (
    <div className="map-wrapper">
      <div className="map-toolbar">
        <button onClick={() => zoom(1)}>+</button>
        <button onClick={() => zoom(-1)}>-</button>
        <button onClick={focusEurope}>Zoom Europe</button>
        <button onClick={resetView}>Reset</button>
      </div>
      <div className="map-surface" onWheel={handleWheel}>
        <div
          ref={containerRef}
          className="map-canvas"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
}
