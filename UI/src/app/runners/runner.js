// runner.js — place at: public/runner.js
//
// The Background Runner context only has access to:
//   - CapacitorKV   (key/value store)
//   - CapacitorNotifications
//   - CapacitorDevice
//   - fetch, setTimeout, console, crypto
//
// Health plugins are NOT available here.
// Health data must be read in the Angular app (foreground) and
// the step count stored in CapacitorKV before the app is backgrounded.
// This runner then reads that cached value and posts it to the backend.

addEventListener('syncSteps', async (resolve, reject, args) => {
  try {
    // Read the step count that was cached by the Angular app before backgrounding
    const stepsResult = await CapacitorKV.get({ key: 'cached_steps_today' });
    const dateResult = await CapacitorKV.get({ key: 'cached_steps_date' });
    const tokenResult = await CapacitorKV.get({ key: 'access_token' });
    const urlResult = await CapacitorKV.get({ key: 'api_base_url' });

    const steps = parseInt(stepsResult?.value ?? '0', 10);
    const date = dateResult?.value;
    const accessToken = tokenResult?.value;
    const apiUrl = urlResult?.value ?? 'http://192.168.1.XXX:3000/api';

    if (!accessToken || !date) {
      console.log('[BackgroundRunner] Missing token or date — skipping sync');
      resolve();
      return;
    }

    const response = await fetch(`${apiUrl}/steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ steps, date }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[BackgroundRunner] Sync failed:', err.message);
    } else {
      console.log(`[BackgroundRunner] Synced ${steps} steps for ${date}`);
    }

    resolve();
  } catch (err) {
    console.error('[BackgroundRunner] Error:', err);
    reject(err);
  }
});
