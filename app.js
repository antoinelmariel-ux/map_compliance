import { createElement as h, render } from './react-lite.js';

const VERSION = '1.0.0';

function MapSurface() {
  const fallback = h(
    'div',
    { className: 'map-fallback' },
    'Chargement de la carte...'
  );

  const mapObject = h('object', {
    data: './world.svg',
    type: 'image/svg+xml',
    ariaLabel: 'Carte du monde',
    onError: () => mapObject.replaceWith(fallback.cloneNode(true)),
  });

  const container = h('div', { className: 'map-surface' }, mapObject);
  return container;
}

function ZoomControls() {
  let zoom = 100;
  const level = h('span', { className: 'zoom-level', ariaLive: 'polite' }, `${zoom}%`);

  const update = (delta) => {
    zoom = Math.min(400, Math.max(25, zoom + delta));
    level.textContent = `${zoom}%`;
  };

  const zoomIn = h('button', { type: 'button', onClick: () => update(10), ariaLabel: 'Zoom avant' }, '+');
  const zoomOut = h('button', { type: 'button', onClick: () => update(-10), ariaLabel: 'Zoom arrière' }, '−');

  return h('div', { className: 'zoom-controls', role: 'group', ariaLabel: 'Commandes de zoom' }, zoomOut, level, zoomIn);
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
  return h(
    'div',
    { className: 'page' },
    h(
      'main',
      { className: 'map-area', role: 'main' },
      h(MapSurface),
      h(OverlayDock),
      h(ZoomControls)
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
