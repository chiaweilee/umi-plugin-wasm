import { IApi } from "umi";

export default (api: IApi) => {
  api.chainWebpack((memo) => {
    memo.set("experiments", {
      ...(memo.get("experiments") || {}),
      asyncWebAssembly: true,
      syncWebAssembly: true,
    });

    memo.module
      .rule("asset")
      .exclude.add(/\.wasm$/)
      .end();

    return memo;
  });
};
