# quotation-1
견적서 비교 프로그램-1

## AI 견적 분석 기능 배포 안내 (Vercel)

⑥ 견적 비교 Summary, ⑧ 추천 대시보드 화면의 `🤖 AI 견적 분석` 버튼은 `/api/analyze-quotation` 서버리스 함수가 Claude API를 호출해 동작합니다. 이 기능은 정적 호스팅(GitHub Pages)에서는 동작하지 않으며, Vercel 배포가 필요합니다.

1. [Vercel](https://vercel.com)에서 이 GitHub 저장소를 Import 합니다.
2. Vercel 프로젝트 **Settings → Environment Variables**에서 `ANTHROPIC_API_KEY`를 등록합니다. (Anthropic Console에서 발급한 API 키)
3. 배포(Deploy)하면 정적 화면(`index.html`)과 `/api/analyze-quotation` 서버리스 함수가 함께 서빙됩니다.

API 키는 절대 `index.html` 등 클라이언트 코드에 넣지 않으며, 서버리스 함수 내부에서 `process.env.ANTHROPIC_API_KEY`로만 읽습니다.

## 프로젝트 목록/생성 데이터 저장 (Supabase, 1단계)

① 프로젝트 목록, ② 프로젝트 생성 화면은 Supabase `projects` 테이블과 직접 연동되어 있습니다(그 외 ③~⑧ 화면은 아직 샘플 데이터입니다).

1. Supabase SQL Editor에서 `supabase/schema.sql`의 내용을 실행해 `projects` 테이블을 생성합니다.
2. `index.html`에는 Supabase 프로젝트 URL과 publishable(anon) 키가 이미 포함되어 있습니다. 이 키는 클라이언트에서 사용하도록 설계된 공개 키이며 `ANTHROPIC_API_KEY`와 달리 노출되어도 되는 키입니다(단, Row Level Security 정책으로 접근 범위를 통제해야 합니다).
3. ② 화면에서 프로젝트를 저장하면 즉시 Supabase `projects` 테이블에 INSERT되고, ① 화면 목록에 반영됩니다.

> 현재 RLS 정책은 인증 없이 anon 키로 읽기/쓰기를 모두 허용하는 프로토타입 설정입니다. 실제 운영 전환 시 로그인 붙이고 정책을 `auth.uid()` 기반으로 교체해야 합니다.
