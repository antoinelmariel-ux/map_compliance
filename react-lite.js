/**
 * Mini implémentation de React pour une expérience 100 % embarquée.
 * Fournit createElement, Fragment et render pour des composants fonctionnels simples.
 */
export const Fragment = Symbol('Fragment');

function applyProps(element, props = {}) {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children' || value === undefined || value === null) return;

    if (key === 'className') {
      element.className = value;
      return;
    }

    if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
      return;
    }

    if (/^on[A-Z]/.test(key) && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
      return;
    }

    element.setAttribute(key, value);
  });
}

function normalizeChild(child) {
  if (Array.isArray(child)) {
    return child.flatMap((item) => normalizeChild(item)).filter(Boolean);
  }

  if (child === false || child === true || child === undefined || child === null) {
    return [];
  }

  if (child instanceof Node) {
    return [child];
  }

  if (typeof child === 'string' || typeof child === 'number') {
    return [document.createTextNode(child)];
  }

  return [];
}

function createDomElement(type, props, children) {
  if (type === Fragment) {
    const fragment = document.createDocumentFragment();
    normalizeChild(children).forEach((node) => fragment.appendChild(node));
    return fragment;
  }

  const element = document.createElement(type);
  applyProps(element, props);
  normalizeChild(children).forEach((node) => element.appendChild(node));
  return element;
}

export function createElement(type, props = {}, ...children) {
  const normalizedChildren = children.length === 1 ? children[0] : children;

  if (typeof type === 'function') {
    return normalizeChild(type({ ...(props || {}), children: normalizedChildren }))[0];
  }

  return createDomElement(type, props, normalizedChildren);
}

export function render(rootElement, container) {
  if (!(container instanceof Element)) {
    throw new Error('Le conteneur de rendu est introuvable.');
  }

  container.replaceChildren();
  const nodes = normalizeChild(rootElement);
  nodes.forEach((node) => container.appendChild(node));
}

export default {
  Fragment,
  createElement,
  render,
};
