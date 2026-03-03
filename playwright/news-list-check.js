/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

// 뉴스 목록 화면을 Playwright로 검증합니다.
async function run() {
  const baseUrl = process.env.BACKOFFICE_BASE_URL || 'http://127.0.0.1:3011';
  const loginId = process.env.BACKOFFICE_LOGIN_ID || 'lty0325';
  const loginPwd = process.env.BACKOFFICE_LOGIN_PWD || 'test12345!';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let newsMetaResponseStatus = null;
  const dialogMessageList = [];

  // 뉴스 메타 파일 응답 상태를 수집합니다.
  page.on('response', (response) => {
    const responseUrl = response.url();
    if (responseUrl.includes('/api/last/news/meta.json')) {
      newsMetaResponseStatus = response.status();
    }
  });

  // 화면 alert 메시지를 수집하고 테스트를 계속 진행합니다.
  page.on('dialog', async (dialog) => {
    dialogMessageList.push(dialog.message());
    await dialog.dismiss();
  });

  try {
    console.log('로그인 페이지 진입 시작');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });

    // 로그인 입력을 수행합니다.
    const loginForm = page.locator('form');
    await loginForm.locator('input[type="text"]').fill(loginId);
    await loginForm.locator('input[type="password"]').fill(loginPwd);
    await loginForm.locator('button[type="submit"]').click();

    // 로그인 후 이동을 대기합니다.
    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 });
    console.log('로그인 성공');

    console.log('뉴스 목록 페이지 이동');
    await page.goto(`${baseUrl}/news/list`, { waitUntil: 'networkidle' });

    // 페이지 타이틀을 확인합니다.
    const pageTitle = await page.locator('h3.page-title').textContent();
    console.log(`페이지 타이틀: ${pageTitle}`);

    // 언론사/카테고리 선택 조건을 설정합니다.
    const pressSelect = page.locator('select[name="pressNo"]');
    const categorySelect = page.locator('select[name="categoryCd"]');

    const pressOptions = await pressSelect.locator('option').all();
    if (pressOptions.length > 1) {
      const pressValue = await pressOptions[1].getAttribute('value');
      await pressSelect.selectOption(pressValue || '');
      await page.waitForTimeout(500);
    }

    const categoryOptions = await categorySelect.locator('option').all();
    if (categoryOptions.length > 1) {
      const categoryValue = await categoryOptions[1].getAttribute('value');
      await categorySelect.selectOption(categoryValue || '');
    }

    // 그리드 로딩 결과를 확인합니다.
    const rowsLocator = page.locator('.ag-center-cols-container .ag-row');
    const noRowsLocator = page.locator('.ag-overlay-no-rows-center');
    try {
      await Promise.race([
        rowsLocator.first().waitFor({ state: 'visible', timeout: 15000 }),
        noRowsLocator.waitFor({ state: 'visible', timeout: 15000 }),
      ]);
    } catch {
      // 데이터 없음/렌더 지연 케이스를 허용하고 후속 카운트로 판정합니다.
      console.log('그리드 행/오버레이 표시 대기 타임아웃, 현재 렌더 상태로 계속 진행합니다.');
    }

    const rowCount = await rowsLocator.count();
    console.log(`조회 결과 행 수: ${rowCount}`);

    // 메타 파일 요청 실패를 테스트 실패로 처리합니다.
    if (newsMetaResponseStatus !== null && newsMetaResponseStatus >= 400) {
      throw new Error(`뉴스 메타 파일 요청 실패 status=${newsMetaResponseStatus}`);
    }

    // 오류 alert가 발생하면 테스트 실패로 처리합니다.
    const hasErrorDialog = dialogMessageList.some((message) => message.includes('불러오지 못했습니다'));
    if (hasErrorDialog) {
      throw new Error(`오류 alert 감지: ${dialogMessageList.join(' | ')}`);
    }

    if (rowCount > 0) {
      // 행 높이를 확인합니다.
      const firstRowBox = await rowsLocator.first().boundingBox();
      if (firstRowBox) {
        console.log(`첫 행 높이: ${firstRowBox.height}`);
      }

      // 뉴스 타이틀 링크 새창 동작을 확인합니다.
      const firstTitleLink = rowsLocator.first().locator('a').first();
      if (await firstTitleLink.count()) {
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          firstTitleLink.click(),
        ]);
        await newPage.waitForLoadState('domcontentloaded');
        console.log(`새창 URL: ${newPage.url()}`);
        await newPage.close();
      } else {
        console.log('타이틀 링크가 없어 새창 확인을 건너뜁니다.');
      }

      // 타이틀 이미지 클릭 시 모달 확인을 수행합니다.
      const imageButton = rowsLocator.first().locator('button:has(img[alt="뉴스 타이틀 이미지"])');
      if (await imageButton.count()) {
        await imageButton.click();
        const modal = page.locator('div[role="document"]', {
          has: page.locator('img[alt="뉴스 타이틀 이미지"]'),
        });
        await modal.waitFor({ state: 'visible', timeout: 5000 });
        const modalBox = await modal.boundingBox();
        if (modalBox) {
          console.log(`이미지 모달 크기: ${modalBox.width}x${modalBox.height}`);
        }
        await modal.locator('button[aria-label="닫기"]').click();
      } else {
        console.log('타이틀 이미지가 없어 모달 확인을 건너뜁니다.');
      }
    }

    console.log('뉴스 목록 화면 검증 완료');
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error('Playwright 검증 중 오류 발생', error);
  process.exit(1);
});
