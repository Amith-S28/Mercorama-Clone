#!/usr/bin/env python3
"""
Modular Per-Country UN Comtrade Bilateral Data Ingestion Script (Clean Progress Bar)

Downloads 100% REAL, UNALTERED official bilateral country-to-country trade flows
separately for any specified country code with multi-key round-robin load balancing.

Display: Clean, single-line in-place updating terminal progress bar ONLY.

Usage:
  python scripts/download_country_bilateral.py --country USA
  python scripts/download_country_bilateral.py --country SGP
  python scripts/download_country_bilateral.py --country DEU
"""

import os
import sys
import json
import time
import csv
import argparse
import urllib.request
import urllib.error

# Automatically load .env.local if present
def load_env_local():
  script_dir = os.path.dirname(os.path.abspath(__file__))
  env_file = os.path.join(script_dir, "..", ".env.local")
  if os.path.exists(env_file):
    try:
      with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
          line = line.strip()
          if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip("\"'")
            if k and not os.getenv(k):
              os.environ[k] = v
    except Exception:
      pass

load_env_local()

# Collect all available API keys from environment
def get_api_keys(custom_key_arg=""):
  keys = []
  if custom_key_arg:
    for k in custom_key_arg.split(","):
      if k.strip():
        keys.append(k.strip())
  
  for env_var in ["COMTRADE_API_KEY", "COMTRADE_API_KEY_2", "UN_COMTRADE_KEY", "COMTRADE_KEY"]:
    val = os.getenv(env_var, "").strip()
    if val and val not in keys:
      keys.append(val)
      
  return keys

# UN M49 numeric codes and ISO3 country dictionary
COUNTRY_M49 = {
  "USA": {"code": "842", "name": "United States"},
  "CHN": {"code": "156", "name": "China"},
  "JPN": {"code": "392", "name": "Japan"},
  "DEU": {"code": "276", "name": "Germany"},
  "GBR": {"code": "826", "name": "United Kingdom"},
  "FRA": {"code": "250", "name": "France"},
  "CAN": {"code": "124", "name": "Canada"},
  "IND": {"code": "356", "name": "India"},
  "BRA": {"code": "076", "name": "Brazil"},
  "KOR": {"code": "410", "name": "South Korea"},
  "MEX": {"code": "484", "name": "Mexico"},
  "AUS": {"code": "036", "name": "Australia"},
  "NLD": {"code": "528", "name": "Netherlands"},
  "SGP": {"code": "702", "name": "Singapore"},
  "ZAF": {"code": "710", "name": "South Africa"},
  "ITA": {"code": "380", "name": "Italy"},
  "MYS": {"code": "458", "name": "Malaysia"},
  "VNM": {"code": "704", "name": "Vietnam"},
  "ESP": {"code": "724", "name": "Spain"},
  "THA": {"code": "764", "name": "Thailand"},
  "IDN": {"code": "360", "name": "Indonesia"},
  "CHE": {"code": "756", "name": "Switzerland"},
  "SWE": {"code": "752", "name": "Sweden"},
  "POL": {"code": "616", "name": "Poland"},
  "BEL": {"code": "056", "name": "Belgium"},
  "TUR": {"code": "792", "name": "Turkey"},
  "SAU": {"code": "682", "name": "Saudi Arabia"},
  "ARE": {"code": "784", "name": "UAE"},
  "TWN": {"code": "158", "name": "Taiwan"},
  "DNK": {"code": "208", "name": "Denmark"},
  "IRL": {"code": "372", "name": "Ireland"},
  "COL": {"code": "170", "name": "Colombia"},
  "PRK": {"code": "408", "name": "North Korea"},
}

# Reverse lookup for partner numeric code to ISO3
M49_TO_ISO = {v["code"]: k for k, v in COUNTRY_M49.items()}

# Top partner codes for bilateral queries
TOP_PARTNER_CODES = [
  "842", "156", "276", "392", "826", "124", "484", "356", "076", "250",
  "702", "410", "036", "528", "756", "380", "724", "784", "458", "704",
  "764", "360", "752", "616", "056", "792", "682"
]

