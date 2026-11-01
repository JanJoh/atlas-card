# Changelog

## 0.2.0 — 2026-11-01

- **HGW values moved into the heat pump, no separate box.** The hot gas (discharge pipe) temperature is shown in the compressor box, where the immersion heater row sits when one is configured (next to the HGW label otherwise). The temperature going to the tank is shown in the HGW label itself ("HGW 63°") while the loop runs. The box to the right of the tank is gone; the coloured loop and label show that HGW runs.
- A sensor alarm turns the HGW label yellow ("HGW givarlarm") and stays in the explanation line.
- The refrigerant view adds the HGW status, the temperature to the tank and, when configured, the hot gas pump's stop limit (`hgw_stop`).
- The HGW label's text uses the normal text colour, so it is readable in dark themes.
- Based on the first screenshot from a real Atlas with HGW.

## 0.1.0 — 2026-10-30

- First version, written without access to the hardware. Derived from Calibra Card 0.6.1: an Atlas without a built-in tank, with an external water heater and a hot gas heat exchanger (HGW).
- HGW loop from the compressor to the tank, with its own pump symbol and a box showing status, hot gas and supply temperature, and an optional stop limit. `hgw: false` hides it.
- The external tank shows its top temperature, and the bottom one only when that sensor exists.
- The refrigerant view adds the discharge pipe temperature, whether HGW is enabled, and the HGW sensor alarm.
