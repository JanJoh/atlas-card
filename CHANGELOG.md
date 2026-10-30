# Changelog

## 0.1.0 — 2026-10-30

- First version, written without access to the hardware. Derived from Calibra Card 0.6.1: an Atlas without a built-in tank, with an external water heater and a hot gas heat exchanger (HGW).
- HGW loop from the compressor to the tank, with its own pump symbol and a box showing status, hot gas and supply temperature, and an optional stop limit. `hgw: false` hides it.
- The external tank shows its top temperature, and the bottom one only when that sensor exists.
- The refrigerant view adds the discharge pipe temperature, whether HGW is enabled, and the HGW sensor alarm.
