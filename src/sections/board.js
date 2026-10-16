// 역할 B: 할 일 보드
// 담당 파일: 이 파일 하나. 데이터 파일은 없고 브라우저 localStorage에 저장한다.
// 완성 목표: 할 일 추가, 완료 표시, 삭제가 되고 새로고침 후에도 목록이 남는다.
import { placeholder } from '../lib/dom.js';

export const meta = { id: 'board', title: '할 일 보드' };

// 저장 키는 다른 섹션과 겹치지 않게 이 값을 쓴다.
export const STORAGE_KEY = 'vibe-team-lab:board';

export function render(root) {
  // TODO(역할 B): 입력창과 추가 버튼, 할 일 목록을 그리고 localStorage(STORAGE_KEY)에 저장한다.
  // 도움말: base.css의 .field-row, .input, .btn, .list, .list-item, .is-done 클래스를 쓴다.
  placeholder(root, {
    role: '역할 B',
    file: 'src/sections/board.js',
    note: '할 일은 브라우저 localStorage에 저장합니다.',
  });
}
