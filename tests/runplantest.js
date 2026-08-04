// 時間駆動の長いラン（約5分ごとにボス）が正しく組めているか。
//   ・buildRunPlan：区切りの数だけボスが入り、最後はステージボス
//   ・サバイバル小ウェーブは score を持たない（時間だけで進む）
//   ・startRun が state.plan を用意し、planOf がそれを使う
//   ・ボスは出るたびタフになる（BOSS_TIME_GROWTH）
const { load, GRID, makeReporter } = require('./harness');
const R = makeReporter('runplantest');
const { ev, errors } = load();

// intro は segments:3。プラン = 5小ウェーブ×3 + ボス3 = 18、ボスは index 5/11/17。
const introLen = ev('buildRunPlan(STAGES.intro).length');
R.eq(introLen, 18, 'intro プラン長は 5×3 + ボス3 = 18');
R.eq(ev("buildRunPlan(STAGES.intro).filter(w=>w.boss).length"), 3, 'intro はボス3体（segments:3）');
R.eq(ev("buildRunPlan(STAGES.intro).filter(w=>w.boss).pop().boss"), 'stage', '最後のボスはステージボス');
R.eq(ev("buildRunPlan(STAGES.intro).slice(0,-1).filter(w=>w.boss&&w.boss==='stage').length"), 0,
     'ステージボスは最後だけ（途中は mid）');

// 既定は 6 区切り＝ボス6体。
R.eq(ev("buildRunPlan(STAGES.kitchen).filter(w=>w.boss).length"), ev('RUN_SEGMENTS_DEFAULT'),
     '既定ステージはボス RUN_SEGMENTS_DEFAULT 体');

// サバイバル小ウェーブは score を持たない＝時間だけで進む。time は持つ。
R.ok(ev("buildRunPlan(STAGES.intro).filter(w=>!w.boss).every(w=>w.score===undefined && w.time>0)"),
     'ザコ小ウェーブは score なし・time あり（時間駆動）');
// 密度・種類は時間とともに増える（最初 < 最後）。
R.ok(ev("(function(){var p=buildRunPlan(STAGES.kitchen).filter(w=>!w.boss);return p[0].cap < p[p.length-1].cap && p[0].types <= p[p.length-1].types;})()"),
     '後半ほど cap（密度）が高い');
// 種類はロスターの数を超えない。
R.ok(ev("(function(){var p=buildRunPlan(STAGES.intro).filter(w=>!w.boss);var r=STAGES.intro.order.length;return p.every(w=>w.types<=r&&w.types>=1);})()"),
     'types はロスター内に収まる');

// startRun が state.plan を用意し、planOf がそれを返す。
ev("STAGE=STAGES.intro; startRun();");
R.eq(ev('state.plan.length'), 18, 'startRun で state.plan が生成される');
R.ok(ev('planOf()===state.plan'), 'planOf は生成プランを使う');
R.eq(ev('state.bossSpawned'), 0, 'ラン開始時 bossSpawned は 0');

// ボスは出るたびタフに：同じ中ボスを2回出すと HP 比 ≒ BOSS_TIME_GROWTH。
ev(GRID + " STAGE=STAGES.intro; startRun(); spawnBoss('mid');");
const hp1 = ev('state.bossRef.maxhp');
ev("spawnBoss('mid');");
const hp2 = ev('state.bossRef.maxhp');
const growth = ev('BOSS_TIME_GROWTH');
R.ok(Math.abs(hp2/hp1 - growth) < 0.03, `2体目のボスは約${growth}倍タフ（${hp1}→${hp2}）`);
R.eq(ev('state.bossSpawned'), 2, 'ボスを2体出したら bossSpawned は 2');

// timeToNextBoss：開始直後は最初の区切り（5小ウェーブ×60秒 ≒ 300秒）に近い。
ev("STAGE=STAGES.intro; startRun();");
const ttb = ev('timeToNextBoss()');
R.ok(ttb > 240 && ttb <= 300, `開始直後のボスまで残りは約5分（${ttb}秒）`);
R.eq(ev('fmtClock(125)'), '2:05', 'fmtClock は M:SS');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
