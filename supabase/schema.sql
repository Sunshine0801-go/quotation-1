-- SteelBid Comparator v2.0 — 1단계: 프로젝트 목록(①)/생성(②) 화면용 테이블
-- Supabase SQL Editor에서 이 파일 전체를 붙여넣고 실행(Run)하세요.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  client_country text,
  material_type text,
  base_currency text default 'USD',
  exchange_rate_date date,
  bid_due_date date,
  status text not null default '진행 중',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security 활성화 (기본은 전체 차단)
alter table public.projects enable row level security;

-- 1단계 프로토타입: publishable(anon) 키로 조회/등록 모두 허용
-- 주의: 로그인/인증이 없으므로 이 키를 아는 누구나 읽기/쓰기가 가능합니다.
-- 추후 인증 붙일 때 이 정책을 auth.uid() 기반으로 교체해야 합니다.
create policy "public can read projects"
  on public.projects for select
  to anon
  using (true);

create policy "public can insert projects"
  on public.projects for insert
  to anon
  with check (true);
