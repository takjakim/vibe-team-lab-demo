// 역할 C: 주간 일정
// 담당 파일: 이 파일 하나. data는 src/data/schedule.json 객체({ week, items })다.
// 완성 목표: 요일별로 일정을 묶어 시간순으로 보여 주고, 오늘 요일을 강조한다.
import { placeholder } from '../lib/dom.js';

export const meta = { id: 'schedule', title: '주간 일정', source: 'schedule.json' };

export function render(root, data) {
  // TODO(역할 C): 아래 자리표시자를 지우고 data.items를 요일별 목록으로 그린다.
  // 도움말: base.css의 .day-group, .list, .list-item, .badge 클래스를 쓴다.
  const count = Array.isArray(data?.items) ? data.items.length : 0;
  placeholder(root, {
    role: '역할 C',
    file: 'src/sections/schedule.js',
    note: `schedule.json에 일정 ${count}건이 준비되어 있습니다.`,
  });
}
