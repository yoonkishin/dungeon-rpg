'use strict';

const MAIN_QUESTS = [
  {
    id: 'chief_intro',
    title: '촌장의 첫 부탁',
    targetNpcId: 'chief',
    objectiveType: 'talk',
    objectiveTarget: 'chief',
    description: '촌장에게 말을 걸어 첫 임무를 받자.',
    reminder: ['촌장이 널 찾고 있다.', '마을 한가운데 있는 촌장에게 먼저 말을 걸어봐.'],
    completionLines: ['좋아, 이제 모험을 시작할 때다.', '우선 필드의 첫 던전인 슬라임 동굴을 정리해다오.'],
    reward: { gold: 100, items: ['potion_hp'] }
  },
  {
    id: 'slime_cave_clear',
    title: '슬라임 동굴 정리',
    targetNpcId: 'chief',
    objectiveType: 'clearDungeon',
    objectiveTarget: 0,
    description: '필드의 슬라임 동굴을 클리어하고 촌장에게 보고하자.',
    reminder: ['슬라임 동굴이 아직 정리되지 않았다.', '필드의 첫 번째 포탈로 들어가 거대 슬라임을 쓰러뜨려라.'],
    completionLines: ['수고했다! 마을 사람들이 한숨 돌릴 수 있겠구나.', '이번엔 현자에게 가서 다음 지역에 대한 조언을 들어보거라.'],
    reward: { gold: 180, items: ['potion_hp2'] }
  },
  {
    id: 'sage_report',
    title: '현자의 조언',
    targetNpcId: 'sage',
    objectiveType: 'talk',
    objectiveTarget: 'sage',
    description: '현자와 대화해 다음 공략 목표를 듣자.',
    reminder: ['현자가 다음 여정을 준비하고 있다.', '마을 북서쪽의 현자에게 가보자.'],
    completionLines: ['좋다. 이제 고블린 소굴을 공략할 때다.', '활과 회복 아이템을 챙기고, 가능하면 동료도 편성해서 나가게.'],
    reward: { gold: 120, items: ['ring_def'] }
  },
  {
    id: 'goblin_den_clear',
    title: '고블린 왕 토벌',
    targetNpcId: 'sage',
    objectiveType: 'clearDungeon',
    objectiveTarget: 1,
    description: '고블린 소굴을 클리어하고 현자에게 보고하자.',
    reminder: ['고블린 소굴이 아직 남아 있다.', '두 번째 포탈로 들어가 고블린 왕을 처치해라.'],
    completionLines: ['훌륭하군. 이제부터는 진짜 원정대의 형태를 갖춰가게 될 거다.', '다음 던전부터는 더 강한 장비와 동료 조합을 의식해라.'],
    reward: { gold: 250, items: ['amulet1'] }
  }
];

