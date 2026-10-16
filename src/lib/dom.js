// 공용 DOM 도우미 (수정 금지)
// 문자열은 textContent로만 넣으므로 데이터에 HTML이 섞여 있어도 안전하다.

/**
 * 요소를 만든다.
 * 예: el('li', { class: 'list-item', dataset: { id: '1' } }, ['할 일', el('button', { onclick: fn }, '삭제')])
 * @param {string} tag 태그 이름
 * @param {object} [props] 속성. class, dataset, on으로 시작하는 이벤트(onclick 등), 그 밖의 HTML 속성
 * @param {Array|string|Node} [children] 자식 요소 또는 문자열
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') {
      node.className = value;
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of [children].flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'object' ? child : String(child));
  }
  return node;
}

/**
 * "준비 중" 자리표시자를 그린다. 각 역할이 섹션을 구현하면 이 호출을 지운다.
 * @param {HTMLElement} root 섹션 본문 요소
 * @param {{ role: string, file: string, note?: string }} info 담당 역할, 담당 파일, 덧붙일 설명
 */
export function placeholder(root, { role, file, note }) {
  root.replaceChildren(
    el('div', { class: 'placeholder' }, [
      el('p', { class: 'placeholder-title' }, '준비 중입니다.'),
      el('p', {}, [`${role} 담당 파일: `, el('code', {}, file)]),
      note ? el('p', { class: 'muted' }, note) : null,
    ]),
  );
}
