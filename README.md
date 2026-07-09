# Portfolio

グラフィックデザイナー/UIデザイナーのポートフォリオサイト。白ベース×パステルカラーを基調に、GLSLを使ったジェネラティブアート表現を取り入れています。

## 構成

サイトは3セクション構成です。

- **01 About** — プロフィール、スキル
- **02 Projects** — 制作事例一覧(Pickup 1件 + 通常カード)。各カードから専用の詳細ページへ遷移
- **03 Contact** — SNSリンク

## Hero の特徴

- WebGL(GLSLドメインワープFBM)による液体パステル背景。マウスで歪む
- ガラス質感のショートカットカード3枚(3D傾き・視差・光沢追従)
- 左下のコピー(行マスクリビール)
- 東京時間ライブ時計
- カスタムカーソル(ドット+追従リング、サイト全体)

## ファイル構成

```
index.html          トップページ(About / Projects / Contact)
works/               各プロジェクトの詳細ページ
  uchinoko.html        うちの子製作所
  senryu.html          川柳なう。
  tcusmart.html        TCU smart
  tekurun.html         テクルン
  wordwolf.html        ゲームで企業文化を可視化
  maze.html            ゴールを目指せ!
css/style.css        全ページ共通スタイル
js/main.js           WebGL/スクロール演出/インタラクション実装
assets/               画像素材
```

作品詳細ページは共通のテンプレート構造(wp-head / wp-hero-photo / wp-section など)を使って追加できます。既存ページ(`works/senryu.html` など)を複製して差し替えるのが早道です。

デザイン方針の詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

## ローカルでの確認

`index.html` をブラウザで開くだけで動作します(ビルド不要の静的サイト)。
