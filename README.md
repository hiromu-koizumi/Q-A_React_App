## サービスURL
https://cos-qa.firebaseapp.com

## 概要
コスプレイヤー向けのQ&サービス
## なぜ作ろうと思ったか
- 既存のQ&Aサービスがスマホ最適化されていない
- 回答が「こんなことは調べればわかる。投稿するな！！」など思いやりの無い投稿が多く、質問しにくい状態である
※実際にコスプレイヤーの方に聞いた情報
## このサービスで実現したいこと
スマホでも使いやすく、回答に思いやりがあり気軽に質問ができるサービス
## そのための工夫
- スマホで使用しやすいようにBottomNavigation、横幅が長いボタンなどの実装
- 自分の名前の設定ができない完全匿名性
- メインカラーがピンク、丸みのあるデザインを意識し優しい雰囲気に
### 検討中
- 回答の前に「その回答は質問者を傷つけませんか？」などのアラートを表示
- 通報機能
- 匿名性の廃止

## 何ができるのか？（機能）
- 登録・ログイン
- 質問・回答にいいね
- 質問に回答
- 回答に返信
- 質問の回答数といいね数を表示
- 回答のいいね数と返信数を表示
- マイページで自分の回答と質問を表示
## どうやってできているのか？（技術）
- Firebase
  - Authentication
  - Cloud Firestore
- React
- Redux
- Semantic UI
## 技術的な工夫
- 無限スクロールの実装
- 詳細ページからタイムラインに戻った時に画面の位置が維持される
- React Hooksの利用

## サービスURL
https://cos-qa.firebaseapp.com
