'use strict';

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
  if (typeof normalizeCommanderState === 'function') normalizeCommanderState();
  if (!options.silent && typeof showToast === 'function') {
    showToast(getCompanionName(cId) + ' 합류!');
  }
  if (typeof renderCompanionPanel === 'function' && companionPanelOpen) renderCompanionPanel();
  if (typeof renderProfile === 'function' && profileOpen) renderProfile();
  return true;
}

function buildQuestRewardText(quest) {
  if (!quest || !quest.reward) return '';
  const chunks = [];
  if (quest.reward.gold) chunks.push('💰 ' + quest.reward.gold + 'G');
  if (quest.reward.xp || quest.reward.exp) chunks.push('✨ EXP ' + (quest.reward.xp || quest.reward.exp));
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

function grantMainQuestReward(quest, characterId = null) {
  if (!quest || !quest.reward) return;
  const rewardCharacterId = characterId || (typeof getCurrentInteractionCharacterId === 'function' ? getCurrentInteractionCharacterId() : currentCommanderId);
  if (quest.reward.gold) player.gold += quest.reward.gold;
  if (quest.reward.xp || quest.reward.exp) {
    gainCharacterXP(rewardCharacterId, quest.reward.xp || quest.reward.exp);
  }
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) inventory.push(createItemInstance(id));
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

  grantMainQuestReward(quest, typeof getCurrentInteractionCharacterId === 'function' ? getCurrentInteractionCharacterId() : currentCommanderId);
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

function grantSubquestReward(quest, characterId = null) {
  if (!quest || !quest.reward) return;
  const rewardCharacterId = characterId || (typeof getCurrentInteractionCharacterId === 'function' ? getCurrentInteractionCharacterId() : currentCommanderId);
  if (quest.reward.gold) player.gold += quest.reward.gold;
  if (quest.reward.xp || quest.reward.exp) {
    gainCharacterXP(rewardCharacterId, quest.reward.xp || quest.reward.exp);
  }
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) inventory.push(createItemInstance(id));
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

  grantSubquestReward(quest, typeof getCurrentInteractionCharacterId === 'function' ? getCurrentInteractionCharacterId() : currentCommanderId);
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
