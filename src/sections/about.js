// 역할 A: 팀 소개
// 담당 파일: 이 파일 하나. data는 src/data/team.json 배열이다.
import { el } from '../lib/dom.js';

export const meta = { id: 'about', title: '팀 소개', source: 'team.json' };

// 팀원 한 명을 카드로 만든다.
function card(member) {
  const github = String(member.github ?? '').trim();
  return el('article', { class: 'profile' }, [
    el('h3', {}, member.name),
    el('p', {}, el('span', { class: 'badge' }, member.role)),
    el('p', {}, member.focus),
    github
      ? el(
          'p',
          {},
          el(
            'a',
            {
              href: `https://github.com/${encodeURIComponent(github)}`,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            `GitHub: ${github}`,
          ),
        )
      : null,
  ]);
}

export function render(root, data) {
  const members = Array.isArray(data) ? data : [];
  if (members.length === 0) {
    root.replaceChildren(el('p', { class: 'empty' }, '아직 등록된 팀원이 없습니다.'));
    return;
  }
  root.replaceChildren(el('div', { class: 'grid' }, members.map(card)));
}
