// 装備・メタLvの中立化と、強化ショップ（アカウント共通・フラット）の健全性。
//   ・gear 由来の指数スケールは撤去（equipEffLv=0 / playerAtkMul=1）
//   ・武器メタLv は weaponStat に影響しない（強さはラン内のみ）
//   ・shopBonus は購入ランクを合計し、buyShop がシュガーを消費してランクを上げる
const { load, makeReporter } = require('./harness');
const R = makeReporter('shoptest');
const { ev, errors } = load();
ev('startRun()');

// --- 中立化 ---
R.eq(ev('equipEffLv()'), 0, 'gear 実効Lvは常に0');
R.eq(ev('playerAtkMul()'), 1, 'playerAtkMul は 1（gearで伸びない）');

// 武器メタLv は weaponStat を動かさない（step は動かす）。
ev("var W={id:'knife',lv:1,step:0,mods:{dmg:0,count:0,spd:0,area:0}};");
ev("META.wp.knife.lv=0; var d0=weaponStat(W).dmg;");
ev("META.wp.knife.lv=10; var d10=weaponStat(W).dmg;");
R.eq(ev('d0===d10'), true, '武器メタLvを上げても weaponStat.dmg は不変');

// --- 強化ショップ ---
R.ok(ev('SHOP_LIST.length>=6'), 'ショップ項目が6以上ある');
ev("for(const id of SHOP_LIST) META.shop[id]=0;");
R.eq(ev("shopBonus().atk"), 0, '未購入なら火力ボーナス0');

// 火力を1ランク買う：シュガー消費・ランク+1・ボーナス反映。
ev("META.sugar=100000;");
ev("var before=META.sugar; var cost=shopCost('atk'); var okBuy=buyShop('atk');");
R.eq(ev('okBuy'), true, '火力を購入できる');
R.eq(ev("META.shop.atk"), 1, '購入でランク 0→1');
R.eq(ev("shopBonus().atk"), ev('SHOP.atk.per'), 'ボーナスに per ぶん反映');
R.eq(ev("before-META.sugar"), ev('cost'), 'シュガーが cost ぶん減る');

// 上限まで買うと shopCost は null（打ち止め）。
ev("META.sugar=1e9; for(var i=0;i<20;i++) buyShop('atk');");
R.eq(ev("META.shop.atk"), ev('SHOP.atk.max'), 'ランクは max で頭打ち');
R.eq(ev("shopCost('atk')"), null, '上限では shopCost は null');

// シュガー不足なら買えない。
ev("META.sugar=0;");
R.eq(ev("canBuyShop('hp')"), false, 'シュガー不足では買えない');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
