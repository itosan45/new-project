import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * このディレクトリを単体のプロジェクトとして扱わせる。
   *
   * 指定しないと、親（/home/user/new-project）に package-lock.json が
   * あるためそちらをルートと誤検出する。Vercel で Root Directory を
   * webapp に設定しても、ビルド側が親を見に行って壊れる。
   */
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
