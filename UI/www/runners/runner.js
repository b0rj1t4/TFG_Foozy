// Save a value to the Capacitor KV store
addEventListener('testSave', async (resolve, reject, args) => {
  try {
    CapacitorKV.set('foo', 'my bar 42');
    resolve();
  } catch (err) {
    console.error(err);
    reject(err);
  }
});

// Get a value from the Capacitor KV store
addEventListener('testLoad', async (resolve, reject, args) => {
  try {
    const value = CapacitorKV.get('foo');
    resolve(value);
  } catch (err) {
    console.error(err);
    reject(err);
  }
});

// Make a fetch request to the randomuser API and return first user

addEventListener('fetchTest', async (resolve, reject, args) => {
  try {
    const res = await fetch('https://randomuser.me/api/');
    if (!res.ok) {
      throw new Error('Could not fetch user');
    }
    const result = await res.json();
    resolve(result['results'][0]);
  } catch (err) {
    console.error(err);
    reject(err);
  }
});

// Trigger a local notification

addEventListener('notificationTest', async (resolve, reject, args) => {
  try {
    let scheduleDate = new Date();
    scheduleDate.setSeconds(scheduleDate.getSeconds() + 5);
    CapacitorNotifications.schedule([
      {
        id: 42,
        title: 'Background Magic 🧙‍♂️',
        body: 'This comes from the background runner',
        scheduleAt: scheduleDate,
      },
    ]);
    resolve();
  } catch (err) {
    console.error(err);
    reject(err);
  }
});

addEventListener('syncSteps', async (resolve, reject, args) => {
  try {
    // 1. Read today's steps from the device health store
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    const healthResult = await CapacitorHealthkit.queryHKitSampleType({
      sampleName: 'stepCount',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 0,
      ascending: false,
    });

    const steps = (healthResult.resultData ?? []).reduce(
      (sum, sample) => sum + (sample.quantity ?? 0),
      0,
    );

    // 2. Read the stored access token
    const tokenResult = await CapacitorKV.get({ key: 'access_token' });
    const accessToken = tokenResult?.value;

    if (!accessToken) {
      console.log('[BackgroundRunner] No access token — skipping sync');
      resolve();
      return;
    }

    // 3. Read the stored API base URL
    // const urlResult = await CapacitorKV.get({ key: 'api_base_url' });
    const apiUrl = 'http://192.168.4.20:3000/api';

    // 4. POST to backend — upsert for today (one record per day)
    const dateStr = today.toISOString().split('T')[0];

    const response = await fetch(`${apiUrl}/steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ steps, date: dateStr }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[BackgroundRunner] Sync failed', err.message);
    } else {
      console.log(`[BackgroundRunner] Synced ${steps} steps for ${dateStr}`);
    }

    resolve();
  } catch (err) {
    console.error('[BackgroundRunner] Error', err);
    reject(err);
  }
});