const SUBQUESTS = [
  {
    id: 'guard_patrol',
    npcId: 'guard',
    title: '경비병의 정찰 의뢰',
    objectiveType: 'killEnemies',
    targetAmount: 12,
    prereqMainQuestIndex: 1,
    description: '필드와 던전에서 적 12마리를 처치하고 경비병에게 보고하자.',
    offerLines: ['요즘 필드 주변이 더 시끄럽습니다.', '밖으로 나가 적 12마리만 정리해주시면 방비에 큰 도움이 됩니다.'],
    progressLines: ['정찰 임무는 아직 진행 중입니다.', '필드와 던전 어디서든 적을 처치하면 됩니다.'],
    completionLines: ['좋습니다. 경계선이 훨씬 조용해졌군요.', '이 보급품을 챙겨가십시오. 다음 원정에 도움이 될 겁니다.'],
    reward: { gold: 140, items: ['potion_hp2'] }
  },
  {
    id: 'sage_survey',
    npcId: 'sage',
    title: '현자의 탐사 기록',
    objectiveType: 'clearDungeonCount',
    targetAmount: 2,
    prereqMainQuestIndex: 2,
    description: '새로운 던전 2곳을 정리하고 현자에게 지도를 갱신받자.',
    offerLines: ['던전의 흐름을 더 정확히 알고 싶군.', '앞으로 2개의 던전을 더 정리해주면 내 기록을 보강해 주지.'],
    progressLines: ['기록은 아직 완성되지 않았네.', '새로운 던전을 더 정리하고 돌아오게.'],
    completionLines: ['좋군. 던전의 패턴이 훨씬 또렷해졌어.', '백광 수도승도 자네 원정대에 합류하겠다고 하더군.'],
    reward: { gold: 180, items: ['ring_atk'], companions: [9] }
  },
  {
    id: 'chief_companions',
    npcId: 'chief',
    title: '원정대 보강',
    objectiveType: 'companionCount',
    targetAmount: 3,
    prereqMainQuestIndex: 4,
    description: '동료를 3명 이상 확보해 촌장에게 원정대 구성을 보고하자.',
    offerLines: ['자네도 이제 제법 이름이 알려졌네.', '동료를 셋 이상 모아 진짜 원정대답게 꾸려보게.'],
    progressLines: ['원정대는 아직 부족하네.', '던전을 더 정리해서 믿을 만한 동료를 모아오게.'],
    completionLines: ['훌륭하군. 이제 마을도 자네를 정식 원정대로 인정할 걸세.', '새 장비 한 점 마련할 수 있도록 지원금을 주지.'],
    reward: { gold: 260, items: ['shield1'] }
  },
  {
    id: 'training_first_promotion',
    npcId: 'sage',
    title: '첫 승급 수련',
    objectiveType: 'classRank',
    targetAmount: 2,
    prereqMainQuestIndex: 4,
    description: '수련의 방에서 첫 승급을 완료하고 현자에게 수련 결과를 보고하자.',
    offerLines: ['이제 자네도 기초 단계를 넘길 때가 됐네.', '마을 수련의 방에서 첫 승급을 끝내고 다시 오게.'],
    progressLines: ['몸이 아직 덜 익었네.', 'Lv 6 이상이 되면 수련의 방에서 글라디에이터 승급을 확정할 수 있네.'],
    completionLines: ['좋아, 승급의 감각을 익혔군.', '이제부터는 클래스 변화가 전투 흐름을 더 크게 바꿔줄 걸세.'],
    reward: { gold: 220, items: ['helmet2'] }
  },
  {
    id: 'chief_synergy_squad',
    npcId: 'chief',
    title: '연계 전술 시험',
    objectiveType: 'activeSynergy',
    targetAmount: 1,
    prereqMainQuestIndex: 4,
    description: '시너지가 맞는 동료 2명을 함께 편성해 연계 전술을 증명하자.',
    offerLines: ['원정대는 숫자보다 조합이 중요하네.', '시너지가 나는 둘을 함께 묶어 진짜 전술팀을 보여주게.'],
    progressLines: ['아직 조합의 힘이 보이지 않는군.', '동료 패널에서 시너지 조합을 맞춰 출전시켜 보게.'],
    completionLines: ['좋아, 이게 바로 원정대다운 움직임일세.', '조합을 보는 눈이 생기면 전투가 훨씬 수월해질 걸세.'],
    reward: { gold: 240, items: ['potion_hp2', 'potion_hp2'] }
  },
  {
    id: 'guard_outpost_upgrade',
    npcId: 'guard',
    title: '전초기지 정비',
    objectiveType: 'villageUpgradeTotal',
    targetAmount: 3,
    prereqMainQuestIndex: 4,
    description: '마을 발전 시설을 합계 3단계 이상 강화해 방어 태세를 끌어올리자.',
    offerLines: ['마을도 이제 전초기지다운 모양을 갖춰야 합니다.', '시설 강화를 몇 번만 더 해주면 경계가 훨씬 안정될 겁니다.'],
    progressLines: ['아직 설비가 부족합니다.', '마을 발전 패널에서 시설을 더 강화하고 돌아와 주십시오.'],
    completionLines: ['훌륭합니다. 이제 외곽 경계선도 한결 든든해졌습니다.', '이 장비는 정비 지원 명목으로 드리겠습니다.'],
    reward: { gold: 230, items: ['boots2'] }
  }
];
function getMainQuest() {
  return MAIN_QUESTS[mainQuestIndex] || null;
}

function getCurrentMainQuest() {
  return getMainQuest();
}

function getQuestNpcById(id) {
  return TOWN_NPCS.find(npc => npc.id === id) || NPCS.find(npc => npc.id === id) || null;
}

function getQuestNpcName(id) {
  const npc = getQuestNpcById(id);
  return npc ? npc.name : '알 수 없음';
}

function getQuestOfferNpcId(quest) {
  if (!quest) return null;
  return quest.offerNpcId || quest.npcId || quest.targetNpcId || null;
}

function getQuestTurnInNpcId(quest) {
  if (!quest) return null;
  return quest.turnInNpcId || quest.npcId || quest.targetNpcId || null;
}

