# ROBLOX INTEL — Cloudflare Pages

## Deploy
1. Extract the ZIP.
2. Upload the extracted project to a GitHub repository (or use Wrangler).
3. In Cloudflare Dashboard, open **Workers & Pages → Create → Pages → Connect to Git**.
4. Select the repository.
5. Framework preset: **None**. Build command: leave empty. Build output directory: `/`.
6. Deploy. The `functions/api/user.js` file creates the `/api/user` endpoint automatically.

Do not upload only `index.html`: the `functions` folder is required for the API proxy.

## Included
- Arabic RTL responsive interface, blue animated design.
- Username lookup through Roblox public endpoints.
- Public profile fields: user ID, username, display name, description, account creation date, public banned flag, avatar headshot.
- Server-side Cloudflare Pages Function; no Roblox cookie, password, API key, or secret required.
- Input validation, POST-only endpoint, request size/content-type checks, same-origin browser request check, safe error handling, no arbitrary URL proxy.

## Recommended extra Cloudflare protection
In Cloudflare Dashboard, add a **WAF rate limiting rule** for `*/api/user`:
- Method: POST
- Example threshold: 20 requests per IP per 1 minute
- Action: Managed Challenge or Block for a short period
Tune this based on real traffic. The Function intentionally does not pretend to provide a globally accurate per-IP limiter without a Cloudflare rate-limiting product/rule.

## Notes
- Only public Roblox profile data is displayed. Private inventory, email, password, Robux balance, private presence, and private account data are not requested.
- Roblox may change or rate-limit public endpoints. A temporary Roblox/API failure will show an error instead of exposing server details.
- The site is an independent fan-made project and is not affiliated with Roblox.
