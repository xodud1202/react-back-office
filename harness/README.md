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

### 서버 상태 확인 검증
- 서버 실행 후 `curl.exe -i http://127.0.0.1:3011/healthcheck`로 실제 HTTP 응답을 확인한다.
- 쿠키 없이 HTTP `200`, `Content-Type: text/plain; charset=utf-8`, 본문 `OK`, `Cache-Control: no-store`가 반환되어야 한다.
- 로그인 리다이렉트나 HTML 응답 없이 `node-batch`의 `checkHealth` 결과가 `success: true`여야 한다.
- 인증 쿠키 없이 기존 관리자 보호 경로에 접근하면 로그인 리다이렉트가 유지되어야 한다.
- 임시 서버로 검증했다면 해당 프로세스를 종료하고 사용 포트가 해제되었는지 확인한다.
