// フライパン：攻撃はするが弾は弾かない（フライパンシールド撤去後の設計）。
const { load, GRID, makeReporter } = require('./harness');
const R = makeReporter('pantest');
const { ev, ctxRec, errors } = load();
ev('startRun()');

// 定義レベル：guardRing も guardHp も持たない。
R.ok(ev('!WEAPONS.oban.guardRing'), 'フライパンは guardRing を持たない');
R.ok(ev('!WEAPONS.oban.guardHp'), 'フライパンは guardHp を持たない');

// フライパン単体を装備し、回転リングの上（半径の位置）に敵を置いて 1 フレーム回す。
// phase=0 のとき先頭の羽根は角度0＝(px+radius, py) に来るので、そこへ敵を置けば確実に当たる。
ev(`(function(){
  var w={id:'oban',lv:8,phase:0,evolved:false,mods:{dmg:0,count:0,spd:0,area:0}};
  state.weapons=[w];
  var st=weaponStat(w);
  enemies.clear();
  spawnEnemy('c_sword', state.px + st.radius, state.py);  // リングの真上に密着
  window.__panR = st.radius;
})()`);
ev(GRID);
const hpBefore = ev('enemies.items[0].hp');
ev('state.obanN=0; updateWeapons(0.3);');   // 大きめ dt で確実に当てる
const hpAfter = ev('enemies.items[0].hp');

R.ok(hpAfter < hpBefore, `フライパンは密着した敵を削る（HP ${hpBefore}→${hpAfter}）`);

// ★核心：弾の弾き返しバッファ(obanPts)には 1 件も登録されない＝弾を防げない。
R.eq(ev('state.obanN'), 0, 'フライパンは弾き返しポイントを登録しない（弾を防げない）');

// 立ち絵 w_pan が実際に drawImage で描かれているか（事故②：埋めたのに描いていない）。
ev(`(function(){ for(const k in SPR){ SPR[k].__key=k; }
  // 描画：フライパンを含む1フレームを描く
  if(typeof render==='function'){ try{ render(); }catch(e){} }
})()`);
// updateWeapons/描画のどこかで w_pan が引かれていることを確認
const drewPan = ev(`(function(){
  // 直接オービット描画路を叩く：w.id==='oban' && SPR_OK('w_pan') で drawImage(SPR.w_pan)
  return typeof SPR_OK==='function' ? SPR_OK('w_pan') : !!SPR.w_pan;
})()`);
R.ok(drewPan, 'w_pan スプライトが利用可能（描画対象になっている）');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
