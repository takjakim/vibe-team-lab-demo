// 역할 D: 테마 설정
// data는 app.js가 넘겨 주는 테마 훅이다.
import { el } from '../lib/dom.js';

export const meta = { id: 'theme', title: '테마', source: 'theme' };

const OPTIONS = [
  { value: 'system', label: '시스템 설정 따르기' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

const CURRENT_LABEL = { light: '라이트', dark: '다크' };

export function render(root, data) {
  const status = el('p', { class: 'muted theme-status', 'aria-live': 'polite' });

  const inputs = OPTIONS.map(({ value }) =>
    el('input', {
      type: 'radio',
      name: 'theme-preference',
      value,
      onchange: (event) => data.set(event.target.value),
    }),
  );

  // 선택 상태와 안내 문구를 현재 값에 맞춘다
  function sync(preference, current) {
    inputs.forEach((input) => {
      input.checked = input.value === preference;
    });
    status.textContent = `현재 적용: ${CURRENT_LABEL[current] ?? current}`;
  }

  const group = el('fieldset', { class: 'choice-group' }, [
    el('legend', { class: 'visually-hidden' }, '테마 선택'),
    OPTIONS.map(({ label }, index) => el('label', {}, [inputs[index], label])),
  ]);

  root.replaceChildren(group, status);
  sync(data.getPreference(), data.getCurrent());

  // 헤더 버튼 등 다른 곳에서 바뀐 값도 반영한다
  data.onChange(({ preference, current }) => sync(preference, current));
}
