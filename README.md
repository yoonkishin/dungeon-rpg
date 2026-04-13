# dungeon-rpg

빠르게 플레이 감각을 검증하기 위한 **모바일 가로 화면 웹 던전 RPG 프로토타입**이다.

이 저장소는 메인 제품 저장소가 아니라, 전투감/조작/UI 흐름/저장 UX를 빠르게 실험하기 위한 **프로토타입 전용 repo**로 운영한다.

- 메인 개발 저장소: `lightsaber_test`
- 프로토타입 저장소: `dungeon-rpg`

자세한 운영 원칙은 아래 문서를 따른다.
- `AGENTS.md`
- `docs/repo-strategy.md`

---

## 목표

이 프로젝트의 목적은 완성형 구조를 만드는 것이 아니라 아래를 빠르게 검증하는 것이다.

- 이동감과 전투 템포
- 터치 조작 UX
- HUD/패널 UI 흐름
- 맵 전환과 탐험 리듬
- 저장/복원 경험
- 동료/장비/스킬 시스템의 체감

즉, **재미와 사용감 검증용 실험실**에 가깝다.

---

## 현재 구현 범위

현재 코드 구조상 아래 시스템이 포함되어 있다.

- Town / Field / Dungeon 맵 흐름
- 타일 기반 렌더링
- 전투 로직
- 적 데이터 및 동작
- 동료 시스템
- 장비 UI 및 인벤토리 패널
- 스킬 시스템
- 오디오 시스템
- 마을 귀환 / 전환 처리
- localStorage 기반 저장/로드
- 터치 조작 + 키보드 fallback

주요 파일:

```text
index.html
css/styles.css
js/state.js
js/helpers.js
js/main.js
js/transitions.js
js/combat.js
js/enemies.js
js/companions.js
js/maps.js
js/render-map.js
js/render-entities.js
js/render-effects.js
js/render-minimap.js
js/rendering.js
js/save.js
js/skills.js
js/ui-manager.js
js/ui-panel-*.js
js/audio.js
```

---

## 실행 방법

가장 간단한 방법은 정적 파일 서버로 실행하는 것이다.

---

## 문서 자동 동기화

구현 상태 문서가 코드보다 뒤처지지 않도록, 이 repo는 자동 동기화 장치를 둔다.

- `node scripts/sync-doc-state.js --write` : 코드 기준으로 문서 스냅샷 갱신
- `docs/implemented-state.md` : 자동 생성되는 현재 구현 상태 문서
- `.githooks/pre-commit` : commit 전에 문서 스냅샷 자동 갱신 + stage
- `.githooks/pre-push` : push 전에 문서 sync 여부와 부팅 스모크 테스트를 검사

즉, 앞으로 기능 구현이 끝난 상태로 commit하면, 최소한 구현 스냅샷 문서는 자동으로 따라오게 한다.

---

## 부팅 스모크 테스트

검은 화면급 부팅 실패를 줄이기 위해, 이 repo에는 **Node 기반 부팅 스모크 테스트**가 포함되어 있다.

```bash
node scripts/check-boot.js
```

이 스크립트는 핵심 JS 파일을 실제 로드 순서대로 실행해 보고,
초기 부팅 경로에서 예외가 나는지 빠르게 확인한다.

또한 현재 로컬 repo에는 `core.hooksPath=.githooks`가 설정되어 있어,
`git push` 전에 아래 훅이 자동으로 실행된다.

- `.githooks/pre-push`
- 내부에서 `node scripts/check-boot.js` 실행

즉, 앞으로는 **push 전에 최소한 부팅 크래시 여부를 한 번 자동 검사**한다.

추가로, 런타임 예외가 발생했을 때 검은 화면만 남지 않도록
`js/constants.js`에서 **Runtime Error Overlay**를 켜두었다.

- `window.onerror`
- `unhandledrejection`

두 경로를 잡아, 모바일에서도 에러 메시지/파일/라인/스택이 화면에 바로 보이게 한다.

