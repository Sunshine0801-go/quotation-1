# quotation-1
견적서 비교 프로그램-1

## AI 견적 분석 기능 배포 안내 (Vercel)

⑥ 견적 비교 Summary, ⑧ 추천 대시보드 화면의 `🤖 AI 견적 분석` 버튼은 `/api/analyze-quotation` 서버리스 함수가 Claude API를 호출해 동작합니다. 이 기능은 정적 호스팅(GitHub Pages)에서는 동작하지 않으며, Vercel 배포가 필요합니다.

1. [Vercel](https://vercel.com)에서 이 GitHub 저장소를 Import 합니다.
2. Vercel 프로젝트 **Settings → Environment Variables**에서 `ANTHROPIC_API_KEY`를 등록합니다. (Anthropic Console에서 발급한 API 키)
3. 배포(Deploy)하면 정적 화면(`index.html`)과 `/api/analyze-quotation` 서버리스 함수가 함께 서빙됩니다.

API 키는 절대 `index.html` 등 클라이언트 코드에 넣지 않으며, 서버리스 함수 내부에서 `process.env.ANTHROPIC_API_KEY`로만 읽습니다.
