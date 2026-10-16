#!/usr/bin/env node
// 팀 허브 검사 스크립트
// 사용법: node scripts/check.mjs   (외부 의존성 없음, Node 20.19 이상)
// 하나라도 실패하면 종료 코드 1로 끝난다. CI(job 이름 check)도 이 스크립트를 실행한다.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SECTIONS_DIR = join(ROOT, 'src', 'sections');
const DATA_DIR = join(ROOT, 'src', 'data');
const REQUIRED_TEAM_KEYS = ['name', 'role', 'focus', 'github'];
const GITHUB_ID = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const CONFLICT_MARKER = /^(<{7}|={7}|>{7})(?: |$)/m;
const IN_CI = process.env.GITHUB_ACTIONS === 'true';

const results = { pass: 0, fail: 0, warn: 0 };

const rel = (file) => relative(ROOT, file).split(sep).join('/');

function pass(message) {
  results.pass += 1;
  console.log(`[통과] ${message}`);
}

function fail(file, message) {
  results.fail += 1;
  console.log(`[실패] ${file}: ${message}`);
  if (IN_CI) console.log(`::error file=${file}::${message}`);
}

function warn(file, message) {
  results.warn += 1;
  console.log(`[주의] ${file}: ${message}`);
  if (IN_CI) console.log(`::warning file=${file}::${message}`);
}