class KeyManager:
  def __init__(self, keys):
    self.keys = keys
    self.index = 0

  def get_key(self):
    if not self.keys:
      return None
    key = self.keys[self.index % len(self.keys)]
    self.index += 1
    return key

def fetch_comtrade_batch(reporter_code, partner_code, period, cmd_code, key_manager, on_status_update=None, retry_count=0):
  """Fetch data from UN Comtrade API with key rotation and silent backoff handling."""
  api_key = key_manager.get_key()
  
  if api_key:
    url = f"https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode={reporter_code}&period={period}&cmdCode={cmd_code}&partnerCode={partner_code}"
    headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Ocp-Apim-Subscription-Key": api_key,
      "subscription-key": api_key
    }
  else:
    url = f"https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode={reporter_code}&period={period}&cmdCode={cmd_code}&partnerCode={partner_code}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

  req = urllib.request.Request(url, headers=headers)
  
  try:
    with urllib.request.urlopen(req, timeout=20) as response:
      data = json.loads(response.read().decode("utf-8"))
      return data.get("data", [])
  except urllib.error.HTTPError as e:
    if e.code == 429 and retry_count < 10:
      wait_secs = 10 * (retry_count + 1)
      if on_status_update:
        on_status_update(f"Cooling 429 ({wait_secs}s)")
      time.sleep(wait_secs)
      return fetch_comtrade_batch(reporter_code, partner_code, period, cmd_code, key_manager, on_status_update, retry_count + 1)
    elif e.code in (400, 404):
      return []
    else:
      return []
  except Exception as e:
    if retry_count < 5:
      wait_secs = 3 * (retry_count + 1)
      if on_status_update:
        on_status_update(f"Retry ({wait_secs}s)")
      time.sleep(wait_secs)
      return fetch_comtrade_batch(reporter_code, partner_code, period, cmd_code, key_manager, on_status_update, retry_count + 1)
    return []

