const test = require("node:test");
const assert = require("node:assert/strict");
require("./dom-shim");
const { AtlasCard, DEFAULT_ENTITIES } = require("../dist/atlas-card.js");

const P = "diplomat_inverter_duo";

function states(over = {}) {
  const base = {
    [`sensor.${P}_outdoor_temperature`]: "3.2",
    [`sensor.${P}_first_prioritised_demand`]: "Heat",
    [`binary_sensor.${P}_compressor_control_signal`]: "on",
    [`sensor.${P}_compressor_speed_percent`]: "58",
    [`sensor.${P}_compressor_speed_rpm`]: "3480",
    [`sensor.${P}_compressor_current_gear`]: "6",
    [`sensor.${P}_compressor_available_gears`]: "10",
    [`number.${P}_maximum_allowed_gear_in_heating`]: "10",
    [`number.${P}_maximum_allowed_gear_in_tap_water`]: "10",
    [`sensor.${P}_compressor_temporarily_blocked`]: "0",
    [`sensor.${P}_brine_in_temperature`]: "4.8",
    [`sensor.${P}_brine_out_temperature`]: "1.7",
    [`sensor.${P}_brine_circulation_pump_speed`]: "55",
    [`sensor.${P}_condenser_circulation_pump_speed`]: "48",
    [`sensor.${P}_condenser_in_temperature`]: "31.0",
    [`sensor.${P}_condenser_out_temperature`]: "36.4",
    [`sensor.${P}_tap_water_top_temperature`]: "57.0",
    [`binary_sensor.${P}_heating_season_active`]: "on",
    [`number.${P}_heating_season_stop_temperature`]: "15",
    [`binary_sensor.${P}_sum_alarm`]: "off",
    [`binary_sensor.${P}_hgw_regulation_control_signal`]: "on",
    [`sensor.${P}_hgw_supply_line_temperature`]: "61.2",
    [`switch.${P}_enable_hgw`]: "on",
    [`binary_sensor.${P}_hgw_sensor_alarm`]: "off",
    [`sensor.${P}_discharge_pipe_temperature`]: "78.4",
    ...over,
  };
  const out = {};
  const changed = new Date(Date.now() - 50 * 60e3).toISOString();
  for (const [k, v] of Object.entries(base)) if (v !== undefined) out[k] = { state: v, last_changed: changed, attributes: {} };
  return out;
}

function card(over = {}, config = {}, lang = "sv") {
  const c = new AtlasCard();
  c.setConfig({ borehole_depth: 120, ...config });
  c._statsAt = Date.now();          // no websocket in tests
  c.hass = { states: states(over), locale: { language: lang } };
  return c;
}

const html = (c) => c.shadowRoot.innerHTML;

test("default HGW entities are the thermiagenesis inverter ones", () => {
  assert.equal(DEFAULT_ENTITIES.hgw_active, `binary_sensor.${P}_hgw_regulation_control_signal`);
  assert.equal(DEFAULT_ENTITIES.hgw_supply, `sensor.${P}_hgw_supply_line_temperature`);
  assert.equal(DEFAULT_ENTITIES.hgw_enabled, `switch.${P}_enable_hgw`);
  assert.equal(DEFAULT_ENTITIES.discharge, `sensor.${P}_discharge_pipe_temperature`);
});

test("heating with HGW running: loop coloured, hot gas in the compressor box, supply in the HGW label", () => {
  const c = card();
  const m = c._model();
  assert.equal(m.heatOn, true);
  assert.equal(m.hgw.active, true);
  assert.equal(m.hgw.status, "Laddar beredaren");
  assert.equal(m.hgw.gas, "78°");
  assert.equal(m.hgw.supply, "61°");
  const h = html(c);
  assert.ok(!h.includes("Hetgasväxlare (HGW)"), "no separate HGW box");
  assert.match(h, />Hetgas</);
  assert.match(h, />78°</);
  assert.match(h, />HGW 61°</);
  assert.match(h, /stroke="#a8327a"/);
  assert.match(h, /Extern/);
  assert.ok(!h.includes("Beredare idag"));
});

test("HGW idle: loop grey, no supply value", () => {
  const m = card({ [`binary_sensor.${P}_hgw_regulation_control_signal`]: "off" })._model();
  assert.equal(m.hgw.active, false);
  assert.equal(m.hgw.status, "Står still");
  assert.equal(m.hgw.supply, "–");
  assert.ok(!html(card({ [`binary_sensor.${P}_hgw_regulation_control_signal`]: "off" })).includes('stroke="#a8327a"'));
});

