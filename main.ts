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
