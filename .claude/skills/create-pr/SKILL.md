---
name: create-pr
description: |
  현재 브랜치의 커밋을 바탕으로 GitHub Pull Request를 생성한다. 저장소 신호(커밋 언어, README 언어, 라이선스 유무)를 보고 한국어/영어 PR 템플릿 중 하나를 자동 선택하고, diff와 커밋 로그로 제목·본문을 채워 `gh pr create`로 실제 PR을 연다.
  "PR 만들어줘", "PR 생성해줘", "풀리퀘스트 올려줘", "pull request 열어줘", "create a PR", "open a pull request" 같은 요청에 활성화한다.
context: fork
argument-hint: "[base-branch] [PR에 반드시 반영할 배경 설명]"
---

# create-pr: GitHub PR 자동 생성

이 스킬은 대화 기록을 상속하지 않는 격리된 컨텍스트에서 실행된다. 현재 작업 디렉토리의 git 저장소 상태(커밋, diff, 브랜치)만을 근거로 모든 판단을 스스로 내려야 한다. "이전에 사용자가 말한 것"을 가정하지 말고, 아래 절차로 직접 조사한다. 단, 호출자가 `args`로 배경 설명이나 base 브랜치를 넘겼다면 그 내용을 최우선 근거로 반영한다.

## Step 0: 사전 확인

- `git rev-parse --is-inside-work-tree`로 git 저장소인지 확인한다. 아니면 즉시 중단하고 사용자에게 알린다.
- `git branch --show-current`로 현재 브랜치를 확인한다. base 브랜치(`main`/`master`/저장소 기본 브랜치)와 같으면 **PR을 만들 수 없다** — 자기 자신에 대한 PR이 되기 때문이다. 이 경우 새 브랜치가 필요하다는 사실을 알리고 중단한다(임의로 브랜치를 만들지 않는다).
- `git status --porcelain`으로 커밋되지 않은 변경사항이 있는지 확인한다. 있으면 먼저 커밋이 필요함을 안내하고 중단한다(이 스킬은 커밋을 대신하지 않는다 — 커밋은 별도 `commit` 스킬의 역할이다).
- base 브랜치를 정한다: `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`로 저장소 기본 브랜치를 조회한다. 실패하면 `main`을 기본값으로 쓴다. `args`에 base 브랜치가 명시돼 있으면 그것을 우선한다.
- `gh pr view --json url,number 2>/dev/null`로 현재 브랜치에 이미 열린 PR이 있는지 확인한다. 있으면 새로 만들지 않고 기존 PR URL을 보고한 뒤 종료한다.

## Step 1: 변경 내용 수집

- `git log <base>..HEAD --oneline`으로 이 브랜치에만 있는 커밋 목록을 확인한다.
- `git diff <base>...HEAD --stat`과 필요시 `git diff <base>...HEAD`로 실제 변경 내용을 확인한다. 커밋 메시지만으로 "왜"가 불충분하면 diff를 읽고 의도를 파악한다.
- 저장소 루트의 `AGENTS.md` 또는 `CLAUDE.md`, `CONTRIBUTING.md`가 있으면 읽는다. PR 작성 관련 지침(언어, 필수 섹션, 체크리스트 등)이 있으면 이후 모든 단계에서 최우선으로 따른다.

## Step 2: 템플릿 언어 결정

기본값은 **한국어**(`references/template-ko.md`)다. 다음을 모두 확인해 저장소가 "영어 기반 오픈소스"로 판단될 때만 영어(`references/template-en.md`)로 전환한다:

1. `git log --oneline -30`의 커밋 메시지에 한글이 전혀 없고 전부 영어로 작성돼 있다.
2. `README.md`가 영어로 작성돼 있다(또는 `README.ko.md`처럼 한국어판이 별도 파일로 분리돼 있어 기본 README가 영어다).
3. 저장소가 public이거나 `LICENSE` 파일이 존재해 오픈소스 배포 성격이 있다.

세 조건을 모두 만족하면 영어 템플릿을 쓴다. 하나라도 애매하거나(예: 커밋이 거의 없는 신규 저장소, 커밋 언어가 혼재) 판단이 서지 않으면 기본값인 한국어 템플릿을 쓴다. `AGENTS.md`/`CLAUDE.md`/`CONTRIBUTING.md`에 PR 언어가 명시돼 있었다면 이 판단 자체를 건너뛰고 그 지침을 따른다.

선택한 템플릿 파일을 읽어 구조(섹션 제목, 체크리스트 형식)를 그대로 유지한 채 내용을 채운다. 플레이스홀더(`<...>`)를 실제 내용으로 바꾸고, 채울 내용이 없는 섹션은 빈 채로 남기지 말고 통째로 삭제한다.

## Step 3: 제목과 본문 작성

- **제목**: 70자 이내, 간결하게. 저장소 커밋 컨벤션이 보이면(예: `type(scope): 요약`) 그 스타일을 따르고, 없으면 평서형으로 무엇을 하는 PR인지 명확히 쓴다.
- **본문**: Step 2에서 고른 템플릿 구조를 그대로 사용한다.
  - 개요/Summary: diff와 커밋 목적을 종합해 "무엇을"보다 "왜"에 무게를 둔다.
  - 변경 사항/Changes: `git diff --stat` 기준으로 의미 있는 변경 단위별 bullet.
  - 테스트 계획/Test Plan: 저장소에서 감지되는 실제 검증 수단(`package.json`의 test/lint/build 스크립트, `AGENTS.md`에 명시된 커맨드 등)을 체크리스트로 제시한다. 이번 작업 중 실제로 실행해 통과를 확인한 항목만 체크(`- [x]`)하고, 실행하지 않았거나 확인 불가능한 항목은 미체크(`- [ ]`) 상태로 둔다. 없는 검증 수단을 지어내지 않는다.
  - 관련 이슈: `args`나 커밋 메시지에 이슈 번호(`#123` 등)가 언급돼 있으면 채우고, 없으면 이 섹션을 삭제한다.
- 현재 세션에 PR 본문 attribution 관련 지침(예: 특정 문구로 끝맺으라는 지시)이 시스템 수준으로 주어져 있다면 본문 맨 끝에 그대로 포함한다. 그런 지침이 없다면 임의로 추가하지 않는다.

## Step 4: push 및 PR 생성

- 현재 브랜치가 원격에 없으면 `git push -u origin <현재 브랜치>`로 푸시한다. PR 생성은 원격에 브랜치가 있어야 가능하므로, 이 push는 "PR 생성"이라는 요청 범위에 내재된 동작이다.
- `gh pr create --title "<제목>" --body "$(cat <<'EOF'\n<본문>\nEOF\n)" --base <base 브랜치>`로 PR을 생성한다. 본문은 항상 HEREDOC으로 전달해 줄바꿈·마크다운 서식을 보존한다.
- `--draft`, 리뷰어 지정 등 `args`에 명시되지 않은 옵션은 기본값(일반 PR, 리뷰어 미지정)으로 둔다.

## Step 5: 결과 보고

생성된 PR의 번호와 URL, 사용한 템플릿 언어(한국어/영어)와 그 판단 근거를 한두 문장으로 보고한다.

## 참고 파일

- `references/template-ko.md` — 기본 한국어 PR 템플릿
- `references/template-en.md` — 영어 기반 오픈소스 프로젝트용 PR 템플릿
