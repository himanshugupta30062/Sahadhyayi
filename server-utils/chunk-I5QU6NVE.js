// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// src/integrations/supabase/previewAuthStorage.ts
function brokeredPreviewStorage() {
  var _a, _b;
  if (typeof window === "undefined")
    return void 0;
  const host = location.hostname;
  const PREVIEW_ZONES = ["lovableproject.com", "lovableproject-dev.com", "lovable.app", "gpt-eng.com", "gptengineer.run"];
  const onPreviewZone = PREVIEW_ZONES.some((z) => host === z || host.endsWith("." + z));
  const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const projectId = onPreviewZone ? ((_a = host.match(new RegExp("^(?:id-preview(?:-[a-z0-9]+)?|project)--(" + UUID + ")(?:-dev)?(?=\\.|$)", "i"))) == null ? void 0 : _a[1]) ?? ((_b = host.match(new RegExp("^(" + UUID + ")(?=[.-])", "i"))) == null ? void 0 : _b[1]) : void 0;
  const framed = window.parent && window.parent !== window;
  if (!projectId || !framed)
    return localStorage;
  const dev = host.endsWith(".lovableproject-dev.com") || host.endsWith(".gpt-eng.com");
  const EDITOR = dev ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/ : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
  const ancestor = location.ancestorOrigins && location.ancestorOrigins[0] || (document.referrer ? new URL(document.referrer).origin : "");
  const editorOrigins = ancestor && EDITOR.test(ancestor) ? [ancestor] : dev ? ["https://lovable.dev", "http://localhost:3000"] : ["https://lovable.dev"];
  const RESULT = "lovable-preview-auth:result";
  const TIMEOUT = 2e3;
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const request = (type, key, value) => new Promise((resolve) => {
    const requestId = newId();
    let done = false;
    const finish = (r) => {
      if (done)
        return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(r);
    };
    const onMessage = (e) => {
      if (editorOrigins.indexOf(e.origin) < 0)
        return;
      const d = e.data;
      if (d && d.type === RESULT && d.requestId === requestId)
        finish(d);
    };
    window.addEventListener("message", onMessage);
    const msg = { type, requestId, projectId, key };
    if (value !== void 0)
      msg["value"] = value;
    for (const origin of editorOrigins)
      window.parent.postMessage(msg, origin);
    const timer = setTimeout(() => finish(null), TIMEOUT);
  });
  let firstGet = true;
  const RETRY_DELAY = 250;
  return {
    getItem: async (key) => {
      let res = await request("lovable-preview-auth:get", key);
      if (!res && firstGet) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        res = await request("lovable-preview-auth:get", key);
      }
      firstGet = false;
      if (res && res.ok && typeof res.value === "string") {
        if (res.value === "") {
          localStorage.removeItem(key);
          return null;
        }
        return res.value;
      }
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
      return request("lovable-preview-auth:set", key, value).then(() => void 0);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
      return request("lovable-preview-auth:remove", key).then(() => void 0);
    }
  };
}

// src/integrations/supabase/client.ts
var SUPABASE_URL = "https://rknxtatvlzunatpyqxro.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U";
var supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  },
  global: {
    headers: {
      "X-Client-Info": "sahadhyayi-app"
    }
  }
});

export {
  supabase
};
