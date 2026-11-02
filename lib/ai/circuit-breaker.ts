import { createAdminClient } from '@/lib/supabase/admin';

interface RouteIdentifier {
  provider: string;
  model: string;
}

export async function isCircuitOpen(route: RouteIdentifier): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('ai_provider_state')
      .select('state, opened_at, open_ms')
      .eq('provider', route.provider)
      .eq('model', route.model)
      .single();

    if (!data) return false;

    if (data.state === 'open') {
      const openedAt = new Date(data.opened_at).getTime();
      const now = Date.now();
      if (now - openedAt > data.open_ms) {
        // Transition to half_open
        await admin
          .from('ai_provider_state')
          .update({ state: 'half_open', updated_at: new Date().toISOString() })
          .eq('provider', route.provider)
          .eq('model', route.model);
        return false; // allow one probe
      }
      return true; // still open
    }

    return false;
  } catch (err) {
    // Fail-open: if DB check fails, don't block the request
    return false;
  }
}

export async function recordSuccess(route: RouteIdentifier) {
  try {
    const admin = createAdminClient();
    await admin
      .from('ai_provider_state')
      .upsert({
        provider: route.provider as any,
        model: route.model,
        state: 'closed',
        failures: 0,
        opened_at: null,
        updated_at: new Date().toISOString(),
      });
  } catch (err) {
    // ignore
  }
}

export async function recordFailure(route: RouteIdentifier, errorKind: string, errorMessage: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('ai_provider_state')
      .select('failures, open_ms')
      .eq('provider', route.provider)
      .eq('model', route.model)
      .single();

    const currentFailures = (data?.failures || 0) + 1;
    let nextState = 'closed';
    let openedAt = null;
    let openMs = data?.open_ms || 60000;

    if (errorKind === 'AUTH') {
      nextState = 'open';
      openedAt = new Date().toISOString();
      openMs = 900000; // 15 mins for auth failure
    } else if (currentFailures >= 5) {
      nextState = 'open';
      openedAt = new Date().toISOString();
      openMs = Math.min(openMs * 2, 300000); // backoff up to 5 min
    }

    await admin
      .from('ai_provider_state')
      .upsert({
        provider: route.provider as any,
        model: route.model,
        state: nextState,
        failures: currentFailures,
        opened_at: openedAt,
        open_ms: openMs,
        last_error: errorMessage.slice(0, 500),
        updated_at: new Date().toISOString(),
      });
  } catch (err) {
    // ignore
  }
}
