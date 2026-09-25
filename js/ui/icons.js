const ICONS = {
  home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6l-.08.08H10l-.08-.08a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1l-.08-.08V10l.08-.08a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6l.08-.08H14l.08.08a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.08.37.3.72.6 1l.08.08V14l-.08.08c-.3.28-.52.63-.6.92Z"/>',
  'book-open':'<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7Z"/>',
  mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  library:'<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  shield:'<path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  upload:'<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6"/>',
  flame:'<path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 2-1 3-2 4 0-4-2-7-5-10 0 4-3 6-3 10 0 6 3 10 7 10Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  brain:'<path d="M9.5 4A2.5 2.5 0 0 0 7 6.5V7a3 3 0 0 0-1 5.83V14a3 3 0 0 0 3 3h.5M14.5 4A2.5 2.5 0 0 1 17 6.5V7a3 3 0 0 1 1 5.83V14a3 3 0 0 1-3 3h-.5M12 4v16M9 9h3M12 14h3"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-left':'<path d="M19 12H5M11 18l-6-6 6-6"/>',
  volume:'<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12"/>',
  translate:'<path d="M4 5h8M8 3v2M6 5c.7 3 2.6 5.3 5 7M10 5c-.8 3-2.7 5.6-6 8M14 19l3-8 3 8M15 16h4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  rotate:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  plane:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  coffee:'<path d="M3 8h13v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2M6 2v2M10 2v2M14 2v2"/>',
  hotel:'<path d="M3 21V8h18v13M3 15h18M7 12h2M15 12h2"/>',
  briefcase:'<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  spark:'<path d="m12 3-1.5 3.5L7 8l3.5 1.5L12 13l1.5-3.5L17 8l-3.5-1.5ZM5 15l-.8 1.8L2.5 17.5l1.7.7L5 20l.8-1.8 1.7-.7-1.7-.7ZM19 13l-.8 1.8-1.7.7 1.7.7L19 18l.8-1.8 1.7-.7-1.7-.7Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'
};

export function icon(name, className='icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

export function hydrateIcons(root=document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = icon(el.dataset.icon);
  });
}
