(function () {
  "use strict";

  var STORAGE_KEY = "stilltab_settings";
  var DB_NAME = "StillTab";
  var DB_VERSION = 1;
  var DB_STORE = "wallpaper";
  var CUSTOM_PREFIX = "custom:";
  var MAX_HISTORY = 8;
  var runtimeUrls = { image: "", video: "", localImages: {} };

  var defaults = {
    engine: "bing",
    customEngineName: "",
    customEngineUrl: "",
    customEngines: [],
    source: "image",
    fileName: "",
    overlay: 42,
    backgroundOpacity: 100,
    language: "zh-CN",
    history: [],
    imageDataUrl: "",
    localImages: [],
    activeImageId: "",
    iconCache: {}
  };

  var engines = {
    google: {
      label: "Google",
      badge: "G",
      url: "https://www.google.com/search?q={query}"
    },
    bing: {
      label: "Bing",
      badge: "B",
      url: "https://www.bing.com/search?q={query}"
    },
    duckduckgo: {
      label: "DuckDuckGo",
      badge: "D",
      url: "https://duckduckgo.com/?q={query}"
    },
    baidu: {
      label: "Baidu",
      badge: "B",
      url: "https://www.baidu.com/s?wd={query}"
    }
  };

  var languages = [
    { code: "zh-CN", name: "\u4e2d\u6587\uff08\u7b80\u4f53\uff09" },
    { code: "zh-TW", name: "\u4e2d\u6587\uff08\u7e41\u9ad4\uff09" },
    { code: "en", name: "English" },
    { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
    { code: "ru", name: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
    { code: "ja", name: "\u65e5\u672c\u8a9e" },
    { code: "ko", name: "\ud55c\uad6d\uc5b4" }
  ];

  var translations = {
    "en": {
      settingsTitle: "Wallpaper",
      localWallpaper: "Local wallpaper",
      sourceLabel: "Source",
      sourceImage: "Image",
      sourceVideo: "Video",
      chooseFile: "Choose local wallpaper",
      addImage: "Add image",
      noFile: "No local file selected",
      imageCount: "images",
      searchSection: "Search",
      searchPlaceholder: "Search the Web",
      engineLabel: "Search engine",
      customName: "Custom name",
      customNamePlaceholder: "Example",
      customUrl: "Custom URL",
      customUrlPlaceholder: "https://example.com/search?q={query}",
      addCustom: "Add custom engine",
      overlayLabel: "Overlay",
      backgroundOpacityLabel: "Background opacity",
      languageTitle: "Language",
      deleteImage: "Delete image"
    },
    "zh-CN": {
      settingsTitle: "\u58c1\u7eb8",
      localWallpaper: "\u672c\u5730\u58c1\u7eb8",
      sourceLabel: "\u6765\u6e90",
      sourceImage: "\u56fe\u7247",
      sourceVideo: "\u89c6\u9891",
      chooseFile: "\u9009\u62e9\u672c\u5730\u58c1\u7eb8",
      addImage: "\u6dfb\u52a0\u56fe\u7247",
      noFile: "\u672a\u9009\u62e9\u672c\u5730\u6587\u4ef6",
      imageCount: "\u5f20",
      searchSection: "\u641c\u7d22",
      searchPlaceholder: "\u5728 Web \u4e2d\u641c\u7d22...",
      engineLabel: "\u641c\u7d22\u5f15\u64ce",
      customName: "\u81ea\u5b9a\u4e49\u540d\u79f0",
      customNamePlaceholder: "\u793a\u4f8b",
      customUrl: "\u81ea\u5b9a\u4e49 URL",
      customUrlPlaceholder: "https://example.com/search?q={query}",
      addCustom: "\u6dfb\u52a0\u81ea\u5b9a\u4e49\u5f15\u64ce",
      overlayLabel: "\u906e\u7f69",
      backgroundOpacityLabel: "\u80cc\u666f\u900f\u660e\u5ea6",
      languageTitle: "\u8bed\u8a00",
      deleteImage: "\u5220\u9664\u56fe\u7247"
    }
  };

  translations["zh-TW"] = Object.assign({}, translations["zh-CN"], {
    settingsTitle: "\u58c1\u7d19",
    localWallpaper: "\u672c\u5730\u58c1\u7d19",
    sourceImage: "\u5716\u7247",
    sourceVideo: "\u5f71\u7247",
    chooseFile: "\u9078\u64c7\u672c\u5730\u58c1\u7d19",
    addImage: "\u65b0\u589e\u5716\u7247",
    noFile: "\u672a\u9078\u64c7\u672c\u5730\u6a94\u6848",
    imageCount: "\u5f35",
    searchSection: "\u641c\u5c0b",
    searchPlaceholder: "\u5728 Web \u4e2d\u641c\u5c0b...",
    engineLabel: "\u641c\u5c0b\u5f15\u64ce",
    customName: "\u81ea\u8a02\u540d\u7a31",
    addCustom: "\u65b0\u589e\u81ea\u8a02\u5f15\u64ce",
    backgroundOpacityLabel: "\u80cc\u666f\u900f\u660e\u5ea6",
    languageTitle: "\u8a9e\u8a00",
    deleteImage: "\u522a\u9664\u5716\u7247"
  });

  translations["ru"] = Object.assign({}, translations.en, {
    settingsTitle: "Обои",
    localWallpaper: "Локальные обои",
    sourceLabel: "Источник",
    sourceImage: "Изображение",
    sourceVideo: "Видео",
    chooseFile: "Выбрать локальные обои",
    addImage: "Добавить изображение",
    noFile: "Локальный файл не выбран",
    imageCount: "изобр.",
    searchSection: "Поиск",
    engineLabel: "Поисковая система",
    customName: "Свое имя",
    customNamePlaceholder: "Пример",
    customUrl: "Свой URL",
    addCustom: "Добавить поисковик",
    overlayLabel: "Затемнение",
    panelStyle: "Стиль панели",
    panelCompact: "Компактный",
    panelWide: "Широкий",
    iconOpacity: "Прозрачность значков",
    languageTitle: "Язык",
    deleteImage: "Удалить изображение"
  });

  translations["ar"] = Object.assign({}, translations.en, {
    settingsTitle: "الخلفية",
    localWallpaper: "خلفية محلية",
    sourceLabel: "المصدر",
    sourceImage: "صورة",
    sourceVideo: "فيديو",
    chooseFile: "اختر خلفية محلية",
    addImage: "إضافة صورة",
    noFile: "لم يتم اختيار ملف محلي",
    imageCount: "صور",
    searchSection: "البحث",
    engineLabel: "محرك البحث",
    customName: "اسم مخصص",
    customNamePlaceholder: "مثال",
    customUrl: "رابط مخصص",
    addCustom: "إضافة محرك مخصص",
    overlayLabel: "التعتيم",
    panelStyle: "نمط اللوحة",
    panelCompact: "مضغوط",
    panelWide: "واسع",
    iconOpacity: "شفافية الأيقونات",
    languageTitle: "اللغة",
    deleteImage: "حذف الصورة"
  });

  translations["ja"] = Object.assign({}, translations.en, {
    settingsTitle: "壁紙",
    localWallpaper: "ローカル壁紙",
    sourceLabel: "ソース",
    sourceImage: "画像",
    sourceVideo: "動画",
    chooseFile: "ローカル壁紙を選択",
    addImage: "画像を追加",
    noFile: "ローカルファイル未選択",
    imageCount: "枚",
    searchSection: "検索",
    engineLabel: "検索エンジン",
    customName: "カスタム名",
    customNamePlaceholder: "例",
    customUrl: "カスタム URL",
    addCustom: "カスタム検索を追加",
    overlayLabel: "オーバーレイ",
    panelStyle: "パネル表示",
    panelCompact: "コンパクト",
    panelWide: "ワイド",
    iconOpacity: "アイコン透明度",
    languageTitle: "言語",
    deleteImage: "画像を削除"
  });

  translations["ko"] = Object.assign({}, translations.en, {
    settingsTitle: "배경화면",
    localWallpaper: "로컬 배경화면",
    sourceLabel: "소스",
    sourceImage: "이미지",
    sourceVideo: "동영상",
    chooseFile: "로컬 배경화면 선택",
    addImage: "이미지 추가",
    noFile: "선택된 로컬 파일 없음",
    imageCount: "장",
    searchSection: "검색",
    engineLabel: "검색 엔진",
    customName: "사용자 지정 이름",
    customNamePlaceholder: "예시",
    customUrl: "사용자 지정 URL",
    addCustom: "사용자 지정 엔진 추가",
    overlayLabel: "오버레이",
    panelStyle: "패널 스타일",
    panelCompact: "컴팩트",
    panelWide: "와이드",
    iconOpacity: "아이콘 투명도",
    languageTitle: "언어",
    deleteImage: "이미지 삭제"
  });

  Object.assign(translations.ru, {
    backgroundOpacityLabel: "\u041f\u0440\u043e\u0437\u0440\u0430\u0447\u043d\u043e\u0441\u0442\u044c \u0444\u043e\u043d\u0430",
    searchPlaceholder: "\u041f\u043e\u0438\u0441\u043a \u0432 Web..."
  });

  Object.assign(translations.ar, {
    backgroundOpacityLabel: "\u0634\u0641\u0627\u0641\u064a\u0629 \u0627\u0644\u062e\u0644\u0641\u064a\u0629",
    searchPlaceholder: "\u0627\u0628\u062d\u062b \u0641\u064a Web..."
  });

  Object.assign(translations.ja, {
    backgroundOpacityLabel: "\u80cc\u666f\u306e\u900f\u660e\u5ea6",
    searchPlaceholder: "Web \u3067\u691c\u7d22..."
  });

  Object.assign(translations.ko, {
    backgroundOpacityLabel: "\ubc30\uacbd \ud22c\uba85\ub3c4",
    searchPlaceholder: "Web\uc5d0\uc11c \uac80\uc0c9..."
  });

  var state = Object.assign({}, defaults, readState());

  var el = {
    root: document.documentElement,
    background: document.getElementById("background"),
    backgroundVideo: document.getElementById("backgroundVideo"),
    form: document.getElementById("searchForm"),
    search: document.getElementById("searchInput"),
    engineButton: document.getElementById("engineButton"),
    engineIcon: document.getElementById("engineIcon"),
    engineFallback: document.getElementById("engineFallback"),
    engineMenu: document.getElementById("engineMenu"),
    engineList: document.getElementById("engineList"),
    historyPopover: document.getElementById("historyPopover"),
    historyList: document.getElementById("historyList"),
    clearHistory: document.getElementById("clearHistoryButton"),
    languageToggle: document.getElementById("languageToggle"),
    languagePanel: document.getElementById("languagePanel"),
    languageOptions: document.getElementById("languageOptions"),
    settingsToggle: document.getElementById("settingsToggle"),
    settingsPanel: document.getElementById("settingsPanel"),
    wallpaperStatus: document.getElementById("wallpaperStatus"),
    engineSelect: document.getElementById("engineSelect"),
    customEngineName: document.getElementById("customEngineName"),
    customEngineUrl: document.getElementById("customEngineUrl"),
    addCustomEngine: document.getElementById("addCustomEngineButton"),
    customEngineList: document.getElementById("customEngineList"),
    sourceSelect: document.getElementById("sourceSelect"),
    chooseFile: document.getElementById("chooseFileButton"),
    fileInput: document.getElementById("fileInput"),
    localGallery: document.getElementById("localGallery"),
    advancedSection: document.getElementById("advancedSection"),
    overlayRange: document.getElementById("overlayRange"),
    backgroundOpacityRange: document.getElementById("backgroundOpacityRange")
  };

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
  }

  function saveState() {
    var persisted = Object.assign({}, state);
    delete persisted.videoDataUrl;
    persisted.imageDataUrl = "";
    persisted.localImages = Array.isArray(persisted.localImages) ? persisted.localImages.map(function (image) {
      var copy = Object.assign({}, image);
      delete copy.dataUrl;
      return copy;
    }) : [];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch (error) {
      persisted.iconCache = {};
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
        return;
      } catch (secondError) {}

      persisted.imageDataUrl = "";
      persisted.localImages = persisted.localImages.map(function (image) {
        var copy = Object.assign({}, image);
        delete copy.dataUrl;
        delete copy.thumbDataUrl;
        return copy;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    }
  }

  function normalizeState() {
    state.customEngines = normalizeCustomEngines(state.customEngines);
    migrateLegacyCustomEngine();

    if (!engines[state.engine] && !customEngineById(state.engine)) state.engine = defaults.engine;
    if (!["image", "video"].includes(state.source)) state.source = defaults.source;
    state.overlay = clamp(Number(state.overlay), 15, 82, defaults.overlay);
    state.backgroundOpacity = clamp(Number(state.backgroundOpacity), 35, 100, defaults.backgroundOpacity);
    state.history = Array.isArray(state.history) ? uniqueList(state.history).slice(0, MAX_HISTORY) : [];
    state.customEngineName = String(state.customEngineName || "");
    state.customEngineUrl = String(state.customEngineUrl || "");
    state.fileName = String(state.fileName || "");
    state.imageDataUrl = String(state.imageDataUrl || "");
    state.localImages = normalizeLocalImages(state.localImages);
    if (!state.localImages.length && state.imageDataUrl) {
      state.localImages = [{
        id: "legacy-" + Date.now(),
        name: state.fileName || "Local wallpaper",
        dataUrl: state.imageDataUrl
      }];
      state.activeImageId = state.localImages[0].id;
    }
    state.activeImageId = state.localImages.some(function (image) {
      return image.id === state.activeImageId;
    }) ? state.activeImageId : (state.localImages[0] && state.localImages[0].id || "");
    state.imageDataUrl = activeLocalImage() ? localImagePreview(activeLocalImage()) : "";
    state.language = languages.some(function (language) {
      return language.code === state.language;
    }) ? state.language : defaults.language;
    state.iconCache = state.iconCache && typeof state.iconCache === "object" ? state.iconCache : {};
  }

  function normalizeLocalImages(value) {
    if (!Array.isArray(value)) return [];

    return value.map(function (image, index) {
      var dataUrl = String(image && image.dataUrl || "");
      var thumbDataUrl = String(image && image.thumbDataUrl || "");
      if (dataUrl && dataUrl.indexOf("data:image/") !== 0) dataUrl = "";
      if (thumbDataUrl && thumbDataUrl.indexOf("data:image/") !== 0) thumbDataUrl = "";
      if (!dataUrl && !thumbDataUrl && !(image && image.id)) return null;

      return {
        id: String(image.id || "image-" + Date.now() + "-" + index),
        name: String(image.name || "Local wallpaper"),
        dataUrl: dataUrl,
        thumbDataUrl: thumbDataUrl || dataUrl
      };
    }).filter(Boolean).slice(0, 12);
  }

  function activeLocalImage() {
    return state.localImages.find(function (image) {
      return image.id === state.activeImageId;
    }) || state.localImages[0] || null;
  }

  function normalizeCustomEngines(value) {
    if (!Array.isArray(value)) return [];

    return value.map(function (engine, index) {
      var label = String(engine && (engine.label || engine.name) || "Custom").trim() || "Custom";
      var url = String(engine && engine.url || "").trim();
      if (!isValidCustomEngineUrl(url)) return null;

      return {
        id: String(engine.id || "custom-" + Date.now() + "-" + index),
        label: label.slice(0, 40),
        badge: label.slice(0, 1).toUpperCase(),
        url: url
      };
    }).filter(Boolean);
  }

  function migrateLegacyCustomEngine() {
    if (!isValidCustomEngineUrl(state.customEngineUrl)) return;

    var exists = state.customEngines.some(function (engine) {
      return engine.url === state.customEngineUrl;
    });

    if (!exists) {
      var label = (state.customEngineName || "Custom").trim();
      var migrated = {
        id: "custom-" + Date.now(),
        label: label,
        badge: label.slice(0, 1).toUpperCase(),
        url: state.customEngineUrl
      };
      state.customEngines.push(migrated);
      if (state.engine === "custom") state.engine = CUSTOM_PREFIX + migrated.id;
    }

    state.customEngineName = "";
    state.customEngineUrl = "";
  }

  function isValidCustomEngineUrl(value) {
    if (!value || !value.includes("{query}")) return false;

    try {
      var url = new URL(value.replace("{query}", "test"));
      return url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function clamp(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }

  function uniqueList(items) {
    var seen = [];
    items.forEach(function (item) {
      var value = String(item || "").trim();
      var key = value.toLowerCase();
      if (value && seen.every(function (existing) { return existing.toLowerCase() !== key; })) {
        seen.push(value);
      }
    });
    return seen;
  }

  function customEngineById(engineId) {
    if (!engineId || engineId.indexOf(CUSTOM_PREFIX) !== 0) return null;
    var id = engineId.slice(CUSTOM_PREFIX.length);
    var engine = state.customEngines.find(function (item) { return item.id === id; });
    return engine ? Object.assign({}, engine, { id: CUSTOM_PREFIX + engine.id }) : null;
  }

  function activeEngine() {
    if (state.engine.indexOf(CUSTOM_PREFIX) === 0) {
      var custom = customEngineById(state.engine);
      if (custom) return custom;
    }
    return Object.assign({ id: state.engine }, engines[state.engine] || engines.bing);
  }

  function engineOptions() {
    var options = Object.keys(engines).map(function (id) {
      return Object.assign({ id: id }, engines[id]);
    });

    state.customEngines.forEach(function (engine) {
      options.push(Object.assign({}, engine, { id: CUSTOM_PREFIX + engine.id }));
    });

    return options;
  }

  function applyState() {
    normalizeState();

    renderEngineSelect();
    el.engineSelect.value = activeEngine().id;
    el.sourceSelect.value = state.source;
    el.overlayRange.value = state.overlay;
    el.backgroundOpacityRange.value = state.backgroundOpacity;
    el.fileInput.accept = state.source === "video" ? "video/*" : "image/*";
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";

    setCssVars();
    translateSettings();
    updateEngineUI();
    applyBackground();
    renderHistory();
    renderLanguages();
    renderCustomEngines();
    renderLocalGallery();
    fitPanelsToViewport();
  }

  function t(key) {
    var pack = translations[state.language] || translations.en;
    return pack[key] || translations.en[key] || key;
  }

  function translateSettings() {
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-option]").forEach(function (node) {
      node.textContent = t(node.dataset.i18nOption);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });

    el.languageToggle.setAttribute("aria-label", t("languageTitle"));
    el.settingsPanel.setAttribute("aria-label", t("settingsTitle"));
    el.languagePanel.setAttribute("aria-label", t("languageTitle"));
  }

  function fitPanelsToViewport() {
    window.requestAnimationFrame(function () {
      var languageHeight = el.languagePanel.scrollHeight;
      var settingsHeight = el.settingsPanel.scrollHeight;
      var availableHeight = Math.max(280, window.innerHeight - 124);
      var languageScale = Math.min(1, availableHeight / Math.max(languageHeight, 1));
      var settingsScale = Math.min(1, availableHeight / Math.max(settingsHeight, 1));

      el.root.style.setProperty("--language-panel-scale", String(languageScale));
      el.root.style.setProperty("--settings-panel-scale", String(settingsScale));
    });
  }

  function setCssVars() {
    el.root.style.setProperty("--overlay-opacity", String(state.overlay / 100));
    el.root.style.setProperty("--background-opacity", String(state.backgroundOpacity / 100));
  }

  function updateEngineUI() {
    var engine = activeEngine();
    el.engineFallback.textContent = engine.badge;
    el.engineButton.title = "Search with " + engine.label;
    applyEngineIcon(el.engineButton, el.engineIcon, el.engineFallback, engine);
    renderEngineMenu();
    cacheEngineIcon(engine);
  }

  function renderEngineMenu() {
    el.engineList.textContent = "";

    engineOptions().forEach(function (engine) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      var image = document.createElement("img");
      var fallback = document.createElement("span");
      var label = document.createElement("span");

      item.className = "engine-option";
      item.dataset.engine = engine.id;
      button.type = "button";
      button.dataset.engine = engine.id;
      button.setAttribute("aria-pressed", String(engine.id === activeEngine().id));
      image.alt = "";
      image.width = 18;
      image.height = 18;
      fallback.className = "engine-fallback";
      fallback.textContent = engine.badge;
      label.className = "engine-option-label";
      label.textContent = engine.label;

      button.append(image, fallback, label);
      item.append(button);
      el.engineList.append(item);
      applyEngineIcon(item, image, fallback, engine);
      cacheEngineIcon(engine);
    });
  }

  function renderEngineSelect() {
    el.engineSelect.textContent = "";

    engineOptions().forEach(function (engine) {
      var option = document.createElement("option");
      option.value = engine.id;
      option.textContent = engine.label;
      el.engineSelect.append(option);
    });
  }

  function applyEngineIcon(container, image, fallback, engine) {
    var src = cachedIcon(engine) || faviconUrl(engine);
    container.classList.toggle("has-icon", Boolean(src));

    if (!src) {
      image.removeAttribute("src");
      fallback.hidden = false;
      return;
    }

    image.src = src;
    fallback.hidden = true;
    image.addEventListener("error", function () {
      image.removeAttribute("src");
      container.classList.remove("has-icon");
      fallback.hidden = false;
    }, { once: true });
  }

  function cachedIcon(engine) {
    return state.iconCache[iconCacheKey(engine)] || "";
  }

  function iconCacheKey(engine) {
    return engine.id + ":" + engineOrigin(engine);
  }

  function faviconUrl(engine) {
    var origin = engineOrigin(engine);
    return origin ? origin + "/favicon.ico" : "";
  }

  function engineOrigin(engine) {
    try {
      return new URL(engine.url.replace("{query}", "")).origin;
    } catch (error) {
      return "";
    }
  }

  function cacheEngineIcon(engine) {
    var key = iconCacheKey(engine);
    var url = faviconUrl(engine);
    if (!url || state.iconCache[key] || typeof fetch !== "function") return;

    fetchFavicon(url)
      .then(function (dataUrl) {
        if (!dataUrl) throw new Error("Empty favicon");
        return dataUrl;
      })
      .catch(function () {
        return fetchPageHtml(engine.url).then(function (html) {
          var iconSrc = findIconLink(html, engineOrigin(engine));
          return iconSrc ? fetchFavicon(iconSrc) : Promise.reject();
        });
      })
      .then(function (dataUrl) {
        if (!dataUrl) return;
        state.iconCache[key] = dataUrl;
        saveState();
        if (activeEngine().id === engine.id) updateEngineUI();
      })
      .catch(function () {});
  }

  function fetchFavicon(url) {
    return fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Icon request failed");
        return response.blob();
      })
      .then(blobToDataUrl);
  }

  function fetchPageHtml(engineUrl) {
    var pageUrl = engineUrl.replace("{query}", "");
    return fetch(pageUrl).then(function (response) {
      if (!response.ok) throw new Error("Page request failed");
      return response.text();
    });
  }

  function findIconLink(html, origin) {
    var re = /<link\b[^>]*>/gi;
    var match;

    while ((match = re.exec(html)) !== null) {
      var tag = match[0];
      var relMatch = tag.match(/\brel=["']([^"']+)["']/i);
      if (!relMatch) continue;

      var rel = relMatch[1].toLowerCase();
      if (rel !== "icon" && rel !== "shortcut icon") continue;

      var hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
      if (!hrefMatch) continue;

      var href = hrefMatch[1];
      if (href.indexOf("//") === 0) return location.protocol + href;
      if (href.indexOf("/") === 0) return origin + href;
      if (href.indexOf("http") !== 0) return origin + "/" + href;
      return href;
    }

    return null;
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.addEventListener("load", function () { resolve(String(reader.result || "")); });
      reader.addEventListener("error", function () { reject(reader.error); });
      reader.readAsDataURL(blob);
    });
  }

  function openWallpaperDb() {
    return new Promise(function (resolve, reject) {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is unavailable"));
        return;
      }

      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.addEventListener("upgradeneeded", function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      });
      request.addEventListener("success", function () { resolve(request.result); });
      request.addEventListener("error", function () { reject(request.error); });
    });
  }

  function imageStore(mode) {
    return openWallpaperDb().then(function (db) {
      return {
        db: db,
        store: db.transaction(DB_STORE, mode).objectStore(DB_STORE)
      };
    });
  }

  function localImageKey(id) {
    return "local-image-" + id;
  }

  function videoKey() {
    return "local-video";
  }

  function putLocalImageBlob(id, file) {
    return imageStore("readwrite").then(function (entry) {
      return new Promise(function (resolve, reject) {
        var request = entry.store.put({
          blob: file,
          type: file.type,
          name: file.name || "Local wallpaper"
        }, localImageKey(id));

        request.addEventListener("success", function () {
          entry.db.close();
          resolve();
        });
        request.addEventListener("error", function () {
          entry.db.close();
          reject(request.error);
        });
      });
    });
  }

  function putVideoBlob(file) {
    return imageStore("readwrite").then(function (entry) {
      return new Promise(function (resolve, reject) {
        var request = entry.store.put({
          blob: file,
          type: file.type,
          name: file.name || "Local wallpaper"
        }, videoKey());

        request.addEventListener("success", function () {
          entry.db.close();
          resolve();
        });
        request.addEventListener("error", function () {
          entry.db.close();
          reject(request.error);
        });
      });
    });
  }

  function getLocalImageBlob(id) {
    return imageStore("readonly").then(function (entry) {
      return new Promise(function (resolve, reject) {
        var request = entry.store.get(localImageKey(id));

        request.addEventListener("success", function () {
          var record = request.result;
          entry.db.close();
          resolve(record && record.blob || null);
        });
        request.addEventListener("error", function () {
          entry.db.close();
          reject(request.error);
        });
      });
    });
  }

  function getVideoBlob() {
    return imageStore("readonly").then(function (entry) {
      return new Promise(function (resolve, reject) {
        var request = entry.store.get(videoKey());

        request.addEventListener("success", function () {
          var record = request.result;
          entry.db.close();
          resolve(record && record.blob || null);
        });
        request.addEventListener("error", function () {
          entry.db.close();
          reject(request.error);
        });
      });
    });
  }

  function deleteLocalImageBlob(id) {
    return imageStore("readwrite").then(function (entry) {
      return new Promise(function (resolve, reject) {
        var request = entry.store.delete(localImageKey(id));

        request.addEventListener("success", function () {
          entry.db.close();
          resolve();
        });
        request.addEventListener("error", function () {
          entry.db.close();
          reject(request.error);
        });
      });
    }).catch(function () {});
  }

  function localImagePreview(image) {
    return image && (image.dataUrl || image.thumbDataUrl) || "";
  }

  function loadLocalImageUrl(image) {
    if (!image) return Promise.resolve("");
    if (runtimeUrls.localImages[image.id]) return Promise.resolve(runtimeUrls.localImages[image.id]);

    return getLocalImageBlob(image.id).then(function (blob) {
      if (!blob) return localImagePreview(image);
      runtimeUrls.localImages[image.id] = URL.createObjectURL(blob);
      return runtimeUrls.localImages[image.id];
    }).catch(function () {
      return localImagePreview(image);
    });
  }

  function loadVideoUrl() {
    if (runtimeUrls.video) return Promise.resolve(runtimeUrls.video);

    return getVideoBlob().then(function (blob) {
      if (!blob) return "";
      runtimeUrls.video = URL.createObjectURL(blob);
      return runtimeUrls.video;
    }).catch(function () {
      return "";
    });
  }

  function showVideoBackground(url) {
    if (el.backgroundVideo.src !== url) el.backgroundVideo.src = url;
    el.backgroundVideo.classList.add("active");
    el.backgroundVideo.play().catch(function () {});
  }

  function createLocalImageThumb(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();

      image.addEventListener("load", function () {
        var maxWidth = 640;
        var scale = Math.min(1, maxWidth / image.naturalWidth);
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");

        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      });
      image.addEventListener("error", function () {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to create wallpaper thumbnail"));
      });
      image.src = url;
    });
  }

  function applyBackground() {
    var localImage = activeLocalImage();
    var preview = localImagePreview(localImage);

    el.background.classList.remove("has-image");
    el.background.style.backgroundImage = "";
    el.backgroundVideo.classList.remove("active");

    if (state.source === "image" && localImage) {
      if (preview) {
        el.background.style.backgroundImage = "url(\"" + preview + "\")";
        el.background.classList.add("has-image");
      }
      loadLocalImageUrl(localImage).then(function (url) {
        if (state.source !== "image" || activeLocalImage() !== localImage || !url) return;
        el.background.style.backgroundImage = "url(\"" + url + "\")";
        el.background.classList.add("has-image");
      });
    }

    if (state.source === "video") {
      if (runtimeUrls.video) {
        showVideoBackground(runtimeUrls.video);
      } else {
        loadVideoUrl().then(function (url) {
          if (state.source !== "video" || !url) return;
          showVideoBackground(url);
        });
        el.backgroundVideo.removeAttribute("src");
        el.backgroundVideo.load();
      }
    } else {
      el.backgroundVideo.removeAttribute("src");
      el.backgroundVideo.load();
    }

    updateWallpaperSummary();
  }

  function updateWallpaperSummary() {
    var localImage = activeLocalImage();
    el.wallpaperStatus.textContent = localImage || state.fileName ? t("localWallpaper") : t("noFile");
    if (state.source === "image" && state.localImages.length > 1) {
      el.wallpaperStatus.textContent = t("localWallpaper") + " - " + state.localImages.length + " " + t("imageCount");
    }
  }

  function renderLocalGallery() {
    el.localGallery.textContent = "";
    el.localGallery.hidden = !(state.source === "image" && state.localImages.length);
    el.chooseFile.textContent = state.localImages.length && state.source === "image" ? t("addImage") : t("chooseFile");

    if (el.localGallery.hidden) return;

    state.localImages.forEach(function (image) {
      var card = document.createElement("button");
      var remove = document.createElement("span");

      card.type = "button";
      card.className = "local-thumb";
      card.dataset.selectLocalImage = image.id;
      card.classList.toggle("is-current", image.id === state.activeImageId);
      if (localImagePreview(image)) card.style.backgroundImage = "url(\"" + localImagePreview(image) + "\")";
      if (!localImagePreview(image)) {
        loadLocalImageUrl(image).then(function (url) {
          if (url) card.style.backgroundImage = "url(\"" + url + "\")";
        });
      }
      card.setAttribute("aria-label", image.name);

      remove.className = "local-thumb-delete";
      remove.setAttribute("data-delete-local-image", image.id);
      remove.setAttribute("aria-label", t("deleteImage"));
      remove.textContent = "x";

      card.append(remove);
      el.localGallery.append(card);
    });
  }

  function renderLanguages() {
    el.languageOptions.textContent = "";

    languages.forEach(function (language) {
      var option = document.createElement("button");
      option.type = "button";
      option.className = "language-option";
      option.dataset.language = language.code;
      option.textContent = language.name;
      option.classList.toggle("is-current", language.code === state.language);
      option.setAttribute("aria-label", "Use " + language.name);
      el.languageOptions.append(option);
    });
  }

  function renderCustomEngines() {
    el.customEngineList.textContent = "";

    state.customEngines.forEach(function (engine) {
      var item = document.createElement("li");
      var name = document.createElement("span");
      var use = document.createElement("button");
      var remove = document.createElement("button");

      name.className = "custom-engine-name";
      name.textContent = engine.label;
      use.type = "button";
      use.className = "custom-engine-action";
      use.textContent = "Use";
      use.dataset.useCustomEngine = engine.id;
      use.setAttribute("aria-label", "Use " + engine.label);
      remove.type = "button";
      remove.className = "custom-engine-action delete";
      remove.textContent = "Del";
      remove.dataset.deleteCustomEngine = engine.id;
      remove.setAttribute("aria-label", "Delete " + engine.label);

      item.append(name, use, remove);
      el.customEngineList.append(item);
    });
  }

  function searchUrl(query) {
    return activeEngine().url.replace("{query}", encodeURIComponent(query));
  }

  function submitSearch(event) {
    event.preventDefault();
    var query = el.search.value.trim();
    if (!query) return;

    addHistory(query);
    window.location.href = searchUrl(query);
  }

  function addHistory(query) {
    var lower = query.toLowerCase();
    state.history = [query].concat(state.history.filter(function (item) {
      return item.toLowerCase() !== lower;
    })).slice(0, MAX_HISTORY);
    saveState();
    renderHistory();
  }

  function removeHistory(query) {
    state.history = state.history.filter(function (item) { return item !== query; });
    saveState();
    renderHistory();
  }

  function renderHistory() {
    el.historyList.textContent = "";

    state.history.forEach(function (query) {
      var item = document.createElement("li");
      var open = document.createElement("button");
      var remove = document.createElement("button");

      open.type = "button";
      open.className = "history-query";
      open.textContent = query;
      open.dataset.query = query;
      remove.type = "button";
      remove.className = "history-delete";
      remove.textContent = "x";
      remove.dataset.remove = query;
      remove.setAttribute("aria-label", "Remove " + query);

      item.append(open, remove);
      el.historyList.append(item);
    });

    updateHistoryVisibility();
  }

  function updateHistoryVisibility() {
    var hasHistory = state.history.length > 0;
    var isActive = document.activeElement === el.search || el.historyPopover.contains(document.activeElement);
    el.historyPopover.hidden = !(hasHistory && isActive);
  }

  function setEngineMenuOpen(open) {
    el.engineMenu.hidden = !open;
    el.engineButton.setAttribute("aria-expanded", String(open));
    if (open) el.historyPopover.hidden = true;
  }

  function setPanelOpen(open) {
    el.settingsPanel.hidden = !open;
    el.settingsToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      setLanguagePanelOpen(false);
      fitPanelsToViewport();
    }
  }

  function setLanguagePanelOpen(open) {
    el.languagePanel.hidden = !open;
    el.languageToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      setPanelOpen(false);
      fitPanelsToViewport();
    }
  }

  function selectEngine(engineId) {
    if (engines[engineId] || customEngineById(engineId)) {
      state.engine = engineId;
      saveState();
      applyState();
    }
    setEngineMenuOpen(false);
  }

  function addLocalFiles(files) {
    var selected = Array.from(files || []).filter(function (file) {
      return file && file.type && file.type.indexOf("image/") === 0;
    });
    if (!selected.length) return;

    Promise.all(selected.map(function (file) {
      var id = "image-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

      return createLocalImageThumb(file).catch(function () {
        return readAsDataUrl(file);
      }).then(function (thumbDataUrl) {
        var image = {
          id: id,
          name: file.name || "Local wallpaper",
          thumbDataUrl: thumbDataUrl
        };

        return putLocalImageBlob(id, file).then(function () {
          return image;
        }).catch(function () {
          return readAsDataUrl(file).then(function (dataUrl) {
            image.dataUrl = dataUrl;
            image.thumbDataUrl = thumbDataUrl || dataUrl;
            return image;
          });
        });
      });
    })).then(function (images) {
      revokeRuntimeUrl("image");
      state.localImages = state.localImages.concat(images).slice(0, 12);
      state.activeImageId = images[images.length - 1].id;
      state.fileName = images[images.length - 1].name;
      state.imageDataUrl = localImagePreview(images[images.length - 1]);
      state.source = "image";
      saveState();
      applyState();
    });
  }

  function chooseLocalFile(file) {
    if (!file) return;
    state.fileName = file.name;

    if (file.type.indexOf("video/") === 0) {
      revokeRuntimeUrl("video");
      runtimeUrls.video = URL.createObjectURL(file);
      state.source = "video";
      state.imageDataUrl = "";
      saveState();
      applyState();
      putVideoBlob(file).catch(function () {});
      return;
    }

    addLocalFiles([file]);
  }

  function deleteLocalImage(id) {
    if (runtimeUrls.localImages[id]) {
      URL.revokeObjectURL(runtimeUrls.localImages[id]);
      delete runtimeUrls.localImages[id];
    }
    deleteLocalImageBlob(id);

    state.localImages = state.localImages.filter(function (image) {
      return image.id !== id;
    });
    if (state.activeImageId === id) {
      state.activeImageId = state.localImages[0] && state.localImages[0].id || "";
    }
    if (!state.localImages.length) {
      state.source = "image";
      state.fileName = "";
      state.imageDataUrl = "";
    }
    saveState();
    applyState();
  }

  function readAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.addEventListener("load", function () { resolve(String(reader.result || "")); });
      reader.addEventListener("error", function () { reject(reader.error); });
      reader.readAsDataURL(file);
    });
  }

  function revokeRuntimeUrl(kind) {
    if (runtimeUrls[kind] && runtimeUrls[kind].indexOf("blob:") === 0) {
      URL.revokeObjectURL(runtimeUrls[kind]);
    }
    runtimeUrls[kind] = "";
  }

  function addCustomEngine() {
    var label = el.customEngineName.value.trim();
    var url = el.customEngineUrl.value.trim();
    if (!label || !isValidCustomEngineUrl(url)) return;

    var engine = {
      id: "custom-" + Date.now(),
      label: label.slice(0, 40),
      badge: label.slice(0, 1).toUpperCase(),
      url: url
    };

    state.customEngines.push(engine);
    state.engine = CUSTOM_PREFIX + engine.id;
    el.customEngineName.value = "";
    el.customEngineUrl.value = "";
    saveState();
    applyState();
  }

  function deleteCustomEngine(id) {
    var engineId = CUSTOM_PREFIX + id;
    state.customEngines = state.customEngines.filter(function (engine) {
      return engine.id !== id;
    });
    if (state.engine === engineId) state.engine = defaults.engine;
    saveState();
    applyState();
  }

  function bindEvents() {
    window.addEventListener("resize", fitPanelsToViewport);

    el.form.addEventListener("submit", submitSearch);
    el.search.addEventListener("focus", updateHistoryVisibility);
    el.search.addEventListener("blur", function () { setTimeout(updateHistoryVisibility, 80); });

    el.engineButton.addEventListener("click", function () {
      setEngineMenuOpen(el.engineMenu.hidden);
    });

    el.engineList.addEventListener("click", function (event) {
      var option = event.target.closest("[data-engine]");
      if (!option || !el.engineList.contains(option)) return;
      event.stopPropagation();
      selectEngine(option.dataset.engine);
    });

    el.historyList.addEventListener("click", function (event) {
      var query = event.target.dataset.query;
      var remove = event.target.dataset.remove;

      if (remove) {
        removeHistory(remove);
        return;
      }

      if (query) {
        el.search.value = query;
        el.form.requestSubmit();
      }
    });

    el.clearHistory.addEventListener("click", function () {
      state.history = [];
      saveState();
      renderHistory();
    });

    el.languageToggle.addEventListener("click", function () {
      setLanguagePanelOpen(el.languagePanel.hidden);
    });

    el.languageOptions.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-language]");
      if (!button) return;
      state.language = button.dataset.language;
      saveState();
      applyState();
      setLanguagePanelOpen(false);
    });

    el.settingsToggle.addEventListener("click", function () {
      setPanelOpen(el.settingsPanel.hidden);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setEngineMenuOpen(false);
        setPanelOpen(false);
        setLanguagePanelOpen(false);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        el.search.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!el.engineMenu.hidden && !el.engineMenu.contains(event.target) && !el.engineButton.contains(event.target)) {
        setEngineMenuOpen(false);
      }

      if (!el.languagePanel.hidden && !el.languagePanel.contains(event.target) && !el.languageToggle.contains(event.target)) {
        setLanguagePanelOpen(false);
      }

      if (!el.settingsPanel.hidden && !el.settingsPanel.contains(event.target) && !el.settingsToggle.contains(event.target)) {
        setPanelOpen(false);
      }
    });

    el.engineSelect.addEventListener("change", function () {
      selectEngine(el.engineSelect.value);
    });

    el.addCustomEngine.addEventListener("click", addCustomEngine);
    el.customEngineName.addEventListener("keydown", submitCustomEngineOnEnter);
    el.customEngineUrl.addEventListener("keydown", submitCustomEngineOnEnter);

    el.customEngineList.addEventListener("click", function (event) {
      var useId = event.target.dataset.useCustomEngine;
      var deleteId = event.target.dataset.deleteCustomEngine;

      if (useId) {
        selectEngine(CUSTOM_PREFIX + useId);
        return;
      }

      if (deleteId) deleteCustomEngine(deleteId);
    });

    el.sourceSelect.addEventListener("change", function () {
      state.source = el.sourceSelect.value;
      saveState();
      applyState();
    });

    el.chooseFile.addEventListener("click", function () { el.fileInput.click(); });
    el.fileInput.addEventListener("change", function () {
      if (state.source === "video") {
        chooseLocalFile(el.fileInput.files && el.fileInput.files[0]);
      } else {
        addLocalFiles(el.fileInput.files);
      }
      el.fileInput.value = "";
    });

    el.localGallery.addEventListener("click", function (event) {
      var deleteId = event.target.dataset.deleteLocalImage;
      if (deleteId) {
        event.stopPropagation();
        deleteLocalImage(deleteId);
        return;
      }

      var select = event.target.closest("[data-select-local-image]");
      if (!select) return;
      state.activeImageId = select.dataset.selectLocalImage;
      state.source = "image";
      saveState();
      applyState();
    });

    el.overlayRange.addEventListener("input", function () {
      state.overlay = Number(el.overlayRange.value);
      setCssVars();
    });
    el.overlayRange.addEventListener("change", saveState);

    el.backgroundOpacityRange.addEventListener("input", function () {
      state.backgroundOpacity = Number(el.backgroundOpacityRange.value);
      setCssVars();
    });
    el.backgroundOpacityRange.addEventListener("change", saveState);
  }

  function submitCustomEngineOnEnter(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustomEngine();
  }

  bindEvents();
  applyState();
})();
