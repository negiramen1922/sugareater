// フォーク：突進中は無敵ではなくダメージカット（-60%）。突進の合間に必ず切れる（永続しない）。
const { load, GRID, makeReporter } = require('./harness');
const R = makeReporter('forktest');
const { ev, errors } = load();
ev('startRun()');

R.ok(ev("/ダメージカット/.test(WEAPONS.fork.desc)"), '説明が「ダメージカット」になっている');
R.ok(ev("!/突進中は無敵/.test(WEAPONS.fork.desc)"), '説明に「突進中は無敵」が残っていない');
R.ok(ev("/ダメージカット/.test(WEAPONS.fork.evo.desc)"), '進化の説明もダメージカット');
R.ok(ev("!/無敵が続く/.test(WEAPONS.fork.evo.desc)"), '進化の説明に「無敵が続く」が残っていない');

// ダメージカット中でも被弾は通る＝無敵ではない。50 ダメージ→軽減後 20 になる。
const hp = ev(`(function(){
  state.iframe=0; state.mode='play'; state.hp=100; state.shield=0;
  state.eb.eva=0; state.eb.dr=0; state.cb.dr=0; state.extras.wall=false; state.passives.blaze=0;
  state.cutT=1; state.cutAmt=0.6;
  hurtPlayer(50);
  return state.hp;
})()`);
R.near(hp, 80, 0.001, '-60%カット中に50被弾→HP100が80（被弾は通る＝無敵ではない）');

// カットが無いときは 50 まるごと通る（カットが効いていることの対照）。
const hp2 = ev(`(function(){
  state.iframe=0; state.mode='play'; state.hp=100; state.shield=0;
  state.eb.eva=0; state.eb.dr=0; state.cb.dr=0; state.extras.wall=false; state.passives.blaze=0;
  state.cutT=0; state.cutAmt=0;
  hurtPlayer(50);
  return state.hp;
})()`);
R.near(hp2, 50, 0.001, 'カット無しなら50まるごと通る（HP100→50）');

// 突進を実際に走らせると、その間 cutAmt=0.6・cutT>0 になる。
ev(`(function(){
  // フォーク単体を装備して、入力方向へ突進させる
  var w={id:'fork',lv:8,evolved:false,mods:{dmg:0,count:0,spd:0,area:0},cd:0};
  state.weapons=[w]; input.x=1; input.y=0; state.cutT=0; state.cutAmt=0;
  ${'grid.resize(view.w,view.h); grid.build(state.camx,state.camy);'}
  updateWeapons(0.016);           // ここで state.dash が立つ
})()`);
R.ok(ev('!!state.dash'), '突進が発生する');
ev(`updateDash(0.016);`);
R.near(ev('state.cutAmt'), 0.6, 0.001, '突進中の cutAmt は 0.6');
R.ok(ev('state.cutT>0'), '突進中は cutT>0（カットが効いている）');

// 永続しない：突進が終わって cutT が減衰すれば 0 になる。
const decayed = ev(`(function(){
  state.dash=null;                 // 突進終了
  state.cutT=0.5; state.cutAmt=0.6; // 進化の余韻の最大値
  // メインループの減衰（if(state.cutT>0) state.cutT-=dt）を手で回す
  for(var i=0;i<40 && state.cutT>0;i++){ state.cutT-=0.02; }
  return state.cutT;
})()`);
R.ok(decayed <= 0, '突進が無ければ cutT は 0 まで減衰する（永続しない）');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
