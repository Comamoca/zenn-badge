import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";
import { ensure, is, maybe } from "jsr:@core/unknownutil";
import { Err, Ok, Result } from "https://deno.land/x/monads@v0.5.10/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/mod.ts";

interface userinfo {
  like: string;
  followings: string;
  articles: string;
  scraps: string;
  books: string;
}

interface userinfoURL {
  like: URL;
  followings: URL;
  articles: URL;
  scraps: URL;
  books: URL;
}

interface userBadges {
  like: string;
  followings: string;
  articles: string;
  scraps: string;
  books: string;
}

export async function generate_badge(
  user_name: string,
): Promise<Result<userBadges, string>> {
  const info = await fetch_info(user_name);

  if (info.isOk()) {
    const user_info_url = info_url(info.unwrap());
    return Ok({
      like: (await fetch_svg(user_info_url.like)),
      followings: (await fetch_svg(user_info_url.followings)),
      articles: (await fetch_svg(user_info_url.articles)),
      scraps: (await fetch_svg(user_info_url.scraps)),
      books: (await fetch_svg(user_info_url.books)),
    });
  } else {
    return Err("ユーザー情報の取得に失敗しました");
  }
}

export async function error_badge() {
  return await fetch_svg(
    new URL(
      "https://img.shields.io/badge/Zenn%20error-Internal%20server%20error-orange.svg",
    ),
  );
}

async function fetch_svg(url: URL): Promise<string> {
  const svg = await fetch(url);
  return await svg.text();
}

function info_url(userInfo: userinfo): userinfoURL {
  const tmpl = (tp: string) => {
    const value = userInfo[tp as keyof typeof userInfo];
    return `https://img.shields.io/badge/Zenn ${tp}-${
      maybe(value, is.String) ?? "0"
    }-blue.svg`;
  };

  return {
    like: new URL(tmpl("like")),
    followings: new URL(tmpl("followings")),
    articles: new URL(tmpl("articles")),
    scraps: new URL(tmpl("scraps")),
    books: new URL(tmpl("books")),
  };
}

async function fetch_info(
  user_name: string,
): Promise<Result<userinfo, string>> {
  const url = `https://zenn.dev/${user_name}`;

  await sleep(1);
  const res = await fetch(url);

  if (res.status != 200) {
    return Err("ユーザーページの取得に失敗しました。");
  }

  const html = await res.text();

  const doc = new DOMParser().parseFromString(html, "text/html");

  const info = doc?.querySelector(
    "#__next > header.UserHeader_header__wgo13 > div > div > div.UserHeader_profileMain__6Itxi > div.UserHeader_profileLower__IQG7z > div.UserHeader_metaContainer__y__ik",
  );

  const like = info?.querySelector(
    "button:nth-child(1) > span",
  )?.textContent;
  const followings = info?.querySelector("button:nth-child(2) > span")
    ?.textContent;

  const articlesInfo = doc?.querySelector(
    "#__next > div.Container_default__13H8g.Container_common__figYY > div",
  );

  const articles = doc?.querySelector(
    "div > div > div > div > div > div > a:nth-child(1) > span",
  )?.textContent;

  const scraps = articlesInfo?.querySelector("a:nth-child(2) > span")
    ?.textContent;
  const book = (() => {
    const book = articlesInfo?.querySelector("a:nth-child(2) > span");
    // Bookを出していない人はbookの数字がscrapsと同じになる
    if (scraps == book?.textContent) {
      return "0";
    } else {
      return book?.textContent;
    }
  })();

  // エラーが発生したら空白が返ってくる

  return Ok({
    like: ensure(like, is.String),
    followings: ensure(followings, is.String),
    articles: ensure(articles, is.String),
    scraps: ensure(scraps, is.String),
    books: ensure(book, is.String),
  });
}