function getMainQuestStatus(quest) {
  if (!quest) return { label:'완료', ready:false };
  if (isMainQuestObjectiveMet(quest)) return { label:'완료 - 보고 필요', ready:true };
  if (quest.objectiveType === 'talk') return { label:'대화 필요', ready:false };
  if (quest.objectiveType === 'clearDungeon') return { label:'던전 공략 중', ready:false };
  if (quest.objectiveType === 'classRank') return { label:'승급 진행 중', ready:false };
  if (quest.objectiveType === 'activeSynergy') return { label:'조합 구성 중', ready:false };
  if (quest.objectiveType === 'villageUpgradeTotal') return { label:'마을 발전 중', ready:false };
  return { label:'진행 중', ready:false };
}

function getSubquestStatus(quest) {
  if (!quest) return { label:'알 수 없음', ready:false };
  if (isSubquestObjectiveMet(quest)) return { label:'완료 - 보고 필요', ready:true };
  return { label:'진행 중', ready:false };
}

function getAvailableSubquests() {
  return SUBQUESTS.filter(quest => isSubquestAvailable(quest) && !isSubquestAccepted(quest.id));
}

function getAcceptedSubquestsDetailed() {
  return acceptedSubquests.map(id => SUBQUESTS.find(quest => quest.id === id)).filter(Boolean).map(quest => {
    const status = getSubquestStatus(quest);
    return {
      quest,
      offerNpcName: getQuestNpcName(getQuestOfferNpcId(quest)),
      turnInNpcName: getQuestNpcName(getQuestTurnInNpcId(quest)),
      progressText: buildSubquestProgressText(quest),
      rewardText: buildQuestRewardText(quest),
      statusLabel: status.label,
      readyToTurnIn: status.ready,
    };
  });
}

function buildQuestRealtimeSnapshot() {
  const mainQuest = getMainQuest();
  const mainReady = mainQuest && isMainQuestObjectiveMet(mainQuest) ? '1' : '0';
  const subState = acceptedSubquests.map(id => {
    const quest = SUBQUESTS.find(q => q.id === id);
    if (!quest) return id + ':0';
    return id + ':' + (isSubquestObjectiveMet(quest) ? '1' : '0') + ':' + buildSubquestProgressText(quest);
  }).join('|');
  return [
    mainQuest ? mainQuest.id : 'none',
    mainReady,
    acceptedSubquests.slice().sort().join(','),
    completedSubquests.slice().sort().join(','),
    subState
  ].join('||');
}

function updateQuestRealtimeStatus() {
  const mainQuest = getMainQuest();
  if (mainQuest && isMainQuestObjectiveMet(mainQuest)) {
    if (questRealtimeNoticeState.mainReadyQuestId !== mainQuest.id) {
      questRealtimeNoticeState.mainReadyQuestId = mainQuest.id;
      if (typeof showToast === 'function') {
        showToast('메인 퀘스트 완료! ' + getQuestNpcName(getQuestTurnInNpcId(mainQuest)) + '에게 보고하세요');
      }
    }
  } else {
    questRealtimeNoticeState.mainReadyQuestId = null;
  }

  const activeAcceptedIds = new Set(acceptedSubquests);
  Object.keys(questRealtimeNoticeState.subReadyQuestIds).forEach(id => {
    if (!activeAcceptedIds.has(id)) delete questRealtimeNoticeState.subReadyQuestIds[id];
  });

  acceptedSubquests.forEach(id => {
    const quest = SUBQUESTS.find(q => q.id === id);
    if (!quest) return;
    if (isSubquestObjectiveMet(quest)) {
      if (!questRealtimeNoticeState.subReadyQuestIds[id]) {
        questRealtimeNoticeState.subReadyQuestIds[id] = true;
        if (typeof showToast === 'function') {
          showToast('서브 퀘스트 완료! ' + getQuestNpcName(getQuestTurnInNpcId(quest)) + '에게 보고하세요');
        }
      }
    } else {
      delete questRealtimeNoticeState.subReadyQuestIds[id];
    }
  });

  const snapshot = buildQuestRealtimeSnapshot();
  if (snapshot !== questRealtimeNoticeState.snapshot) {
    questRealtimeNoticeState.snapshot = snapshot;
    if (typeof questPanelOpen !== 'undefined' && questPanelOpen && typeof renderQuestPanel === 'function') {
      renderQuestPanel();
    }
  }
}

