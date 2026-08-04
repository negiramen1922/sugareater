#!/bin/bash
# 全テストをまとめて実行する。対象は ../index.html。
#   使い方:  bash runall.sh
# 前提: 初回のみ  npm install jsdom  （tests/ 直下か上位に node_modules があること）
set -u
cd "$(dirname "$0")"

echo "===== 構文チェック ====="
bash check.sh ../index.html || exit 1
echo

# jsdom でゲームを実際に動かして検証する（引き継ぎ資料の手法を再現）。
TESTS=(
  errtest.js    # 読み込み・出撃・更新で JS エラーが出ないか
  wpntest.js    # 武器定義の健全性（19本＋固有2・フライパンシールド撤去・おぼん→フライパン）
  knifetest.js  # ナイフの分裂（貫通→分裂・0→3・子ナイフ生成）
  forktest.js   # フォークのダメージカット（無敵ではない・永続しない）
  foiltest.js   # アルミホイル進化（本数は数のみ・減衰ゼロ・連鎖増）
  pantest.js    # フライパンは攻撃するが弾は弾かない
  sprtest.js    # 立ち絵 w_pan が実際に描画される・武器sprの整合
  progtest.js   # 育成ModelA（全カードでLv上昇・Lv10進化のみ・進化後打ち止め）＋ボスHP2倍
  catetest.js   # 武器カテゴリ（近接/遠隔/設置 6/7/6）とマスタリー加算
  shoptest.js   # 装備/メタLvの中立化＋強化ショップ（アカウント共通）
  uitest.js     # 厨房UI再構成（各タブ描画・武器シュガー解放・キャラ解放）
)

fail=0
for t in "${TESTS[@]}"; do
  printf '%-14s ' "$t"
  out=$(timeout 90 node "$t" 2>&1)
  if echo "$out" | grep -q "すべて通りました"; then
    n=$(echo "$out" | grep -c "○")
    echo "OK  (${n}項目)"
  else
    echo "★ 失敗"
    echo "$out" | grep -E "✗|Error|エラー" | head -10 | sed 's/^/    /'
    fail=1
  fi
done

echo
if [ $fail -eq 0 ]; then echo "===== 全テスト通過 ====="; else echo "===== 失敗あり ====="; exit 1; fi
