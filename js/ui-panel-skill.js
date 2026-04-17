'use strict';

// ─── Skill Panel UI ──────────────────────────────────────────────────────
const skillPanel = document.getElementById('skill-panel');
const skillPanelCloseBtn = document.getElementById('skill-panel-close');
const skillPanelHeaderRight = skillPanel ? skillPanel.querySelector('.inv-header-right') : null;
let skillEditMode = false;
let editSelectedSlot = null;

bindTap(skillPanelCloseBtn, () => closeSkillPanel());

const skillEditToggleBtn = (function createSkillEditToggleBtn() {
  if (!skillPanelHeaderRight || !skillPanelCloseBtn) return null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'skill-edit-toggle-btn';
  btn.id = 'skill-panel-edit-toggle';
  if (typeof skillPanelHeaderRight.insertBefore === 'function') skillPanelHeaderRight.insertBefore(btn, skillPanelCloseBtn);
  else if (typeof skillPanelHeaderRight.appendChild === 'function') skillPanelHeaderRight.appendChild(btn);
  bindTap(btn, () => {
    skillEditMode = !skillEditMode;
    if (!skillEditMode) editSelectedSlot = null;
    if (skillPanelOpen) renderSkillPanel();
  });
  return btn;
})();

function openSkillPanel() {
  skillPanelOpen = true;
  showPanel(skillPanel);
  renderSkillPanel();
}
function closeSkillPanel() {
  skillPanelOpen = false;
  skillEditMode = false;
  editSelectedSlot = null;
  hidePanel(skillPanel);
}

const SKILL_BADGE_COLORS = {
  projectile: '#e74c3c',
  melee: '#e67e22',
  self: '#2ecc71',
  buff: '#3498db',
  aoe: '#8e44ad',
};

function getSkillSlotKey(pageIdx, slotIdx) {
  return pageIdx + ':' + slotIdx;
}

function parseSkillSlotKey(slotKey) {
  if (typeof slotKey !== 'string') return null;
  const parts = slotKey.split(':');
  if (parts.length !== 2) return null;
  const pageIdx = Number(parts[0]);
  const slotIdx = Number(parts[1]);
  if (!Number.isInteger(pageIdx) || !Number.isInteger(slotIdx)) return null;
  return { pageIdx, slotIdx };
}

function buildSkillCard(skill, opts = {}) {
  const badgeColor = SKILL_BADGE_COLORS[skill.type] || '#555';
  const iconBg = skill.iconBg || '#444';
  const classes = ['skill-card'];
  if (opts.locked) classes.push('locked');
  if (opts.editing) classes.push('editing');
  if (opts.extraClass) classes.push(opts.extraClass);

  const slotAttr = opts.slotKey ? ' data-slot-key="' + opts.slotKey + '"' : '';
  const candidateAttr = opts.candidateId ? ' data-skill-candidate="' + opts.candidateId + '"' : '';

  return '<div class="' + classes.join(' ') + '"' + slotAttr + candidateAttr + '>' +
    '<div class="skill-icon-circle" style="--skill-icon-bg:' + iconBg + '22;--skill-icon-border:' + iconBg + '55;">' + skill.icon + '</div>' +
    '<div class="skill-info">' +
      '<div class="skill-name">' + skill.name +
        (opts.locked ? '<span class="skill-lock">🔒</span>' : '') +
        '<span class="skill-type-badge" style="--skill-type-bg:' + badgeColor + '22;--skill-type-color:' + badgeColor + ';--skill-type-border:' + badgeColor + '44;">' + (skill.typeLabel || skill.type) + '</span>' +
      '</div>' +
      '<div class="skill-desc">' + skill.desc + '</div>' +
    '</div>' +
    '<div class="skill-meta">' +
      '<span class="mp">💧' + skill.mpCost + '</span>' +
      '<span class="cd">⏱' + (skill.cooldown / 1000).toFixed(1) + 's</span>' +
    '</div>' +
  '</div>';
}

function buildEmptySkillCard(opts = {}) {
  const classes = ['skill-card', 'empty-slot-card'];
  if (opts.editing) classes.push('editing');

  return '<div class="' + classes.join(' ') + '" data-slot-key="' + (opts.slotKey || '') + '">' +
    '<div class="skill-info">' +
      '<div class="skill-name">빈 슬롯</div>' +
      '<div class="skill-desc">허용된 스킬로 채울 수 있습니다</div>' +
    '</div>' +
    '<div class="skill-meta">' +
      '<span class="skill-slot-info">미배치</span>' +
    '</div>' +
  '</div>';
}

