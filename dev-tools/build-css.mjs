import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";
import { PurgeCSS } from "purgecss";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(toolsDirectory, "..");
const cssDirectory = path.join(projectDirectory, "css");

const siteSources = [
  "css/fonts.css",
  "vendor/bootstrap/css/bootstrap.min.css",
  "vendor/themify/themify.css",
  "css/style.css",
  "css/global/global.css",
  "css/theme/gold.css",
  "css/custom.css",
];

const siteContent = [
  "index.html",
  "politica-de-privacidade.html",
  "js/site-enhancements.js",
];

function toWebPath(value) {
  return value.split(path.sep).join("/");
}

function rebaseUrls(css, sourceFile) {
  const sourceDirectory = path.dirname(path.join(projectDirectory, sourceFile));

  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, rawUrl) => {
    const value = rawUrl.trim();
    if (/^(?:data:|https?:|#|\/)/i.test(value)) return match;

    const suffixIndex = value.search(/[?#]/);
    const assetPath = suffixIndex === -1 ? value : value.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? "" : value.slice(suffixIndex);
    const absoluteAsset = path.resolve(sourceDirectory, assetPath);
    const rebased = toWebPath(path.relative(cssDirectory, absoluteAsset));
    const wrapped = quote || '"';

    return `url(${wrapped}${rebased}${suffix}${wrapped})`;
  });
}

async function concatenateSources(sourceFiles) {
  const parts = [];
  for (const sourceFile of sourceFiles) {
    const css = await fs.readFile(path.join(projectDirectory, sourceFile), "utf8");
    parts.push(rebaseUrls(css, sourceFile));
  }
  return parts.join("\n");
}

function minify(css, outputName) {
  const result = new CleanCSS({ level: 2 }).minify(css);
  if (result.errors.length > 0) {
    throw new Error(`${outputName}: ${result.errors.join("; ")}`);
  }
  return `${result.styles}\n`;
}

async function purge(css, content) {
  const [result] = await new PurgeCSS().purge({
    content,
    css: [{ raw: css }],
    fontFace: true,
    keyframes: true,
  });
  return result.css;
}

async function writeCss(fileName, css) {
  const outputPath = path.join(cssDirectory, fileName);
  await fs.writeFile(outputPath, css, "utf8");
  const size = Buffer.byteLength(css);
  process.stdout.write(`${toWebPath(path.relative(projectDirectory, outputPath))}: ${size} bytes\n`);
}

async function build() {
  const siteCss = await concatenateSources(siteSources);
  const content = await Promise.all(
    siteContent.map(async (file) => ({
      raw: await fs.readFile(path.join(projectDirectory, file), "utf8"),
      extension: path.extname(file).slice(1),
    })),
  );
  const optimizedSiteCss = await purge(siteCss, content);
  await writeCss("site.min.css", minify(optimizedSiteCss, "site.min.css"));

  const indexHtml = await fs.readFile(path.join(projectDirectory, "index.html"), "utf8");
  const aboutStart = indexHtml.indexOf('<div id="about"');
  const floatingStart = indexHtml.indexOf("<!-- Back To Top -->");
  const scriptStart = indexHtml.indexOf("<!-- Script principal -->");
  if (aboutStart === -1 || floatingStart === -1 || scriptStart === -1) {
    throw new Error("Não foi possível localizar os limites do conteúdo crítico em index.html.");
  }
  const criticalMarkup = `${indexHtml.slice(0, aboutStart)}\n${indexHtml.slice(floatingStart, scriptStart)}`;
  const criticalCss = await purge(optimizedSiteCss, [
    { raw: criticalMarkup, extension: "html" },
  ]);
  await writeCss("site-critical.min.css", minify(criticalCss, "site-critical.min.css"));

  const areaCss = await concatenateSources(["css/fonts.css", "css/area-page.css"]);
  await writeCss("area-page.min.css", minify(areaCss, "area-page.min.css"));
}

build().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
