// Pinned project header (dark band above the entry stream).

export const PRJT_STATUS_ORDER = ['ACTIVE', 'PENDING', 'STANDBY', 'CLOSED'];

export const PRJT_COLOR_VARS = {
  ACTIVE: ['--prjt-active-bg', '--prjt-active-fg'],
  PENDING: ['--prjt-pending-bg', '--prjt-pending-fg'],
  STANDBY: ['--prjt-standby-bg', '--prjt-standby-fg'],
  CLOSED: ['--prjt-closed-bg', '--prjt-closed-fg'],
};

export const PROP_COLOR_VARS = {
  ACTIVE: ['--prop-active-bg', '--prop-active-fg'],
  INQUIRY: ['--prop-inquiry-bg', '--prop-inquiry-fg'],
  PROSPECT: ['--prop-prospect-bg', '--prop-prospect-fg'],
  PAUSE: ['--prop-pause-bg', '--prop-pause-fg'],
  FINISHED: ['--prop-finished-bg', '--prop-finished-fg'],
  COLD: ['--prop-cold-bg', '--prop-cold-fg'],
  INACTIVE: ['--prop-inactive-bg', '--prop-inactive-fg'],
};

export function applyBadgeColors(el, colorMap, status) {
  const vars = colorMap[status];
  if (vars) {
    el.style.background = `var(${vars[0]})`;
    el.style.color = `var(${vars[1]})`;
  } else {
    el.style.background = 'var(--gray-bg)';
    el.style.color = 'var(--gray)';
  }
}

function metaItem(label, value) {
  const wrap = document.createElement('div');
  wrap.className = 'ph-meta-item';
  const l = document.createElement('div');
  l.className = 'ph-meta-label';
  l.textContent = label;
  const v = document.createElement('div');
  v.className = 'ph-meta-value';
  v.textContent = value;
  wrap.append(l, v);
  return wrap;
}

function checkMeta(label, checked) {
  const wrap = document.createElement('div');
  wrap.className = 'ph-meta-item';
  const l = document.createElement('div');
  l.className = 'ph-meta-label';
  l.textContent = label;
  const v = document.createElement('div');
  v.className = `ph-meta-value ${checked ? 'ph-check-yes' : 'ph-check-no'}`;
  v.textContent = checked ? '✓' : '—';
  wrap.append(l, v);
  return wrap;
}

export function renderProjectHeader(container, job) {
  container.innerHTML = '';
  container.hidden = false;

  const eyebrow = document.createElement('div');
  eyebrow.className = 'ph-eyebrow';
  eyebrow.textContent = job.jobNumber;

  const name = document.createElement('div');
  name.className = 'ph-name';
  name.textContent = job.jobName || job.jobNameNo;

  const badges = document.createElement('div');
  badges.className = 'ph-badges';

  const prjtBadge = document.createElement('span');
  prjtBadge.className = 'ph-badge';
  prjtBadge.innerHTML = `<span class="ph-badge-label">PROJECT</span>${job.prjtStatus || '—'}`;
  applyBadgeColors(prjtBadge, PRJT_COLOR_VARS, job.prjtStatus);

  const propBadge = document.createElement('span');
  propBadge.className = 'ph-badge';
  propBadge.innerHTML = `<span class="ph-badge-label">PROPOSAL</span>${job.propStatus || '—'}`;
  applyBadgeColors(propBadge, PROP_COLOR_VARS, job.propStatus);

  badges.append(prjtBadge, propBadge);

  const meta = document.createElement('div');
  meta.className = 'ph-meta';
  meta.append(
    metaItem('SECTOR', job.mainSector || '—'),
    metaItem('SUB TYPE', job.subTypes || '—'),
    checkMeta('MATTERPORT', job.requiresMatterport),
    checkMeta('POINT CLOUD', job.requiresPointCloud),
    checkMeta('DP', job.requiresDP),
    checkMeta('BP', job.requiresBP)
  );

  container.append(eyebrow, name, badges, meta);
}
