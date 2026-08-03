// ナイフ：貫通ではなく分裂。強化で分裂数が 0→3 に増える。当たると子ナイフが飛ぶ。
const { load, GRID, makeReporter } = require('./harness');
const R = makeReporter('knifetest');
const { ev, errors } = load();
ev('startRun()');

// 素の定義：pierce は 0（さいばしに任せた）、split の起点は 0。
R.eq(ev('WEAPONS.knife.pierce'), 0, '素のナイフは貫通 0');
R.eq(ev('WEAPONS.knife.split'), 0, '素のナイフは分裂 0');
R.eq(ev('WEAPONS.knife.trait'), '分裂', 'ナイフの特性は分裂');

// レベルアップ札を step 段とったときの分裂数を weaponStat で確認
// （Model A：lvUp の進み具合は w.step が持つ。META 強化の影響を消すため wp.lv=0）。
function splitAt(step) {
  return ev(`(function(){ if(META.wp.knife) META.wp.knife.lv=0;
    var w={id:'knife',lv:1+${step},step:${step},evolved:false,mods:{dmg:0,count:0,spd:0,area:0}};
    return Math.round(weaponStat(w).split); })()`);
}
R.eq(splitAt(0), 0, 'step0 の分裂は 0');
R.eq(splitAt(2), 1, 'step2 の分裂は 1');
R.eq(splitAt(5), 2, 'step5 の分裂は 2');
R.eq(splitAt(7), 3, 'step7（全段）の分裂は 3');

// pierce はレベルを上げても増えない（分裂に置き換わったので）。
R.eq(ev(`(function(){ if(META.wp.knife) META.wp.knife.lv=0;
  var w={id:'knife',lv:8,step:7,evolved:false,mods:{dmg:0,count:0,spd:0,area:0}};
  return weaponStat(w).pierce; })()`), 0, 'step7 でも貫通は 0 のまま');

// spawnKnifeSplit：split=2 のナイフが当たると子ナイフが 2本生まれる。
const spawned = ev(`(function(){
  var p=projs.spawn();
  p.x=state.px; p.y=state.py; p.vx=360; p.vy=0; p.ang=0;
  p.dmg=15; p.split=2; p.pierce=0; p.bounce=0; p.r=7; p.life=1; p.wid=0;
  p.hitIds=new Set(); p.look='';
  var before=projs.n;
  spawnKnifeSplit(p);
  var after=projs.n;
  // 直近に生まれた子を調べる
  window.__child = after>before ? projs.items[after-1] : null;
  return after - before;
})()`);
R.eq(spawned, 2, 'split=2 のナイフから子ナイフが 2本');
R.eq(ev('window.__child.pierce'), 0, '子ナイフの貫通は 0');
R.eq(ev('window.__child.split'), 0, '子ナイフはさらに分裂しない（split 0）');
R.near(ev('window.__child.dmg'), ev('15*0.6'), 0.001, '子ナイフの威力は親の 0.6 倍');

// split=0 のナイフは分裂しない。
const none = ev(`(function(){
  var p={x:state.px,y:state.py,vx:360,vy:0,ang:0,dmg:15,split:0,pierce:0,bounce:0,r:7,life:1,wid:0,hitIds:new Set(),look:''};
  var before=projs.n; spawnKnifeSplit(p); return projs.n-before;
})()`);
R.eq(none, 0, 'split=0 のナイフは分裂しない');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
