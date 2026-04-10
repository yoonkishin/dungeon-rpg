# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# dungeon-rpg 에이전트 가이드

이 저장소는 **메인 제품 저장소가 아니라, 빠른 검증용 프로토타입 저장소**다.

목표는 완벽한 구조나 장기 유지보수가 아니라,
**재미 / 전투감 / UI 흐름 / 모바일 조작 / 빠른 아이디어 검증**이다.

---

## 1. 이 저장소의 역할

이 repo는 아래 목적에 최적화한다.

- 빠른 실험
- 짧은 구현 루프
- 웹에서 즉시 실행 가능한 프로토타입
- 전투 템포, 이동감, UI/UX, 미니맵, 저장 흐름 검증

이 repo는 `lightsaber_test`의 하위 호환이 아니다.
또한 `lightsaber_test`의 구조/문서 체계를 그대로 복붙하는 공간도 아니다.

**정리:**
- `lightsaber_test` = 메인 개발
- `dungeon-rpg` = 프로토타입/실험

---

## 2. 기술 기준

- HTML / CSS / JavaScript 기반 (빌드 도구 없음, `<script>` 태그 순서대로 직접 로드)
- 모바일 가로 화면 우선
- 터치 조작 우선, 키보드 fallback 허용
- 빠른 브라우저 실행성과 확인 속도 중시
- localStorage 저장 허용

복잡한 빌드 파이프라인, 과도한 프레임워크 도입, 과한 추상화는 기본적으로 우선순위가 낮다.

---

## 3. 개발 명령어

```bash
# 로컬 실행 (정적 파일 서버)
python3 -m http.server 8000
# → http://localhost:8000

# 부팅 스모크 테스트 (검은 화면급 부팅 실패 사전 검출)
node scripts/check-boot.js

# pre-push 훅이 문서 sync 검사 + check-boot.js를 실행함 (.githooks/pre-push)
# pre-commit 훅이 scripts/sync-doc-state.js로 구현 스냅샷 문서를 자동 갱신함
# 훅이 막으면 원인을 고친 뒤 commit/push
```

테스트 프레임워크나 린터는 없다. 검증은 브라우저에서 직접 확인한다.

---

## 4. 아키텍처

### Script Load Order (index.html)

순서가 곧 의존성이다. 순서를 바꾸면 부팅이 깨진다.

```
constants.js  → 타일 상수, DUNGEON_INFO, Runtime Error Overlay
audio.js      → AudioSystem 싱글턴 (Web Audio API)
maps.js       → buildTown(), buildField(), buildDungeon() — 맵 2D 배열 생성
data.js       → COMPANION_ROSTER, ITEMS, SKILLS, ENEMY_TYPES 정의
state.js      → 모든 전역 가변 상태 선언 (player, enemies, inventory 등)
helpers.js    → dist(), resolveCollision(), addParticles() 등 유틸
enemies.js    → spawnEnemies(), createEnemy(), 적 AI
combat.js     → doAttack(), performEnemyAttack(), boss 특수기
transitions.js→ enterField(), enterTown(), enterDungeon(), checkPortal()
skills.js     → useSkill(), skillPages, 키보드 fallback 입력
companions.js → updateCompanion(), 동료 AI 모드별 행동
rendering.js  → draw(), drawMap(), Y-sort 엔티티 렌더링, 미니맵
ui-controls.js→ 조이스틱, 공격/포션 버튼, 메뉴 토글
ui-panels.js  → 인벤토리/상점/프로필/동료/스킬/퀘스트 패널 렌더링
save.js       → autoSave(30초), loadSave(), localStorage 직렬화
main.js       → gameLoop() → update(dt) + draw(), 초기화 진입점
```

### Game Loop

`main.js`의 `gameLoop(ts)` → `requestAnimationFrame` 루프:
1. `update(dt)` — 입력 처리, 이동/충돌, 적 AI, 동료 AI, 맵 전환, 아이템 획득, 카메라 추적
2. `tickAutoSave(dt)` — 30초 주기 자동 저장
3. `draw()` — 맵 타일 → 드롭 아이템 → 엔티티(Y-sort) → 이펙트 → 파티클 → 데미지 숫자 → 미니맵 → HUD

### Global State Model

- **constants.js / data.js**: 불변 게임 설정 (DUNGEON_INFO, ITEMS, ENEMY_TYPES, COMPANION_ROSTER)
- **state.js**: 가변 런타임 상태 (player, enemies[], companions[], inventory[], equipped, 퀘스트 진행 등)
- **save.js**: state.js의 주요 변수들을 localStorage로 직렬화/역직렬화

### File Responsibilities

| 파일 | 책임 |
|------|------|
| `combat.js` | 전투 판정, 피해 계산, 보스 특수기. 패널 HTML 건드리지 않음 |
| `transitions.js` | 맵 이동, 지역 전환. 맵 전환의 기준 파일 |
| `ui-controls.js` | 입력 캡처 + 라우팅 (조이스틱, 버튼, 터치) |
| `ui-panels.js` | 패널 콘텐츠 렌더링 + 내부 인터랙션 |
| `save.js` | 저장/복원 전담. 다른 파일에서 세이브 포맷 직접 변경 금지 |
| `enemies.js` | 적 생성 + 스폰 로직 |
| `maps.js` | 맵 타일 배열 생성 (town 40x30, field 80x60, dungeon 20x15) |