function readText(file) {
  return readFileSync(file, 'utf8');
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// JSON 문법 오류가 처음 생긴 위치(문자 번호)를 찾는다. Node 버전마다 오류 메시지 형식이 달라 직접 훑는다.
function findJsonErrorOffset(text) {
  let i = 0;
  const skip = () => {
    while (i < text.length && /\s/.test(text[i])) i += 1;
  };
  const value = () => {
    skip();
    const ch = text[i];
    if (ch === '{') return object();
    if (ch === '[') return array();
    if (ch === '"') return string();
    const literal = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(text.slice(i));
    if (!literal) throw i;
    i += literal[0].length;
  };
  const string = () => {
    i += 1;
    while (i < text.length && text[i] !== '"') {
      if (text[i] === '\n') throw i;
      i += text[i] === '\\' ? 2 : 1;
    }
    if (i >= text.length) throw i;
    i += 1;
  };
  const list = (close, item) => {
    i += 1;
    skip();
    if (text[i] === close) {
      i += 1;
      return;
    }
    for (;;) {
      item();
      skip();
      if (text[i] === ',') {
        i += 1;
        skip();
        if (text[i] === close) throw i; // 마지막 항목 뒤 쉼표
        continue;
      }
      if (text[i] === close) {
        i += 1;
        return;
      }
      throw i; // 쉼표가 빠졌거나 괄호가 맞지 않음
    }
  };
  const object = () =>
    list('}', () => {
      skip();
      if (text[i] !== '"') throw i;
      string();
      skip();
      if (text[i] !== ':') throw i;
      i += 1;
      value();
    });
  const array = () => list(']', value);
  try {
    value();
    skip();
    return i < text.length ? i : -1;
  } catch (offset) {
    return typeof offset === 'number' ? offset : -1;
  }
}

function describeJsonError(text, error) {
  const offset = findJsonErrorOffset(text);
  if (offset < 0) return `(원문: ${error.message})`;
  const before = text.slice(0, offset);
  const line = before.split('\n').length;
  const column = offset - before.lastIndexOf('\n');
  const lineText = text.split('\n')[line - 1]?.trim() ?? '';
  return `${line}행 ${column}열 근처("${lineText}")를 확인하십시오. 항목 사이 쉼표, 마지막 항목 뒤 쉼표, 따옴표와 괄호가 흔한 원인입니다.`;
}

// 1. 병합 충돌 표시가 남아 있는지
function checkConflictMarkers() {
  const files = [join(ROOT, 'index.html'), ...walk(join(ROOT, 'src'))].filter((file) =>
    /\.(html|js|css|json)$/.test(file),
  );
  let found = false;
  for (const file of files) {
    const text = readText(file);
    const match = CONFLICT_MARKER.exec(text);
    if (match) {
      found = true;
      const line = text.slice(0, match.index).split('\n').length;
      fail(rel(file), `${line}행에 병합 충돌 표시(${match[1]})가 남아 있습니다. 두 변경을 모두 반영한 뒤 표시 줄을 지우십시오.`);
    }
  }
  if (!found) pass('병합 충돌 표시 없음');
}

// 2. index.html에 #app과 모듈 스크립트가 있는지
function checkIndexHtml() {
  const file = join(ROOT, 'index.html');
  if (!existsSync(file)) {
    fail('index.html', '파일이 없습니다.');
    return;
  }
  const html = readText(file);
  if (/<main[^>]*\bid\s*=\s*["']app["']/i.test(html)) pass('index.html에 <main id="app"> 있음');
  else fail('index.html', '<main id="app"> 요소가 없습니다. index.html은 공용 파일이므로 원래대로 되돌리십시오.');
  if (/<script[^>]*type\s*=\s*["']module["'][^>]*src\s*=\s*["'][^"']*src\/app\.js["']/i.test(html)) {
    pass('index.html이 src/app.js를 모듈로 불러옴');
  } else {
    fail('index.html', '<script type="module" src="src/app.js"> 태그가 없습니다.');
  }
}

// 3. 데이터 JSON 파싱과 team.json 규칙
function checkData() {
  const files = walk(DATA_DIR).filter((file) => file.endsWith('.json'));
  if (files.length === 0) fail('src/data', 'JSON 파일이 없습니다.');
  const parsed = new Map();
  for (const file of files) {
    const text = readText(file);
    try {
      parsed.set(basename(file), JSON.parse(text));
      pass(`JSON 파싱: ${rel(file)}`);
    } catch (error) {
      fail(rel(file), `JSON 문법 오류입니다. ${describeJsonError(text, error)}`);
    }
  }
  checkTeam(parsed.get('team.json'), parsed.has('team.json') || !existsSync(join(DATA_DIR, 'team.json')));
}

function checkTeam(team, parsedOk) {
  const file = 'src/data/team.json';
  if (!existsSync(join(DATA_DIR, 'team.json'))) {
    fail(file, '파일이 없습니다.');
    return;
  }
  if (!parsedOk) return; // 파싱 실패는 위에서 이미 보고했다
  if (!Array.isArray(team)) {
    fail(file, '최상위 값은 배열([ ... ])이어야 합니다.');
    return;
  }
  const seen = new Map();
  let ok = true;
  team.forEach((member, index) => {
    const label = `${index + 1}번째 카드`;
    if (member === null || typeof member !== 'object' || Array.isArray(member)) {
      fail(file, `${label}는 객체({ ... })여야 합니다.`);
      ok = false;
      return;
    }
    const who = typeof member.name === 'string' && member.name.trim() ? `${label}(${member.name})` : label;
    for (const key of REQUIRED_TEAM_KEYS) {
      if (typeof member[key] !== 'string' || member[key].trim() === '') {
        fail(file, `${who}에 "${key}" 값이 없거나 비어 있습니다. 필수 키: ${REQUIRED_TEAM_KEYS.join(', ')}`);
        ok = false;
      }
    }
    if (typeof member.github === 'string' && member.github.trim()) {
      const id = member.github.trim().replace(/^@/, '');
      if (!GITHUB_ID.test(id)) {
        fail(file, `${who}의 github 값(${member.github})이 GitHub 아이디 형식이 아닙니다. 주소가 아니라 아이디만 적습니다.`);
        ok = false;
      }
      const key = id.toLowerCase();
      if (seen.has(key)) {
        fail(file, `${who}의 github 아이디(${id})가 ${seen.get(key)}와 중복됩니다.`);
        ok = false;
      } else {
        seen.set(key, who);
      }
    }
  });
  if (ok) pass(`team.json 카드 ${team.length}개: 필수 키와 github 중복 검사`);
}

// 4. 섹션 목록(index.js)과 섹션 파일 일치, 각 섹션의 export 확인
async function checkSections() {
  const indexFile = join(SECTIONS_DIR, 'index.js');
  if (!existsSync(indexFile)) {
    fail('src/sections/index.js', '파일이 없습니다.');
    return;
  }
  const source = readText(indexFile);
  const imports = new Map(); // 변수 이름 -> 파일 이름
  for (const match of source.matchAll(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]\.\/([\w-]+\.js)['"]/g)) {
    imports.set(match[1], match[2]);
  }
  const listMatch = /export\s+const\s+sections\s*=\s*\[([^\]]*)\]/.exec(source);
  if (!listMatch) {
    fail('src/sections/index.js', 'export const sections = [ ... ] 배열을 찾지 못했습니다.');
    return;
  }
  const listed = listMatch[1].split(',').map((name) => name.trim()).filter(Boolean);
  const listedFiles = [];
  let ok = true;
  for (const name of listed) {
    const fileName = imports.get(name);
    if (!fileName) {
      fail('src/sections/index.js', `목록의 "${name}"에 해당하는 import 문이 없습니다.`);
      ok = false;
    } else if (!existsSync(join(SECTIONS_DIR, fileName))) {
      fail('src/sections/index.js', `목록 항목 ${name}에 대응하는 src/sections/${fileName} 파일이 없습니다.`);
      ok = false;
    } else {
      listedFiles.push(fileName);
    }
  }
  const actualFiles = readdirSync(SECTIONS_DIR).filter((name) => name.endsWith('.js') && name !== 'index.js');
  for (const fileName of actualFiles) {
    if (!listedFiles.includes(fileName)) {
      fail(`src/sections/${fileName}`, 'index.js 목록에 없는 섹션 파일입니다. 도우미 코드는 섹션 파일 안에 두십시오.');
      ok = false;
    }
  }
  if (ok) pass(`섹션 목록과 파일 일치: ${listed.join(', ')}`);

  for (const fileName of listedFiles) {
    await checkSectionModule(fileName);
  }
}

async function checkSectionModule(fileName) {
  const file = `src/sections/${fileName}`;
  const full = join(SECTIONS_DIR, fileName);
  const source = readText(full);
  const id = fileName.replace(/\.js$/, '');
  if (!/export\s+(?:async\s+)?function\s+render\s*\(/.test(source)) {
    fail(file, 'export function render(root, data) 함수가 없습니다.');
    return;
  }
  if (!/export\s+const\s+meta\s*=/.test(source)) {
    fail(file, 'export const meta = { id, title, source } 선언이 없습니다.');
    return;
  }

  let mod;
  try {
    mod = await import(pathToFileURL(full).href);
  } catch (error) {
    if (/Cannot use import statement|Unexpected token 'export'/.test(error.message)) {
      warn(file, `현재 Node(${process.version})에서는 모듈 불러오기 검사를 건너뜁니다. Node 22 이상을 권장합니다.`);
      return;
    }
    let hint = '';
    if (error instanceof ReferenceError && /\b(document|window|localStorage|navigator)\b/.test(error.message)) {
      hint = ' 모듈 최상위에서 브라우저 전용 객체를 쓰면 안 됩니다. render 함수 안으로 옮기십시오.';
    }
    fail(file, `모듈을 불러오지 못했습니다. 문법 오류나 잘못된 import 경로를 확인하십시오. (${error.message})${hint}`);
    return;
  }

  const problems = [];
  if (typeof mod.render !== 'function') problems.push('render가 함수가 아닙니다');
  const meta = mod.meta;
  if (!meta || typeof meta !== 'object') {
    problems.push('meta가 객체가 아닙니다');
  } else {
    if (meta.id !== id) problems.push(`meta.id는 파일 이름과 같은 "${id}"여야 합니다`);
    if (typeof meta.title !== 'string' || !meta.title.trim()) problems.push('meta.title이 비어 있습니다');
    if (meta.source !== undefined) {
      if (typeof meta.source !== 'string') {
        problems.push('meta.source는 문자열이어야 합니다');
      } else if (meta.source.endsWith('.json') && !existsSync(join(DATA_DIR, meta.source))) {
        problems.push(`meta.source가 가리키는 src/data/${meta.source} 파일이 없습니다`);
      } else if (!meta.source.endsWith('.json') && meta.source !== 'theme') {
        problems.push('meta.source는 "파일이름.json" 또는 "theme"이어야 합니다');
      }
    }
  }
  if (problems.length > 0) fail(file, `${problems.join('. ')}.`);
  else pass(`섹션 모듈: ${file} (render, meta)`);
}

async function main() {
  console.log('팀 허브 검사를 시작합니다.\n');
  checkConflictMarkers();
  checkIndexHtml();
  checkData();
  await checkSections();

  console.log(`\n결과: 통과 ${results.pass}건, 실패 ${results.fail}건, 주의 ${results.warn}건`);
  if (results.fail > 0) {
    console.log('검사에 실패했습니다. 위의 [실패] 항목을 고친 뒤 다시 실행하십시오.');
    process.exitCode = 1;
  } else {
    console.log('모든 검사를 통과했습니다.');
  }
}

main().catch((error) => {
  console.error('검사 스크립트 자체에서 오류가 발생했습니다.', error);
  process.exitCode = 1;
});
