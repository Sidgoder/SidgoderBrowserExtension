const fields = {
  ip: document.getElementById("ip-value"),
  country: document.getElementById("country-value"),
  region: document.getElementById("region-value"),
  city: document.getElementById("city-value"),
  postal: document.getElementById("postal-value"),
  isp: document.getElementById("isp-value"),
  timezone: document.getElementById("timezone-value"),
  latitude: document.getElementById("latitude-value"),
  longitude: document.getElementById("longitude-value"),
  updatedAt: document.getElementById("updated-at"),
  statusBanner: document.getElementById("status-banner")
};

const refreshButton = document.getElementById("refresh-button");
const copyButton = document.getElementById("copy-button");
const LOADING_TEXT = "加载中...";
const LAST_UPDATED_PREFIX = "最近更新：";

refreshButton.addEventListener("click", () => loadData(true));
copyButton.addEventListener("click", copyIp);

loadData(false);

async function loadData(forceRefresh) {
  setLoadingState(true);
  hideStatus();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_IP_INFO",
      forceRefresh
    });

    if (!response?.ok) {
      throw new Error(response?.error || "加载失败，请稍后重试");
    }

    renderData(response.data);

    if (response.data.stale) {
      showStatus(`当前显示的是缓存结果：${response.data.staleReason}`);
    }
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "加载失败，请稍后重试");
    renderEmptyState();
  } finally {
    setLoadingState(false);
  }
}

async function copyIp() {
  const ip = fields.ip.textContent?.trim();

  if (!isCopyableIp(ip)) {
    showStatus("当前没有可复制的 IP 地址");
    return;
  }

  try {
    await navigator.clipboard.writeText(ip);
    showStatus("IP 地址已复制");
  } catch (_error) {
    showStatus("复制失败，请检查浏览器权限");
  }
}

function renderData(data) {
  fields.ip.textContent = data.ip;
  fields.country.textContent = data.country;
  fields.region.textContent = data.region;
  fields.city.textContent = data.city;
  fields.postal.textContent = data.postal;
  fields.isp.textContent = data.isp;
  fields.timezone.textContent = data.timezone;
  fields.latitude.textContent = String(data.latitude);
  fields.longitude.textContent = String(data.longitude);
  fields.updatedAt.textContent = `${LAST_UPDATED_PREFIX}${formatTime(data.cachedAt)}`;
  updateCopyButtonState();
}

function renderEmptyState() {
  fields.ip.textContent = "-";
  fields.country.textContent = "-";
  fields.region.textContent = "-";
  fields.city.textContent = "-";
  fields.postal.textContent = "-";
  fields.isp.textContent = "-";
  fields.timezone.textContent = "-";
  fields.latitude.textContent = "-";
  fields.longitude.textContent = "-";
  fields.updatedAt.textContent = `${LAST_UPDATED_PREFIX}-`;
  updateCopyButtonState();
}

function setLoadingState(loading) {
  refreshButton.disabled = loading;
  refreshButton.textContent = loading ? "加载中" : "刷新";
  copyButton.disabled = loading || !isCopyableIp(fields.ip.textContent?.trim());

  if (loading) {
    fields.ip.textContent = LOADING_TEXT;
  }
}

function showStatus(message) {
  fields.statusBanner.textContent = message;
  fields.statusBanner.classList.remove("hidden");
}

function hideStatus() {
  fields.statusBanner.textContent = "";
  fields.statusBanner.classList.add("hidden");
}

function updateCopyButtonState() {
  copyButton.disabled = !isCopyableIp(fields.ip.textContent?.trim());
}

function isCopyableIp(ip) {
  return Boolean(ip && ip !== "-" && ip !== LOADING_TEXT);
}

function formatTime(isoString) {
  if (!isoString) {
    return "-";
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}
