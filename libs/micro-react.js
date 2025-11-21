(function(global){
  const isEvent = name => /^on/.test(name);
  const isAttribute = name => !isEvent(name) && name !== 'children' && name !== 'style';
  const Fragment = Symbol('Fragment');

  const hookState = new Map();
  const effectState = new Map();
  let currentPath = 'root';
  let hookIndex = 0;
  let rootElement = null;
  let rootContainer = null;

  function createElement(type, props, ...children){
    const flatChildren = [];
    children.flat(Infinity).forEach(child => {
      if (child === false || child === true || child === null || child === undefined) return;
      flatChildren.push(child);
    });
    return { type, props: props || {}, children: flatChildren };
  }

  function useRef(initial){
    return { current: initial };
  }

  function useState(initial){
    const key = currentPath;
    const hooks = hookState.get(key) || [];
    if (hooks[hookIndex] === undefined){
      hooks[hookIndex] = typeof initial === 'function' ? initial() : initial;
    }
    const stateIndex = hookIndex;
    function setState(value){
      const currentHooks = hookState.get(key) || [];
      const nextValue = typeof value === 'function' ? value(currentHooks[stateIndex]) : value;
      currentHooks[stateIndex] = nextValue;
      hookState.set(key, currentHooks);
      rerender();
    }
    const value = hooks[hookIndex];
    hookState.set(key, hooks);
    hookIndex++;
    return [value, setState];
  }

  function useEffect(effect, deps){
    const key = currentPath;
    const hooks = effectState.get(key) || [];
    const prev = hooks[hookIndex];
    let hasChanged = true;
    if (prev && deps){
      hasChanged = deps.some((dep, i) => dep !== prev.deps[i]);
    } else if (prev && !deps){
      hasChanged = true;
    }
    hooks[hookIndex] = { effect, deps, hasChanged };
    effectState.set(key, hooks);
    hookIndex++;
  }

  function applyEffects(){
    effectState.forEach(entries => {
      entries.forEach(entry => {
        if (entry && entry.hasChanged){
          entry.hasChanged = false;
          entry.effect();
        }
      });
    });
  }

  function setProps(dom, props){
    Object.keys(props || {}).forEach(name => {
      if (name === 'style' && typeof props.style === 'object'){
        Object.assign(dom.style, props.style);
      } else if (isEvent(name)){
        const event = name.toLowerCase().substring(2);
        dom.addEventListener(event, props[name]);
      } else if (isAttribute(name)){
        dom.setAttribute(name, props[name]);
      }
    });
  }

  function build(element, path){
    if (element === null || element === undefined || element === false) return document.createComment('empty');
    if (typeof element === 'string' || typeof element === 'number') return document.createTextNode(element);
    if (Array.isArray(element)){
      const frag = document.createDocumentFragment();
      element.forEach((child, i) => frag.appendChild(build(child, `${path}.${i}`)));
      return frag;
    }
    const { type, props, children } = element;
    if (type === Fragment){
      const frag = document.createDocumentFragment();
      children.forEach((child, i) => frag.appendChild(build(child, `${path}.${i}`)));
      return frag;
    }
    if (typeof type === 'function'){
      const prevPath = currentPath;
      const prevHookIndex = hookIndex;
      currentPath = path;
      hookIndex = 0;
      const rendered = type({ ...(props || {}), children });
      const node = build(rendered, `${path}.0`);
      currentPath = prevPath;
      hookIndex = prevHookIndex;
      return node;
    }
    const dom = document.createElement(type);
    setProps(dom, props || {});
    children.forEach((child, i) => dom.appendChild(build(child, `${path}.${i}`)));
    return dom;
  }

  function render(element, container){
    rootElement = element;
    rootContainer = container;
    const dom = build(element, 'root');
    container.replaceChildren(dom);
    applyEffects();
  }

  function rerender(){
    if (rootElement && rootContainer){
      render(rootElement, rootContainer);
    }
  }

  const React = { createElement, Fragment, useState, useEffect, useRef };
  const ReactDOM = { createRoot(container){ return { render: (element) => render(element, container) }; } };

  global.React = React;
  global.ReactDOM = ReactDOM;
})(window);
