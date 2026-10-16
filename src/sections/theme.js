// 역할 D: 테마 설정
// 담당 파일: 이 파일과 src/styles/theme.css.
// data는 app.js가 넘겨 주는 테마 훅이다.
//   data.getPreference() -> 'system' | 'light' | 'dark'
//   data.getCurrent()    -> 'light' | 'dark'
//   data.set(값), data.toggle(), data.onChange(fn)
// 완성 목표: 시스템 설정 따르기, 라이트, 다크 중 하나를 고르는 선택지를 보여 주고
//           theme.css에 다크 모드 색 변수를 채워 실제로 색이 바뀌게 한다.
import { placeholder } from '../lib/dom.js';

export const meta = { id: 'theme', title: '테마', source: 'theme' };

export function render(root, data) {
  // TODO(역할 D): 아래 자리표시자를 지우고 테마 선택 UI를 그린다.
  const current = data?.getCurrent ? data.getCurrent() : 'light';
  placeholder(root, {
    role: '역할 D',
    file: 'src/sections/theme.js, src/styles/theme.css',
    note: `현재 적용된 테마 값은 ${current}입니다. 다크 모드 색은 theme.css에서 정의합니다.`,
  });
}
