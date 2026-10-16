// 역할 C: 주간 일정
// 담당 파일: 이 파일 하나. data는 src/data/schedule.json 객체({ week, items })다.
// 요일별로 일정을 묶어 시간순으로 보여 주고, 오늘 요일을 강조한다.
import { el } from '../lib/dom.js';

export const meta = { id: 'schedule', title: '주간 일정', source: 'schedule.json' };

const DAYS = ['월', '화', '수', '목', '금'];
const DAY_BY_INDEX = ['일', '월', '화', '수', '목', '금', '토']; // Date.getDay() 순서

// "9:00", "10:30" 같은 시각을 분 단위 숫자로 바꾼다. 형식이 아니면 맨 뒤로 보낸다.
function toMinutes(time) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? '').trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.POSITIVE_INFINITY;
}

// 시각 오름차순 비교. 둘 다 형식이 아니면 원래 순서를 유지한다.
function byTime(a, b) {
  const diff = toMinutes(a.time) - toMinutes(b.time);
  return Number.isNaN(diff) ? 0 : diff;
}

export function render(root, data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const today = DAY_BY_INDEX[new Date().getDay()];

  const groups = DAYS.map((day) => {
    // 같은 요일 항목을 시각 오름차순으로 정렬한다. 문자열 비교는 9:00을 10:00 뒤에 두므로 숫자로 비교한다.
    const dayItems = items.filter((item) => item.day === day).sort(byTime);

    const body = dayItems.length
      ? el(
          'ul',
          { class: 'list' },
          dayItems.map((item) =>
            el('li', { class: 'list-item' }, [
              el('strong', {}, item.time),
              el('span', { class: 'grow' }, item.title),
              el('span', { class: 'badge' }, item.owner),
            ]),
          ),
        )
      : el('p', { class: 'muted' }, '일정 없음');

    return el('div', { class: day === today ? 'day-group is-today' : 'day-group' }, [
      el('h3', {}, day === today ? `${day}요일 (오늘)` : `${day}요일`),
      body,
    ]);
  });

  root.replaceChildren(el('p', { class: 'muted' }, data?.week ?? ''), ...groups);
}