test("HGW turned off with the enable switch wins over the signal", () => {
  const m = card({ [`switch.${P}_enable_hgw`]: "off" })._model();
  assert.equal(m.hgw.active, false);
  assert.equal(m.hgw.status, "Avstängd");
});

test("without the regulation signal a configured hot gas pump decides", () => {
  const over = { [`binary_sensor.${P}_hgw_regulation_control_signal`]: undefined, "sensor.hgw_pump": "45" };
  const m = card(over, { entities: { hgw_pump: "sensor.hgw_pump", hgw_stop: "sensor.hgw_stop" } })._model();
  assert.equal(m.hgw.active, true);
  assert.equal(m.hgw.pumpPct, 45);
  assert.equal(m.hgw.pumpText, "45 %");
  const off = card({ ...over, "sensor.hgw_pump": "0" }, { entities: { hgw_pump: "sensor.hgw_pump" } })._model();
  assert.equal(off.hgw.active, false);
});

test("HGW sensor alarm shows in the HGW label and the explanation line", () => {
  const c = card({ [`binary_sensor.${P}_hgw_sensor_alarm`]: "on" });
  const m = c._model();
  assert.equal(m.hgw.alarm, true);
  assert.match(m.why, /HGW-givaren larmar/);
  assert.equal(m.tone, "warn");
  assert.match(html(c), /HGW givarlarm/);
  assert.match(html(c), /hgwchip alarm/);
});

test("hot water: valve turns, coil branch live", () => {
  const c = card({ [`sensor.${P}_first_prioritised_demand`]: "Hot water", [`binary_sensor.${P}_hgw_regulation_control_signal`]: "off" });
  const m = c._model();
  assert.equal(m.hwOn, true);
  assert.equal(m.heatOn, false);
  assert.match(html(c), /rotate\(90\)/);
});

test("tank: bottom value only drawn when the sensor exists", () => {
  assert.equal(card()._model().tankBotKnown, false);
  const c = card({ [`sensor.${P}_tap_water_lower_temperature`]: "41.0" });
  assert.equal(c._model().tankBotKnown, true);
  assert.match(html(c), /41,0°/);
});

test("hgw: false hides the HGW loop and box", () => {
  const c = card({}, { hgw: false });
  assert.equal(c._model().hgw, null);
  assert.ok(!html(c).includes("Hetgasväxlare"));
  const rows = c._detailModel().at(-1).rows.filter(Boolean).map((r) => r[0]);
  assert.ok(!rows.includes("Hetgas (tryckrör)"));
});

test("refrigerant view lists the HGW rows", () => {
  const rows = card()._detailModel().at(-1).rows.filter(Boolean).map(([l, v]) => `${l}: ${v}`);
  assert.ok(rows.includes("Hetgas (tryckrör): 78,4 °C"), rows.join(" | "));
  assert.ok(rows.includes("HGW påslagen: Ja"));
  assert.ok(rows.includes("HGW · Givarlarm: Inget"));
  assert.ok(rows.includes("Hetgasväxlare (HGW): Laddar beredaren"));
  assert.ok(rows.includes("Till beredaren: 61°"));
});

test("English", () => {
  const c = card({}, {}, "en");
  assert.equal(c._model().hgw.status, "Heating the tank");
  assert.match(html(c), />Hot gas</);
  assert.match(html(c), />HGW 61°</);
  assert.match(html(c), /External/);
});

test("registered as atlas-card", () => {
  assert.ok(customElements.get("atlas-card"));
  assert.ok(window.customCards.some((x) => x.type === "atlas-card"));
});

test("with an immersion heater the hot gas value moves next to the HGW label", () => {
  const c = card({ "sensor.imm": "0" }, { entities: { immersion: "sensor.imm" } });
  assert.match(html(c), />Hetgas 78°</);
});

test("the optional hot gas pump stop limit is listed in the refrigerant view", () => {
  const rows = card({ "sensor.hgw_stop": "55" }, { entities: { hgw_stop: "sensor.hgw_stop" } })._detailModel().at(-1).rows.filter(Boolean).map(([l, v]) => `${l}: ${v}`);
  assert.ok(rows.includes("Hetgaspump, stoppgräns: 55 °C"), rows.join(" | "));
});
