#!/usr/bin/env python3
"""
Trade Republic Python API Client
Handles local data collection and Excel export with xlwing
"""

import json
import requests
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
import os
import sys

# Optional: xlwing for Excel export
try:
    import xlwing as xw
    HAS_XLWING = True
except ImportError:
    HAS_XLWING = False
    logging.warning("xlwing not installed. Excel export disabled.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ETFPrice:
    """ETF Price Data"""
    isin: str
    name: str
    symbol: str
    bid: float
    ask: float
    last: float
    currency: str
    timestamp: str
    source: str = "Trade Republic"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class PortfolioSnapshot:
    """Portfolio Snapshot"""
    timestamp: str
    total_value_bid: float
    total_value_ask: float
    total_value_mid: float
    currency: str
    positions_count: int
    etfs: List[ETFPrice]


class TradeRepublicAPIClient:
    """Trade Republic API Client for local Python"""
    
    def __init__(
        self,
        api_url: str = "http://localhost:3000",
        timeout: int = 10
    ):
        self.api_url = api_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
    
    def get_etf_snapshot(self) -> Optional[Dict[str, Any]]:
        """Fetch ETF snapshot from dashboard API"""
        try:
            response = self.session.get(
                f"{self.api_url}/api/etf/snapshot",
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch ETF snapshot: {e}")
            return None
    
    def get_portfolio_snapshot(self) -> Optional[Dict[str, Any]]:
        """Fetch portfolio snapshot from dashboard API"""
        try:
            response = self.session.get(
                f"{self.api_url}/api/portfolio/snapshot",
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch portfolio snapshot: {e}")
            return None
    
    def get_market_data(self) -> Optional[Dict[str, Any]]:
        """Fetch market data from dashboard API"""
        try:
            response = self.session.get(
                f"{self.api_url}/api/market/snapshot",
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch market data: {e}")
            return None


class ExcelExporter:
    """Export data to Excel using xlwing"""
    
    def __init__(self, filename: str = "trade_republic_data.xlsx"):
        self.filename = filename
        self.has_xlwing = HAS_XLWING
    
    def export_etf_data(self, etfs: List[Dict[str, Any]]) -> bool:
        """Export ETF data to Excel"""
        if not self.has_xlwing:
            logger.error("xlwing not installed. Cannot export to Excel.")
            return False
        
        try:
            # Create or open workbook
            app = xw.App(visible=False)
            wb = app.books.add()
            ws = wb.sheets[0]
            ws.name = "ETF Data"
            
            # Write headers
            headers = ["ISIN", "Name", "Symbol", "Bid", "Ask", "Last", "Currency", "Timestamp", "Source"]
            ws.range("A1").value = headers
            
            # Format headers
            header_range = ws.range("A1").expand("right", len(headers) - 1)
            header_range.font.bold = True
            header_range.fill.color = (79, 129, 189)
            header_range.font.color = (255, 255, 255)
            
            # Write data
            for i, etf in enumerate(etfs, start=2):
                ws.range(f"A{i}").value = [
                    etf.get("isin"),
                    etf.get("name"),
                    etf.get("symbol"),
                    etf.get("bid"),
                    etf.get("ask"),
                    etf.get("last"),
                    etf.get("currency"),
                    etf.get("timestamp"),
                    etf.get("source"),
                ]
            
            # Auto-fit columns
            ws.autofit()
            
            # Save workbook
            wb.save(self.filename)
            wb.close()
            app.quit()
            
            logger.info(f"Successfully exported data to {self.filename}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to export data: {e}")
            return False
    
    def export_portfolio_data(self, portfolio: Dict[str, Any]) -> bool:
        """Export portfolio data to Excel"""
        if not self.has_xlwing:
            logger.error("xlwing not installed. Cannot export to Excel.")
            return False
        
        try:
            app = xw.App(visible=False)
            wb = app.books.add()
            
            # Portfolio Summary Sheet
            ws_summary = wb.sheets[0]
            ws_summary.name = "Portfolio"
            
            ws_summary.range("A1").value = "Portfolio Summary"
            ws_summary.range("A1").font.bold = True
            ws_summary.range("A1").font.size = 14
            
            summary_data = [
                ["Total Value (Bid)", portfolio.get("total_value_bid")],
                ["Total Value (Ask)", portfolio.get("total_value_ask")],
                ["Total Value (Mid)", portfolio.get("total_value_mid")],
                ["Currency", portfolio.get("currency")],
                ["Timestamp", portfolio.get("timestamp")],
            ]
            
            for i, row in enumerate(summary_data, start=3):
                ws_summary.range(f"A{i}").value = row[0]
                ws_summary.range(f"B{i}").value = row[1]
            
            # Positions Sheet
            ws_positions = wb.sheets.add()
            ws_positions.name = "Positions"
            
            headers = ["ISIN", "Name", "Symbol", "Quantity", "Bid", "Ask", "Last"]
            ws_positions.range("A1").value = headers
            
            positions = portfolio.get("positions", [])
            for i, pos in enumerate(positions, start=2):
                ws_positions.range(f"A{i}").value = [
                    pos.get("isin"),
                    pos.get("name"),
                    pos.get("symbol"),
                    pos.get("quantity"),
                    pos.get("bid"),
                    pos.get("ask"),
                    pos.get("last"),
                ]
            
            # Auto-fit all columns
            for ws in wb.sheets:
                ws.autofit()
            
            # Save
            wb.save(self.filename)
            wb.close()
            app.quit()
            
            logger.info(f"Successfully exported portfolio to {self.filename}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to export portfolio: {e}")
            return False


class DataCollector:
    """Main data collection orchestrator"""
    
    def __init__(
        self,
        api_url: str = "http://localhost:3000",
        output_dir: str = "./data"
    ):
        self.client = TradeRepublicAPIClient(api_url)
        self.exporter = ExcelExporter()
        self.output_dir = output_dir
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
    
    def collect_all(self) -> bool:
        """Collect all data and export"""
        logger.info("Starting data collection...")
        
        # Fetch data
        etf_data = self.client.get_etf_snapshot()
        portfolio_data = self.client.get_portfolio_snapshot()
        market_data = self.client.get_market_data()
        
        if not etf_data:
            logger.warning("Failed to fetch ETF data")
            return False
        
        # Save JSON files
        timestamp = datetime.now().isoformat()
        
        if etf_data:
            json_file = os.path.join(self.output_dir, f"etf_data_{timestamp.replace(':', '-')}.json")
            with open(json_file, 'w') as f:
                json.dump(etf_data, f, indent=2)
            logger.info(f"Saved ETF data to {json_file}")
        
        if portfolio_data:
            json_file = os.path.join(self.output_dir, f"portfolio_{timestamp.replace(':', '-')}.json")
            with open(json_file, 'w') as f:
                json.dump(portfolio_data, f, indent=2)
            logger.info(f"Saved portfolio data to {json_file}")
        
        if market_data:
            json_file = os.path.join(self.output_dir, f"market_{timestamp.replace(':', '-')}.json")
            with open(json_file, 'w') as f:
                json.dump(market_data, f, indent=2)
            logger.info(f"Saved market data to {json_file}")
        
        # Export to Excel if xlwing available
        if HAS_XLWING and etf_data.get("data"):
            excel_file = os.path.join(self.output_dir, f"trade_republic_{timestamp.replace(':', '-')}.xlsx")
            self.exporter.filename = excel_file
            self.exporter.export_etf_data(etf_data.get("data", []))
        
        logger.info("Data collection completed successfully")
        return True


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Trade Republic Python API Client")
    parser.add_argument("--api-url", default="http://localhost:3000", help="Dashboard API URL")
    parser.add_argument("--output-dir", default="./data", help="Output directory for data")
    parser.add_argument("--export-excel", action="store_true", help="Export to Excel")
    
    args = parser.parse_args()
    
    collector = DataCollector(args.api_url, args.output_dir)
    success = collector.collect_all()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
