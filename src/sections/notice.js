// 역할 E: 공지
// 담당 파일: 이 파일 하나. data는 src/data/notices.json 배열이다.
// 완성 목표: 공지를 배너로 보여 주고, 닫기를 누른 공지는 새로고침 후에도 다시 나오지 않게 기억한다.
import { placeholder } from '../lib/dom.js';

export const meta = { id: 'notice', title: '공지', source: 'notices.json' };

// 닫은 공지 id 목록을 저장할 localStorage 키
export const STORAGE_KEY = 'vibe-team-lab:dismissed-notices';

export function render(root, data) {
  // TODO(역할 E): 아래 자리표시자를 지우고 공지를 .banner로 그린다. 닫은 공지 id는 STORAGE_KEY에 저장한다.
  const count = Array.isArray(data) ? data.length : 0;
  placeholder(root, {
    role: '역할 E',
    file: 'src/sections/notice.js',
    note: `notices.json에 공지 ${count}건이 준비되어 있습니다.`,
  });
}