function isMainQuestObjectiveMet(quest, npcId) {
  if (!quest) return false;
  if (quest.objectiveType === 'talk') {
    return npcId === quest.objectiveTarget;
  }
  if (quest.objectiveType === 'clearDungeon') {
    return dungeonsCleared.includes(quest.objectiveTarget);
  }
  if (quest.objectiveType === 'classRank') {
    return player.classRank >= quest.objectiveTarget;
  }
  if (quest.objectiveType === 'activeSynergy') {
    return !!getActiveCompanionSynergy();
  }
  if (quest.objectiveType === 'villageUpgradeTotal') {
    return getTotalVillageUpgradeLevel() >= quest.objectiveTarget;
  }
  if (quest.objectiveType === 'companionCount') {
    return companions.length >= quest.objectiveTarget;
  }
  return false;
}

function unlockCompanion(cId, options = {}) {
  if (!isValidCompanionId(cId) || companions.includes(cId)) return false;
  companions.push(cId);
  if (!companionAIModes[cId]) companionAIModes[cId] = getDefaultCompanionAIMode(cId);
  if (!options.silent && typeof showToast === 'function') {
    showToast(getCompanionName(cId) + ' 합류!');
  }
  return true;
}

function buildQuestRewardText(quest) {
  if (!quest || !quest.reward) return '';
  const chunks = [];
  if (quest.reward.gold) chunks.push('💰 ' + quest.reward.gold + 'G');
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) chunks.push(ITEMS[id].icon + ' ' + ITEMS[id].name);
    });
  }
  if (Array.isArray(quest.reward.companions)) {
    quest.reward.companions.forEach(cId => {
      if (isValidCompanionId(cId)) chunks.push((getCompanionRoster(cId).portraitIcon || '★') + ' ' + getCompanionName(cId));
    });
  }
  return chunks.join(', ');
}

function grantMainQuestReward(quest) {
  if (!quest || !quest.reward) return;
  if (quest.reward.gold) player.gold += quest.reward.gold;
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) inventory.push(id);
    });
  }
  if (Array.isArray(quest.reward.companions)) {
    quest.reward.companions.forEach(cId => unlockCompanion(cId, { silent: true }));
  }
}

function tryCompleteMainQuest(npcId) {
  const quest = getMainQuest();
  if (!quest) return null;
  if (quest.targetNpcId !== npcId) return null;
  if (!isMainQuestObjectiveMet(quest, npcId)) return null;

  grantMainQuestReward(quest);
  completedMainQuests.push(quest.id);
  mainQuestIndex++;
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof autoSave === 'function') autoSave();
  return {
    quest,
    rewardText: buildQuestRewardText(quest),
    nextQuest: getMainQuest()
  };
}

function isSubquestAccepted(id) {
  return acceptedSubquests.includes(id);
}

function isSubquestCompleted(id) {
  return completedSubquests.includes(id);
}

function isSubquestAvailable(quest) {
  if (!quest) return false;
  if (isSubquestCompleted(quest.id)) return false;
  if (quest.prereqMainQuestIndex !== undefined && mainQuestIndex < quest.prereqMainQuestIndex) return false;
  return true;
}

function getNpcSubquest(npcId) {
  const npcSubquests = SUBQUESTS.filter(q => q.npcId === npcId && isSubquestAvailable(q));
  if (npcSubquests.length === 0) return null;

  const acceptedReady = npcSubquests.find(q => isSubquestAccepted(q.id) && isSubquestObjectiveMet(q));
  if (acceptedReady) return acceptedReady;

  const unaccepted = npcSubquests.find(q => !isSubquestAccepted(q.id));
  if (unaccepted) return unaccepted;

  return npcSubquests.find(q => isSubquestAccepted(q.id)) || null;
}

function acceptSubquest(quest) {
  if (!quest || isSubquestAccepted(quest.id)) return;
  acceptedSubquests.push(quest.id);
  const progress = {};
  if (quest.objectiveType === 'killEnemies') progress.startKills = totalEnemiesKilled;
  if (quest.objectiveType === 'clearDungeonCount') progress.startDungeons = dungeonsCleared.length;
  if (quest.objectiveType === 'companionCount') progress.startCompanions = companions.length;
  subquestProgress[quest.id] = progress;
  if (typeof autoSave === 'function') autoSave();
}

