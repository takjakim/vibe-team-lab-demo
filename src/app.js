// 팀 허브 진입점 (공용 파일, 수정 금지)
// 하는 일: 테마 훅을 준비하고, sections/index.js 목록 순서대로 섹션 카드를 #app에 그린다.
import { sections } from './sections/index.js';
import { el } from './lib/dom.js';

const THEME_KEY = 'vibe-team-lab:theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// ---------------------------------------------------------------
// 테마 토글 훅
// html 요소의 data-theme 속성("light" 또는 "dark")만 바꾼다.
// 실제 색은 src/styles/theme.css(역할 D)가 정한다.
// ---------------------------------------------------------------
// 저장된 값이 없으면 라이트로 시작한다. 'system'(운영체제 설정 따르기)은 역할 D가 선택지로 제공한다.
function readPreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'light';
  } catch {
    return 'light';
  }
}

function resolve(preference) {
  if (preference === 'system') return darkQuery.matches ? 'dark' : 'light';
  return preference;
}

function apply(preference) {
  const current = resolve(preference);
  document.documentElement.dataset.theme = current;
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.setAttribute('aria-pressed', String(current === 'dark'));
    button.textContent = current === 'dark' ? '라이트 모드' : '다크 모드';
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: { preference, current } }));
}

/** 테마 섹션(역할 D)이 data 인자로 받는 테마 훅 */
const themeHook = {
  /** 저장된 선호값: 'system' | 'light' | 'dark' */
  getPreference: readPreference,
  /** 지금 화면에 적용된 테마: 'light' | 'dark' */
  getCurrent: () => resolve(readPreference()),
  /** 선호값을 저장하고 바로 적용한다 */
  set(preference) {
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      // 저장소를 쓸 수 없어도 화면에는 적용한다
    }
    apply(preference);
  },
  /** 라이트와 다크를 번갈아 적용한다 */
  toggle() {
    themeHook.set(themeHook.getCurrent() === 'dark' ? 'light' : 'dark');
  },
  /** 테마가 바뀔 때마다 fn({ preference, current })를 부른다. 해제 함수를 돌려준다. */
  onChange(fn) {
    const listener = (event) => fn(event.detail);
    document.addEventListener('themechange', listener);
    return () => document.removeEventListener('themechange', listener);
  },
};

darkQuery.addEventListener('change', () => {
  if (readPreference() === 'system') apply('system');
});

// ---------------------------------------------------------------
// 섹션 렌더링
// 각 섹션 모듈은 meta({ id, title, source })와 render(root, data)를 내보낸다.
// source가 'xxx.json'이면 src/data/xxx.json을 읽어 data로, 'theme'이면 테마 훅을 data로 넘긴다.
// ---------------------------------------------------------------
async function loadData(source) {
  if (!source) return null;
  if (source === 'theme') return themeHook;
  const url = new URL(`./data/${source}`, import.meta.url);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${source}를 불러오지 못했습니다 (HTTP ${response.status}).`);
  return response.json();
}

async function renderSection(mod, body) {
  try {
    const data = await loadData(mod.meta.source);
    await mod.render(body, data);
  } catch (error) {
    console.error(`[${mod.meta.id}]`, error);
    body.replaceChildren(
      el('p', { class: 'error', role: 'alert' }, `이 섹션을 그리는 중 오류가 발생했습니다: ${error.message}`),
    );
  }
}

async function main() {
  apply(readPreference());
  document.getElementById('theme-toggle')?.addEventListener('click', () => themeHook.toggle());

  const app = document.getElementById('app');
  const nav = document.getElementById('site-nav');
  app.replaceChildren();
  nav?.replaceChildren();

  // 카드를 목록 순서대로 먼저 배치한 뒤 내용은 동시에 채운다.
  const jobs = sections.map((mod) => {
    const { id, title } = mod.meta;
    const body = el('div', { class: 'section-body' });
    app.append(
      el('section', { id, class: 'card section', 'aria-labelledby': `${id}-title` }, [
        el('h2', { id: `${id}-title`, class: 'section-title' }, title),
        body,
      ]),
    );
    nav?.append(el('a', { href: `#${id}` }, title));
    return renderSection(mod, body);
  });
  await Promise.all(jobs);
}

main();
