// 読み込みと基本操作で JS エラーが出ないか（資料の errtest 相当）。
const { load, GRID, makeReporter } = require('./harness');
const R = makeReporter('errtest');

const { ev, errors } = load();

// 読み込み直後
R.ok(errors.length === 0, '読み込みで JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));

// 主要なグローバルが生きているか
R.ok(ev('typeof WEAPONS') === 'object', 'WEAPONS がある');
R.ok(ev('typeof state') === 'object', 'state がある');
R.ok(ev('typeof grid') === 'object', 'grid がある');
R.ok(ev('typeof updateWeapons') === 'function', 'updateWeapons がある');
R.ok(ev('typeof spawnEnemy') === 'function', 'spawnEnemy がある');
R.ok(ev('typeof hitEnemy') === 'function', 'hitEnemy がある');
R.ok(ev('typeof startRun') === 'function', 'startRun がある');

// 出撃してワンフレーム回す
ev('startRun()');
R.ok(ev('state.mode') === 'play', '出撃で play に入る');
ev(GRID + ' updateWeapons(0.016);');
ev(GRID + ' updateZones(0.016);');
R.ok(errors.length === 0, '出撃＋更新で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));

// 敵を出して当てても落ちない
ev("spawnEnemy('c_sword', state.px+80, state.py); spawnEnemy('c_sword', state.px+90, state.py+10);");
ev(GRID + ' updateWeapons(0.05); updateZones(0.05);');
R.ok(errors.length === 0, '敵を出して更新しても JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));

R.done();
