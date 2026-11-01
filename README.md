# Atlas Card

> [!WARNING]
> **Written blind.** I don't own a Thermia Atlas, a hot gas heat exchanger or an external water heater. This card is a variant of my [Calibra Card](https://github.com/JanJoh/calibra-card), which runs daily on a real Calibra. The Atlas layout and the HGW entities are based only on the [thermiagenesis](https://github.com/JanJoh/thermiagenesis) register map, not on a real installation. Every value in the screenshots is made up.
>
> Expect something to be off: an entity that doesn't exist on your pump, an HGW signal that means something else than assumed, a pipe drawn the wrong way. If you run it on a real Atlas, please open an issue with what you see. Screenshots and entity states help most.

A Lovelace card for a **Thermia Atlas** ground source heat pump **without a built-in tank**, with an **external water heater** and a **hot gas heat exchanger (HGW)**, read locally over Modbus with the [thermiagenesis](https://github.com/JanJoh/thermiagenesis) integration.

It draws the system as it is assumed to be plumbed:

- **Borehole:** brine in and out, ΔT, the depth, and the brine pump.
- **Compressor:** current gear against the allowed maximum, speed, and the internal immersion heater.
- **Diverting valve:** splits the condenser's supply between the radiators and the external water heater's coil. The arrow turns and the inactive branch greys out.
- **Radiators:** supply, return, ΔT and heating stop.
- **HGW loop:** hot gas from the compressor heats tank water in a separate exchanger. A pump takes cold water from the bottom of the tank and returns it hot to the top, independently of the valve. The loop is coloured while it runs. The hot gas (discharge pipe) temperature is shown in the compressor box, and the temperature going to the tank in the HGW label where the loop leaves the heat pump ("HGW 63°"). A sensor alarm turns the label yellow and is named in the explanation line.
- **External water heater:** the top temperature, plus the bottom one if your pump has that sensor. Tap it for a chart of the tank temperatures over 1, 3 or 7 days.

Tap the compressor for the refrigerant circuit: pressures, operating hours, allowed gears, discharge pipe temperature, the HGW status and supply temperature, whether HGW is enabled, the HGW sensor alarm, heating stop and alarms. Every value opens its entity's more-info dialog.

| Heating, HGW heating the tank | Hot water through the valve, HGW idle |
|---|---|
| ![Heating](https://raw.githubusercontent.com/JanJoh/atlas-card/main/images/heat-light-760.png) | ![Hot water](https://raw.githubusercontent.com/JanJoh/atlas-card/main/images/hw-light-760.png) |

| Idle, dark theme | English |
|---|---|
| ![Idle](https://raw.githubusercontent.com/JanJoh/atlas-card/main/images/idle-dark-760.png) | ![English](https://raw.githubusercontent.com/JanJoh/atlas-card/main/images/heat-en-dark-760.png) |

| Refrigerant circuit | Phone |
|---|---|
| ![Refrigerant circuit](https://raw.githubusercontent.com/JanJoh/atlas-card/main/images/heat-detail-light-760.png) | ![Phone](https://raw.githubusercontent.com/JanJoh/atlas-card/main/images/heat-light-380.png) |

Swedish and English follow the user's language. The screenshots use made-up data from `test/preview.html`.

## Installation

HACS → ⋮ → Custom repositories → `https://github.com/JanJoh/atlas-card`, category **Dashboard**. Install **Atlas Card**, then reload the browser.

Manual: copy `dist/atlas-card.js` to `/config/www/` and add `/local/atlas-card.js` as a JavaScript module under **Settings → Dashboards → ⋮ → Resources**.

## Setting up thermiagenesis

1. Install [thermiagenesis](https://github.com/JanJoh/thermiagenesis) and add your heat pump. The Atlas is an inverter model.
2. **Find your entity prefix.** Thermiagenesis names every entity after the same device, so the ids look like `sensor.diplomat_inverter_duo_brine_in_temperature` even on an Atlas. That is the card's default. If your ids look different (renamed device, older version), override them under `entities:` (below).
3. **Enable the HGW entities.** They exist for inverter models but are disabled by default. Go to **Settings → Devices & services → Thermia → Entities**, show disabled entities, and enable:

   | Card key | Default entity | What the card uses it for |
   |---|---|---|
   | `hgw_active` | `binary_sensor.diplomat_inverter_duo_hgw_regulation_control_signal` | HGW loop running or not (assumed meaning; see below) |
   | `hgw_supply` | `sensor.diplomat_inverter_duo_hgw_supply_line_temperature` | Temperature going to the tank |
   | `hgw_enabled` | `switch.diplomat_inverter_duo_enable_hgw` | HGW turned off in the pump's settings |
   | `hgw_alarm` | `binary_sensor.diplomat_inverter_duo_hgw_sensor_alarm` | HGW sensor alarm |
   | `discharge` | `sensor.diplomat_inverter_duo_discharge_pipe_temperature` | Hot gas temperature |

   Also useful, if you want them: `sensor.diplomat_inverter_duo_tap_water_lower_temperature` (tank bottom), `number.diplomat_inverter_duo_minimum_allowed_gear_in_heating`, and the immersion heater entities.
4. Add the card.

**How the card decides that HGW is running:** when the HGW regulation signal (`hgw_active`) is on. If that entity isn't available, it uses `hgw_pump` instead, if you configure one: on for a binary sensor or switch, above 0 for a speed sensor. When `hgw_enabled` is off, HGW counts as turned off, whatever the other entities say. On a Thermia Mega the hot gas pump has its own signal and start/stop limits. Thermiagenesis does not read these on inverter models, so they are optional here.

## Configuration

Minimal:

```yaml
type: custom:atlas-card
```

With site-specific entities:

```yaml
type: custom:atlas-card
title: Atlas · bergvärme
borehole_depth: 120
entities:
  power: sensor.heat_pump_power            # W, shown in the header
  energy: sensor.heat_pump_energy          # kWh, "today" from statistics
  price: sensor.electricity_price
  valve: binary_sensor.hot_water_valve     # on = hot water; without it the card uses the demand
  immersion: sensor.diplomat_inverter_duo_internal_additional_heater_current_step   # if your pump has it
  hgw_pump: switch.hot_gas_pump            # optional: binary or speed (%)
  hgw_stop: sensor.hot_gas_pump_stop_temperature   # optional: listed in the refrigerant view
notices:
  - entity: input_boolean.load_guard
    text: The load guard limits the compressor.
```

| Option | Description |
|---|---|
| `title` | Card title (default `Atlas`). |
| `borehole_depth` | Depth in metres, written under the borehole. |
| `hgw` | `false` hides the HGW loop, label and values, for an Atlas without a hot gas exchanger. Default `true`. |
| `entities.<key>` | Override any entity. The keys are listed in `DEFAULT_ENTITIES` at the top of `dist/atlas-card.js`. |
| `entities.valve` | Binary sensor that is `on` while the valve points to hot water. Without it the card infers the valve position from the demand. |
| `entities.hgw_pump` | Optional hot gas pump: a binary sensor or switch, or a speed in %. Drawn on the pump symbol; used to tell if HGW runs when `hgw_active` is missing. |
| `entities.hgw_stop` | Optional stop temperature for the hot gas pump, listed in the refrigerant view. |
| `entities.immersion` | Binary sensor (`on`) or step sensor (`> 0`) for the internal immersion heater. |
| `immersion_steps` | Number of immersion heater steps drawn as a bar (default `3`). |
| `immersion_step_kw` | Optional kW per step; shows the current power next to the bar. |
| `tank_hours` | Default period of the tank chart: `24`, `72` (default) or `168`. |
| `notices` | A list of `{entity, state (default "on"), text}`. Each text is added to the explanation line while its entity is in that state. |

## Development

```sh
node --test test/*.test.js
```

Screenshots (inside the Playwright image):

```sh
docker run --rm -v "$PWD":/w -w /w mcr.microsoft.com/playwright:v1.49.1-noble \
  sh -c 'npm i -s playwright@1.49.1 >/dev/null && node test/shots.js'
```

## License

MIT
