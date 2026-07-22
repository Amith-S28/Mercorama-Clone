import ports from '../ports.json';

export type KeyPort = {
  name: string;
  countryCode: string;
};

export const KEY_PORTS: KeyPort[] = ports as KeyPort[];
