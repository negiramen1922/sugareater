#!/bin/bash
# 構文チェックだけ（数秒）。index.html の インライン<script> を抜き出して parse する。
#   使い方:  bash check.sh [対象HTML]
set -u
F=${1:-../index.html}
if [ ! -f "$F" ]; then echo "対象が見つからない: $F"; exit 1; fi

node -e '
const fs=require("fs"), vm=require("vm");
const html=fs.readFileSync(process.argv[1],"utf8");
const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m,i=0,bad=0;
while((m=re.exec(html))){
  try{ new vm.Script(m[1],{filename:"block"+i+".js"}); }
  catch(e){ bad++; console.log("★ block"+i+" 構文エラー: "+e.message); }
  i++;
}
console.log("インライン<script> "+i+"個を検査");
if(bad===0){ console.log("構文チェック: OK"); process.exit(0); }
else { console.log("構文チェック: 失敗"); process.exit(1); }
' "$F"
