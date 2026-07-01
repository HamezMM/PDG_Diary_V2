// Staff picker + cookie read/write. No real authentication in V1 — identity
// is name-tag level only, per the technical requirements.

const COOKIE_NAME = 'pdg_author';
const COOKIE_DAYS = 90;

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function getAuthor() {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.recordId === 'string' && /^rec/.test(parsed.recordId)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAuthor(staff) {
  const author = {
    recordId: staff.id,
    firstName: staff.firstName,
    fullName: staff.fullName,
    email: staff.email,
  };
  setCookie(COOKIE_NAME, JSON.stringify(author), COOKIE_DAYS);
  return author;
}

export function clearAuthor() {
  deleteCookie(COOKIE_NAME);
}

function initials(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function renderStaffCard(staff, onSelect) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'staff-card';

  if (staff.photoUrl) {
    const img = document.createElement('img');
    img.className = 'staff-card-photo';
    img.src = staff.photoUrl;
    img.alt = '';
    card.appendChild(img);
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'staff-card-photo-fallback';
    fallback.textContent = initials(staff.fullName || staff.firstName);
    card.appendChild(fallback);
  }

  const name = document.createElement('div');
  name.className = 'staff-card-name';
  name.textContent = staff.fullName || staff.firstName;
  card.appendChild(name);

  if (staff.position) {
    const position = document.createElement('div');
    position.className = 'staff-card-position';
    position.textContent = staff.position;
    card.appendChild(position);
  }

  card.addEventListener('click', () => onSelect(staff));
  return card;
}

export function showStaffPicker(staffList, onSelect) {
  const overlay = document.getElementById('staff-picker');
  const grid = document.getElementById('staff-grid');
  grid.innerHTML = '';

  const sorted = [...staffList].sort((a, b) =>
    (a.fullName || a.firstName).localeCompare(b.fullName || b.firstName)
  );
  sorted.forEach((staff) => {
    grid.appendChild(renderStaffCard(staff, (chosen) => {
      overlay.hidden = true;
      onSelect(chosen);
    }));
  });

  overlay.hidden = false;
}

export function hideStaffPicker() {
  document.getElementById('staff-picker').hidden = true;
}