### Map Transition Flow

- town ↔ field: `TILE_EXIT` 위를 걸으면 자동 전환
- field → dungeon: `TILE_PORTAL` 근처에서 `checkPortal()` → `enterDungeon(dungeonId)`
- dungeon → field: `TILE_EXIT` → `exitDungeon()` → `enterField()`
- 모든 전환 시 `player.hp = maxHp` (풀힐) + `spawnEnemies()` + BGM 변경

### Current Implemented Snapshot (auto-synced)

<!-- AUTO-SNAPSHOT:START -->
- Authoritative implemented status lives in `docs/implemented-state.md` (auto-generated).
- 런타임 가변 상태는 `state.js`로 분리되어 있고 `index.html`에서 직접 로드된다.
- 플레이어 성장 상태(`classLine`, `classRank`, `promotionPending`)와 save/load 연동이 감지됐다.
- 동료 데이터, AI, 시너지 로직이 `data-companions.js`로 분리된 것이 감지됐다.
- 마을 NPC와 시설 업그레이드 로직이 `data-town.js`로 분리된 것이 감지됐다.
- 퀘스트 정의와 퀘스트 흐름 헬퍼가 `data-quests.js`로 분리된 것이 감지됐다.
- 동료 시스템은 10명 roster / 10개 병종 프로필 구조로 감지됐다: 보병, 비병, 기병, 수병, 창병, 궁병, 승려, 신관, 법사, 사교.
- 동료 AI 모드는 `aggressive`, `defensive`, `support` 로 감지됐다고 save/load 연동도 확인됐다.
- 미니맵 컨테이너는 HUD 우측 상단 슬롯(top 56px, right 12px)으로 감지됐다고 표시 상태는 localStorage에 저장된다.
- HUD quick action 버튼은 6개 감지됐다: `profile`, `equipment`, `companion`, `quests`, `skill`, `town-return`.
- 수련의 방 패널과 승급 패널 진입점이 감지됐다.
- 문장의방 패널과 문장 데이터 뼈대가 감지됐다.
- 던전 정예 몬스터와 보스 페이즈 기믹 로직이 감지됐다.
- pre-push 훅은 `scripts/check-boot.js`를 실행해 부팅 스모크 테스트를 강제한다.
- pre-commit 훅은 `scripts/sync-doc-state.js --write`를 실행해 문서 스냅샷을 자동 갱신한다.
- pre-push 훅은 문서 스냅샷 sync 여부도 검사한다.
<!-- AUTO-SNAPSHOT:END -->

---

## 5. 최우선 원칙

### 해야 하는 것
- 재미있는지 빨리 확인한다.
- 작은 단위로 자주 고친다.
- 눈에 보이는 플레이 경험을 우선한다.
- 실험이 성공하면 이유를 문서로 짧게 남긴다.
- 메인 프로젝트로 가져갈 아이디어는 **아이디어/원칙만 승격**한다.

### 하지 말아야 하는 것
- 메인 프로젝트 수준의 과설계
- 불필요한 폴더 세분화
- 실험 repo를 장기 제품 repo처럼 다루기
- `lightsaber_test` 코드/규칙을 문맥 없이 그대로 복사하기
- 프로토타입에서 검증되지 않은 결정을 메인 기준처럼 확정하기

---

## 6. 부팅/초기화 안전 규칙

이 프로젝트에서 가장 흔한 치명적 버그는 **부팅 실패(검은 화면)**다.
번들러 없이 `<script>`로 직접 로드되므로, 초기화 순서 하나만 틀려도 부팅이 죽는다.

1. `buildDungeon()` 등 맵 빌드 함수가 참조할 전역 상태(`currentDungeonId` 등)는 반드시 맵 빌드 이전에 선언
2. `data.js`, `maps.js`, `save.js`, `main.js`, `ui-panels.js` 수정 시 부팅 경로 깨짐 여부 먼저 의심
3. 새 기능을 넣을 때 기존 save/localStorage와 충돌 가능성을 함께 본다
4. 프로토타입이라도 "문법 체크 통과"만으로 끝내지 않는다
   - 최소한 **초기 부팅**, **메뉴 열기**, **패널 열기**, **세이브 복원**까지 한 번 생각한다
5. 검은 화면이 뜨면 렌더링부터 의심하지 말고, **초기화 순서 / 전역 상태 선언 시점 / 저장 데이터 복원 시점**을 먼저 본다
6. push 전 `node scripts/check-boot.js` 통과 필수 (pre-push 훅으로 자동 실행)
7. `js/constants.js`의 Runtime Error Overlay(`window.onerror`, `unhandledrejection`)를 유지할 것

