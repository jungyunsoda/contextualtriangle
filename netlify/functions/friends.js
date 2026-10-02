import { getStore } from "@netlify/blobs";

const KEY = "list";
const MAX = 200;

export default async (req) => {
  try {
    if (req.method === "GET") {
      const { list } = await readList();
      return json({ friends: publish(list) });
    }

    if (req.method !== "POST") {
      return json({ error: "Could not save." }, 405);
    }

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: "Add a name." }, 400);
    }

    const action = body && body.action;
    if (action === "add") return addFriend(body);
    if (action === "update") return updateFriend(body);
    if (action === "remove") return removeFriend(body);
    return json({ error: "Could not save." }, 400);
  } catch (e) {
    return json({ error: "Could not save." }, 500);
  }
};

async function addFriend(body) {
  const entry = cleanEntry(body);
  if (!entry) return json({ error: "Add a name." }, 400);
  const token = randomToken();
  entry.id = crypto.randomUUID();
  entry.tokenHash = await hashToken(token);

  const result = await changeList(function (list) {
    if (list.length >= MAX) return { error: "The list is full." };
    list.push(entry);
    return { list: list };
  });
  if (result.error) return json({ error: result.error }, 400);
  return json({
    friend: { id: entry.id, name: entry.name, keywords: entry.keywords },
    token: token,
  });
}

async function updateFriend(body) {
  const entry = cleanEntry(body);
  if (!entry || !body.id || !body.token) {
    return json({ error: "Add a name." }, 400);
  }
  const tokenHash = await hashToken(String(body.token));
  const result = await changeList(function (list) {
    const index = list.findIndex(function (item) {
      return item.id === body.id;
    });
    if (index === -1) return { error: "That name is no longer on the list." };
    if (!safeEqual(list[index].tokenHash, tokenHash)) {
      return { error: "You can only edit a name you added in this browser." };
    }
    list[index] = {
      id: list[index].id,
      name: entry.name,
      keywords: entry.keywords,
      tokenHash: list[index].tokenHash,
    };
    return { list: list };
  });
  if (result.error) return json({ error: result.error }, 403);
  return json({ ok: true });
}

async function removeFriend(body) {
  if (!body.id || !body.token) {
    return json({ error: "You can only remove a name you added in this browser." }, 403);
  }
  const tokenHash = await hashToken(String(body.token));
  const result = await changeList(function (list) {
    const index = list.findIndex(function (item) {
      return item.id === body.id;
    });
    if (index === -1) return { error: "That name is no longer on the list." };
    if (!safeEqual(list[index].tokenHash, tokenHash)) {
      return { error: "You can only remove a name you added in this browser." };
    }
    list.splice(index, 1);
    return { list: list };
  });
  if (result.error) return json({ error: result.error }, 403);
  return json({ ok: true });
}

function cleanEntry(body) {
  const name = body && String(body.name || "").trim().slice(0, 80);
  if (!name) return null;
  const keywords = [];
  const source = typeof body.keywords === "string" ? body.keywords.split(",") : body.keywords;
  if (Array.isArray(source)) {
    source.forEach(function (word) {
      const text = String(word || "").trim().slice(0, 60);
      if (text && keywords.length < 12) keywords.push(text);
    });
  }
  return { name: name, keywords: keywords };
}

function publish(list) {
  return list.map(function (item) {
    return { id: item.id, name: item.name, keywords: item.keywords };
  });
}

function store() {
  return getStore({ name: "friends", consistency: "strong" });
}

async function readList() {
  let result = null;
  try {
    result = await store().getWithMetadata(KEY, {
      type: "json",
      consistency: "strong",
    });
  } catch (e) {
    result = null;
  }
  const list = result && Array.isArray(result.data) ? result.data : [];
  return { list: list, etag: result && result.etag };
}

async function changeList(mutate) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readList();
    const next = mutate(current.list.slice());
    if (next.error) return next;
    const options = current.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true };
    const written = await store().setJSON(KEY, next.list, options);
    if (written && written.modified) return { list: next.list };
  }
  return { error: "Someone else saved at the same time. Try again." };
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, function (byte) {
    return byte.toString(16).padStart(2, "0");
  }).join("");
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), function (byte) {
    return byte.toString(16).padStart(2, "0");
  }).join("");
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
