import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";
import { PurgeCSS } from "purgecss";
import sharp from "sharp";
import { minify as minifyJavaScript } from "terser";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(toolsDirectory, "..");
const cssDirectory = path.join(projectDirectory, "css");
const imageDirectory = path.join(projectDirectory, "img");

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

const criticalStylePattern = /<style data-critical-css>[\s\S]*?<\/style>/;

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

function prepareHtmlForPurge(html) {
  return html
    .replace(criticalStylePattern, '<style data-critical-css></style>')
    .replace(/<!--[\s\S]*?-->/g, "");
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

async function writeJavaScript(fileName, source) {
  const result = await minifyJavaScript(source, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (!result.code) throw new Error(`${fileName}: a minificação não produziu conteúdo.`);

  const outputPath = path.join(projectDirectory, fileName);
  const output = `${result.code}\n`;
  await fs.writeFile(outputPath, output, "utf8");
  process.stdout.write(`${fileName}: ${Buffer.byteLength(output)} bytes\n`);
}

async function writeHeroVariant(fileName, pipeline, format, options) {
  const outputPath = path.join(imageDirectory, fileName);
  await pipeline.clone()[format](options).toFile(outputPath);
  const { size } = await fs.stat(outputPath);
  process.stdout.write(`${toWebPath(path.relative(projectDirectory, outputPath))}: ${size} bytes\n`);
}

async function buildHeroImages() {
  const sourcePath = path.join(imageDirectory, "nat-marco-maos-2026-1920.jpg");
  const desktop = sharp(sourcePath).rotate().resize({
    width: 1440,
    withoutEnlargement: true,
  });

  await Promise.all([
    writeHeroVariant("nat-marco-maos-2026-1440.avif", desktop, "avif", { quality: 55, effort: 5 }),
    writeHeroVariant("nat-marco-maos-2026-1440.webp", desktop, "webp", { quality: 72, effort: 5 }),
    writeHeroVariant("nat-marco-maos-2026-1440.jpg", desktop, "jpeg", { quality: 72, mozjpeg: true }),
  ]);

  const mobileWidth = 640;
  const mobileHeight = 1280;
  const foregroundHeight = Math.round(mobileWidth / 1.5);
  const blurredBackground = await sharp(sourcePath)
    .rotate()
    .resize(mobileWidth, mobileHeight, { fit: "cover", position: "centre" })
    .blur(28)
    .modulate({ brightness: 0.68, saturation: 0.82 })
    .toBuffer();
  const fadeMask = Buffer.from(`<svg width="${mobileWidth}" height="${foregroundHeight}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="white"/><stop offset="78%" stop-color="white"/><stop offset="100%" stop-color="black" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#fade)"/></svg>`);
  const foreground = await sharp(sourcePath)
    .rotate()
    .resize(mobileWidth, foregroundHeight, { fit: "cover" })
    .composite([{ input: fadeMask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const mobile = sharp(blurredBackground).composite([
    { input: foreground, top: 80, left: 0, blend: "over" },
  ]);

  await Promise.all([
    writeHeroVariant("nat-marco-maos-2026-mobile.avif", mobile, "avif", { quality: 48, effort: 5 }),
    writeHeroVariant("nat-marco-maos-2026-mobile.webp", mobile, "webp", { quality: 68, effort: 5 }),
    writeHeroVariant("nat-marco-maos-2026-mobile.jpg", mobile, "jpeg", { quality: 68, mozjpeg: true }),
  ]);
}

async function build() {
  await buildHeroImages();
  const siteCss = await concatenateSources(siteSources);
  const content = await Promise.all(siteContent.map(async (file) => {
    const extension = path.extname(file).slice(1);
    const raw = await fs.readFile(path.join(projectDirectory, file), "utf8");
    return {
      raw: extension === "html" ? prepareHtmlForPurge(raw) : raw,
      extension,
    };
  }));
  const optimizedSiteCss = await purge(siteCss, content);
  await writeCss("site.min.css", minify(optimizedSiteCss, "site.min.css"));

  const indexPath = path.join(projectDirectory, "index.html");
  const indexHtml = await fs.readFile(indexPath, "utf8");
  const criticalSource = await fs.readFile(path.join(cssDirectory, "critical.css"), "utf8");
  const rebasedCriticalCss = rebaseUrls(criticalSource, "css/critical.css");
  const minifiedCriticalCss = minify(rebasedCriticalCss, "CSS crítico").trim();
  const criticalMatches = indexHtml.match(new RegExp(criticalStylePattern.source, "g")) || [];
  if (criticalMatches.length !== 1) {
    throw new Error("index.html deve conter exatamente um bloco <style data-critical-css>.");
  }
  const updatedIndex = indexHtml.replace(
    criticalStylePattern,
    `<style data-critical-css>\n${minifiedCriticalCss}\n    </style>`,
  );
  await fs.writeFile(indexPath, updatedIndex, "utf8");
  process.stdout.write(`index.html CSS crítico: ${Buffer.byteLength(minifiedCriticalCss)} bytes\n`);

  const areaCss = await concatenateSources(["css/fonts.css", "css/area-page.css"]);
  await writeCss("area-page.min.css", minify(areaCss, "area-page.min.css"));

  const siteJavaScript = await fs.readFile(
    path.join(projectDirectory, "js/site-enhancements.js"),
    "utf8",
  );
  await writeJavaScript("js/site-enhancements.min.js", siteJavaScript);
}

build().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
