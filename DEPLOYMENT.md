## Deployment – Menumitra Customer Display (v2)

### 1. Environments and domains

- **Production**  
  - Frontend: `https://menu4.xyz/v2.2` (and/or `https://menu4.xyz/v2`)  
  - Backend APIs and WebSocket are served from `https://menu4.xyz` and `wss://menu4.xyz`.

- **Testing**  
  - Frontend: `https://menusmitra.xyz/v2.2` (and/or `https://menusmitra.xyz/v2`)  
  - Backend APIs and WebSocket are served from `https://menusmitra.xyz` and `wss://menusmitra.xyz`.

- **Development**  
  - Frontend/API/WebSocket host: `https://men4u.xyz`

All environment-specific configuration is centralized in `src/config/apiConfig.js`. Use the single `CURRENT_ENV` switch to choose which environment to build for.

```js
// src/config/apiConfig.js
// SINGLE SWITCH: change this to 'production' | 'testing' | 'development'
const CURRENT_ENV = 'production';
```

### 2. URL structure

From `apiConfig.js`, the app builds URLs as:

- `ENV.V2_COMMON_BASE = https://<domain>/v2.2/common`
- `ENV.COMMON_API_BASE = https://<domain>/common_api`
- `ENV.API_BASE = https://<domain>/api`

Core calls include:

- Login / OTP / orders / subscription: `ENV.V2_COMMON_BASE/...`
- Generic APIs: `ENV.API_BASE/...`
- Logout: `ENV.COMMON_API_BASE/logout`

Do **not** add `/v2` or `/v2.2` directly into `API_HOST`; the versioned path is appended via these base constants.

### 3. Build commands

From the project root:

```bash
npm install
npm run build
```

The `build` output is created in the `build/` folder and also copies `index.html` to `404.html` for SPA routing:

```json
"build": "CI=false react-scripts build && cp build/index.html build/404.html"
```

### 4. Building for each environment

#### Production – `menu4.xyz`

1. In `src/config/apiConfig.js`, set:

   ```js
   const CURRENT_ENV = 'production';
   ```

2. Build:

   ```bash
   npm run build
   ```

3. Deploy the contents of the `build/` folder to the web server that serves `https://menu4.xyz` (configure it so the app is reachable at `/v2.2` or `/v2` as required).

#### Testing – `menusmitra.xyz`

1. In `src/config/apiConfig.js`, set:

   ```js
   const CURRENT_ENV = 'testing';
   ```

2. Build:

   ```bash
   npm run build
   ```

3. Deploy the `build/` folder contents to the server for `https://menusmitra.xyz` (again serving the app under `/v2.2` or `/v2` as needed).

#### Local / development – `men4u.xyz`

For a dev/test environment that uses `https://men4u.xyz`:

1. Set:

   ```js
   const CURRENT_ENV = 'development';
   ```

2. Run:

   ```bash
   npm start
   ```

   or build with `npm run build` and serve the `build/` directory from your dev server.

### 5. Quick verification checklist

- After deploying, confirm:
  - Login/OTP flow works (no console errors).
  - Outlets load in the header and dropdowns.
  - Orders update live (WebSocket connection succeeds).
  - Logout clears session and redirects to login page.
  - The red “TESTING ENVIRONMENT” banner shows only when `CURRENT_ENV` is set to `testing`.

