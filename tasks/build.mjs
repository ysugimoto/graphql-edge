import * as esbuild from "esbuild";
import ignorePlugin from "esbuild-plugin-ignore";

(async () => {
  try {
    await esbuild.build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      format: "esm",
      // minify: true,
      platform: "node",
      outfile: "./dist/index.js",
      plugins: [
        ignorePlugin([
          {
            resourceRegExp: /^\.\/js-compute-runtime-cli\.js$/,
            contextRegExp: /@fastly\/js-compute/,
          }
        ])
      ],
    });
  } catch (err) {
    console.error(err);
  }
})();