### 새 전역 상태 추가 시 체크리스트

- 선언 시점이 부팅 순서상 안전한가
- save/load에 포함해야 하는가
- 기본값 누락 시 복구 가능한가
- 기존 세이브와 충돌하지 않는가
- 관련 UI/HUD가 같이 갱신되는가

### 실제 사례

- `currentDungeonId`가 선언되기 전에 `buildDungeon()`이 호출될 수 있는 구조 때문에 부팅 단계에서 런타임이 죽을 수 있었음
- 해결: `currentDungeonId` 선언을 map build 이전으로 이동

---

## 7. 메인 repo와의 관계

### `lightsaber_test`로 가져가도 되는 것
- 전투 템포에 대한 결론
- UI 배치 아이디어
- 조작감 개선 포인트
- 저장 UX 아이디어
- 맵 전환/연출 아이디어
- 플레이어 피드백 설계

### 그대로 가져가면 안 되는 것
- 프로토타입용 임시 코드
- 전역 상태 남발 패턴
- 빠른 구현을 위해 땜질한 구조
- 문서 없이 만든 수치 결정

프로토타입의 결과는 참고하되, 메인 반영은 의식적으로 다시 설계한다.

---

## 8. 프로토타입 유지보수 규칙

이 repo도 실험이 누적되면 작은 게임처럼 오래 살아남는다.
**속도를 해치지 않으면서 구조 붕괴를 막는 최소 규칙**을 유지한다.

### 핵심 시스템은 한 곳에서만 바꾼다

- 맵 전환 → `transitions.js`
- 저장/복원 → `save.js`
- 패널 렌더링 → `ui-panels.js`
- 입력/메뉴/오버레이 제어 → `ui-controls.js`

핵심 흐름을 바꿀 때는 먼저 **기준 파일 하나**를 정하고,
다른 파일은 그 흐름을 호출만 하게 유지한다.

### 파일 책임 경계를 가볍게 지킨다

- 전투 파일이 패널 HTML을 직접 만들지 않기
- UI 파일이 맵 생성 로직까지 떠맡지 않기
- 저장 파일 밖에서 세이브 포맷을 제멋대로 바꾸지 않기

### UI는 render + bind 패턴을 우선한다

패널성 UI는 가능하면: 데이터 계산 → HTML 조립/렌더 → 필요한 액션 바인딩 순서.

### 터치/클릭 입력은 공통 방식 우선

- 새 패널/버튼은 먼저 기존 입력 헬퍼(`bindTap()` 등) 사용 가능성을 본다
- 같은 `touchstart + click` 조합을 여러 곳에 복붙하지 않는다

### 리팩토링 기준

우선순위를 두는 경우:
- 같은 버그가 반복될 구조를 줄일 때
- 같은 패턴이 3번 이상 반복될 때
- 모바일 UX 수정 속도를 높일 때
- 부팅 실패 / 런타임 에러 위험을 줄일 때

우선순위가 낮은 경우:
- 보기 좋은 추상화만을 위한 분리
- 아직 검증 안 된 미래 확장을 위한 구조화
- 메인 repo처럼 보이기 위한 폴더 분해

### 변경 전 빠른 점검 질문

- 이 변경이 부팅을 깨뜨릴 수 있나?
- 세이브 데이터를 망가뜨릴 수 있나?
- 모바일 터치 흐름을 막을 수 있나?
- 맵 전환 / 사망 / 패널 열기 중 하나를 꼬이게 하나?
- 지금 이 추상화가 실제로 다음 수정도 쉽게 만들까?

---

## 9. 작업 방식

### 권장 방식
- 한 번에 큰 기능보다 작은 기능 하나씩
- UI/조작/전투를 빠르게 눈으로 확인
- 커밋은 짧고 명확하게
- 필요하면 과감히 갈아엎기 허용

### 커밋 메시지 권장 접두어

```
proto:      빠른 기능 추가
tune:       밸런스/감각 조정
fix:        명백한 버그 수정
experiment: 실험적 변경
docs:       짧은 운영 메모/결론 추가
```

---

## 10. 파일/구조 원칙

현재 구조는 단순함을 유지한다.

필요 전까지는 구조를 크게 쪼개지 않는다.
**문제가 생길 때 분리하고, 분리를 위해 먼저 복잡하게 만들지 않는다.**

---

## 11. 문서 규칙

문서에 남길 가치가 있는 것:
- 검증된 UX 결정
- 실패한 실험과 이유
- 메인 repo로 옮길 만한 인사이트
- 실행/테스트 방법

문서에 굳이 길게 안 써도 되는 것:
- 아직 검증 안 된 거대한 비전
- 추상적인 아키텍처 미학
- 제품 수준의 장기 로드맵

---

## 12. 성공 기준

- 빨리 실행된다
- 손으로 만졌을 때 체감이 좋다
- 실험 결과가 분명하다
- 메인 프로젝트에 줄 수 있는 인사이트가 생긴다

완벽함보다 **속도와 학습 가치**가 중요하다.
