const storage = globalThis.chrome?.storage?.local;
const localKey = "onlyTabSettings";
const runtimeBackground = {
  imageUrl: "",
  videoUrl: ""
};

const state = {
  searchEngine: "bing",
  opacity: 56,
  language: "en-US",
  theme: "light",
  source: "blank",
  backgroundFileName: "",
  backgroundDataUrl: "",
  backgroundVideoName: "",
  searchHistory: [],
  weather: {
    temperature: null,
    code: null,
    updatedAt: 0,
    locationName: ""
  }
};

const searchTargets = {
  bing: "https://www.bing.com/search?q=",
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  baidu: "https://www.baidu.com/s?wd="
};

const translations = {
  "en-US": {
    pageLabel: "OnlyTab new tab page",
    conditionsLabel: "Current conditions",
    searchLabel: "Search",
    openSettings: "Open settings",
    placeholder: "",
    panelTitle: "Settings",
    generalTitle: "General",
    languageLabel: "Interface Language",
    themeLabel: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    englishOption: "English (US)",
    chineseOption: "Chinese (Simplified)",
    engineLabel: "Search Engine",
    appearanceTitle: "Background & Appearance",
    sourceLabel: "Background Format",
    blankSource: "Default",
    imageSource: "Image",
    videoSource: "Video",
    pathLabel: "Current File Path",
    emptyPath: "Click to choose a background file",
    storedPath: "Selected image: ",
    storedVideoPath: "Selected video: ",
    opacityLabel: "Opacity",
    historyTitle: "Recent Searches",
    clearHistory: "Clear All",
    deleteHistory: "Delete",
    location: "Locating...",
    locating: "Locating...",
    locationDenied: "Location unavailable",
    weatherUnavailable: "Weather unavailable"
  },
  "zh-CN": {
    pageLabel: "\u004f\u006e\u006c\u0079\u0054\u0061\u0062 \u65b0\u6807\u7b7e\u9875",
    conditionsLabel: "\u5f53\u524d\u72b6\u6001",
    searchLabel: "\u641c\u7d22",
    openSettings: "\u6253\u5f00\u8bbe\u7f6e",
    placeholder: "",
    panelTitle: "\u8bbe\u7f6e",
    generalTitle: "\u901a\u7528",
    languageLabel: "\u754c\u9762\u8bed\u8a00",
    themeLabel: "\u4e3b\u9898",
    lightTheme: "\u6d45\u8272",
    darkTheme: "\u6df1\u8272",
    englishOption: "\u82f1\u8bed\uff08\u7f8e\u56fd\uff09",
    chineseOption: "\u7b80\u4f53\u4e2d\u6587",
    engineLabel: "\u641c\u7d22\u5f15\u64ce",
    appearanceTitle: "\u80cc\u666f\u4e0e\u5916\u89c2",
    sourceLabel: "\u80cc\u666f\u683c\u5f0f",
    blankSource: "\u9ed8\u8ba4",
    imageSource: "\u56fe\u7247",
    videoSource: "\u89c6\u9891",
    pathLabel: "\u5f53\u524d\u6587\u4ef6\u8def\u5f84",
    emptyPath: "\u70b9\u51fb\u9009\u62e9\u80cc\u666f\u6587\u4ef6",
    storedPath: "\u5df2\u9009\u56fe\u7247\uff1a",
    storedVideoPath: "\u5df2\u9009\u89c6\u9891\uff1a",
    opacityLabel: "\u900f\u660e\u5ea6",
    historyTitle: "\u641c\u7d22\u8bb0\u5f55",
    clearHistory: "\u5168\u90e8\u5220\u9664",
    deleteHistory: "\u5220\u9664",
    location: "\u6b63\u5728\u5b9a\u4f4d...",
    locating: "\u6b63\u5728\u5b9a\u4f4d...",
    locationDenied: "\u65e0\u6cd5\u83b7\u53d6\u4f4d\u7f6e",
    weatherUnavailable: "\u65e0\u6cd5\u83b7\u53d6\u5929\u6c14"
  }
};