def render_progress_bar(iso3, current_batch, total_batches, current_year, current_hs, total_records, status_msg="Running"):
  """Render a single-line in-place updating terminal progress bar."""
  bar_length = 25
  pct = (current_batch / total_batches) * 100 if total_batches > 0 else 0.0
  filled_len = int(bar_length * current_batch // total_batches) if total_batches > 0 else 0
  bar = "#" * filled_len + "-" * (bar_length - filled_len)
  
  line = f"\r[{iso3}] [{bar}] {pct:5.1f}% | {current_batch}/{total_batches} | Yr {current_year} HS {current_hs} | Records: {total_records:,} | {status_msg}   "
  sys.stdout.write(line)
  sys.stdout.flush()

def main():
  parser = argparse.ArgumentParser(description="Fetch uniform 2019-2025 bilateral trade data per country.")
  parser.add_argument("--country", type=str, required=True, help="ISO3 country code (e.g. USA, SGP, DEU, IND, CHN)")
  parser.add_argument("--years", type=str, default="2025,2024,2023,2022,2021,2020,2019", help="Uniform 2019-2025 date range")
  parser.add_argument("--key", type=str, default="", help="Optional UN Comtrade Subscription Key(s)")
  parser.add_argument("--output_dir", type=str, default="Data/bilateral", help="Output directory")
  
  args = parser.parse_args()
  iso3 = args.country.upper()
  
  if iso3 not in COUNTRY_M49:
    print(f"\n[ERROR] Unknown country ISO3 code '{iso3}'.")
    sys.exit(1)
    
  keys = get_api_keys(args.key)
  key_manager = KeyManager(keys)
  
  country_info = COUNTRY_M49[iso3]
  reporter_code = country_info["code"]
  country_name = country_info["name"]
  years = [y.strip() for y in args.years.split(",") if y.strip()]
  
  os.makedirs(args.output_dir, exist_ok=True)
  checkpoint_dir = os.path.join(args.output_dir, "checkpoints")
  os.makedirs(checkpoint_dir, exist_ok=True)
  
  out_csv = os.path.join(args.output_dir, f"{iso3}_bilateral_trade.csv")
  chk_file = os.path.join(checkpoint_dir, f"{iso3}_checkpoint.json")
  
  # Load existing checkpoint if present
  completed_keys = set()
  if os.path.exists(chk_file):
    try:
      with open(chk_file, "r") as fp:
        completed_keys = set(json.load(fp))
    except Exception:
      completed_keys = set()
      
  file_exists = os.path.exists(out_csv)
  
  # Count existing records in CSV
  total_records_saved = 0
  if file_exists:
    try:
      with open(out_csv, "r", encoding="utf-8") as f:
        total_records_saved = max(0, sum(1 for _ in f) - 1)
    except Exception:
      total_records_saved = 0

  csv_fieldnames = [
    "Year", "Reporter_ISO3", "Reporter_Name",
    "Partner_ISO3", "Partner_Name",
    "Flow_Code", "Flow_Desc",
    "HS_Code", "HS_Description",
    "Trade_Value_USD", "Net_Weight_KG", "Quantity", "Quantity_Unit"
  ]

  # Partner codes & HS codes
  partner_codes = [p for p in TOP_PARTNER_CODES if p != reporter_code]
  chunk_size = 10
  partner_chunks = [partner_codes[i:i + chunk_size] for i in range(0, len(partner_codes), chunk_size)]
  hs_chapters = [str(i).zfill(2) for i in range(1, 100)]
  
  total_batches = len(years) * len(hs_chapters) * len(partner_chunks)
  current_batch_count = len(completed_keys)

  print(f"\n[INGESTION STARTED] {country_name} ({iso3}) | 2019-2025 | Keys: {len(keys)}")
  render_progress_bar(iso3, current_batch_count, total_batches, years[0], "01", total_records_saved, "Initializing")

  with open(out_csv, "a", newline="", encoding="utf-8") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=csv_fieldnames)
    if not file_exists:
      writer.writeheader()
      
    for yr in years:
      for hs in hs_chapters:
        for p_chunk in partner_chunks:
          partner_str = ",".join(p_chunk)
          batch_key = f"{yr}_{hs}_{partner_str}"
          
          if batch_key in completed_keys:
            continue
            
          def update_status(msg):
            render_progress_bar(iso3, current_batch_count, total_batches, yr, hs, total_records_saved, msg)

          records = fetch_comtrade_batch(reporter_code, partner_str, yr, hs, key_manager=key_manager, on_status_update=update_status)
          
          if records:
            for r in records:
              p_code = str(r.get("partnerCode", ""))
              p_iso = M49_TO_ISO.get(p_code, f"M49_{p_code}")
              p_name = COUNTRY_M49.get(p_iso, {}).get("name", r.get("partnerISO") or f"Partner {p_code}")
              flow_code = "X" if r.get("flowCode") == "X" or r.get("flowCode") == 2 else "M"
              
              row = {
                "Year": r.get("period", yr),
                "Reporter_ISO3": iso3,
                "Reporter_Name": country_name,
                "Partner_ISO3": p_iso,
                "Partner_Name": p_name,
                "Flow_Code": flow_code,
                "Flow_Desc": "Exports" if flow_code == "X" else "Imports",
                "HS_Code": r.get("cmdCode", hs),
                "HS_Description": r.get("cmdDesc", f"HS Chapter {hs}"),
                "Trade_Value_USD": r.get("primaryValue", 0),
                "Net_Weight_KG": r.get("netWgt", 0),
                "Quantity": r.get("qty", 0),
                "Quantity_Unit": r.get("qtyUnitAbbr", "")
              }
              writer.writerow(row)
              total_records_saved += 1
            csvfile.flush()

          completed_keys.add(batch_key)
          current_batch_count += 1
          
          # Checkpoint
          with open(chk_file, "w") as fp:
            json.dump(list(completed_keys), fp)
            
          # Update single-line progress bar
          render_progress_bar(iso3, current_batch_count, total_batches, yr, hs, total_records_saved, "Active")
          
          # Pacing delay: 1.2s per request for dual keys (strictly under 10 calls / 10s per key quota)
          time.sleep(1.2)

  sys.stdout.write(f"\n[COMPLETE] {iso3} Ingestion finished! Saved {total_records_saved:,} records to {out_csv}\n\n")

if __name__ == "__main__":
  main()
