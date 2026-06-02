# Backend reference (Node.js + Express)

Deploy these routes on the same host as existing `v2.3/common` APIs. This folder is **reference only** — the CDS repo is frontend-only.

## Suggested modules

```
auth/
  login.controller.js      # PIN login + OTP trigger
  pin.controller.js        # setup_pin, reset_pin
  token.service.js         # JWT issue / refresh
  pin.service.js           # bcrypt hash, verify, lockout
  rateLimit.middleware.js
  validatePin.middleware.js
```

## PIN service sketch

```javascript
const bcrypt = require("bcrypt");
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

async function verifyPin(user, plainPin) {
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw lockedError(user.locked_until);
  }
  if (!user.pin_hash) {
    return { requiresPinSetup: true };
  }
  const ok = await bcrypt.compare(plainPin, user.pin_hash);
  if (ok) {
    await resetAttempts(user.id);
    return { valid: true };
  }
  await incrementFailedAttempts(user.id);
  return { valid: false };
}

async function setPin(userId, plainPin) {
  const pin_hash = await bcrypt.hash(plainPin, 12);
  await db.query(
    "UPDATE users SET pin_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?",
    [pin_hash, userId]
  );
}
```

Wire `POST /login`, `/setup_pin`, `/reset_pin`, `/refresh_token` to match `docs/PIN_AUTH.md`.
