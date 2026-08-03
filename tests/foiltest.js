// アルミホイル進化「雷雲のシート」：本数は「数」だけで増える（進化での上乗せ廃止）。
// 進化は「減衰ゼロ・連鎖増・威力増」を与える。
const { load, makeReporter } = require('./harness');
const R = makeReporter('foiltest');
const { ev } = load();
ev('startRun()');

// 進化の内容：falloff を 1.0（減衰しない）にセット、chains は加算 +5、dmg は倍率。
R.ok(ev("WEAPONS.foil.evo.set && WEAPONS.foil.evo.set.falloff===1.0"), '進化は falloff=1.0（減衰ゼロ）をセット');
R.eq(ev('WEAPONS.foil.evo.mul.chains'), 5, '進化は連鎖 +5');
R.ok(ev('WEAPONS.foil.evo.mul.dmg>1'), '進化は威力倍率を持つ');

// ★核心：進化の mul に count が無い＝本数を無償で増やさない。
R.ok(ev("!('count' in WEAPONS.foil.evo.mul)"), '進化 mul に count が無い（本数の無償ボーナスは廃止）');

// 実効値でも確認：同じ Lv・同じ mods なら、進化しても本数(count)は変わらない。
function countOf(evolved, area, cnt) {
  return ev(`(function(){ if(META.wp.foil) META.wp.foil.lv=0;
    var w={id:'foil',lv:8,evolved:${evolved},mods:{dmg:0,count:${cnt},spd:0,area:${area}}};
    return Math.round(weaponStat(w).count); })()`);
}
R.eq(countOf(true, 0, 0), countOf(false, 0, 0), '進化しても本数は増えない（0段）');
R.eq(countOf(true, 0, 2), countOf(false, 0, 2), '進化しても本数は増えない（数+2段でも同数）');
R.ok(countOf(false, 0, 2) > countOf(false, 0, 0), '本数は「数」の強化でだけ増える');

// falloff：素は 0.74、進化後は 1.0（＝跳ねても減衰しない）。
R.near(ev("WEAPONS.foil.falloff"), 0.74, 0.001, '素の falloff は 0.74');
const evoFall = ev(`(function(){ if(META.wp.foil) META.wp.foil.lv=0;
  var w={id:'foil',lv:8,evolved:true,mods:{dmg:0,count:0,spd:0,area:0}};
  return weaponStat(w).falloff; })()`);
R.near(evoFall, 1.0, 0.001, '進化後の falloff は 1.0（減衰ゼロ）');

// 連鎖数は進化で増える。
const chNo = ev(`(function(){ if(META.wp.foil) META.wp.foil.lv=0;
  var w={id:'foil',lv:8,evolved:false,mods:{dmg:0,count:0,spd:0,area:0}};
  return Math.round(weaponStat(w).chains); })()`);
const chYes = ev(`(function(){ if(META.wp.foil) META.wp.foil.lv=0;
  var w={id:'foil',lv:8,evolved:true,mods:{dmg:0,count:0,spd:0,area:0}};
  return Math.round(weaponStat(w).chains); })()`);
R.ok(chYes > chNo, `進化で連鎖が増える（${chNo}→${chYes}）`);

R.done();
