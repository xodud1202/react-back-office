## react-back-office 검증 하네스

### 기본 명령
- `npm run lint`
- `npm run build`

### 화면 검증 기준
- 기본 브라우저 직접 오픈 방식으로 확인한다.
- 포트 기준 URL은 `http://127.0.0.1:3011` 또는 `http://localhost:3011`이다.
- 로그인, 조회, 등록, 수정, 검증 시나리오는 공통 체크리스트 `../../AGENTS/harness/checklists/frontend-screen-change.md`를 따른다.

### 완료 기준
- lint와 build가 성공해야 한다.
- 실제 화면에서 요청 기능을 직접 조작해 확인해야 한다.
- 미실행 항목은 결과 보고에 사유를 남긴다.
