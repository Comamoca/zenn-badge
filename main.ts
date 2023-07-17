import { Context, Hono } from "https://deno.land/x/hono@v3.3.1/mod.ts";
import { error_badge, generate_badge } from "./badge.ts";

const app = new Hono();
const api = new Hono();

async function badge(c: Context, user_name: string, tp: string) {
  const result = await generate_badge(user_name);

  if (result.isOk()) {
    const badges = result.unwrap();

    c.header("Content-Type", "image/svg+xml");
    return c.body(badges[tp as keyof typeof badges]);
  } else {
    // internal server error
    c.header("Content-Type", "image/svg+xml");
    return c.body(await error_badge());
  }
}

api.get("/", (c) =>
  c.text(`
[ このAPIの使い方 ]
このAPIには以下のエンドポイントが用意されています

・api/{user_name}/like
・api/{user_name}/followings
・api/{user_name}/articles
・api/{user_name}/scraps
・api/{user_name}/books

{user_name}にはZennのユーザー名を指定してください。

[ Q&A ]
・スクレイピングだけど大丈夫？
もし何かあったら速攻シャットダウンします。それ前提で利用してください。
一応申し訳程度にZennへリクエストを飛ばす前に1秒sleepさせる処理を入れてます。

・なんかバッジがオレンジ色なんだけど
Zenn Errorなどと表示されていたらサーバー内部でエラーが発生しています。
ユーザーやエンドポイントが正しいかどうか今一度確認してください。
それでも治らなかった場合はissueを立てて下さい。
`));

api.get("/:username/like", async (c) => {
  const user_name = c.req.param("username");
  return await badge(c, user_name, "like");
});

api.get("/:username/followings", async (c) => {
  const user_name = c.req.param("username");
  return await badge(c, user_name, "followings");
});

api.get("/:username/articles", async (c) => {
  const user_name = c.req.param("username");
  return await badge(c, user_name, "articles");
});

api.get("/:username/scraps", async (c) => {
  const user_name = c.req.param("username");
  return await badge(c, user_name, "scraps");
});

api.get("/:username/books", async (c) => {
  const user_name = c.req.param("username");
  return await badge(c, user_name, "books");
});

app.route("/api", api);
Deno.serve(app.fetch);