const elements = {
  html: document.documentElement,
  background: document.querySelector("#background"),
  backgroundVideo: document.querySelector("#backgroundVideo"),
  veil: document.querySelector("#veil"),
  clock: document.querySelector("#clockText"),
  date: document.querySelector("#dateText"),
  form: document.querySelector("#searchForm"),
  input: document.querySelector("#searchInput"),
  panel: document.querySelector("#customizePanel"),
  settingsButton: document.querySelector("#settingsButton"),
  historyPanel: document.querySelector("#searchHistoryPanel"),
  historyList: document.querySelector("#searchHistoryList"),
  clearHistory: document.querySelector("#clearHistoryButton"),
  language: document.querySelector("#languageSelect"),
  engine: document.querySelector("#engineSelect"),
  theme: document.querySelector("#themeSelect"),
  source: document.querySelector("#sourceSelect"),
  path: document.querySelector("#pathText"),
  file: document.querySelector("#imageFile"),
  opacity: document.querySelector("#opacityRange"),
  location: document.querySelector("#locationText"),
  temperature: document.querySelector("#temperatureText"),
  weatherIcon: document.querySelector(".sun-icon"),
  languageOptions: document.querySelectorAll("#languageSelect option"),
  i18n: document.querySelectorAll("[data-i18n]"),
  i18nAria: document.querySelectorAll("[data-i18n-aria]")
};

function copy() {
  return translations[state.language] ?? translations["en-US"];
}

function updateClock() {
  const now = new Date();
  const locale = state.language === "zh-CN" ? "zh-CN" : "en-US";

  elements.clock.textContent = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: state.language !== "zh-CN"
  }).format(now);

  elements.date.textContent = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(now);
}

function applyLanguage() {
  const text = copy();

  elements.html.lang = state.language === "zh-CN" ? "zh-CN" : "en";
  elements.input.placeholder = text.placeholder;

  elements.i18n.forEach((node) => {
    node.textContent = text[node.dataset.i18n] ?? node.textContent;
  });

  elements.i18nAria.forEach((node) => {
    node.setAttribute("aria-label", text[node.dataset.i18nAria] ?? node.getAttribute("aria-label"));
  });

  elements.languageOptions[0].textContent = text.englishOption;
  elements.languageOptions[1].textContent = text.chineseOption;
  updatePathText();
  updateWeatherDisplay();
  renderSearchHistory();
  updateClock();
}

function updateWeatherDisplay(status) {
  const text = copy();
  const temperature = Number.isFinite(state.weather?.temperature)
    ? `${Math.round(state.weather.temperature)}\u00b0C`
    : "--\u00b0C";

  elements.location.textContent = status ?? (state.weather.locationName || text.location);
  elements.temperature.textContent = temperature;
  elements.weatherIcon.dataset.weather = weatherKind(state.weather?.code);
}

function updatePathText() {
  const text = copy();

  if (state.source === "video" && state.backgroundVideoName) {
    elements.path.value = `${text.storedVideoPath}${state.backgroundVideoName || "video"}`;
    return;
  }

  if (state.source === "image" && state.backgroundFileName) {
    elements.path.value = `${text.storedPath}${state.backgroundFileName || "image"}`;
    return;
  }

  elements.path.value = text.emptyPath;
}

function applyBackground() {
  elements.veil.style.opacity = `${state.opacity / 100}`;
  elements.file.accept = state.source === "video" ? "video/*" : "image/*";
  elements.background.classList.toggle("has-image", state.source === "image" && Boolean(runtimeBackground.imageUrl));
  elements.backgroundVideo.classList.toggle("active", state.source === "video" && Boolean(runtimeBackground.videoUrl));

  if (state.source === "image" && runtimeBackground.imageUrl) {
    elements.background.style.backgroundImage = `url("${runtimeBackground.imageUrl}")`;
  } else {
    elements.background.style.backgroundImage = "";
  }

  if (state.source === "video" && runtimeBackground.videoUrl) {
    elements.backgroundVideo.src = runtimeBackground.videoUrl;
    elements.backgroundVideo.play().catch(() => {});
  } else {
    elements.backgroundVideo.removeAttribute("src");
    elements.backgroundVideo.load();
  }
}

function applyState() {
  elements.engine.value = state.searchEngine;
  elements.language.value = state.language;
  elements.theme.value = state.theme;
  elements.opacity.value = state.opacity;
  elements.source.value = state.source;
  elements.html.dataset.theme = state.theme;

  applyLanguage();
  applyBackground();
  renderSearchHistory();
}

function weatherKind(code) {
  if (!Number.isFinite(code)) {
    return "sun";
  }

  if (code >= 95) {
    return "storm";
  }

  if (code >= 71 && code <= 86) {
    return "snow";
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "rain";
  }

  if (code >= 1 && code <= 48) {
    return "cloud";
  }

  return "sun";
}

