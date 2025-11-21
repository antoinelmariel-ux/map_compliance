import { createElement as h, render } from './react-lite.js';

const VERSION = '1.1.0';

function MapSurface({ onStageReady }) {
  const fallback = h(
    'div',
    { className: 'map-fallback' },
    'Chargement de la carte...'
  );

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
    } catch (error) {
      const errorFallback = fallback.cloneNode(true);
      errorFallback.textContent = 'Carte indisponible.';
      stage.replaceChildren(errorFallback);
      console.error(error);
    }
  };

  injectSvg();
  onStageReady?.(stage);

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
  const focusButton = h(
    'button',
    { type: 'button', onClick: focus, ariaLabel: 'Centrer sur l’Europe' },
    'Focus Europe'
  );

  return h(
    'div',
    { className: 'zoom-controls', role: 'group', ariaLabel: 'Commandes de zoom' },
    zoomOut,
    level,
    zoomIn,
    resetButton,
    focusButton
  );
}

function DockPanel({ title, children }) {
  return h(
    'div',
    { className: 'panel' },
    h('h3', null, title),
    h('p', null, children)
  );
}

function OverlayDock() {
  return h(
    'div',
    { className: 'overlay-dock', role: 'complementary' },
    h(DockPanel, { title: 'Légende' }, 'Zones colorées selon le statut de conformité des pays.'),
    h(DockPanel, { title: 'Backoffice' }, 'Gestion des calques, sources de données et contrôles internes.')
  );
}

function Footer() {
  return h(
    'footer',
    { className: 'footer' },
    h(
      'div',
      { className: 'footer-content' },
      h('span', null, 'Interface cartographique immersive'),
      h('span', null, h('em', null, `Version ${VERSION}`))
    )
  );
}

function App() {
  const stageRef = { current: null };
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

  return h(
    'div',
    { className: 'page' },
    h(
      'main',
      { className: 'map-area', role: 'main' },
      h(MapSurface, { onStageReady: (stage) => {
        stageRef.current = stage;
        applyTransform();
      }}),
      h(OverlayDock),
      h(ZoomControls, {
        getScale: () => mapState.scale,
        onScaleChange: handleScaleChange,
        onReset: handleReset,
        onFocusEurope: handleFocusEurope,
      })
    ),
    h(Footer)
  );
}

function bootstrap() {
  const root = document.getElementById('root');
  if (!root) return;

  render(h(App), root);
}

bootstrap();
