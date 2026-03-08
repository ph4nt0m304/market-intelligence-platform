#!/usr/bin/env python3
"""
Market Intelligence Python bridge.

Features:
- Collect snapshot data from Next.js API
- Export one-shot Excel files
- Live Excel refresh loop (default every 20 seconds)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime
from typing import Any, Dict, Optional

import requests

try:
    import xlwings as xw

    HAS_XLWINGS = True
except ImportError:
    HAS_XLWINGS = False


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("python_api_client")


def _safe(value: Any, fallback: str = "-") -> Any:
    return fallback if value is None else value


def _fmt_ts(value: Any) -> str:
    if value is None:
        return "-"
    if isinstance(value, (int, float)):
        try:
            return datetime.fromtimestamp(float(value) / 1000.0).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return str(value)
    return str(value)


class ApiClient:
    def __init__(self, api_url: str, timeout: int = 10) -> None:
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def _get(self, path: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.session.get(f"{self.api_url}{path}", timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.error("GET %s failed: %s", path, exc)
            return None

    def get_legacy_data(self) -> Optional[Dict[str, Any]]:
        return self._get("/api/data")

    def get_etf_snapshot(self) -> Optional[Dict[str, Any]]:
        return self._get("/api/etf/snapshot")

    def get_market_snapshot(self) -> Optional[Dict[str, Any]]:
        return self._get("/api/market/snapshot")

    def get_combined_snapshot(self) -> Optional[Dict[str, Any]]:
        """
        Prefer /api/data (legacy-compatible unified endpoint).
        Fall back to combining /api/market/snapshot + /api/etf/snapshot.
        """
        data = self.get_legacy_data()
        if data:
            return data

        market = self.get_market_snapshot()
        etf = self.get_etf_snapshot()
        if not market or not etf:
            return None

        m = market.get("data", {})
        ts = int(m.get("timestamp") or time.time() * 1000)

        def _mk_row(row: Dict[str, Any]) -> Dict[str, Any]:
            return {
                "label": row.get("name"),
                "isin": row.get("isin"),
                "bid": row.get("bid"),
                "ask": row.get("ask"),
                "last": row.get("last"),
                "price": row.get("last"),
                "currency": row.get("currency"),
                "source": row.get("source", "Trade Republic"),
                "status": "OK",
                "ts": row.get("timestamp", ts),
            }

        xau = m.get("xauUsd", {})
        xag = m.get("xagUsd", {})
        eur = m.get("eurUsd", {})
        tr_rows = [_mk_row(row) for row in etf.get("data", [])]

        return {
            "xau": {
                "symbol": xau.get("binanceSymbol"),
                "bid": xau.get("price"),
                "ask": xau.get("price"),
                "price": xau.get("price"),
                "ts": ts,
            }
            if xau
            else None,
            "xag": {
                "symbol": xag.get("binanceSymbol"),
                "bid": xag.get("price"),
                "ask": xag.get("price"),
                "price": xag.get("price"),
                "ts": ts,
            }
            if xag
            else None,
            "eur": {
                "symbol": eur.get("binanceSymbol"),
                "bid": eur.get("price"),
                "ask": eur.get("price"),
                "price": eur.get("price"),
                "ts": ts,
            }
            if eur
            else None,
            "xauEur": (m.get("xauEur") or {}).get("price"),
            "xagEur": (m.get("xagEur") or {}).get("price"),
            "tr": tr_rows,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "binance+trade-republic",
        }


class ExcelWriter:
    def __init__(self, excel_file: str) -> None:
        self.excel_file = excel_file

    def write_snapshot(self, snapshot: Dict[str, Any]) -> bool:
        if not HAS_XLWINGS:
            logger.error("xlwings is not installed. Install with: pip install xlwings")
            return False

        app = None
        wb = None
        try:
            if os.path.exists(self.excel_file):
                app = xw.App(visible=False, add_book=False)
                wb = app.books.open(self.excel_file)
            else:
                app = xw.App(visible=False)
                wb = app.books.add()

            ws = wb.sheets["Prices"] if "Prices" in [s.name for s in wb.sheets] else wb.sheets.add("Prices")
            ws.clear()

            headers = ["Pair", "Bid", "Ask", "Price", "Source", "Timestamp"]
            ws.range("A1").value = headers
            ws.range("A1:F1").font.bold = True

            row = 2
            for key, label in [("xau", "XAUUSD"), ("xag", "XAGUSD"), ("eur", "EURUSD")]:
                v = snapshot.get(key) or {}
                ws.range(f"A{row}").value = [
                    label,
                    _safe(v.get("bid")),
                    _safe(v.get("ask")),
                    _safe(v.get("price")),
                    "Binance",
                    _fmt_ts(v.get("ts")),
                ]
                row += 1

            for key, label in [("xauEur", "XAUEUR"), ("xagEur", "XAGEUR")]:
                ws.range(f"A{row}").value = [label, "-", "-", _safe(snapshot.get(key)), "Derived", _fmt_ts(snapshot.get("timestamp"))]
                row += 1

            tr_rows = snapshot.get("tr", [])
            if tr_rows:
                row += 1
                ws.range(f"A{row}").value = "Trade Republic"
                ws.range(f"A{row}").font.bold = True
                row += 1
                for tr in tr_rows:
                    ws.range(f"A{row}").value = [
                        tr.get("label") or tr.get("isin"),
                        _safe(tr.get("bid")),
                        _safe(tr.get("ask")),
                        _safe(tr.get("price") if tr.get("price") is not None else tr.get("last")),
                        tr.get("source", "Trade Republic"),
                        _fmt_ts(tr.get("ts")),
                    ]
                    row += 1

            row += 1
            ws.range(f"A{row}").value = f"Updated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            ws.range(f"A{row}").font.italic = True
            ws.autofit()

            wb.save(self.excel_file)
            return True
        except Exception as exc:
            logger.error("Excel write failed: %s", exc)
            return False
        finally:
            try:
                if wb is not None:
                    wb.close()
            except Exception:
                pass
            try:
                if app is not None:
                    app.quit()
            except Exception:
                pass


def save_json(output_dir: str, payload: Dict[str, Any], prefix: str) -> str:
    os.makedirs(output_dir, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    out_path = os.path.join(output_dir, f"{prefix}_{stamp}.json")
    with open(out_path, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, indent=2, ensure_ascii=False)
    return out_path


def run_once(
    client: ApiClient,
    output_dir: str,
    writer: Optional[ExcelWriter],
    export_excel: bool,
    write_json: bool,
) -> bool:
    snapshot = client.get_combined_snapshot()
    if not snapshot:
        logger.error("No data available from API")
        return False

    if write_json:
        json_path = save_json(output_dir, snapshot, "market_snapshot")
        logger.info("Saved JSON snapshot: %s", json_path)

    if export_excel and writer:
        if writer.write_snapshot(snapshot):
            logger.info("Excel exported: %s", writer.excel_file)
        else:
            return False
    return True


def run_live(
    client: ApiClient,
    output_dir: str,
    writer: Optional[ExcelWriter],
    export_excel: bool,
    write_json: bool,
    interval_seconds: int,
    max_iterations: Optional[int],
) -> bool:
    interval = max(1, interval_seconds)
    if interval > 20:
        logger.warning("Interval %ss too slow for realtime target. Clamping to 20s.", interval)
        interval = 20

    logger.info("Starting live mode. Refresh every %ss.", interval)
    i = 0
    try:
        while True:
            i += 1
            ok = run_once(client, output_dir, writer, export_excel, write_json)
            if not ok:
                logger.warning("Iteration %s failed; retrying on next cycle.", i)

            if max_iterations is not None and i >= max_iterations:
                logger.info("Reached max iterations (%s).", max_iterations)
                return ok

            time.sleep(interval)
    except KeyboardInterrupt:
        logger.info("Live loop interrupted by user.")
        return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Market Intelligence Python bridge")
    parser.add_argument("--api-url", default="http://localhost:3000", help="Base URL of Next.js app")
    parser.add_argument("--output-dir", default="./data", help="Directory for JSON snapshots")
    parser.add_argument("--excel-file", default="./data/market_data.xlsx", help="Excel output file")
    parser.add_argument("--export-excel", action="store_true", help="Write Excel output")
    parser.add_argument("--no-json", action="store_true", help="Disable JSON dump")
    parser.add_argument("--live", action="store_true", help="Continuous mode")
    parser.add_argument("--interval", type=int, default=20, help="Refresh interval in seconds (max 20 for realtime)")
    parser.add_argument("--max-iterations", type=int, default=None, help="Stop after N loops in live mode")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    client = ApiClient(args.api_url)
    writer = ExcelWriter(args.excel_file) if args.export_excel else None
    write_json = not args.no_json

    if args.export_excel and not HAS_XLWINGS:
        logger.error("xlwings is required for Excel export. Install: pip install xlwings")
        sys.exit(1)

    success = (
        run_live(client, args.output_dir, writer, args.export_excel, write_json, args.interval, args.max_iterations)
        if args.live
        else run_once(client, args.output_dir, writer, args.export_excel, write_json)
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
