import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../css/newtab.css", import.meta.url), "utf8");
const script = readFileSync(new URL("../js/newtab.js", import.meta.url), "utf8");

const mojibakeMarkers = ["Ã", "Â", "ðŸ", "ï¿½"];

test("newtab script is valid JavaScript", () => {
  const result = spawnSync(process.execPath, ["--check", "StillTab/js/newtab.js"], {
    cwd: new URL("../..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("visible UI copy is not mojibake", () => {
  const combined = `${html}\n${script}`;
  for (const marker of mojibakeMarkers) {
    assert.equal(combined.includes(marker), false, `unexpected mojibake marker: ${marker}`);
  }

  assert.match(html, /Settings/);
  assert.match(html, /Choose local wallpaper/);
  assert.match(html, /Language/);
});

test("core engines and language options match the architecture", () => {
  for (const engine of ["Google", "Bing", "DuckDuckGo", "Baidu"]) {
    assert.match(script, new RegExp(`label: "${engine}"`));
  }

  for (const sourceText of [
    "\\u4e2d\\u6587\\uff08\\u7b80\\u4f53\\uff09",
    "\\u4e2d\\u6587\\uff08\\u7e41\\u9ad4\\uff09",
    "English",
    "\\u0627\\u0644\\u0639\\u0631\\u0628\\u064a\\u0629",
    "\\u0420\\u0443\\u0441\\u0441\\u043a\\u0438\\u0439",
    "\\u65e5\\u672c\\u8a9e",
    "\\ud55c\\uad6d\\uc5b4"
  ]) {
    assert.match(script, new RegExp(sourceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const removedLanguage of ["Espa\\u00f1ol", "Portugu\\u00eas", "Deutsch", "Italiano", "Polski"]) {
    assert.doesNotMatch(script, new RegExp(removedLanguage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("custom engine validation rejects invalid templates", () => {
  assert.match(script, /function isValidCustomEngineUrl/);
  assert.match(script, /url\.protocol === "https:"/);
  assert.match(script, /includes\("\{query\}"\)/);
});

test("custom engines are selectable from the settings dropdown", () => {
  assert.match(script, /function renderEngineSelect/);
  assert.match(script, /renderEngineSelect\(\)/);
  assert.match(script, /engineOptions\(\)\.forEach\(function \(engine\)/);
  assert.match(script, /option\.value = engine\.id/);
  assert.match(script, /el\.engineSelect\.append\(option\)/);
  assert.match(script, /el\.engineSelect\.value = activeEngine\(\)\.id/);
  assert.match(script, /CUSTOM_PREFIX \+ engine\.id/);
});

test("search engine menu lets the whole rendered option choose an engine", () => {
  assert.match(script, /item\.dataset\.engine = engine\.id/);
  assert.match(script, /event\.target\.closest\("\[data-engine\]"\)/);
  assert.match(script, /if \(!option \|\| !el\.engineList\.contains\(option\)\) return;\s+event\.stopPropagation\(\);\s+selectEngine\(option\.dataset\.engine\)/);
  assert.match(script, /selectEngine\(option\.dataset\.engine\)/);
  assert.match(css, /\.engine-popover,[\s\S]*\.history-popover \{[\s\S]*z-index: 3/);
});

test("wallpaper source removes Bing daily wallpaper and keeps local modes", () => {
  assert.doesNotMatch(html, /Bing Daily/);
  assert.doesNotMatch(html, /value="still"/);
  assert.doesNotMatch(html, /data-i18n-option="sourceStill"/);
  assert.doesNotMatch(script, /BING_PRIMARY|BING_FALLBACK|bing\.kaininx|bing\.biturl/);
  assert.doesNotMatch(script, /function bingMkt|function fetchBingUrl|function ensureBingWallpaper/);
  assert.doesNotMatch(script, /bingWallpaper|sourceStill|state\.bing|bingRequest/);
  assert.doesNotMatch(script, /source: "still"/);
  assert.match(script, /source: "image"/);
  assert.match(script, /\["image", "video"\]\.includes\(state\.source\)/);
});

test("settings copy is driven by the selected language", () => {
  assert.match(script, /var translations = \{/);
  assert.match(script, /function translateSettings/);
  assert.match(script, /translateSettings\(\)/);
  assert.match(script, /settingsTitle: "Wallpaper"/);
  assert.match(script, /searchPlaceholder: "Search the Web"/);
  assert.match(script, /settingsTitle: "\\u58c1\\u7eb8"/);
  assert.match(script, /searchPlaceholder: "\\u5728 Web \\u4e2d\\u641c\\u7d22\.\.\."/);
  assert.match(script, /chooseFile: "\\u9009\\u62e9\\u672c\\u5730\\u58c1\\u7eb8"/);
  assert.match(script, /translations\["ru"\]/);
  assert.match(script, /translations\["ar"\]/);
  assert.match(script, /translations\["ja"\]/);
  assert.match(script, /translations\["ko"\]/);
});

test("settings and language panels use compact dimensions", () => {
  assert.match(html, /id="settingsTitle"/);
  assert.match(html, /id="searchInput"[^>]+data-i18n-placeholder="searchPlaceholder"/);
  assert.match(html, /data-i18n="chooseFile"/);
  assert.match(html, /data-i18n="languageTitle"/);
  assert.match(html, /data-i18n="sourceLabel"/);
  assert.match(html, /data-i18n-option="sourceImage"/);
  assert.match(html, /data-i18n-placeholder="customUrlPlaceholder"/);
  assert.match(script, /var languageHeight = el\.languagePanel\.scrollHeight/);
  assert.match(script, /var settingsHeight = el\.settingsPanel\.scrollHeight/);
  assert.match(script, /--language-panel-scale/);
  assert.match(script, /--settings-panel-scale/);
  assert.match(css, /max-height: calc\(100vh - 124px\)/);
  assert.match(css, /transform: scale\(var\(--language-panel-scale, 1\)\)/);
  assert.match(css, /transform: scale\(var\(--settings-panel-scale, 1\)\)/);
});

test("settings and language panels are anchored below their matching toolbar buttons", () => {
  assert.match(css, /--toolbar-top: clamp\(22px, 4\.4vh, 48px\)/);
  assert.match(css, /--toolbar-button-size: 52px/);
  assert.match(css, /--toolbar-panel-gap: 18px/);
  assert.match(css, /top: calc\(var\(--toolbar-top\) \+ var\(--toolbar-button-size\) \+ var\(--toolbar-panel-gap\)\)/);
  assert.match(css, /right: var\(--toolbar-right\)/);
  assert.match(css, /right: calc\(var\(--toolbar-right\) \+ var\(--toolbar-button-size\) \+ var\(--toolbar-button-gap\)\)/);
});

test("wallpaper settings remove reset and advanced toggle controls", () => {
  assert.doesNotMatch(html, /id="resetBackgroundButton"/);
  assert.doesNotMatch(html, /id="advancedToggle"/);
  assert.doesNotMatch(script, /resetBackground/);
  assert.doesNotMatch(script, /setAdvancedOpen/);
  assert.doesNotMatch(script, /advancedToggle/);
  assert.match(html, /<section class="settings-group advanced-section" id="advancedSection">/);
});

test("settings keep compact panel style and expose background opacity only", () => {
  assert.doesNotMatch(html, /id="panelModeSelect"/);
  assert.doesNotMatch(html, /id="iconOpacityRange"/);
  assert.doesNotMatch(script, /panelMode/);
  assert.doesNotMatch(script, /iconOpacityRange/);
  assert.doesNotMatch(script, /state\.iconOpacity/);
  assert.doesNotMatch(script, /el\.iconOpacity/);
  assert.match(html, /id="backgroundOpacityRange" type="range" min="35" max="100" value="100"/);
  assert.match(html, /data-i18n="backgroundOpacityLabel"/);
  assert.match(script, /backgroundOpacity: 100/);
  assert.match(script, /backgroundOpacityRange: document\.getElementById\("backgroundOpacityRange"\)/);
  assert.match(script, /--background-opacity/);
  assert.match(css, /--background-opacity: 1/);
  assert.match(css, /\.background,[\s\S]*\.background-video[\s\S]*opacity: var\(--background-opacity\)/);
  assert.match(css, /\.settings-panel \{[\s\S]*width: min\(320px, calc\(100vw - 36px\)\)/);
});

test("image source supports repeated multi-image additions", () => {
  assert.match(html, /id="fileInput" type="file" accept="image\/\*" multiple/);
  assert.match(html, /id="localGallery"/);
  assert.doesNotMatch(html, /id="wallpaperThumb"/);
  assert.doesNotMatch(html, /id="fileNote"/);
  assert.match(script, /localImages: \[\]/);
  assert.match(script, /function addLocalFiles/);
  assert.match(script, /Array\.from\(files \|\| \[\]\)/);
  assert.match(script, /state\.localImages = state\.localImages\.concat/);
  assert.match(script, /function renderLocalGallery/);
  assert.match(script, /data-delete-local-image/);
  assert.match(script, /el\.background\.style\.backgroundImage = "url/);
  assert.doesNotMatch(script, /--local-image/);
  assert.doesNotMatch(script, /fileNote/);
  assert.doesNotMatch(script, /wallpaperThumb/);
});

test("local wallpaper image data persists outside localStorage", () => {
  assert.match(script, /var DB_NAME = "StillTab"/);
  assert.match(script, /indexedDB\.open\(DB_NAME, DB_VERSION\)/);
  assert.match(script, /function putLocalImageBlob/);
  assert.match(script, /function getLocalImageBlob/);
  assert.match(script, /function createLocalImageThumb/);
  assert.match(script, /delete copy\.dataUrl/);
  assert.match(script, /thumbDataUrl/);
});

test("local wallpaper video data persists outside runtime blob URLs", () => {
  assert.match(script, /function videoKey/);
  assert.match(script, /return "local-video"/);
  assert.match(script, /function putVideoBlob/);
  assert.match(script, /function getVideoBlob/);
  assert.match(script, /function loadVideoUrl/);
  assert.match(script, /putVideoBlob\(file\)\.catch/);
  assert.match(script, /loadVideoUrl\(\)\.then/);
  assert.match(script, /showVideoBackground\(url\)/);
  assert.match(script, /delete persisted\.videoDataUrl/);
});

test("select controls use the StillTab glass select treatment", () => {
  assert.match(css, /appearance: none/);
  assert.match(css, /\.settings-row input,[\s\S]*\.settings-row select \{/);
  assert.match(css, /box-shadow: inset 0 1px 0 rgba\(255, 255, 255, 0\.06\)/);
  assert.match(css, /background-image:[\s\S]*linear-gradient\(45deg, transparent 50%, var\(--muted\) 50%\)/);
  assert.match(css, /select:focus/);
  assert.match(css, /option \{/);
});

test("StillTab owns its generated icon assets", () => {
  const svg = readFileSync(new URL("../icon/icon.svg", import.meta.url), "utf8");
  assert.match(svg, /StillTab icon/);
  assert.match(svg, /data-part="s-frame"/);
  assert.match(svg, /data-part="inner-detail"/);
  assert.doesNotMatch(svg, /<text/);
  assert.doesNotMatch(svg, /<rect[^>]+x="0"[^>]+width="128"[^>]+height="128"/);
  assert.doesNotMatch(svg, /linearGradient|radialGradient|filter=/);

  for (const size of [16, 48, 128]) {
    const icon = readFileSync(new URL(`../icon/icon${size}.png`, import.meta.url));
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
    assert.ok(icon.length > 256, `icon${size}.png should contain a real StillTab raster`);
  }
});
