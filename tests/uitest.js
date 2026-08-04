// 厨房UIの再構成が壊れていないか（各タブの描画・武器解放・詳細パネル）。
//   ・武器/強化/出撃/キャラ の各タブが JS エラーなく描ける
//   ・武器はシュガーで解放できる（設計図ではない）
//   ・強化ショップ・キャラ詳細が描ける
const { load, makeReporter } = require('./harness');
const R = makeReporter('uitest');
const { ev, errors } = load();

// 各タブを描画してエラーが出ないこと。
for(const tab of ['home','wp','shop','ch']){
  ev(`kTab='${tab}'; renderKitchen();`);
  R.ok(errors.length===0, `${tab} タブが描ける` + (errors.length?' → '+errors[0]:''));
}

// 強化タブは SHOP を全部並べる。
ev("kTab='shop'; renderKitchen();");
R.ok(ev("$('k-list').innerHTML.length>0"), '強化タブに項目が並ぶ');

// 武器詳細：未解放はシュガー解放ボタン、解放済みは編成ボタン。
R.ok(ev("detailWeapon('pepper').includes('buyW')"), '未解放武器はシュガー解放ボタン(buyW)');
R.ok(ev("!detailWeapon('pepper').includes('upW')"), '武器レベル強化ボタン(upW)は無い');
R.ok(ev("detailWeapon('knife').includes('addW')||detailWeapon('knife').includes('delW')"),
     '解放済み武器は編成ボタン');

// 武器解放：シュガーを払って own=1、編成に自動追加。
ev("META.sugar=100000; META.wp.pepper.own=0; var i=META.loadout.indexOf('pepper'); if(i>=0)META.loadout.splice(i,1);");
ev("var okW=buyWeapon('pepper');");
R.eq(ev('okW'), true, 'シュガーで武器を解放できる');
R.eq(ev("META.wp.pepper.own"), 1, '解放で own=1');
R.ok(ev("META.loadout.indexOf('pepper')>=0"), '解放した武器は編成に入る');
// 解放済みは unlockCost が null。
R.eq(ev("weaponUnlockCost('pepper')"), null, '解放済みは解放コスト null');

// キャラ：chef は初期解放（全開）、他はシュガーで解放。
R.ok(ev("META.ch.chef.lv>0"), 'chef は初期解放');
R.ok(ev("detailChar('glutton').includes('upC')||META.ch.glutton.lv>0"), '未解放キャラは解放ボタン(upC)');
ev("META.sugar=100000; if(META.ch.glutton.lv<=0){ upgradeChar('glutton'); }");
R.eq(ev("META.ch.glutton.lv"), ev('CHAR_MAX_LV'), '解放したキャラは全開(CHAR_MAX_LV)');

// ステージ解放はクリア制：1面は常に開く、2面は1面クリアで開く。
ev("META.cleared={};");
const stageList = ev("Object.values(STAGES).sort((a,b)=>a.idx-b.idx).map(s=>s.id)");
ev("kTab='home'; renderKitchen();");
R.ok(ev("$('k-stages').innerHTML.includes('前の面をクリアで解放')"), '未クリアの先の面はロック表示');
// 1面をクリア扱いにすると2面が開く。
ev(`META.cleared['${stageList[0]}']=true; renderStages();`);
R.ok(ev(`(function(){var b=$('k-stages').querySelector('[data-id=\\'${stageList[1]}\\']'); return b && !b.disabled;})()`),
     '1面クリアで2面が解放される');

R.ok(errors.length === 0, '一連の描画で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
