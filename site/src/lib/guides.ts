// The guides in docs/guides/, in the order the guide list shows them.
export interface Guide {
  slug: string;
  /** Short title for lists and navigation */
  short: string;
}

export const GUIDES: Guide[] = [
  { slug: "modbus-address-off-by-one", short: "Addresses off by one" },
  { slug: "byte-and-word-order", short: "Byte and word order" },
  { slug: "scaling-and-units", short: "Scaling and units" },
  { slug: "modbus-reads-zero", short: "Reads 0, 0xFFFF or 0x8000" },
  { slug: "modbus-timeout-no-response", short: "Timeouts, no response" },
  { slug: "modbus-crc-error", short: "CRC errors on RS-485" },
  { slug: "modbus-exception-codes", short: "Exception codes" },
  { slug: "modbus-function-codes", short: "Function codes and areas" },
  { slug: "modbus-unit-id-slave-id", short: "Unit ID (slave ID)" },
  { slug: "modbus-rtu-vs-tcp", short: "RTU, TCP and RS-485" },
  { slug: "how-to-find-a-modbus-register-map", short: "Finding a register map" },
  { slug: "is-it-safe-to-write-modbus", short: "Writing safely" },
];
