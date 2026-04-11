'use strict';

// ─── Skill Panel UI ──────────────────────────────────────────────────────
const skillPanel = document.getElementById('skill-panel');
bindTap(document.getElementById('skill-panel-close'), () => closeSkillPanel());

function openSkillPanel() {
  skillPanelOpen = true;
  showPanel(skillPanel);
  renderSkillPanel();
}
function closeSkillPanel() {
  skillPanelOpen = false;
  hidePanel(skillPanel);
}
const SKILL_BADGE_COLORS = {
  projectile: '#e74c3c',
  melee: '#e67e22',
  self: '#2ecc71',
  buff: '#3498db',
  aoe: '#8e44ad',
};

function getSkillSlotLabel(skillId) {
  for (let p = 0; p < skillPages.length; p++) {
    for (let s = 0; s < skillPages[p].length; s++) {
      if (skillPages[p][s] === skillId) {
        return '슬롯 ' + (p + 1) + '-' + (s + 1) + ' 등록됨';
      }
    }
  }
  return '';
}

function buildSkillCard(skill) {
  const slotLabel = getSkillSlotLabel(skill.id);
  const badgeColor = SKILL_BADGE_COLORS[skill.type] || '#555';
  const iconBg = skill.iconBg || '#444';
  return `
    <div class="skill-card">
      <div class="skill-icon-circle" style="--skill-icon-bg:${iconBg}22;--skill-icon-border:${iconBg}55;">${skill.icon}</div>
      <div class="skill-info">
        <div class="skill-name">${skill.name} <span class="skill-type-badge" style="--skill-type-bg:${badgeColor}22;--skill-type-color:${badgeColor};--skill-type-border:${badgeColor}44;">${skill.typeLabel || skill.type}</span></div>
        <div class="skill-desc">${skill.desc}</div>
        ${slotLabel ? `<div class="skill-slot-info">${slotLabel}</div>` : ''}
      </div>
      <div class="skill-stats">
        <div class="skill-stat mp">💧 ${skill.mpCost}</div>
        <div class="skill-stat cd">⏱ ${(skill.cooldown / 1000).toFixed(1)}s</div>
      </div>
    </div>
  `;
}

function renderSkillPanel() {
  const content = document.getElementById('skill-panel-content');
  content.innerHTML = SKILLS.map(buildSkillCard).join('');
}
