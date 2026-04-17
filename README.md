# RAD Maintenance Fallback — Cloudflare Worker + Static Page

Automated fallback system for [radrd.net](https://radrd.net). When the home lab goes offline (power failure, tunnel drop, etc.), visitors are transparently served a branded maintenance page instead of a generic Cloudflare error.

---

## Architecture

```
User Request → radrd.net
                    │
                    ▼
         Cloudflare Worker (radrd-fallback)
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
    Origin healthy?       502/523/530 or
    → Pass through        network failure?
                          → Serve fallback
                                │
                                ▼
                    Cloudflare Pages (static)
                    summer-cake-8053.williamgalan.workers.dev
```

The Worker runs at the edge and acts as a transparent proxy. When the origin (Ghost via Cloudflare Tunnel) is unreachable, the Worker intercepts the failure and returns the static maintenance page instead. The Pages deployment is fully on Cloudflare's edge — it remains available regardless of home lab status.

---

## Files

### `worker.js`
The Cloudflare Worker script deployed to the `radrd-fallback` Worker application.

**What it does:**
- Intercepts all requests to `radrd.net/*`
- Forwards requests to the origin normally when the site is healthy
- Catches HTTP error codes `502`, `523`, `530` (tunnel dead / origin unreachable) and network-level exceptions
- On failure, fetches and returns the static maintenance page with a `503 Service Unavailable` status

**Key constant:**
```javascript
const FALLBACK = "https://summer-cake-8053.williamgalan.workers.dev";
```
Update this URL if the Pages project is redeployed or renamed.

---

### `index.html`
The static maintenance page deployed to Cloudflare Pages.

**Characteristics:**
- Fully self-contained — no external asset dependencies except Google Fonts
- RAD brand styling: `#EF6B5B` accent on dark background `#0e0c0c`
- Typography: DM Serif Display (headline) + Space Mono (body)
- RAD bunny logo embedded as base64 (no separate image file needed)
- Scan line animation and grain overlay for aesthetic texture
- Copy in Spanish

---

## Cloudflare Configuration

| Component | Name | Type |
|-----------|------|------|
| Traffic cop | `radrd-fallback` | Worker |
| Static fallback | `summer-cake-8053` | Pages project |
| Worker route | `radrd.net/*` | Zone route |

> ⚠️ The Pages project must **not** be directly assigned to the `radrd.net` domain route. It only serves as the fallback source fetched by the Worker. Assigning it directly to the route bypasses the Worker logic entirely.

---

## Deployment

### Updating the Worker
1. Edit `worker.js` locally
2. Go to **Cloudflare Dashboard → Workers & Pages → radrd-fallback**
3. Edit the Worker code and deploy

Or via Wrangler CLI:
```bash
wrangler deploy worker.js --name radrd-fallback
```

### Updating the Maintenance Page
1. Edit `index.html`
2. Push to the GitHub repo connected to the Pages project
3. Cloudflare Pages redeploys automatically on push to the main branch

---

## Testing

To verify the fallback is working:
1. Stop the Cloudflare Tunnel on the home lab (or shut down Ghost)
2. Visit [radrd.net](https://radrd.net) from a browser
3. Within a few seconds you should see the RAD maintenance page (HTTP 503)
4. Restart the tunnel — normal site resumes with no configuration changes needed
