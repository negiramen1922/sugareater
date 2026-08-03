// 立ち絵・スプライト（事故②：埋め込んだのに描画から参照していない、の検出）。
const { load, GRID, makeReporter } = require('./harness');
const R = makeReporter('sprtest');
const { ev, win, ctxRec, errors } = load();

// 1) 武器スプライトの整合：全武器の spr キーが SPRITE_SRC に実在する（宙ぶらりんな参照が無い）。
//    ※敵/エフェクトは SPR[e.spr] や 'dog_'+ab のような計算参照で描かれ、静的には追えないので、
//      ここでは今回の変更が触る「武器スプライト」に絞って整合を確認する。
const keys = ev('Object.keys(SPRITE_SRC)');
const badWeaponSpr = ev(`Object.values(WEAPONS).filter(w=>w.spr && !SPRITE_SRC[w.spr]).map(w=>w.id+':'+w.spr)`);
R.ok(badWeaponSpr.length === 0, '全武器の spr が SPRITE_SRC に実在する' + (badWeaponSpr.length ? ' → ' + badWeaponSpr.join(',') : ''));

// w_pan は残っている（フライパンが使う）。lid 撤去で孤児化していない＝oban が今も参照。
R.ok(keys.includes('w_pan'), 'w_pan スプライトが存在する');
R.ok(ev("WEAPONS.oban.spr==='w_pan'"), 'w_pan はフライパン(oban)から参照されている');
R.ok(ev("SPR_OK('w_pan')"), 'w_pan は描画可能（complete && naturalWidth）');

// 2) 実際に描く：フライパンを装備してプレイ画面を1フレーム描画し、drawImage に w_pan が来るか。
ev('startRun()');
ev(`(function(){
  var w={id:'oban',lv:8,phase:0.3,evolved:false,mods:{dmg:0,count:0,spd:0,area:0}};
  state.weapons=[w];
  for(const k in SPR){ SPR[k].__key=k; }
})()`);
ev(GRID);
ctxRec.drawImage.length = 0;
ev('try{ render(); }catch(e){ window.__renderErr=String(e); }');
R.ok(!ev('window.__renderErr'), 'render() が例外なく走る' + (ev('window.__renderErr') ? ' → ' + ev('window.__renderErr') : ''));
R.ok(ctxRec.drawImage.includes('w_pan'), 'render で w_pan が実際に drawImage される');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
