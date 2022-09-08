import * as esbuild from "esbuild";

(async () => {
  try {
    await esbuild.build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      format: "esm",
      minify: true,
      outfile: "./dist/index.js",
    });
  } catch (err) {
    console.error(err);
  }
})();
