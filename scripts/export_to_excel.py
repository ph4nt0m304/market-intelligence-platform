#!/usr/bin/env python3
"""
Market Intelligence Platform - Export to Excel
Fetches data from the API and pushes to Excel using xlwings

Requirements:
    pip install requests xlwings pandas

Usage:
    python export_to_excel.py
    
Configuration:
    Set API_BASE_URL to your deployed site URL
"""

import requests
import json
from datetime import datetime
from typing import Optional
import sys

# Configuration
API_BASE_URL = "https://v0-market-intelligence-platform-zeta.vercel.app"

# Try to import xlwings (optional for testing)
try:
    import xlwings as xw
    XLWINGS_AVAILABLE = True
except ImportError:
    XLWINGS_AVAILABLE = False
    print("[WARNING] xlwings not installed. Install with: pip install xlwings")

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("[WARNING] pandas not installed. Install with: pip install pandas")


def fetch_all_data(format: str = "json") -> dict:
    """Fetch all market data from the API"""
    url = f"{API_BASE_URL}/api/export?format={format}"
    print(f"[INFO] Fetching data from {url}")
    
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    return response.json()


def fetch_markets() -> dict:
    """Fetch market prices (Binance)"""
    url = f"{API_BASE_URL}/api/export/markets"
    print(f"[INFO] Fetching markets from {url}")
    
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    return response.json()


def fetch_etfs() -> dict:
    """Fetch ETF data (Trade Republic)"""
    url = f"{API_BASE_URL}/api/export/etfs"
    print(f"[INFO] Fetching ETFs from {url}")
    
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    return response.json()


def export_to_excel_xlwings(data: dict, excel_path: Optional[str] = None):
    """Export data to Excel using xlwings (requires Excel installed)"""
    if not XLWINGS_AVAILABLE:
        print("[ERROR] xlwings is required for Excel export")
        return False
    
    try:
        # Open existing workbook or create new one
        if excel_path:
            try:
                wb = xw.Book(excel_path)
                print(f"[INFO] Opened existing workbook: {excel_path}")
            except Exception:
                wb = xw.Book()
                print(f"[INFO] Created new workbook (will save to {excel_path})")
        else:
            wb = xw.Book()
            print("[INFO] Created new workbook")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # === Sheet: Markets (Binance) ===
        if "markets" in data and data["markets"]:
            sheet_name = "Markets"
            if sheet_name in [s.name for s in wb.sheets]:
                ws = wb.sheets[sheet_name]
                ws.clear()
            else:
                ws = wb.sheets.add(sheet_name)
            
            # Header
            ws.range("A1").value = "Market Intelligence Platform - Market Data"
            ws.range("A2").value = f"Updated: {timestamp}"
            ws.range("A1:E1").api.Font.Bold = True
            
            # Data headers
            headers = ["Symbol", "Binance Symbol", "Price", "Currency", "Last Update"]
            ws.range("A4").value = headers
            ws.range("A4:E4").api.Font.Bold = True
            
            # Data rows
            binance_data = data["markets"].get("binance", {})
            row = 5
            for key, market in binance_data.items():
                if isinstance(market, dict):
                    ws.range(f"A{row}").value = [
                        market.get("pair", key),
                        market.get("binanceSymbol", ""),
                        market.get("price"),
                        market.get("currency", "USD"),
                        market.get("lastUpdate", ""),
                    ]
                    row += 1
            
            print(f"[INFO] Exported markets to sheet '{sheet_name}'")
        
        # === Sheet: ETFs (Trade Republic) ===
        if "etfs" in data and data["etfs"]:
            sheet_name = "ETFs"
            if sheet_name in [s.name for s in wb.sheets]:
                ws = wb.sheets[sheet_name]
                ws.clear()
            else:
                ws = wb.sheets.add(sheet_name)
            
            # Header
            ws.range("A1").value = "Market Intelligence Platform - ETF Data"
            ws.range("A2").value = f"Updated: {timestamp}"
            ws.range("A1:I1").api.Font.Bold = True
            
            # Data headers
            headers = ["ISIN", "Name", "Symbol", "Bid", "Ask", "Last", "Spread", "Spread %", "Currency"]
            ws.range("A4").value = headers
            ws.range("A4:I4").api.Font.Bold = True
            
            # Data rows
            row = 5
            for etf in data["etfs"].get("instruments", []):
                ws.range(f"A{row}").value = [
                    etf.get("isin", ""),
                    etf.get("name", ""),
                    etf.get("symbol", ""),
                    etf.get("bid"),
                    etf.get("ask"),
                    etf.get("last"),
                    etf.get("spread"),
                    etf.get("spreadPercent"),
                    etf.get("currency", ""),
                ]
                row += 1
            
            print(f"[INFO] Exported ETFs to sheet '{sheet_name}'")
        
        # === Sheet: Arbitrage ===
        if "arbitrage" in data and data["arbitrage"]:
            sheet_name = "Arbitrage"
            if sheet_name in [s.name for s in wb.sheets]:
                ws = wb.sheets[sheet_name]
                ws.clear()
            else:
                ws = wb.sheets.add(sheet_name)
            
            ws.range("A1").value = "Market Intelligence Platform - Arbitrage Opportunities"
            ws.range("A2").value = f"Updated: {timestamp}"
            ws.range("A3").value = f"EUR/USD Rate: {data['arbitrage'].get('eurUsdRate', 'N/A')}"
            ws.range("A1:F1").api.Font.Bold = True
            
            headers = ["Asset", "ETF ISIN", "ETF Name", "ETF Price", "Binance Price", "Spread %", "Direction"]
            ws.range("A5").value = headers
            ws.range("A5:G5").api.Font.Bold = True
            
            row = 6
            for asset_type in ["gold", "silver"]:
                for opp in data["arbitrage"].get(asset_type, []):
                    etf = opp.get("etf", {})
                    binance = opp.get("binance", {})
                    ws.range(f"A{row}").value = [
                        asset_type.upper(),
                        etf.get("isin", ""),
                        etf.get("name", ""),
                        etf.get("price"),
                        binance.get("price"),
                        opp.get("spreadPct"),
                        opp.get("direction", ""),
                    ]
                    row += 1
            
            print(f"[INFO] Exported arbitrage to sheet '{sheet_name}'")
        
        # === Sheet: Signals ===
        if "signals" in data and data["signals"]:
            sheet_name = "Signals"
            if sheet_name in [s.name for s in wb.sheets]:
                ws = wb.sheets[sheet_name]
                ws.clear()
            else:
                ws = wb.sheets.add(sheet_name)
            
            ws.range("A1").value = "Market Intelligence Platform - Trading Signals"
            ws.range("A2").value = f"Updated: {timestamp}"
            ws.range("A1:H1").api.Font.Bold = True
            
            headers = ["ID", "Asset", "Type", "Instrument", "Spread %", "Z-Score", "Confidence", "Rationale", "Created"]
            ws.range("A4").value = headers
            ws.range("A4:I4").api.Font.Bold = True
            
            row = 5
            for signal in data["signals"].get("active", []):
                ws.range(f"A{row}").value = [
                    signal.get("id", ""),
                    signal.get("asset", ""),
                    signal.get("type", ""),
                    signal.get("instrument", ""),
                    signal.get("spreadPct"),
                    signal.get("zScore"),
                    signal.get("confidence", ""),
                    signal.get("rationale", ""),
                    signal.get("createdAt", ""),
                ]
                row += 1
            
            print(f"[INFO] Exported signals to sheet '{sheet_name}'")
        
        # Remove default Sheet1 if empty
        for sheet in wb.sheets:
            if sheet.name == "Sheet1" or sheet.name == "Feuil1":
                try:
                    sheet.delete()
                except Exception:
                    pass
        
        # Save workbook
        if excel_path:
            wb.save(excel_path)
            print(f"[SUCCESS] Workbook saved to: {excel_path}")
        else:
            print("[INFO] Workbook created but not saved (no path specified)")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to export to Excel: {e}")
        return False