function getSubquestProgressValue(quest) {
  const progress = subquestProgress[quest.id] || {};
  if (quest.objectiveType === 'killEnemies') return Math.max(0, totalEnemiesKilled - (progress.startKills || 0));
  if (quest.objectiveType === 'clearDungeonCount') return Math.max(0, dungeonsCleared.length - (progress.startDungeons || 0));
  if (quest.objectiveType === 'companionCount') return companions.length;
  if (quest.objectiveType === 'classRank') return player.classRank;
  if (quest.objectiveType === 'activeSynergy') return getActiveCompanionSynergy() ? 1 : 0;
  if (quest.objectiveType === 'villageUpgradeTotal') return getTotalVillageUpgradeLevel();
  return 0;
}

function isSubquestObjectiveMet(quest) {
  return getSubquestProgressValue(quest) >= (quest.targetAmount || 0);
}

function buildSubquestProgressText(quest) {
  const value = Math.min(getSubquestProgressValue(quest), quest.targetAmount || 0);
  if (quest.objectiveType === 'activeSynergy') {
    const synergy = getActiveCompanionSynergy();
    return synergy ? `1/1 (${synergy.name})` : '0/1';
  }
  return `${value}/${quest.targetAmount}`;
}

function grantSubquestReward(quest) {
  if (!quest || !quest.reward) return;
  if (quest.reward.gold) player.gold += quest.reward.gold;
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) inventory.push(id);
    });
  }
  if (Array.isArray(quest.reward.companions)) {
    quest.reward.companions.forEach(cId => unlockCompanion(cId, { silent: true }));
  }
}

function tryResolveSubquest(npcId) {
  const quest = getNpcSubquest(npcId);
  if (!quest) return null;

  if (!isSubquestAccepted(quest.id)) {
    acceptSubquest(quest);
    return {
      type: 'accepted',
      quest,
      rewardText: buildQuestRewardText(quest)
    };
  }

  if (!isSubquestObjectiveMet(quest)) {
    return {
      type: 'progress',
      quest,
      progressText: buildSubquestProgressText(quest)
    };
  }

  grantSubquestReward(quest);
  acceptedSubquests = acceptedSubquests.filter(id => id !== quest.id);
  completedSubquests.push(quest.id);
  delete subquestProgress[quest.id];
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof autoSave === 'function') autoSave();
  return {
    type: 'completed',
    quest,
    rewardText: buildQuestRewardText(quest)
  };
}

function getNpcInteractionLines(npc) {
  const quest = getMainQuest();
  const completion = tryCompleteMainQuest(npc.id);
  if (completion) {
    const lines = [`[메인 퀘스트 완료] ${completion.quest.title}`];
    (completion.quest.completionLines || []).forEach(line => lines.push(line));
    if (completion.rewardText) lines.push('보상: ' + completion.rewardText);
    if (completion.nextQuest) lines.push('[다음 목표] ' + completion.nextQuest.description);
    return lines;
  }

  if (quest && quest.targetNpcId === npc.id) {
    return [
      `[메인 퀘스트] ${quest.title}`,
      quest.description,
      ...((quest.reminder && quest.reminder.length) ? quest.reminder : [])
    ];
  }

  const subquestResult = tryResolveSubquest(npc.id);
  if (subquestResult) {
    if (subquestResult.type === 'accepted') {
      return [
        `[서브퀘스트 수락] ${subquestResult.quest.title}`,
        ...(subquestResult.quest.offerLines || []),
        subquestResult.quest.description,
        subquestResult.rewardText ? '보상: ' + subquestResult.rewardText : ''
      ].filter(Boolean);
    }
    if (subquestResult.type === 'progress') {
      return [
        `[서브퀘스트] ${subquestResult.quest.title}`,
        ...(subquestResult.quest.progressLines || []),
        '진행도: ' + subquestResult.progressText
      ].filter(Boolean);
    }
    if (subquestResult.type === 'completed') {
      return [
        `[서브퀘스트 완료] ${subquestResult.quest.title}`,
        ...(subquestResult.quest.completionLines || []),
        subquestResult.rewardText ? '보상: ' + subquestResult.rewardText : ''
      ].filter(Boolean);
    }
  }

  if (npc.id === 'guard' && quest) {
    return [
      '지금 목표를 잊지 마십시오.',
      quest.description,
      currentMap === 'town' ? '출구로 나가려면 동쪽이나 북쪽 길을 이용하면 됩니다.' : '필드에서는 포탈 위치를 미니맵으로 확인해보세요.'
    ];
  }

  return npc.dialogue;
}
