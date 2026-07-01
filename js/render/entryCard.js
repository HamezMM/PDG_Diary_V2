// Single entry card component, shared by the Work Plan band, date groups,
// and the Project Notes reference block.

const BASE_BORDER_VAR = {
  'Daily Activity': '--ink',
  'Work Plan': '--blue',
  'Meeting Notes': '--mauve',
  'Project Note': '--amber',
};

function slug(text) {
  return (text || '').replace(/\s+/g, '-');
}

function borderColorVar(entry) {
  if (entry.type === 'Email') {
    return entry.emailDirection === 'Outgoing' ? '--green' : '--blue';
  }
  if (entry.status === 'Important' && entry.type !== 'Meeting Notes') {
    return '--red';
  }
  return BASE_BORDER_VAR[entry.type] || '--ink';
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// "Thursday 18 Jun 2026" — used for date-group headings.
function formatFullDate(iso) {
  if (!iso) return '';
  const date = parseISODate(iso);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// "18 Jun 2026" — used for the compact date shown in a card header.
function formatCardDate(iso) {
  if (!iso) return '';
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function badge(text, className) {
  const el = document.createElement('span');
  el.className = `badge ${className}`;
  el.textContent = text;
  return el;
}

function initials(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function renderAuthor(staff) {
  const wrap = document.createElement('span');
  wrap.className = 'entry-author';

  if (staff && staff.photoUrl) {
    const img = document.createElement('img');
    img.className = 'entry-avatar';
    img.src = staff.photoUrl;
    img.alt = '';
    wrap.appendChild(img);
  } else {
    const fallback = document.createElement('span');
    fallback.className = 'entry-avatar-fallback';
    fallback.textContent = initials(staff ? (staff.fullName || staff.firstName) : '?');
    wrap.appendChild(fallback);
  }

  const name = document.createElement('span');
  name.textContent = staff ? (staff.fullName || staff.firstName) : 'Unknown';
  wrap.appendChild(name);

  return wrap;
}

export function renderEntryCard(entry, { staffById }) {
  const card = document.createElement('article');
  card.className = 'entry-card' + (entry.status === 'Archived' ? ' is-archived' : '');
  card.style.borderLeftColor = `var(${borderColorVar(entry)})`;

  const header = document.createElement('div');
  header.className = 'entry-card-header';

  if (entry.type === 'Email') {
    header.appendChild(badge(entry.emailDirection === 'Outgoing' ? 'OUTGOING' : 'INCOMING', `badge-${entry.emailDirection || 'Incoming'}`));
  } else {
    header.appendChild(badge(entry.type.toUpperCase(), `badge-${slug(entry.type)}`));
  }

  if (entry.entryDate) {
    const date = document.createElement('span');
    date.className = 'entry-date';
    date.textContent = formatCardDate(entry.entryDate);
    header.appendChild(date);
  }

  if (entry.title) {
    const title = document.createElement('span');
    title.className = 'entry-title';
    title.textContent = entry.title;
    header.appendChild(title);
  }

  header.appendChild(renderAuthor(staffById.get(entry.authorId)));

  if (entry.status && entry.status !== 'General') {
    header.appendChild(badge(entry.status.toUpperCase(), `badge-${entry.status}`));
  }

  const body = document.createElement('div');
  body.className = 'entry-card-body';
  const renderer = window.marked && typeof window.marked.parse === 'function' ? window.marked.parse : null;
  body.innerHTML = renderer ? renderer(entry.body || '') : (entry.body || '');

  card.append(header, body);

  if (entry.type === 'Meeting Notes' && entry.transcriptLink) {
    const footer = document.createElement('div');
    footer.className = 'entry-card-footer';
    const link = document.createElement('a');
    link.className = 'transcript-link-btn';
    link.href = entry.transcriptLink;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View Transcript ↗';
    footer.appendChild(link);
    card.appendChild(footer);
  }

  if (entry.type === 'Project Note' && entry.category) {
    const footer = document.createElement('div');
    footer.className = 'entry-card-footer';
    footer.appendChild(badge(entry.category.toUpperCase(), 'badge-Project-Note'));
    card.appendChild(footer);
  }

  return card;
}

export { formatFullDate };
