import { getMarketSnapshot } from '@/lib/binance-service';
import { getETFSnapshot } from '@/lib/etf-data';

type TrRow = {
  label: string;
  isin: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  price: number | null;
  currency: string;
  source: string;
  status: 'OK';
  ts: number;
};

export type LegacyLiveSnapshot = {
  xau: { symbol: string; bid: number; ask: number; price: number; ts: number } | null;
  xag: { symbol: string; bid: number; ask: number; price: number; ts: number } | null;
  eur: { symbol: string; bid: number; ask: number; price: number; ts: number } | null;
  xauEur: number | null;
  xagEur: number | null;
  tr: TrRow[];
  timestamp: string;
  source: string;
};

export type LegacyPairQuote = {
  pair: string;
  price: number | null;
  ts: number | null;
  bid?: number | null;
  ask?: number | null;
  last?: number | null;
  label?: string;
  isin?: string;
};

const SNAPSHOT_CACHE_MS = 2000;
let cachedSnapshot: LegacyLiveSnapshot | null = null;
let cachedAt = 0;
let inflightSnapshot: Promise<LegacyLiveSnapshot> | null = null;

function normalize(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

async function fetchExternalBotSnapshot(): Promise<LegacyLiveSnapshot | null> {
  const botUrl = process.env.MARKET_BOT_URL;
  if (!botUrl) return null;

  try {
    const token = process.env.MARKET_BOT_TOKEN;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${botUrl.replace(/\/$/, '')}/data`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as LegacyLiveSnapshot;
    return payload;
  } catch {
    return null;
  }
}

function withSyntheticBidAsk(price: number | null): { bid: number; ask: number; price: number } | null {
  if (price == null) return null;
  const halfSpread = price * 0.00025; // 2.5 bps each side
  return {
    bid: price - halfSpread,
    ask: price + halfSpread,
    price,
  };
}

export async function buildLegacyLiveSnapshot(): Promise<LegacyLiveSnapshot> {
  const bridged = await fetchExternalBotSnapshot();
  if (bridged) {
    return {
      ...bridged,
      source: 'market-bot-bridge',
      timestamp: new Date().toISOString(),
    };
  }

  const [market, etf] = await Promise.all([getMarketSnapshot(), Promise.resolve(getETFSnapshot())]);

  const xau = withSyntheticBidAsk(market.xauUsd.price);
  const xag = withSyntheticBidAsk(market.xagUsd.price);
  const eur = withSyntheticBidAsk(market.eurUsd.price);

  const tr: TrRow[] = etf.etfs.map((row) => ({
    label: row.name,
    isin: row.isin,
    bid: row.bid,
    ask: row.ask,
    last: row.last,
    price: row.last,
    currency: row.currency,
    source: row.source,
    status: 'OK',
    ts: row.timestamp,
  }));

  return {
    xau: xau
      ? { symbol: market.xauUsd.binanceSymbol, bid: xau.bid, ask: xau.ask, price: xau.price, ts: market.timestamp }
      : null,
    xag: xag
      ? { symbol: market.xagUsd.binanceSymbol, bid: xag.bid, ask: xag.ask, price: xag.price, ts: market.timestamp }
      : null,
    eur: eur
      ? { symbol: market.eurUsd.binanceSymbol, bid: eur.bid, ask: eur.ask, price: eur.price, ts: market.timestamp }
      : null,
    xauEur: market.xauEur.price,
    xagEur: market.xagEur.price,
    tr,
    timestamp: new Date().toISOString(),
    source: 'binance+trade-republic',
  };
}

export async function getLegacyLiveSnapshot(maxAgeMs: number = SNAPSHOT_CACHE_MS): Promise<LegacyLiveSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedAt <= Math.max(0, maxAgeMs)) {
    return cachedSnapshot;
  }

  if (inflightSnapshot) {
    return inflightSnapshot;
  }

  inflightSnapshot = buildLegacyLiveSnapshot()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      cachedAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      inflightSnapshot = null;
    });

  return inflightSnapshot;
}

export function resolveLegacyPair(snapshot: LegacyLiveSnapshot, pairInput: string): LegacyPairQuote | null {
  const target = normalize(pairInput);

  const directMap: Record<string, () => LegacyPairQuote> = {
    XAUUSD: () => ({
      pair: 'XAUUSD',
      price: snapshot.xau?.price ?? null,
      bid: snapshot.xau?.bid ?? null,
      ask: snapshot.xau?.ask ?? null,
      ts: snapshot.xau?.ts ?? null,
    }),
    XAGUSD: () => ({
      pair: 'XAGUSD',
      price: snapshot.xag?.price ?? null,
      bid: snapshot.xag?.bid ?? null,
      ask: snapshot.xag?.ask ?? null,
      ts: snapshot.xag?.ts ?? null,
    }),
    EURUSD: () => ({
      pair: 'EURUSD',
      price: snapshot.eur?.price ?? null,
      bid: snapshot.eur?.bid ?? null,
      ask: snapshot.eur?.ask ?? null,
      ts: snapshot.eur?.ts ?? null,
    }),
    XAUEUR: () => ({
      pair: 'XAUEUR',
      price: snapshot.xauEur,
      ts: snapshot.xau?.ts ?? null,
    }),
    XAGEUR: () => ({
      pair: 'XAGEUR',
      price: snapshot.xagEur,
      ts: snapshot.xag?.ts ?? null,
    }),
  };

  const direct = directMap[target];
  if (direct) {
    return direct();
  }

  const trMatch = snapshot.tr.find(
    (row) => normalize(row.isin) === target || normalize(row.label) === target
  );

  if (!trMatch) {
    return null;
  }

  return {
    pair: trMatch.isin,
    label: trMatch.label,
    isin: trMatch.isin,
    bid: trMatch.bid,
    ask: trMatch.ask,
    last: trMatch.last,
    price: trMatch.price,
    ts: trMatch.ts,
  };
}