def export_to_csv(data: dict, output_dir: str = "."):
    """Export data to CSV files using pandas"""
    if not PANDAS_AVAILABLE:
        print("[ERROR] pandas is required for CSV export")
        return False
    
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Export markets
        if "markets" in data and data["markets"]:
            binance = data["markets"].get("binance", {})
            rows = []
            for key, market in binance.items():
                if isinstance(market, dict):
                    rows.append({
                        "symbol": market.get("pair", key),
                        "binance_symbol": market.get("binanceSymbol", ""),
                        "price": market.get("price"),
                        "currency": market.get("currency", "USD"),
                        "last_update": market.get("lastUpdate", ""),
                    })
            df = pd.DataFrame(rows)
            path = f"{output_dir}/markets_{timestamp}.csv"
            df.to_csv(path, index=False)
            print(f"[INFO] Saved markets to {path}")
        
        # Export ETFs
        if "etfs" in data and data["etfs"]:
            df = pd.DataFrame(data["etfs"].get("instruments", []))
            path = f"{output_dir}/etfs_{timestamp}.csv"
            df.to_csv(path, index=False)
            print(f"[INFO] Saved ETFs to {path}")
        
        # Export signals
        if "signals" in data and data["signals"]:
            df = pd.DataFrame(data["signals"].get("active", []))
            path = f"{output_dir}/signals_{timestamp}.csv"
            df.to_csv(path, index=False)
            print(f"[INFO] Saved signals to {path}")
        
        print(f"[SUCCESS] CSV files exported to {output_dir}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to export to CSV: {e}")
        return False


def main():
    """Main entry point"""
    print("=" * 60)
    print("Market Intelligence Platform - Data Export")
    print("=" * 60)
    print()
    
    try:
        # Fetch all data
        print("[STEP 1] Fetching data from API...")
        data = fetch_all_data()
        print(f"[OK] Received data with keys: {list(data.keys())}")
        print()
        
        # Export options
        if len(sys.argv) > 1:
            output = sys.argv[1]
            if output.endswith(".xlsx"):
                print(f"[STEP 2] Exporting to Excel: {output}")
                export_to_excel_xlwings(data, output)
            elif output == "--csv":
                output_dir = sys.argv[2] if len(sys.argv) > 2 else "."
                print(f"[STEP 2] Exporting to CSV: {output_dir}")
                export_to_csv(data, output_dir)
            else:
                print(f"[INFO] Unknown output format. Printing JSON...")
                print(json.dumps(data, indent=2))
        else:
            # Default: print JSON
            print("[STEP 2] No output specified. Printing JSON...")
            print()
            print(json.dumps(data, indent=2, default=str))
        
        print()
        print("[DONE] Export completed successfully!")
        
    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch data: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
