// 역할 E: 공지
// 담당 파일: 이 파일 하나. data는 src/data/notices.json 배열이다.
// 공지를 배너로 보여 주고, 닫은 공지는 localStorage에 기억한다.
import { el } from '../lib/dom.js';

export const meta = { id: 'notice', title: '공지', source: 'notices.json' };

// 닫은 공지 id 목록을 저장할 localStorage 키
export const STORAGE_KEY = 'vibe-team-lab:dismissed-notices';

// 닫은 id 목록 읽기. 실패하거나 형식이 다르면 빈 배열
function loadDismissed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 닫은 id 목록 저장. 저장소를 쓸 수 없어도 오류 없이 넘어간다
function saveDismissed(ids) {
  try {
    if (ids.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 저장 불가 환경에서는 이번 화면에서만 닫힌다
  }
}

export function render(root, data) {
  const notices = Array.isArray(data) ? data : [];
  const dismissed = loadDismissed();

  // 날짜 최신순(내림차순), 닫은 공지 제외
  const visible = [...notices]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .filter((n) => !dismissed.includes(n.id));

  if (visible.length === 0) {
    root.replaceChildren(
      el('div', { class: 'empty' }, [
        el('p', {}, '새 공지가 없습니다.'),
        el(
          'button',
          {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            onclick: () => {
              saveDismissed([]);
              render(root, data);
            },
          },
          '닫은 공지 다시 보기',
        ),
      ]),
    );
    return;
  }

  root.replaceChildren(
    ...visible.map((n) =>
      el('div', { class: n.level === 'important' ? 'banner is-important' : 'banner' }, [
        el('div', { class: 'grow' }, [
          el('p', { class: 'banner-title' }, n.title),
          el('p', { class: 'muted' }, n.date),
          el('p', {}, n.body),
        ]),
        el(
          'button',
          {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            'aria-label': '공지 닫기',
            onclick: () => {
              saveDismissed([...loadDismissed(), n.id]);
              render(root, data);
            },
          },
          '닫기',
        ),
      ]),
    ),
  );
}
