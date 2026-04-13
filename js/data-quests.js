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
  },
  {
    id: 'lava_cave_clear',
    title: '화염 골렘 격파',
    targetNpcId: 'sage',
    objectiveType: 'clearDungeon',
    objectiveTarget: 5,
    description: '용암 동굴을 클리어하고 현자에게 보고하자.',
    reminder: ['화산 협곡 깊은 곳에 화염 골렘이 버티고 있다.', '불꽃 공격에 대비해 방어력을 최대한 끌어올리고 입장해라.'],
    completionLines: ['살아 돌아왔군. 화염 골렘은 원정대 전체가 힘을 합쳐야 쓰러뜨릴 수 있는 상대야.', '이제 빙설 고원 너머의 얼음 성채에서 무언가 심상치 않은 기운이 감지되고 있다.'],
    reward: { gold: 350, items: ['iron1', 'potion_hp2'] }
  },
  {
    id: 'ice_citadel_rank',
    title: '얼음 성채를 향한 담금질',
    targetNpcId: 'chief',
    objectiveType: 'classRank',
    objectiveTarget: 4,
    description: '파이터 이상으로 승급하고 촌장에게 원정 준비를 보고하자.',
    reminder: ['빙결 여왕의 냉기는 미숙한 자를 단번에 얼린다.', '수련의 방에서 4단 파이터 이상으로 승급을 완료하고 다시 오게.'],
    completionLines: ['좋아, 이제 자네라면 빙결 여왕과 맞설 수 있겠어.', '얼음 성채 깊숙이 들어가 여왕을 쓰러뜨리고 돌아오게. 마을 전체가 기다리고 있네.'],
    reward: { gold: 300, items: ['ring_atk'] }
  },
  {
    id: 'dark_tower_clear',
    title: '검은 탑의 암흑 기사',
    targetNpcId: 'sage',
    objectiveType: 'clearDungeon',
    objectiveTarget: 7,
    description: '마왕의 탑을 공략하고 현자에게 보고하자.',
    reminder: ['암흑 기사는 근접전에 특화된 최정예 수문장이다.', '동료 조합과 스킬 타이밍을 맞춰야 버틸 수 있다. 혼자 무너지지 마라.'],
    completionLines: ['자네가 해냈군. 암흑 기사를 쓰러뜨린 원정대는 역사에 손에 꼽을 정도야.', '이제 마지막 관문이 열렸다. 심연의 문, 최종 던전에서 마왕이 기다리고 있다.'],
    reward: { gold: 500, items: ['amulet1', 'potion_hp2'] }
  },
  {
    id: 'final_dungeon_clear',
    title: '마왕 타도',
    targetNpcId: 'chief',
    objectiveType: 'clearDungeon',
    objectiveTarget: 8,
    description: '최종 던전을 클리어하고 촌장에게 귀환 보고를 하자.',
    reminder: ['마왕의 파멸진은 원정대 전체를 동시에 위협한다.', '회복 아이템을 가득 채우고, 동료를 최대한 강화한 뒤 심연의 문으로 들어서라.'],
    completionLines: ['…살아 돌아왔군. 마왕이 쓰러졌다. 자네가 이 땅의 영웅이야.', '이 마을도, 필드도, 모든 이가 자네의 이름을 오래 기억할 걸세. 최고의 보물을 받게.'],
    reward: { gold: 800, items: ['event1', 'potion_hp2', 'potion_hp2'] }
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
