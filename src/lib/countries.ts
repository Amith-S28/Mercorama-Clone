export interface CountryOption {
  iso3: string;
  name: string;
  region: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { iso3: 'CAN', name: 'Canada', region: 'North America' },
  { iso3: 'USA', name: 'United States', region: 'North America' },
  { iso3: 'MEX', name: 'Mexico', region: 'North America' },
  { iso3: 'JPN', name: 'Japan', region: 'Asia-Pacific' },
  { iso3: 'KOR', name: 'South Korea', region: 'Asia-Pacific' },
  { iso3: 'CHN', name: 'China', region: 'Asia-Pacific' },
  { iso3: 'IND', name: 'India', region: 'Asia-Pacific' },
  { iso3: 'AUS', name: 'Australia', region: 'Asia-Pacific' },
  { iso3: 'DEU', name: 'Germany', region: 'Europe' },
  { iso3: 'GBR', name: 'United Kingdom', region: 'Europe' },
  { iso3: 'FRA', name: 'France', region: 'Europe' },
  { iso3: 'ARE', name: 'United Arab Emirates', region: 'Middle East' },
];

export function getCountryName(iso3: string): string {
  return COUNTRY_OPTIONS.find((c) => c.iso3 === iso3)?.name ?? iso3;
}

export const ISO3_TO_WTO_NUMERIC: Record<string, string> = {
  CAN: '124',
  USA: '840',
  MEX: '484',
  JPN: '392',
  KOR: '410',
  CHN: '156',
  IND: '356',
  AUS: '036',
  DEU: '276',
  GBR: '826',
  FRA: '250',
  ARE: '784',
};

export const ISO3_TO_COMTRADE_NUMERIC: Record<string, string> = {
  CAN: '124',
  USA: '842',
  MEX: '484',
  JPN: '392',
  KOR: '410',
  CHN: '156',
  IND: '699',
  AUS: '36',
  DEU: '276',
  GBR: '826',
  FRA: '250',
  ARE: '784',
};