function renderSkillPanel() {
  const content = document.getElementById('skill-panel-content');
  const pageInd = document.getElementById('skill-page-ind');
  const commanderName = typeof getCharacterDisplayName === 'function'
    ? getCharacterDisplayName(currentCommanderId || (typeof getHeroCharacterId === 'function' ? getHeroCharacterId() : 'hero'))
    : '주인공';
  const classId = typeof getCommanderClassIdForCompat === 'function' ? getCommanderClassIdForCompat() : null;
  const policy = classId !== null && typeof getClassSkillPolicy === 'function' ? getClassSkillPolicy(classId) : null;
  const allowed = policy && Array.isArray(policy.allowed) ? new Set(policy.allowed) : null;

  if (skillEditToggleBtn) {
    skillEditToggleBtn.textContent = skillEditMode ? '완료' : '편성 변경';
  }

  if (pageInd) {
    pageInd.textContent = commanderName + ' · 페이지 ' + (currentSkillPage + 1) + '/' + skillPages.length;
  }

  if (editSelectedSlot) {
    const invalidPage = editSelectedSlot.pageIdx < 0 || editSelectedSlot.pageIdx >= skillPages.length;
    const invalidSlot = editSelectedSlot.slotIdx < 0 || editSelectedSlot.slotIdx >= 4;
    if (invalidPage || invalidSlot) editSelectedSlot = null;
  }

  const skillMap = {};
  SKILLS.forEach(skill => {
    skillMap[skill.id] = skill;
  });

  let html = '<div class="skill-panel-layout">';
  html += '<div class="skill-pages-grid">';

  for (let p = 0; p < skillPages.length; p++) {
    const isCurrent = p === currentSkillPage;
    const page = Array.isArray(skillPages[p]) ? skillPages[p] : [];

    html += '<div class="skill-page-col' + (isCurrent ? ' current-page' : '') + '">';
    html += '<div class="skill-page-header">';
    html += '<span class="skill-page-title' + (isCurrent ? ' active' : '') + '">페이지 ' + (p + 1) + '</span>';
    if (isCurrent) html += '<span class="skill-page-badge">활성</span>';
    html += '</div>';

    for (let s = 0; s < 4; s++) {
      const slotKey = getSkillSlotKey(p, s);
      const skillId = page[s] || null;
      const skill = skillId ? skillMap[skillId] : null;
      const locked = classId !== null && skill && typeof isSkillAllowedForClass === 'function'
        ? !isSkillAllowedForClass(skill.id, classId)
        : false;
      const editing = !!editSelectedSlot && editSelectedSlot.pageIdx === p && editSelectedSlot.slotIdx === s;
      html += skill
        ? buildSkillCard(skill, { locked: locked, editing: editing, slotKey: slotKey })
        : buildEmptySkillCard({ editing: editing, slotKey: slotKey });
    }

    html += '</div>';
  }

  html += '</div>';

  if (skillEditMode) {
    const selectedSkillId = editSelectedSlot && Array.isArray(skillPages[editSelectedSlot.pageIdx])
      ? (skillPages[editSelectedSlot.pageIdx][editSelectedSlot.slotIdx] || null)
      : null;
    const placedSkillIds = new Set();

    skillPages.forEach((page, pageIdx) => {
      if (!Array.isArray(page)) return;
      for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
        const skillId = page[slotIdx];
        if (!skillId) continue;
        if (editSelectedSlot && pageIdx === editSelectedSlot.pageIdx && slotIdx === editSelectedSlot.slotIdx) continue;
        placedSkillIds.add(skillId);
      }
    });

    const candidates = SKILLS.filter(skill => {
      if (allowed && !allowed.has(skill.category)) return false;
      if (placedSkillIds.has(skill.id)) return false;
      return true;
    });

    html += '<div class="skill-edit-panel">';
    html += '<div class="skill-edit-header">';
    html += '<div class="skill-edit-summary">';
    if (editSelectedSlot) {
      const selectedSkill = selectedSkillId ? skillMap[selectedSkillId] : null;
      html += '선택 슬롯: 페이지 ' + (editSelectedSlot.pageIdx + 1) + ' · 슬롯 ' + (editSelectedSlot.slotIdx + 1);
      html += selectedSkill ? ' · ' + selectedSkill.name : ' · 빈 슬롯';
    } else {
      html += '편집할 슬롯을 선택하세요';
    }
    html += '</div>';
    html += '<div class="skill-edit-actions">';
    if (classId !== null) {
      html += '<button type="button" class="skill-edit-reset-btn">기본값 복원</button>';
    }
    html += '</div>';
    html += '</div>';

    if (!editSelectedSlot) {
      html += '<div class="skill-edit-empty">카드의 "이 슬롯 편집"을 눌러 교체할 자리를 고르세요.</div>';
    } else if (candidates.length === 0) {
      html += '<div class="skill-edit-empty">선택 가능한 스킬이 없습니다.</div>';
    } else {
      html += '<div class="skill-edit-title">교체 후보</div>';
      html += '<div class="skill-edit-candidates">';
      candidates.forEach(skill => {
        html += buildSkillCard(skill, { candidateId: skill.id, extraClass: 'skill-edit-candidate' });
      });
      html += '</div>';
    }

    html += '</div>';
  }

  html += '</div>';
  content.innerHTML = html;

  if (skillEditMode) {
    Array.from(content.querySelectorAll('[data-slot-key]')).forEach(el => {
      bindTap(el, () => {
        const parsed = parseSkillSlotKey(el.getAttribute('data-slot-key'));
        if (!parsed) return;
        editSelectedSlot = parsed;
        renderSkillPanel();
      });
    });

    Array.from(content.querySelectorAll('[data-skill-candidate]')).forEach(el => {
      bindTap(el, () => {
        if (!editSelectedSlot) return;
        const skillId = el.getAttribute('data-skill-candidate');
        if (!Array.isArray(skillPages[editSelectedSlot.pageIdx])) {
          skillPages[editSelectedSlot.pageIdx] = [];
        }
        skillPages[editSelectedSlot.pageIdx][editSelectedSlot.slotIdx] = skillId || null;
        editSelectedSlot = null;
        if (typeof renderSkillSlots === 'function') renderSkillSlots();
        if (typeof autoSave === 'function') autoSave();
        renderSkillPanel();
      });
    });

    const resetBtn = content.querySelector('.skill-edit-reset-btn');
    if (resetBtn) {
      bindTap(resetBtn, () => {
        if (!applyClassDefaultLineup(classId)) return;
        editSelectedSlot = null;
        if (typeof renderSkillSlots === 'function') renderSkillSlots();
        if (typeof autoSave === 'function') autoSave();
        renderSkillPanel();
      });
    }
  }
}
