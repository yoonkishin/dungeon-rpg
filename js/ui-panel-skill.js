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

function buildSkillCard(skill) {
  const badgeColor = SKILL_BADGE_COLORS[skill.type] || '#555';
  const iconBg = skill.iconBg || '#444';
  return '<div class="skill-card">' +
    '<div class="skill-icon-circle" style="--skill-icon-bg:' + iconBg + '22;--skill-icon-border:' + iconBg + '55;">' + skill.icon + '</div>' +
    '<div class="skill-info">' +
      '<div class="skill-name">' + skill.name +
        '<span class="skill-type-badge" style="--skill-type-bg:' + badgeColor + '22;--skill-type-color:' + badgeColor + ';--skill-type-border:' + badgeColor + '44;">' + (skill.typeLabel || skill.type) + '</span>' +
      '</div>' +
      '<div class="skill-desc">' + skill.desc + '</div>' +
    '</div>' +
    '<div class="skill-meta">' +
      '<span class="mp">\uD83D\uDCA7' + skill.mpCost + '</span>' +
      '<span class="cd">\u23F1' + (skill.cooldown / 1000).toFixed(1) + 's</span>' +
    '</div>' +
  '</div>';
}

function renderSkillPanel() {
  const content = document.getElementById('skill-panel-content');
  const pageInd = document.getElementById('skill-page-ind');

  if (pageInd) {
    pageInd.textContent = '\uD604\uC7AC \uD398\uC774\uC9C0 ' + (currentSkillPage + 1) + '/' + skillPages.length;
  }

  // Build skill lookup
  const skillMap = {};
  SKILLS.forEach(s => { skillMap[s.id] = s; });

  // Build 3 columns, one per page
  let html = '<div class="skill-pages-grid">';

  for (let p = 0; p < skillPages.length; p++) {
    const isCurrent = p === currentSkillPage;
    html += '<div class="skill-page-col' + (isCurrent ? ' current-page' : '') + '">';
    html += '<div class="skill-page-header">';
    html += '<span class="skill-page-title' + (isCurrent ? ' active' : '') + '">\uD398\uC774\uC9C0 ' + (p + 1) + '</span>';
    if (isCurrent) html += '<span class="skill-page-badge">\uD65C\uC131</span>';
    html += '</div>';

    for (let s = 0; s < skillPages[p].length; s++) {
      const skillId = skillPages[p][s];
      const skill = skillMap[skillId];
      if (skill) {
        html += buildSkillCard(skill);
      }
    }
    html += '</div>';
  }

  html += '</div>';
  content.innerHTML = html;
}
