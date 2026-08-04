// 武器カテゴリ（近接/遠隔/設置）とマスタリー加算の健全性。
//   ・19本すべてが1カテゴリに属する（6/7/6）
//   ・境界の確定：フォーク＝近接、生クリーム＝設置
//   ・grantMastery：使用中＝+1、同カテゴリ所持済み未編成＝+1/20、未所持/別カテゴリ＝0
const { load, makeReporter } = require('./harness');
const R = makeReporter('catetest');
const { ev, errors } = load();

// --- カテゴリ表の健全性 ---
R.eq(ev('CATEGORY_LIST.length'), 3, 'カテゴリは3系統');
R.ok(ev('WEAPON_LIST.every(id=>!!weaponCategory(id))'), '全19本が1カテゴリに属する');
R.eq(ev("WEAPON_LIST.filter(id=>weaponCategory(id)==='melee').length"),  6, '近接は6本');
R.eq(ev("WEAPON_LIST.filter(id=>weaponCategory(id)==='ranged').length"), 7, '遠隔は7本');
R.eq(ev("WEAPON_LIST.filter(id=>weaponCategory(id)==='zone').length"),   6, '設置は6本');

// --- 境界の確定 ---
R.eq(ev("weaponCategory('fork')"),  'melee', 'フォークは近接');
R.eq(ev("weaponCategory('cream')"), 'zone',  '生クリームは設置');
// 代表的な内訳も固定（回帰防止）
R.eq(ev("weaponCategory('oban')"),       'melee',  'フライパンは近接');
R.eq(ev("weaponCategory('knife')"),      'ranged', 'ナイフは遠隔');
R.eq(ev("weaponCategory('foil')"),       'ranged', 'アルミホイルは遠隔');
R.eq(ev("weaponCategory('honey')"),      'zone',   'ハチミツは設置');

// --- マスタリー加算 ---
ev('startRun()');
ev('state.testMode=false;');
// 所持状態を作る：pepper(遠隔)を所持、chopsticks(遠隔)を未所持、oban(近接)を所持。
ev("META.wp.pepper.own=1; META.wp.chopsticks.own=0; META.wp.oban.own=1;");
// マスタリーを一旦ゼロに。
ev("for(const id of WEAPON_LIST) META.mastery[id]=0;");
// 遠隔のナイフだけを使用中にする。
ev("state.weapons=[{id:'knife',innate:false}];");
ev('grantMastery()');

R.eq(ev("META.mastery.knife"), 1, '使用中の武器は +1');
R.near(ev("META.mastery.pepper"), 0.05, 1e-9, '同カテゴリ・所持済み・未編成は +1/20');
R.eq(ev("META.mastery.chopsticks"), 0, '同カテゴリでも未所持は 0');
R.eq(ev("META.mastery.oban"), 0, '別カテゴリ（所持済み）は 0');

// もう1体倒すと積み上がる。
ev('grantMastery()');
R.eq(ev("META.mastery.knife"), 2, '2体目で使用中は 2');
R.near(ev("META.mastery.pepper"), 0.10, 1e-9, '2体目で draft は 0.10');

// テストモード中は貯まらない。
ev('state.testMode=true; grantMastery(); state.testMode=false;');
R.eq(ev("META.mastery.knife"), 2, 'テストモード中は加算しない');

R.ok(errors.length === 0, '一連の処理で JS エラーなし' + (errors.length ? ' → ' + errors[0] : ''));
R.done();
