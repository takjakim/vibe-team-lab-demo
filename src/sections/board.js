// 역할 B: 할 일 보드
// 담당 파일: 이 파일 하나. 데이터 파일은 없고 브라우저 localStorage에 저장한다.
import { el } from '../lib/dom.js';

export const meta = { id: 'board', title: '할 일 보드' };

// 저장 키는 다른 섹션과 겹치지 않게 이 값을 쓴다.
export const STORAGE_KEY = 'vibe-team-lab:board';

// 저장된 목록을 읽는다. 값이 없거나 깨져 있으면 빈 배열을 돌려준다.
function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.text === 'string' && t.text.trim() !== '')
      .map((t) => ({ id: String(t.id ?? ''), text: t.text, done: t.done === true }))
      .map((t, i) => (t.id ? t : { ...t, id: `legacy-${i}-${Date.now()}` }));
  } catch {
    return [];
  }
}

// 목록을 저장한다. 저장소를 쓸 수 없어도 화면은 계속 동작한다.
function save(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // 저장 실패는 무시한다.
  }
}

export function render(root) {
  let todos = load();

  const input = el('input', {
    class: 'input',
    type: 'text',
    placeholder: '할 일을 입력하세요',
    'aria-label': '새 할 일',
    autocomplete: 'off',
  });
  const form = el('form', { class: 'field-row' }, [
    input,
    el('button', { class: 'btn', type: 'submit' }, '추가'),
  ]);
  const listBox = el('div');

  function update(next) {
    todos = next;
    save(todos);
    draw();
  }

  function draw() {
    const remain = todos.filter((t) => !t.done).length;
    const items = todos.map((t) =>
      el('li', { class: t.done ? 'list-item is-done' : 'list-item' }, [
        el('input', {
          type: 'checkbox',
          checked: t.done,
          'aria-label': `${t.text} 완료`,
          onchange: (e) =>
            update(todos.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x))),
        }),
        el('span', { class: 'grow' }, t.text),
        el(
          'button',
          {
            class: 'btn btn-danger btn-sm',
            type: 'button',
            'aria-label': `${t.text} 삭제`,
            onclick: () => update(todos.filter((x) => x.id !== t.id)),
          },
          '삭제',
        ),
      ]),
    );
    listBox.replaceChildren(
      items.length
        ? el('ul', { class: 'list' }, items)
        : el('p', { class: 'empty' }, '아직 할 일이 없습니다.'),
      el('p', { class: 'muted' }, `남은 할 일 ${remain}개`),
    );
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    input.value = '';
    update([...todos, { id, text, done: false }]);
    input.focus();
  });

  root.replaceChildren(form, listBox);
  draw();
}
