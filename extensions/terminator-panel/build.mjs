import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

// Extension host bundle (Node.js / CommonJS)
const extensionConfig = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "es2022",
  sourcemap: true,
  minify: !isWatch,
};

// Webview bundle (Browser / ESM → IIFE)
const webviewConfig = {
  entryPoints: ["src/webview/index.tsx"],
  bundle: true,
  outfile: "dist/webview.js",
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: true,
  minify: !isWatch,
  define: {
    "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
  },
};

async function main() {
  if (isWatch) {
    const extCtx = await esbuild.context(extensionConfig);
    const webCtx = await esbuild.context(webviewConfig);
    await extCtx.watch();
    await webCtx.watch();
    console.log("Watching for changes...");
  } else {
    await esbuild.build(extensionConfig);
    await esbuild.build(webviewConfig);
    console.log("Build complete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
