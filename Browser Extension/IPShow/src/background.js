const CACHE_KEY = "ipshow-cache";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;

const GEO_PROVIDERS = [
  {
    name: "ip.sb",
    url: "https://api.ip.sb/geoip",
    isError(payload) {
      return Boolean(payload?.error || payload?.message);
    },
    normalize(payload) {
      return createNormalizedPayload({
        ip: payload.ip,
        country: payload.country,
        region: payload.region,
        city: payload.city,
        postal: payload.postal_code || payload.postal,
        timezone: payload.timezone,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isp: payload.organization || payload.org
      });
    }
  },
  {
    name: "GeoJS",
    url: "https://get.geojs.io/v1/ip/geo.json",
    isError(payload) {
      return Boolean(payload?.error);
    },
    normalize(payload) {
      return createNormalizedPayload({
        ip: payload.ip,
        country: payload.country,
        region: payload.region || payload.region_name,
        city: payload.city,
        postal: payload.postal || payload.postal_code,
        timezone: payload.timezone,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isp: payload.organization || payload.org || payload.asn_name
      });
    }
  },
  {
    name: "ipapi",
    url: "https://ipapi.co/json/",
    isError(payload) {
      return Boolean(payload?.error);
    },
    normalize(payload) {
      return createNormalizedPayload({
        ip: payload.ip,
        country: payload.country_name || payload.country,
        region: payload.region,
        city: payload.city,
        postal: payload.postal,
        timezone: payload.timezone,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isp: payload.org
      });
    }
  }
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "GET_IP_INFO") {
    return false;
  }

  getIpInfo(Boolean(message.forceRefresh))
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: getErrorMessage(error)
      });
    });

  return true;
});

async function getIpInfo(forceRefresh) {
  const cached = await readCache();

  if (!forceRefresh && isFresh(cached)) {
    return cached;
  }

  try {
    const normalized = await fetchIpInfo();
    await chrome.storage.local.set({ [CACHE_KEY]: normalized });
    return normalized;
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    if (cached) {
      return {
        ...cached,
        stale: true,
        staleReason: errorMessage
      };
    }

    throw new Error(errorMessage);
  }
}

async function fetchIpInfo() {
  const errors = [];

  for (const provider of GEO_PROVIDERS) {
    try {
      const payload = await fetchProvider(provider);
      const normalized = provider.normalize(payload);
      return {
        ...normalized,
        provider: provider.name
      };
    } catch (error) {
      errors.push(`${provider.name}: ${getErrorMessage(error)}`);
    }
  }

  throw new Error(`All IP services are temporarily unavailable. ${errors.join("; ")}`);
}

async function fetchProvider(provider) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(provider.url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let payload;

    try {
      payload = await response.json();
    } catch (_error) {
      throw new Error("Invalid JSON response");
    }

    if (provider.isError(payload)) {
      throw new Error(payload.message || payload.reason || "Service returned an error");
    }

    return payload;
  } catch (error) {
    throw normalizeFetchError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

function createNormalizedPayload(payload) {
  return {
    ip: payload.ip || "-",
    country: payload.country || "-",
    region: payload.region || "-",
    city: payload.city || "-",
    postal: payload.postal || "-",
    timezone: payload.timezone || "-",
    latitude: payload.latitude ?? "-",
    longitude: payload.longitude ?? "-",
    isp: payload.isp || "-",
    cachedAt: new Date().toISOString()
  };
}

async function readCache() {
  const result = await chrome.storage.local.get(CACHE_KEY);
  return result[CACHE_KEY] || null;
}

function isFresh(data) {
  if (!data?.cachedAt) {
    return false;
  }

  const updatedAt = Date.parse(data.cachedAt);
  if (Number.isNaN(updatedAt)) {
    return false;
  }

  return Date.now() - updatedAt < CACHE_TTL_MS;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : "Failed to load IP information";
}

function normalizeFetchError(error) {
  if (error?.name === "AbortError") {
    return new Error("Request timed out");
  }

  if (error instanceof TypeError) {
    return new Error("Network request failed");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to load IP information");
}
