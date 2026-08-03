// 武器定義の健全性（事故①：置換で別の定義を巻き込んで消す、の検出）。
const { load, makeReporter } = require('./harness');
const R = makeReporter('wpntest');
const { ev } = load();

// 選択可能な武器は 19本、固有 2本、合計 21。
R.eq(ev('WEAPON_LIST.length'), 19, '選択可能な武器は 19本');
R.eq(ev('Object.keys(WEAPONS).length'), 21, 'WEAPONS 全体は 21（19＋固有2）');
R.eq(ev("Object.keys(WEAPONS).filter(k=>WEAPONS[k].innate).length"), 2, '固有武器は 2本');

// 過去に消えた武器が生きているか（事故①はディナーベル・レモンを消した）。
for (const [id, name] of [
  ['bell', 'ディナーベル'], ['lemon', 'レモングレネード'], ['knife', 'ナイフ'],
  ['fork', 'フォーク'], ['foil', 'アルミホイル'], ['oban', 'フライパン'],
  ['chopsticks', 'さいばし'], ['mallet', '肉たたき'],
]) {
  R.ok(ev(`!!WEAPONS['${id}']`), `${name}(${id}) が定義されている`);
}

// フライパンシールドは完全に消えている。
R.ok(ev("!WEAPONS['lid']"), "フライパンシールド(lid) は削除済み");
R.ok(ev("Object.values(WEAPONS).every(w=>w.name!=='フライパンシールド')"), 'name にフライパンシールドが残っていない');
R.ok(ev("Object.values(WEAPONS).every(w=>!w.guardRing && !w.guardHp)"), 'guardRing/guardHp を持つ武器はもう無い');

// おぼん→フライパン：id は据え置き、表示名・アイコン・進化が更新済み。
R.eq(ev("WEAPONS.oban.name"), 'フライパン', 'oban の表示名はフライパン');
R.eq(ev("WEAPONS.oban.icon"), '🍳', 'oban のアイコンは🍳');
R.eq(ev("WEAPONS.oban.trait"), '回転', 'oban の特性は回転（弾を弾く、ではない）');
R.eq(ev("WEAPONS.oban.evo.name"), '二重のフライパン', 'oban の進化は二重のフライパン');
R.ok(ev("WEAPONS.oban.evo.flag==='dualring'"), 'oban の進化フラグは dualring');

R.done();
