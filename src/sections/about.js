// 역할 A: 팀 소개
// 담당 파일: 이 파일 하나. data는 src/data/team.json 배열이다.
// 완성 목표: 팀원마다 이름, 역할, 관심 분야, GitHub 링크를 담은 카드를 그리드로 보여 준다.
import { placeholder } from '../lib/dom.js';

export const meta = { id: 'about', title: '팀 소개', source: 'team.json' };

export function render(root, data) {
  // TODO(역할 A): 아래 자리표시자를 지우고 data의 각 항목을 카드로 그린다.
  // 도움말: ../lib/dom.js의 el()과 base.css의 .grid, .profile 클래스를 쓴다.
  const count = Array.isArray(data) ? data.length : 0;
  placeholder(root, {
    role: '역할 A',
    file: 'src/sections/about.js',
    note: `team.json에 ${count}명의 카드 데이터가 준비되어 있습니다.`,
  });
}
