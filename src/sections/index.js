// 섹션 목록 (공용 파일, 수정 금지)
// 화면에는 아래 배열 순서대로 그려진다. 각 역할은 자기 섹션 파일만 고친다.
import * as about from './about.js';
import * as board from './board.js';
import * as schedule from './schedule.js';
import * as theme from './theme.js';
import * as notice from './notice.js';

export const sections = [about, board, schedule, theme, notice];