### 방법 1: Python

```bash
python3 -m http.server 8000
```

그다음 브라우저에서 아래 주소로 연다.

```text
http://localhost:8000
```

### 방법 2: VS Code Live Server

`index.html` 기준으로 Live Server 실행.

> 일부 브라우저 환경에서는 `file://` 직접 실행보다 로컬 서버 실행이 더 안정적이다.

---

## PWA 직접 테스트

이 repo는 `manifest.json` + `sw.js` + `js/pwa.js` 조합으로 **설치 가능한 PWA 테스트 경로**를 제공한다.

### 로컬 테스트

PWA 설치/오프라인 캐시는 `https://` 또는 `localhost` 에서만 안정적으로 동작한다.

```bash
python3 -m http.server 8000
```

- 접속: `http://localhost:8000`
- Chrome DevTools → **Application**
  - **Manifest** 인식 확인
  - **Service Workers** 등록 확인
  - **Offline** 상태에서도 재접속 가능한지 확인

### GitHub Pages 테스트

이 저장소는 `.github/workflows/deploy-pages.yml` 로 `master` 브랜치 push 시 정적 사이트를 배포하도록 준비돼 있다.

예상 URL:

```text
https://yoonkishin.github.io/dungeon-rpg/
```

#### 처음 한 번 확인할 것

GitHub 저장소의 **Settings → Pages** 에서 source/build가 **GitHub Actions** 로 설정되어 있어야 한다.

그 뒤에는:

```bash
git push origin master
```

후 Actions 배포가 끝나면 모바일 브라우저에서 설치/홈 화면 추가를 직접 테스트할 수 있다.

---

## 조작

기본 조작은 모바일 터치 우선이다.

### 모바일
- 가상 조이스틱: 이동
- 우측 버튼: 공격 / 메뉴 / 스킬 / 패널 상호작용

### 키보드 fallback
- 방향키 또는 WASD: 이동
- 나머지 키 입력은 구현 상태에 따라 다를 수 있음

정확한 조작은 현재 `js/game-controls.js` 및 실제 UI 배치 기준으로 확인한다.

---

## 저장 방식

- 브라우저 `localStorage` 기반 저장/로드 사용
- 프로토타입 특성상 저장 포맷은 자주 바뀔 수 있음
- 저장 데이터 초기화가 필요할 수 있음

---

## 이 repo에서 기대해야 하는 것 / 기대하지 말아야 하는 것

### 기대해도 되는 것
- 빠른 실험
- 자주 바뀌는 UI/전투 흐름
- 과감한 튜닝
- 체감 검증

### 기대하지 말아야 하는 것
- 장기 제품 수준의 안정적인 구조
- 정제된 문서 체계
- 완전한 아키텍처 일관성
- 메인 제품으로 바로 이식 가능한 코드 품질

---

## 메인 repo와의 관계

이 repo에서 얻은 결과는 `lightsaber_test`로 바로 코드 복사하지 않는다.

옮겨야 하는 것은 주로 아래다.
- 어떤 조작이 좋은지
- 어떤 UI 흐름이 직관적인지
- 어떤 전투 템포가 재밌는지
- 어떤 피드백이 잘 읽히는지

즉, **코드보다 결론과 인사이트를 메인에 반영**한다.

---

## 권장 커밋 스타일

이 저장소는 아래 접두어를 권장한다.

- `proto:` 빠른 기능 추가
- `tune:` 수치/감각 조정
- `experiment:` 실험적 변경
- `fix:` 버그 수정
- `docs:` 문서 보강

예시:
- `proto: add dodge input test`
- `tune: lower enemy chase radius`
- `experiment: simplify minimap rendering`

---

## 현재 한 줄 정의

`dungeon-rpg`는 **메인 제품으로 가기 전, 플레이 감각과 UX를 검증하는 웹 기반 던전 RPG 프로토타입 저장소**다.