function requestWeather() {
  const text = copy();

  if (!("geolocation" in navigator)) {
    updateWeatherDisplay(text.locationDenied);
    return;
  }

  updateWeatherDisplay(text.locating);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeather(latitude, longitude);
      fetchLocationName(latitude, longitude);
    },
    () => updateWeatherDisplay(text.locationDenied),
    {
      enableHighAccuracy: false,
      maximumAge: 30 * 60 * 1000,
      timeout: 8000
    }
  );
}

async function fetchLocationName(latitude, longitude) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", latitude.toFixed(5));
  url.searchParams.set("longitude", longitude.toFixed(5));
  url.searchParams.set("localityLanguage", "zh");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Location request failed: ${response.status}`);
    }

    const data = await response.json();
    const locationName = uniqueParts([
      data.locality,
      data.city,
      data.principalSubdivision,
      data.countryName
    ]).slice(0, 3).join(", ");

    if (locationName) {
      state.weather.locationName = locationName;
      elements.location.textContent = locationName;
      saveState();
    }
  } catch {
    elements.location.textContent = copy().locationDenied;
  }
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    const data = await response.json();
    state.weather = {
      temperature: data.current?.temperature_2m,
      code: data.current?.weather_code,
      updatedAt: Date.now(),
      locationName: state.weather.locationName
    };
    updateWeatherDisplay();
    saveState();
  } catch {
    updateWeatherDisplay(copy().weatherUnavailable);
  }
}

function saveState() {
  const settings = getPersistedState();
  safeSetLocalSettings(settings);
  storage?.set({ onlyTabSettings: settings })?.catch(() => {});
}

function safeSetLocalSettings(settings) {
  try {
    localStorage.removeItem(localKey);
    localStorage.setItem(localKey, JSON.stringify(settings));
  } catch {
    localStorage.removeItem(localKey);
  }
}

function getPersistedState() {
  const {
    searchEngine,
    opacity,
    language,
    theme,
    source,
    backgroundFileName,
    backgroundDataUrl,
    backgroundVideoName,
    searchHistory,
    weather
  } = state;

  return {
    searchEngine,
    opacity,
    language,
    theme,
    source,
    backgroundFileName,
    backgroundDataUrl,
    backgroundVideoName,
    searchHistory,
    weather
  };
}

function uniqueParts(parts) {
  const seen = new Set();

  return parts.filter((part) => {
    const value = String(part ?? "").trim();
    const key = value.toLowerCase();

    if (!value || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function setPanelOpen(isOpen) {
  elements.panel.classList.toggle("closed", !isOpen);
  elements.settingsButton.setAttribute("aria-expanded", String(isOpen));
}

function handleSearch(event) {
  event.preventDefault();
  const query = elements.input.value.trim();

  if (!query) {
    return;
  }

  addSearchHistory(query);
  const target = searchTargets[state.searchEngine] ?? searchTargets.bing;
  window.location.href = `${target}${encodeURIComponent(query)}`;
}

function addSearchHistory(query) {
  state.searchHistory = [
    query,
    ...state.searchHistory.filter((item) => item.toLowerCase() !== query.toLowerCase())
  ].slice(0, 8);
  saveState();
  renderSearchHistory();
}

function removeSearchHistory(query) {
  state.searchHistory = state.searchHistory.filter((item) => item !== query);
  saveState();
  renderSearchHistory();
}

function clearSearchHistory() {
  state.searchHistory = [];
  saveState();
  renderSearchHistory();
}

function renderSearchHistory() {
  const text = copy();
  const items = state.searchHistory.filter(Boolean);

  elements.historyPanel.hidden = items.length === 0;
  elements.historyList.textContent = "";

  items.forEach((query) => {
    const item = document.createElement("li");
    const searchButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    searchButton.type = "button";
    searchButton.className = "history-query";
    searchButton.textContent = query;
    searchButton.dataset.query = query;

    deleteButton.type = "button";
    deleteButton.className = "history-delete";
    deleteButton.textContent = "\u00d7";
    deleteButton.dataset.deleteQuery = query;
    deleteButton.setAttribute("aria-label", `${text.deleteHistory}: ${query}`);
    deleteButton.title = text.deleteHistory;

    item.append(searchButton, deleteButton);
    elements.historyList.append(item);
  });
}

async function readImageFile(file, rawPath) {
  if (!file) {
    return;
  }

  if (file.type.startsWith("video/")) {
    const objectUrl = URL.createObjectURL(file);
    revokeRuntimeUrl("video");
    runtimeBackground.videoUrl = objectUrl;
    state.backgroundVideoName = displayFilePath(file, rawPath);
    state.source = "video";
  } else {
    revokeRuntimeUrl("image");
    state.backgroundDataUrl = await readFileAsDataUrl(file);
    runtimeBackground.imageUrl = state.backgroundDataUrl;
    state.backgroundFileName = displayFilePath(file, rawPath);
    state.source = "image";
  }

  applyState();
  saveState();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function revokeRuntimeUrl(type) {
  const key = type === "video" ? "videoUrl" : "imageUrl";

  if (runtimeBackground[key]?.startsWith("blob:")) {
    URL.revokeObjectURL(runtimeBackground[key]);
    runtimeBackground[key] = "";
  }
}

function displayFilePath(file, rawPath) {
  return rawPath || file.webkitRelativePath || file.name;
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSearch);

  elements.settingsButton.addEventListener("click", () => {
    setPanelOpen(elements.panel.classList.contains("closed"));
  });

  elements.language.addEventListener("change", () => {
    state.language = elements.language.value;
    applyState();
    saveState();
    requestWeather();
  });

  elements.engine.addEventListener("change", () => {
    state.searchEngine = elements.engine.value;
    saveState();
  });

  elements.theme.addEventListener("change", () => {
    state.theme = elements.theme.value;
    applyState();
    saveState();
  });

  elements.historyList.addEventListener("click", (event) => {
    const query = event.target.dataset.query;
    const deleteQuery = event.target.dataset.deleteQuery;

    if (deleteQuery) {
      removeSearchHistory(deleteQuery);
      return;
    }

    if (query) {
      elements.input.value = query;
      elements.form.requestSubmit();
    }
  });

  elements.clearHistory.addEventListener("click", clearSearchHistory);

  elements.source.addEventListener("change", () => {
    state.source = elements.source.value;
    applyState();
    saveState();
  });

  elements.path.addEventListener("click", () => elements.file.click());

  elements.opacity.addEventListener("input", () => {
    state.opacity = Number(elements.opacity.value);
    elements.veil.style.opacity = `${state.opacity / 100}`;
  });

  elements.opacity.addEventListener("change", saveState);

  elements.file.addEventListener("change", () => readImageFile(elements.file.files?.[0], elements.file.value));
}

async function restoreState() {
  let shouldRewriteStorage = false;
  const localSettings = localStorage.getItem(localKey);

  if (localSettings) {
    try {
      const parsed = JSON.parse(localSettings);
      shouldRewriteStorage = hasLegacyBackgroundData(parsed);
      if (shouldRewriteStorage) {
        localStorage.removeItem(localKey);
      }
      Object.assign(state, parsed);
    } catch {
      localStorage.removeItem(localKey);
    }
  }

  normalizeState();

  if (!storage) {
    restoreRuntimeBackground();
    applyState();
    if (shouldRewriteStorage) {
      saveState();
    }
    requestWeather();
    return;
  }

  const saved = await storage.get("onlyTabSettings");
  shouldRewriteStorage = shouldRewriteStorage || hasLegacyBackgroundData(saved.onlyTabSettings);
  Object.assign(state, saved.onlyTabSettings ?? {});
  normalizeState();
  restoreRuntimeBackground();
  applyState();
  if (shouldRewriteStorage) {
    saveState();
  }
  requestWeather();
}

function hasLegacyBackgroundData(settings) {
  return Boolean(settings?.backgroundVideoUrl);
}

function normalizeState() {
  delete state.backgroundVideoUrl;

  if (state.theme !== "dark") {
    state.theme = "light";
  }

  if (state.source === "static" || state.source === "folder") {
    state.source = "image";
  }

  if (!["blank", "image", "video"].includes(state.source)) {
    state.source = "blank";
  }

  if (typeof state.backgroundFileName !== "string") {
    state.backgroundFileName = "";
  }

  if (typeof state.backgroundDataUrl !== "string") {
    state.backgroundDataUrl = "";
  }

  if (typeof state.backgroundVideoName !== "string") {
    state.backgroundVideoName = "";
  }

  if (!Array.isArray(state.searchHistory)) {
    state.searchHistory = [];
  }

  if (!state.weather || typeof state.weather !== "object") {
    state.weather = {
      temperature: null,
      code: null,
      updatedAt: 0,
      locationName: ""
    };
  }

  if (typeof state.weather.locationName !== "string") {
    state.weather.locationName = "";
  }
}

function restoreRuntimeBackground() {
  runtimeBackground.imageUrl = state.backgroundDataUrl;
}

bindEvents();
restoreState();
setInterval(updateClock, 1000);
