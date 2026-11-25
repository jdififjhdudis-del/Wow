const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  // Accept requests only from this Pages site's own origin.
  const origin = request.headers.get("Origin");
  const requestUrl = new URL(request.url);
  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host || new URL(origin).protocol !== "https:") {
        return json({ error: "Origin not allowed." }, 403);
      }
    } catch {
      return json({ error: "Invalid origin." }, 403);
    }
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "JSON required." }, 415);
  }

  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 1024) return json({ error: "Request too large." }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return json({ error: "Invalid Roblox username." }, 400);
  }

  try {
    const lookup = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    });

    if (lookup.status === 429) return json({ error: "Roblox rate limit reached. Try again shortly." }, 429);
    if (!lookup.ok) return json({ error: "Roblox user lookup is temporarily unavailable." }, 502);

    const lookupData = await lookup.json();
    const user = lookupData?.data?.[0];
    if (!user?.id) return json({ error: "لم يتم العثور على هذا الحساب." }, 404);

    const id = Number(user.id);
    if (!Number.isSafeInteger(id) || id <= 0) return json({ error: "Invalid user record." }, 502);

    const [profileRes, thumbRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${id}`, { headers: { "Accept": "application/json" } }),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`, { headers: { "Accept": "application/json" } })
    ]);

    if (!profileRes.ok) return json({ error: "Could not load this public profile." }, 502);
    const profile = await profileRes.json();
    let avatar = null;
    if (thumbRes.ok) {
      const thumb = await thumbRes.json();
      avatar = thumb?.data?.[0]?.imageUrl || null;
    }

    return json({
      id,
      name: profile.name || user.name,
      displayName: profile.displayName || user.displayName || profile.name,
      description: typeof profile.description === "string" ? profile.description.slice(0, 1000) : "",
      created: profile.created || null,
      isBanned: Boolean(profile.isBanned),
      avatar
    });
  } catch {
    return json({ error: "Network error while contacting Roblox. Please try again." }, 502);
  }
}
