# lightsaber_test → dungeon-rpg Sync Matrix

`dungeon-rpg`를 `lightsaber_test`의 **사전 체험 리허설**로 쓰기 위해,
원본 문서와 현재 프로토타입 사이의 핵심 매핑/충돌 지점을 먼저 고정한다.

이 문서는 구현 단계에서 **“문서상 정본이 무엇인지”**와
**“프로토타입에서 어떻게 재해석했는지”**를 빠르게 확인하기 위한 기준표다.

---

## 1. 핵심 목적

- `lightsaber_test` 문서가 Unity 본개발 전에 실제로 성립하는지 검증
- `dungeon-rpg`가 원본 감각을 체험 가능한 거의 완성형 리허설이 되도록 정렬
- 문서와 프로토타입이 어긋나는 지점을 구현 전에 먼저 명시

---

## 2. Source of Truth 우선순위

이번 동기화에서 직접 확인한 기준 문서:

1. `lightsaber_test/docs/README.md`
2. `lightsaber_test/docs/project-folder-structure.md`
3. `lightsaber_test/docs/superpowers/specs/systems-character-growth.md`
4. `lightsaber_test/docs/superpowers/specs/systems-emblem-system.md`
5. `lightsaber_test/docs/superpowers/specs/systems-equipment-system.md`
6. `lightsaber_test/docs/superpowers/specs/systems-town-facility.md`
7. `lightsaber_test/docs/superpowers/specs/game-data-tables.md`

---

## 3. 정본 → 프로토타입 매핑

| 항목 | `lightsaber_test` 정본 | `dungeon-rpg` 적용 기준 |
|---|---|---|
| Tier cap | `6 / 11 / 16 / 21 / 26 / 31 / 36 / 100 / 200 / 300` | 같은 수치로 맞춘다 |
| 문장의방 진입 레벨 | 7단 Lv36 | `requiredLevel = 36`으로 맞춘다 |
| 문장 획득 조건 | tier + level + attack + defense + 병종 일치 | 현재 프로토타입 검증 단계에서는 **tier + level + 병종 일치**만 우선 적용하고, attack/defense 게이트는 제거했다 |
| 기본 문장 수 | 10종 | 프로토타입도 10종 유지 |
| 마스터 문장 수 | 3종 | 프로토타입도 3종 유지 |
| 8단 클래스 | 배틀마스터 / 택틱스마스터 / 매직마스터 | 프로토타입도 동일 명칭 사용 |
| 9단 클래스 | 그랑스워드 / 그랑아처 / 그랑메이지 | 프로토타입도 동일 명칭 사용 |
| 10단 클래스 | 그랜드스워드 / 그랜드아처 / 그랜드메이지 | 프로토타입도 동일 명칭 사용 |
| 장비 축 | 성장/문장과 별도인 핵심 축 | 프로토타입도 “문장 요구치 달성 수단”으로 승격 |
| 문장 슬롯 의미 | Head-slot 계열 장비 의미 | 최종 검증 전에는 반드시 head-slot 경쟁 의미를 반영해야 함 |

---

## 4. 현재 확인된 충돌과 해석 결정

### 4.1 7단 레벨 게이트

- 기존 프로토타입 일부 문서/코드: `Lv35`
- 정본: `Lv36`

**결정:**  
프로토타입 canonical 값은 **Lv36**으로 통일한다.

### 4.2 전직 시 레벨 리셋 vs 글로벌 레벨 게이트

성장 문서에는 전직 시 레벨을 1로 되돌리는 예시가 있지만,
동시에 정본 표는 `7단 Lv36`, `8단 Lv100`, `9단 Lv200`, `10단 Lv300`처럼
**표시 레벨 기반 글로벌 게이트**로 읽힌다.

**프로토타입 결정:**  
`dungeon-rpg`에서는 **표시 레벨을 유지**하고,
`tier/class` 전환을 별도 상태로 관리한다.

이유:
- 현재 프로토타입 루프와 충돌이 적다
- 체험 검증이 더 직관적이다
- 문장의방 / 8~10단 게이트 검증이 쉬워진다

### 4.3 문장 = 보유 버프 vs 문장 = 장착 의미

정본은 문장을 Head 계열 장비 의미로 다룬다.
기존 프로토타입은 문장을 얻는 즉시 스탯이 영구 반영되는 방식이었다.

**프로토타입 결정:**  
초기 이식 중간 단계에서는 기존 구조를 잠시 허용할 수 있지만,
**최종 validation sign-off 전에 반드시 “머리 슬롯 경쟁 의미”를 반영**한다.

즉:
- 헬멧/문장 동시 효익 불가
- 문장이 실제 장착 의사결정으로 이어져야 함

### 4.4 5개 마을 구조

정본은 카오시아 → 벨퓌어스 → 시시리오 → 엔트리아 → 아리크나의
5개 마을 progression을 가진다.
프로토타입은 현재 단일 마을 shell 중심이다.

**프로토타입 결정:**  
초기에는 **content band / shop tier / facility unlock** 방식으로
마을 progression을 흉내내고,
실제 5개 마을 shell 확장은 시스템 검증 필요가 생기면 뒤에서 추가한다.

---

## 5. 지금 바로 코드에 반영해야 하는 최소 동기화 항목

1. tier cap canonical 값 교정
2. 문장의방 `Lv36` 교정
3. 8/9/10단 클래스명/진입 경로 노출
4. 합체가 단순 버프가 아니라 **8단 계열 진입**으로 이어지게 만들기
5. 장비가 문장 요구치 달성에 실질적으로 기여하게 만들기

---

## 6. 이번 단계의 non-goals

- 전 병종 완벽 밸런스
- 스토리/연출 polish
- Unity 프로젝트 구조를 웹 프로토타입에 1:1 복제

---

## 7. 메모

이 문서는 “코드 복붙”을 위한 문서가 아니다.  
목적은 `lightsaber_test` 문서의 **게임 시스템 진실값**을
`dungeon-rpg`에서 체험 가능한 흐름으로 재배치하는 것이다.
