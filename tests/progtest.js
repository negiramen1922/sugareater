// 育成 Model A：全カードで Lv が上がる／Lv10 で進化カードのみ／進化後は打ち止め。
const { load, makeReporter } = require('./harness');
const R = makeReporter('progtest');
const { ev, errors } = load();
ev('startRun()');

// 検証用に knife 1本だけの状態にする。
ev(`state.weapons=[{id:'knife',lv:1,step:0,cd:0,phase:0,burst:0,burstT:0,mods:{dmg:0,count:0,spd:0,area:0}}];`);

// weapon-up 札：Lv も step も 1 上がる。
ev(`applyCard({kind:'weapon-up',id:'knife'})`);
R.eq(ev('state.weapons[0].lv'),   2, 'weapon-up で Lv 1→2');
R.eq(ev('state.weapons[0].step'), 1, 'weapon-up で step 0→1');

// 軸強化札：Lv は上がるが step は上がらない（lvUp 進行は step だけが持つ）。
ev(`applyCard({kind:'mod-dmg',id:'knife'})`);
R.eq(ev('state.weapons[0].lv'),       3, 'mod-dmg でも Lv 2→3');
R.eq(ev('state.weapons[0].mods.dmg'), 1, 'mod-dmg で 威力軸 0→1');
R.eq(ev('state.weapons[0].step'),     1, '軸強化は step を進めない');

// どのカードでも Lv は 10 で頭打ち。
ev(`for(var i=0;i<20;i++) applyCard({kind:'mod-count',id:'knife'});`);
R.eq(ev('state.weapons[0].lv'), 10, 'Lv は 10 で頭打ち');

// Lv10：その武器の選択肢は進化カードのみ。
R.eq(ev(`buildChoicePool().filter(c=>c.id==='knife').map(c=>c.kind).join(',')`),
     'evolve', 'Lv10 は進化カードのみ');
R.ok(ev(`evolvableWeapons().some(w=>w.id==='knife')`), 'Lv10 で進化可能');

// Lv9 では進化はまだ出ない（境界確認）。
ev(`state.weapons=[{id:'knife',lv:9,step:7,cd:0,phase:0,burst:0,burstT:0,mods:{dmg:0,count:0,spd:0,area:0}}];`);
R.ok(ev(`!evolvableWeapons().some(w=>w.id==='knife')`), 'Lv9 では進化不可');
R.ok(ev(`buildChoicePool().filter(c=>c.id==='knife').every(c=>c.kind!=='evolve')`),
     'Lv9 では進化カードは出ない');

// 進化したら、その武器のカードは一切出ない（打ち止め）。
ev(`state.weapons=[{id:'knife',lv:10,step:7,evolved:true,cd:0,phase:0,burst:0,burstT:0,mods:{dmg:0,count:0,spd:0,area:0}}];`);
R.eq(ev(`buildChoicePool().filter(c=>c.id==='knife').length`), 0, '進化後はカードを出さない');

// ボスHP全体2倍（BOSS_HP_SCALE 5.0）。
R.eq(ev('BOSS_HP_SCALE'), 5, 'BOSS_HP_SCALE は 5.0（2倍）');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
