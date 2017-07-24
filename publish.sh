#!/usr/bin/env bash
echo "生成card.js"
cat ./src/umd/head > ./dist/card.js
cat ./src/{utils.js,lib.js,funcs.js,cache.js,package.js,card.js,page.js,panel.js,create.js,exports.js} >> ./dist/card.js
cat ./src/umd/tail >> ./dist/card.js

echo "复制 card.js 到 example/lib"
cp ./dist/card.js ./example/lib/card.js

echo "完成"
