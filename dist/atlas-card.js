/*
 * Atlas Card
 * https://github.com/JanJoh/atlas-card
 *
 * A Lovelace card for a Thermia Atlas ground source heat pump without a built-in tank, with an
 * external water heater and a hot gas heat exchanger (HGW), read through the thermiagenesis
 * integration. Derived from Calibra Card (https://github.com/JanJoh/calibra-card).
 *
 * Written blind: the author has no Atlas or HGW hardware. The layout and the HGW entities
 * follow the thermiagenesis register map, not a real installation.
 *
 * MIT License
 */

const CARD_VERSION = "0.2.1";

// Entity defaults: the thermiagenesis entity ids (the integration names every entity after the
// same device, whatever the model). Anything else (power meter, price, the valve, the hot gas
// pump) is site specific and only shown when configured.
const TG = "diplomat_inverter_duo";
const DEFAULT_ENTITIES = {
  outdoor: `sensor.${TG}_outdoor_temperature`,
  demand: `sensor.${TG}_first_prioritised_demand`,
  compressor_running: `binary_sensor.${TG}_compressor_control_signal`,
  compressor_pct: `sensor.${TG}_compressor_speed_percent`,
  compressor_rpm: `sensor.${TG}_compressor_speed_rpm`,
  gear: `sensor.${TG}_compressor_current_gear`,
  gears_available: `sensor.${TG}_compressor_available_gears`,
  gear_max_heat: `number.${TG}_maximum_allowed_gear_in_heating`,
  gear_max_tap: `number.${TG}_maximum_allowed_gear_in_tap_water`,
  gear_min_tap: `number.${TG}_minimum_allowed_gear_in_tap_water`,
  compressor_blocked: `sensor.${TG}_compressor_temporarily_blocked`,
  brine_in: `sensor.${TG}_brine_in_temperature`,
  brine_out: `sensor.${TG}_brine_out_temperature`,
  brine_pump: `sensor.${TG}_brine_circulation_pump_speed`,
  condenser_pump: `sensor.${TG}_condenser_circulation_pump_speed`,
  condenser_in: `sensor.${TG}_condenser_in_temperature`,
  condenser_out: `sensor.${TG}_condenser_out_temperature`,
  tank_top: `sensor.${TG}_tap_water_top_temperature`,
  tank_bottom: `sensor.${TG}_tap_water_lower_temperature`,
  tap_start: `number.${TG}_start_temperature_tap_water`,
  tap_stop: `number.${TG}_stop_temperature_tap_water`,
  heating_season_active: `binary_sensor.${TG}_heating_season_active`,
  heating_season_stop: `number.${TG}_heating_season_stop_temperature`,
  integral: `sensor.${TG}_heating_season_integral_value`,
  alarm: `binary_sensor.${TG}_sum_alarm`,
  high_pressure: `sensor.${TG}_high_pressure_side`,
  low_pressure: `sensor.${TG}_low_pressure_side`,
  bubble_point: `sensor.${TG}_bubble_point`,
  dew_point: `sensor.${TG}_dew_point`,
  compressor_hours: `sensor.${TG}_compressor_operating_hours`,
  tap_water_hours: `sensor.${TG}_tap_water_operating_hours`,
  gear_min_heat: `number.${TG}_minimum_allowed_gear_in_heating`,
  phase_alarm: `binary_sensor.${TG}_power_input_phase_detection_alarm`,
  // Hot gas heat exchanger (HGW). Thermiagenesis has these for inverter models; all are disabled by default.
  hgw_active: `binary_sensor.${TG}_hgw_regulation_control_signal`,
  hgw_supply: `sensor.${TG}_hgw_supply_line_temperature`,
  hgw_enabled: `switch.${TG}_enable_hgw`,
  hgw_alarm: `binary_sensor.${TG}_hgw_sensor_alarm`,
  discharge: `sensor.${TG}_discharge_pipe_temperature`,
};

const COLORS = {
  // Brine in (from the borehole) is the warmer side, so the paler blue; brine out, the colder, deeper blue
  brineIn: "#8db8e3", brineOut: "#2f6fb3",
  heat: "#d9622b", heatRet: "#f0a77f",
  hw: "#d0453a", hwRet: "#ec9a92",
  tap: "#d0453a", idle: "var(--atlas-idle, rgba(127, 127, 127, 0.45))",
  gear: "#2f6fb3", gearLimited: "#b26b00", immersion: "#d9822b",
  hgw: "#a8327a", hgwRet: "#d79bc4",
};

const T = {
  sv: {
    title: "Värmepump", borehole: "Borrhål", in: "In", out: "Ut", compressor: "Kompressor",
    stopped: "Står still", brinePump: "Brinepump", condPump: "Kondensorpump", immersion: "Intern elpatron", immersionShort: "Elpatron",
    off: "av", on: "på", circuit: "Kylkrets ›", radiators: "Radiatorer", supply: "Fram", ret: "Retur",
    valve: "Ventil →", toHeat: "värme", toTap: "varmvatten",
    taps: "Kranar", outdoor: "Ute", power: "Effekt nu", price: "Elpris",
    heatStopOn: (t) => `Värmestopp på${t}`, heatStopOff: (t) => `Värmestopp av${t}`, limit: (t) => ` (${t})`,
    pumpToday: "Värmepump el idag", brineMin: "Lägsta brine idag", immHours: "Intern elpatron, totalt",
    back: "‹ Tillbaka", hp: "Högtryck (kondensor)", lp: "Lågtryck (förångare)", bubble: "Bubbelpunkt", dew: "Daggpunkt",
    compHours: "Kompressor, drifttid", tapHours: "Varmvatten, drifttid", gearsHeat: "Tillåtna växlar, värme",
    gearsTap: "Tillåtna växlar, varmvatten", blocked: "Omstartsspärr", minLeft: (m) => `${m} min kvar`, yes: "Ja", no: "Nej",
    alarm: "Samlingslarm", noAlarm: "Inget", active: "Aktivt", phaseAlarm: "Fasdetektering", ok: "OK", fault: "Fel",
    whyRunning: (since) => `Går${since}`, whyIdle: (since) => `Står still${since}`, since: (w) => ` sedan ${w}`,
    yesterday: "igår", stopLimit: "Värmestopp, gräns", seasonIntegral: "Värmesäsongsintegral",
    whyHeatStop: (o, s) => `Värmestopp: ute ${o} är över gränsen ${s}. Radiatorerna får ingen värme, bara varmvatten laddas vid behov.`,
    whyBlocked: (m) => `Omstartsspärr efter stopp · ${m} min kvar.`, whyImmersion: "Intern elpatron har gått in.",
    whyAlarm: "Värmepumpen har ett aktivt larm.",
    demands: { "No demand": "Inget behov", Heat: "Värme", "Hot water": "Varmvatten", "Anti legionella": "Legionella",
      Pool: "Pool", Cooling: "Kyla", "Passive cooling": "Passiv kyla", "Pool 2": "Pool 2", "Brine heating": "Brinevärmning" },
    heatStopChip: "Värmestopp",
    tank: "Varmvattentanken", tankTop: "Topp", tankBottom: "Botten", tankOpen: "Visa varmvattentankens temperaturer",
    tankStart: (a) => `Laddning startar under ${a}`, tankStop: (b) => `slutar vid ${b}`,
    loading: "Hämtar historik…", noHistory: "Ingen historik för perioden.",
    ranges: [[24, "1 dygn"], [72, "3 dygn"], [168, "7 dygn"]],
    legio: "Legionella", legioNow: "Legionella pågår nu", legioLast: (w) => `Legionella senast ${w}`, legioNext: (w) => `nästa omkring ${w}`,
    hgw: "Hetgasväxlare (HGW)", hgwShort: "HGW", hgwOn: "Laddar beredaren", hgwIdle: "Står still", hgwOff: "Avstängd",
    hgwShortStatus: { on: "Laddar", idle: "Vilar", off: "Av", alarm: "Larm" },
    hgwAlarm: "Givarlarm", hgwGas: "Hetgas", hgwToTank: "Till beredaren", hgwStop: (v) => `Stannar under ${v}`,
    hgwPump: "Hetgaspump", hgwPumpStop: "Hetgaspump, stoppgräns", hgwEnabled: "HGW påslagen", discharge: "Hetgas (tryckrör)", tankExt1: "Extern", tankExt2: "beredare",
    whyHgwAlarm: "HGW-givaren larmar.",
  },
  en: {
    title: "Heat pump", borehole: "Borehole", in: "In", out: "Out", compressor: "Compressor",
    stopped: "Stopped", brinePump: "Brine pump", condPump: "Condenser pump", immersion: "Immersion heater", immersionShort: "Immersion",
    off: "off", on: "on", circuit: "Refrigerant ›", radiators: "Radiators", supply: "Supply", ret: "Return",
    valve: "Valve →", toHeat: "heating", toTap: "hot water",
    taps: "Taps", outdoor: "Outdoor", power: "Power", price: "Price",
    heatStopOn: (t) => `Heating stop on${t}`, heatStopOff: (t) => `Heating stop off${t}`, limit: (t) => ` (${t})`,
    pumpToday: "Heat pump today", brineMin: "Lowest brine today", immHours: "Immersion heater, total",
    back: "‹ Back", hp: "High pressure (condenser)", lp: "Low pressure (evaporator)", bubble: "Bubble point", dew: "Dew point",
    compHours: "Compressor hours", tapHours: "Hot water hours", gearsHeat: "Allowed gears, heating",
    gearsTap: "Allowed gears, hot water", blocked: "Restart delay", minLeft: (m) => `${m} min left`, yes: "Yes", no: "No",
    alarm: "Sum alarm", noAlarm: "None", active: "Active", phaseAlarm: "Phase detection", ok: "OK", fault: "Fault",
    whyRunning: (since) => `Running${since}`, whyIdle: (since) => `Stopped${since}`, since: (w) => ` since ${w}`,
    yesterday: "yesterday", stopLimit: "Heating stop, limit", seasonIntegral: "Heating season integral",
    whyHeatStop: (o, s) => `Heating stop: outdoor ${o} is above the limit ${s}. Only hot water is made when needed.`,
    whyBlocked: (m) => `Restart delay after a stop · ${m} min left.`, whyImmersion: "The immersion heater is on.",
    whyAlarm: "The heat pump has an active alarm.",
    demands: {},
    heatStopChip: "Heating stop",
    tank: "Hot water tank", tankTop: "Top", tankBottom: "Bottom", tankOpen: "Show the hot water tank temperatures",
    tankStart: (a) => `Charging starts below ${a}`, tankStop: (b) => `stops at ${b}`,
    loading: "Loading history…", noHistory: "No history for this period.",
    ranges: [[24, "1 day"], [72, "3 days"], [168, "7 days"]],
    legio: "Legionella", legioNow: "Legionella cycle running now", legioLast: (w) => `Legionella last ${w}`, legioNext: (w) => `next around ${w}`,
    hgw: "Hot gas exchanger (HGW)", hgwShort: "HGW", hgwOn: "Heating the tank", hgwIdle: "Idle", hgwOff: "Turned off",
    hgwShortStatus: { on: "Heating", idle: "Idle", off: "Off", alarm: "Alarm" },
    hgwAlarm: "Sensor alarm", hgwGas: "Hot gas", hgwToTank: "To the tank", hgwStop: (v) => `Stops below ${v}`,
    hgwPump: "Hot gas pump", hgwPumpStop: "Hot gas pump, stop limit", hgwEnabled: "HGW enabled", discharge: "Hot gas (discharge)", tankExt1: "External", tankExt2: "tank",
    whyHgwAlarm: "The HGW sensor reports an alarm.",
  },
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function num(hass, id) {
  const s = id && hass?.states?.[id];
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
}

function str(hass, id) {
  const s = id && hass?.states?.[id];
  if (!s || s.state === "unknown" || s.state === "unavailable") return null;
  return s.state;
}

function isOn(hass, id) {
  return str(hass, id) === "on";
}

function fmt(v, digits = 1, unit = "", lang = "sv") {
  if (v === null || v === undefined || !Number.isFinite(v)) return "–";
  const s = v.toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return unit ? `${s}${unit === "°" ? "" : " "}${unit}` : s;
}

// "17:23" today, "igår 17:23" yesterday, else "21 okt 17:23" (local time).
function sinceWhen(iso, lang, t, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const loc = lang === "sv" ? "sv-SE" : "en-GB";
  const hm = d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 864e5);
  if (diff <= 0) return hm;
  if (diff === 1) return `${t.yesterday} ${hm}`;
  return `${d.toLocaleDateString(loc, { day: "numeric", month: "short" }).replace(".", "")} ${hm}`;
}

function fmtPower(w, lang) {
  if (w === null) return "–";
  return Math.abs(w) >= 1000 ? fmt(w / 1000, 2, "kW", lang) : fmt(w, 0, "W", lang);
}

// Tank colour from its temperature: pale at 20 °C, deep red at 60 °C.
function tankColor(t) {
  const a = [246, 211, 196], b = [192, 57, 43];
  const k = t === null ? 0 : Math.max(0, Math.min(1, (t - 20) / 40));
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * k));
  return { css: `rgb(${c.join(",")})`, dark: k > 0.45 };
}

class AtlasCard extends HTMLElement {
  static getStubConfig() {
    return { borehole_depth: 88 };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    this._config = {
      borehole_depth: null,
      notices: [],
      ...config,
      entities: { ...DEFAULT_ENTITIES, ...(config.entities || {}) },
    };
    this._detail = false;   // false, "circuit" or "tank"
    this._tankHours = this._config.tank_hours || 72;
    this._tankHist = null;
    this._stats = {};
    this._statsAt = 0;
    this._sig = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._render();
    }
    if (Date.now() - this._statsAt > 5 * 60 * 1000) this._fetchStats();
  }

  getCardSize() {
    return 8;
  }

  getGridOptions() {
    return { columns: "full", min_columns: 6, rows: "auto" };
  }

  get _lang() {
    const l = this._hass?.locale?.language || this._hass?.language || "sv";
    return l.startsWith("sv") ? "sv" : "en";
  }

  get _t() {
    return T[this._lang];
  }

  _signature() {
    const e = this._config?.entities || {};
    const ids = [...Object.values(e).flat(), ...(this._config?.notices || []).map((n) => n.entity)];
    return ids.map((id) => (id && this._hass?.states?.[id]?.state) ?? "").join("|") + `|${this._detail}`;
  }

  // Today's energy and lowest brine temperature come from long-term statistics.
  async _fetchStats() {
    const hass = this._hass;
    if (!hass?.callWS) return;
    this._statsAt = Date.now();
    const e = this._config.entities;
    const ask = async (id, type) => {
      if (!id || !hass.states[id]) return null;
      try {
        const r = await hass.callWS({ type: "recorder/statistic_during_period", statistic_id: id, calendar: { period: "day" }, types: [type] });
        return r?.[type] ?? null;
      } catch (_) {
        return null;
      }
    };
    const [pump, brine] = await Promise.all([ask(e.energy, "change"), ask(e.brine_in, "min")]);
    this._stats = { pump, brine };
    this._render();
  }

  _model() {
    const hass = this._hass, e = this._config.entities, t = this._t, lang = this._lang;
    const n = (k) => num(hass, e[k]);
    const demandRaw = str(hass, e.demand);
    const demand = demandRaw ? (t.demands[demandRaw] || demandRaw) : "–";
    const running = e.compressor_running ? isOn(hass, e.compressor_running) : (n("compressor_pct") || 0) > 0;
    const valveTap = e.valve ? isOn(hass, e.valve) : demandRaw === "Hot water" || demandRaw === "Anti legionella";
    const heatOn = running && !valveTap;
    const hwOn = running && valveTap;
    const brineOn = (n("brine_pump") ?? (running ? 1 : 0)) > 0;
    const gear = Math.round(n("gear") ?? 0);
    const gears = Math.round(n("gears_available") ?? 10) || 10;
    const maxKey = valveTap ? "gear_max_tap" : "gear_max_heat";
    const maxAllowed = Math.round(n(maxKey) ?? gears);
    const limited = maxAllowed < gears;
    const immersion = e.immersion ? (str(hass, e.immersion) === "on" || (num(hass, e.immersion) || 0) > 0) : false;
    // Seconds left of the restart delay the pump starts each time the compressor stops (about 5 min).
    const blockedS = n("compressor_blocked") || 0, blocked = blockedS > 0, blockedMin = Math.max(1, Math.ceil(blockedS / 60));
    const alarm = isOn(hass, e.alarm);
    const seasonActive = e.heating_season_active ? isOn(hass, e.heating_season_active) : true;
    const heatStop = e.heating_season_active && str(hass, e.heating_season_active) !== null && !seasonActive;
    const stopT = n("heating_season_stop");
    const outdoor = n("outdoor");

    // The explanation line: what limits the pump right now, most important first.
    const notices = (this._config.notices || [])
      .filter((x) => x && x.entity && str(hass, x.entity) === String(x.state ?? "on"))
      .map((x) => x.text);
    let why, tone = "neutral";
    if (alarm) { why = t.whyAlarm; tone = "alert"; }
    else if (heatStop && !running) { why = t.whyHeatStop(fmt(outdoor, 1, "°C", lang), fmt(stopT, 0, "°C", lang)); tone = "stop"; }
    // The chip already says what the pump wants; the line says how long it has run or stood still,
    // and (below) what holds it back.
    else {
      const at = e.compressor_running && str(hass, e.compressor_running) !== null ? hass.states[e.compressor_running].last_changed : null;
      const since = at ? t.since(sinceWhen(at, lang, t)) : "";
      why = running ? t.whyRunning(since) : t.whyIdle(since);
    }
    const hgw = this._config.hgw === false ? null : this._hgwModel();
    const extra = [...notices];
    if (hgw?.alarm) extra.push(t.whyHgwAlarm);
    if (blocked) extra.push(t.whyBlocked(blockedMin));
    if (immersion) extra.push(t.whyImmersion);
    if (extra.length) {
      why = `${why}. ${extra.join(" ")}`.replace(/\.\. /, ". ");
      if (tone === "neutral") tone = "warn";
    }

    const segs = [];
    for (let i = 1; i <= gears; i++) {
      segs.push(running && i <= gear ? (limited || notices.length ? "on-limited" : "on") : i > maxAllowed ? "blocked" : "off");
    }

    const tankTop = n("tank_top"), tankBot = n("tank_bottom");
    let chip = { text: demand, tone: "neutral" };
    if (heatStop && !running) chip = { text: t.heatStopChip, tone: "stop" };
    else if (demandRaw === "Heat") chip.tone = "heat";
    else if (demandRaw === "Hot water" || demandRaw === "Anti legionella") chip.tone = "hw";

    const immHours = (Array.isArray(e.immersion_hours) ? e.immersion_hours : e.immersion_hours ? [e.immersion_hours] : [])
      .map((id) => num(hass, id));

    return {
      chip, why, tone,
      outdoor: fmt(outdoor, 1, "°C", lang),
      power: e.power ? fmtPower(num(hass, e.power), lang) : null,
      price: e.price ? `${fmt(num(hass, e.price), 2, "", lang)} ${hass?.states?.[e.price]?.attributes?.unit_of_measurement || ""}`.trim() : null,
      brineIn: fmt(n("brine_in"), 1, "°", lang), brineOut: fmt(n("brine_out"), 1, "°", lang),
      brineDt: n("brine_in") !== null && n("brine_out") !== null ? fmt(n("brine_in") - n("brine_out"), 1, "", lang) : "–",
      brineOn, heatOn, hwOn, valveTap, segs, limited: limited || notices.length > 0,
      // The gear bar shows used and allowed gears; the text line only carries speed.
      compText: running ? `${fmt(n("compressor_pct"), 0, "%", lang)} · ${fmt(n("compressor_rpm"), 0, "rpm", lang)}` : t.stopped,
      compShort: running ? fmt(n("compressor_pct"), 0, "%", lang) : t.stopped,
      brinePump: fmt(n("brine_pump"), 0, "%", lang), condPump: fmt(n("condenser_pump"), 0, "%", lang),
      brinePct: n("brine_pump"), condPct: n("condenser_pump"),
      immersion: e.immersion ? this._immersionModel(immersion) : null,
      supply: heatOn || heatStop ? fmt(n("condenser_out"), 1, "°", lang) : fmt(n("condenser_out"), 1, "°", lang),
      ret: fmt(n("condenser_in"), 1, "°", lang),
      heatDt: n("condenser_out") !== null && n("condenser_in") !== null ? fmt(n("condenser_out") - n("condenser_in"), 1, "", lang) : "–",
      heatStop, seasonKnown: !!e.heating_season_active && str(hass, e.heating_season_active) !== null,
      stopLimit: stopT !== null ? t.limit(fmt(stopT, 0, "°C", lang)) : "",
      integral: n("integral") !== null ? `${t.seasonIntegral} ${fmt(n("integral"), 0, "", lang)}` : "",
      tankTop: fmt(tankTop, 1, "°", lang), tankBot: fmt(tankBot, 1, "°", lang),
      tankTopC: tankColor(tankTop), tankBotC: tankColor(tankBot),
      // An external tank often has only the top sensor wired; the bottom value is drawn when it has one.
      tankBotKnown: tankBot !== null, hgw,
      stats: {
        pump: e.energy ? fmt(this._stats.pump, 1, "kWh", lang) : null,
        brine: fmt(this._stats.brine, 1, "°C", lang),
        imm: immHours.length ? immHours.map((h) => fmt(h, 0, "h", lang)).join(" · ") : null,
      },
    };
  }

  // The hot gas loop. It counts as running when the HGW regulation signal is on, or when a
  // configured hot gas pump runs (binary on, or a speed above 0). Turned off = the enable switch is off.
  _hgwModel() {
    const hass = this._hass, e = this._config.entities, t = this._t, lang = this._lang;
    const off = !!e.hgw_enabled && str(hass, e.hgw_enabled) === "off";
    const pumpRaw = e.hgw_pump ? str(hass, e.hgw_pump) : null;
    const pumpPct = pumpRaw === null ? null : pumpRaw === "on" ? 100 : pumpRaw === "off" ? 0 : num(hass, e.hgw_pump);
    const signal = e.hgw_active && str(hass, e.hgw_active) !== null ? isOn(hass, e.hgw_active) : null;
    const active = !off && (signal ?? (pumpPct || 0) > 0);
    const stop = e.hgw_stop ? num(hass, e.hgw_stop) : null;
    return {
      active, off, alarm: isOn(hass, e.hgw_alarm),
      status: off ? t.hgwOff : active ? t.hgwOn : t.hgwIdle,
      short: t.hgwShortStatus[isOn(hass, e.hgw_alarm) ? "alarm" : off ? "off" : active ? "on" : "idle"],
      gas: fmt(num(hass, e.discharge), 0, "°", lang),
      supply: active ? fmt(num(hass, e.hgw_supply), 0, "°", lang) : "–",
      stop: stop !== null ? t.hgwStop(fmt(stop, 0, "°C", lang)) : "",
      pumpPct: pumpPct ?? (active ? 100 : 0),
      pumpText: pumpRaw === null ? "" : pumpRaw === "on" || pumpRaw === "off" ? (pumpPct ? t.on : t.off) : fmt(pumpPct, 0, "%", lang),
    };
  }

  // Step sensor (0..n) or binary sensor; a binary "on" counts as step 1.
  _immersionModel(on) {
    const t = this._t, lang = this._lang, raw = str(this._hass, this._config.entities.immersion);
    const n = Math.max(1, Math.round(this._config.immersion_steps ?? 3));
    const step = !on ? 0 : raw === "on" ? 1 : Math.min(n, Math.max(1, Math.round(parseFloat(raw) || 1)));
    const kw = this._config.immersion_step_kw;
    // The bar shows the step; the text only adds power when kW per step is configured.
    const power = on && kw ? fmt(step * kw, 0, "kW", lang) : "";
    return { on, step, steps: Array.from({ length: n }, (_, i) => i < step), text: power, short: power };
  }

  _detailModel() {
    const hass = this._hass, e = this._config.entities, t = this._t, lang = this._lang;
    const n = (k) => num(hass, e[k]);
    const m_hgw = this._config.hgw === false ? null : this._hgwModel();
    const rng = (a, b) => `${n(a) ?? "–"}–${n(b) ?? "–"}`;
    return [
      ["hp", fmt(n("high_pressure"), 1, "bar", lang), `${t.bubble} ${fmt(n("bubble_point"), 1, "°C", lang)}`, "high_pressure", "warm"],
      ["lp", fmt(n("low_pressure"), 1, "bar", lang), `${t.dew} ${fmt(n("dew_point"), 1, "°C", lang)}`, "low_pressure", "cold"],
    ].map(([k, v, sub, ent, kind]) => ({ label: t[k], value: v, sub, entity: e[ent], kind }))
      .concat([{ rows: [
        [t.compHours, fmt(n("compressor_hours"), 0, "h", lang), e.compressor_hours],
        [t.tapHours, fmt(n("tap_water_hours"), 0, "h", lang), e.tap_water_hours],
        [t.gearsHeat, rng("gear_min_heat", "gear_max_heat"), e.gear_max_heat],
        [t.gearsTap, rng("gear_min_tap", "gear_max_tap"), e.gear_max_tap],
        ...(this._config.hgw === false ? [] : [
          null,
          [t.discharge, fmt(n("discharge"), 1, "°C", lang), e.discharge],
          [t.hgw, m_hgw ? (m_hgw.alarm ? t.hgwAlarm : m_hgw.status) : "–", e.hgw_active],
          [t.hgwToTank, m_hgw ? m_hgw.supply : "–", e.hgw_supply],
          ...(e.hgw_stop ? [[t.hgwPumpStop, fmt(num(hass, e.hgw_stop), 0, "°C", lang), e.hgw_stop]] : []),
          [t.hgwEnabled, e.hgw_enabled && str(hass, e.hgw_enabled) !== null ? (isOn(hass, e.hgw_enabled) ? t.yes : t.no) : "–", e.hgw_enabled],
          [`${t.hgwShort} · ${t.hgwAlarm}`, isOn(hass, e.hgw_alarm) ? t.active : t.noAlarm, e.hgw_alarm],
          null,
        ]),
        [t.blocked, (n("compressor_blocked") || 0) > 0 ? t.minLeft(Math.max(1, Math.ceil(n("compressor_blocked") / 60))) : t.no, e.compressor_blocked],
        null,
        // The heating season integral decides heating stop against the limit; it is not the
        // degree minutes that start the compressor (those aren't in the register map).
        [t.stopLimit, fmt(n("heating_season_stop"), 0, "°C", lang), e.heating_season_stop],
        [t.seasonIntegral, fmt(n("integral"), 0, "", lang), e.integral],
        null,
        [t.alarm, isOn(hass, e.alarm) ? t.active : t.noAlarm, e.alarm],
        ...(e.alarm_classes || []).map((id) => [hass?.states?.[id]?.attributes?.friendly_name || id, isOn(hass, id) ? t.active : t.off, id]),
        [t.phaseAlarm, isOn(hass, e.phase_alarm) ? t.fault : t.ok, e.phase_alarm],
      ] }]);
  }

  // The tank's two temperatures over the chosen period, from the recorder's history.
  async _fetchTank() {
    const hass = this._hass, e = this._config.entities, hours = this._tankHours;
    if (!hass?.callWS) return;
    const h = this._tankHist;
    if (h && h.hours === hours && Date.now() - h.at < 5 * 60 * 1000) return;
    this._tankHist = { hours, at: Date.now(), loading: true, series: h?.hours === hours ? h.series : null };
    const end = new Date(), start = new Date(end.getTime() - hours * 3600 * 1000);
    // The demand sensor over 15 days: legionella runs to shade, and the interval between them
    const dStart = new Date(end.getTime() - Math.max(hours, 15 * 24) * 3600 * 1000);
    const ask = (from, ids) => hass.callWS({
      type: "history/history_during_period", start_time: from.toISOString(), end_time: end.toISOString(),
      entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
    });
    try {
      const [r, d] = await Promise.all([ask(start, [e.tank_top, e.tank_bottom]), e.demand ? ask(dStart, [e.demand]).catch(() => null) : null]);
      const series = [e.tank_top, e.tank_bottom].map((id) => tankPoints(r?.[id]));
      const runs = legionellaRuns(d?.[e.demand], end.getTime());
      this._tankHist = { hours, at: Date.now(), start: start.getTime(), end: end.getTime(), series, runs };
    } catch (err) {
      this._tankHist = { hours, at: Date.now(), error: String(err?.message || err) };
    }
    if (this._detail === "tank") this._render();
  }

  _tankHtml() {
    const t = this._t, lang = this._lang, e = this._config.entities, hass = this._hass;
    const top = num(hass, e.tank_top), bot = num(hass, e.tank_bottom);
    const a = num(hass, e.tap_start), b = num(hass, e.tap_stop);
    const h = this._tankHist;
    const leg = (cls, label, v, ent) => `<div class="tleg" data-entity="${esc(ent)}"><i class="${cls}"></i><span class="lbl">${esc(label)}</span><span class="v">${esc(fmt(v, 1, "°C", lang))}</span></div>`;
    const ranges = t.ranges.map(([hrs, label]) => `<button type="button" class="rng${hrs === this._tankHours ? " on" : ""}" data-action="tankrange" data-hours="${hrs}" aria-pressed="${hrs === this._tankHours}">${esc(label)}</button>`).join("");
    const limits = a !== null || b !== null
      ? `<div class="lbl tlim">${esc([a !== null ? t.tankStart(fmt(a, 0, "°C", lang)) : "", b !== null ? t.tankStop(fmt(b, 0, "°C", lang)) : ""].filter(Boolean).join(", "))}</div>` : "";
    let chart;
    if (!h || h.loading && !h.series) chart = `<div class="tmsg">${esc(t.loading)}</div>`;
    else if (h.error) chart = `<div class="tmsg">${esc(h.error)}</div>`;
    else if (!h.series || !h.series.some((pts) => pts.length)) chart = `<div class="tmsg">${esc(t.noHistory)}</div>`;
    else chart = tankChart(h, a, b, lang, t.legio);
    // When the last legionella cycle ran, and roughly when the next one is due
    let legio = "";
    if (h?.runs?.length) {
      const last = h.runs.at(-1), next = nextLegionella(h.runs);
      legio = last.ongoing ? t.legioNow
        : [t.legioLast(whenLong(last.start, lang)), next && next > Date.now() ? t.legioNext(whenLong(next, lang)) : ""].filter(Boolean).join(", ");
    }
    return `<div class="detail">
      <div class="dhead"><div class="dtitle">${esc(t.tank)}</div><button class="back" data-action="detail">${esc(t.back)}</button></div>
      <div class="thead"><div class="tlegs">${leg("top", t.tankTop, top, e.tank_top)}${leg("bot", t.tankBottom, bot, e.tank_bottom)}</div><div class="rngs">${ranges}</div></div>
      ${limits}
      ${legio ? `<div class="lbl tlim"><i class="lgsw"></i>${esc(legio)}</div>` : ""}
      ${chart}
    </div>`;
  }

  _svg(m) {
    const t = this._t, c = COLORS, e = this._config.entities;
    const col = {
      bIn: m.brineOn ? c.brineIn : c.idle, bOut: m.brineOn ? c.brineOut : c.idle,
      heat: m.heatOn ? c.heat : c.idle, heatRet: m.heatOn ? c.heatRet : c.idle,
      hw: m.hwOn ? c.hw : c.idle, hwRet: m.hwOn ? c.hwRet : c.idle,
      hgw: m.hgw?.active ? c.hgw : c.idle, hgwRet: m.hgw?.active ? c.hgwRet : c.idle,
      sup: m.heatOn ? c.heat : m.hwOn ? c.hw : c.idle, tap: c.tap,
    };
    const pipe = (x1, y1, x2, y2, color) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
    const arrow = (x, y, rot, color) => `<path d="M-3 -4.5l5 4.5-5 4.5" transform="translate(${x} ${y}) rotate(${rot})" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    const txt = (x, y, s, cls = "", ent = "", anchor = "start") =>
      `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}"${ent ? ` data-entity="${esc(ent)}"` : ""}>${esc(s)}</text>`;
    const depth = this._config.borehole_depth;

    // Gear segments
    const segW = (160 - 3 * (m.segs.length - 1)) / m.segs.length;
    const segs = m.segs.map((s, i) => {
      const fill = s === "on" ? c.gear : s === "on-limited" ? c.gearLimited : s === "blocked" ? "url(#hatch)" : "var(--atlas-seg, rgba(127, 127, 127, 0.28))";
      return `<rect x="${185 + i * (segW + 3)}" y="88" width="${segW.toFixed(2)}" height="14" rx="3" fill="${fill}"/>`;
    }).join("");

    const tankId = "tg";
    // Immersion heater steps, drawn like the compressor's gears
    const immBar = (x, y, h) => {
      const st = m.immersion.steps, w = (160 - 3 * (st.length - 1)) / st.length;
      return st.map((on, i) => `<rect x="${(x + i * (w + 3)).toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${h}" rx="3" fill="${on ? c.immersion : "var(--atlas-seg, rgba(127, 127, 127, 0.28))"}"/>`).join("");
    };
    // Pump symbol: a ring filled to the speed, with an impeller that spins while running
    const pumpSym = (cx, cy, pct, color, ent) => {
      const r = 12, circ = 2 * Math.PI * r, k = Math.max(0, Math.min(100, pct || 0)) / 100;
      const spin = k > 0 ? ` style="animation-duration:${(2.4 - 1.8 * k).toFixed(2)}s"` : "";   // faster at higher speed
      return `<g class="pump" data-entity="${esc(ent)}">
        <circle cx="${cx}" cy="${cy}" r="${r}" class="pumpbg"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--atlas-seg, rgba(127, 127, 127, 0.28))" stroke-width="3"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${k > 0 ? color : "transparent"}" stroke-width="3"
          stroke-dasharray="${(circ * k).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
        <g class="${k > 0 ? "spin" : ""}"${spin}><path d="M${cx - 5} ${cy - 5}l10 5-10 5z" fill="${k > 0 ? color : "var(--atlas-idle, #c9cdd2)"}"/></g>
      </g>`;
    };
    return `
<svg viewBox="0 34 712 296" role="img" aria-label="${esc(t.title)}">
  <defs>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="var(--card-background-color, #fff)"/><rect width="3" height="6" fill="var(--atlas-seg, rgba(127, 127, 127, 0.28))"/>
    </pattern>
    <linearGradient id="${tankId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${m.tankTopC.css}"/><stop offset="1" stop-color="${(m.tankBotKnown ? m.tankBotC : m.tankTopC).css}"/>
    </linearGradient>
  </defs>

  ${txt(0, 48, t.borehole, "lbl strong")}
  <rect x="0" y="60" width="44" height="10" fill="#ece4d6"/><line x1="0" y1="61" x2="44" y2="61" stroke="#8c7b62" stroke-width="2"/>
  <rect x="0" y="72" width="44" height="230" fill="var(--atlas-rock, rgba(127, 127, 127, 0.18))"/>
  ${depth ? txt(0, 318, `${depth} m`, "lbl") : ""}
  ${pipe(16, 160, 16, 292, col.bOut)}${pipe(30, 120, 30, 292, col.bIn)}${pipe(16, 292, 30, 292, col.bOut)}
  ${pipe(30, 120, 170, 120, col.bIn)}${pipe(16, 160, 170, 160, col.bOut)}
  ${txt(60, 110, `${t.in} ${m.brineIn}`, "val", e.brine_in)}
  ${txt(60, 145, `ΔT ${m.brineDt}`, "lbl opt")}
  ${txt(60, 180, `${t.out} ${m.brineOut}`, "val", e.brine_out)}

  <g class="hp" data-action="detail" tabindex="0" role="button" aria-label="${esc(t.circuit)}">
    <rect x="170" y="56" width="190" height="180" rx="12" class="box hpbox"/>
    ${txt(185, 78, t.compressor, "lbl")}
    ${segs}
    ${txt(185, 126, m.compText, "val full", e.compressor_pct)}${txt(185, 130, m.compShort, "val big short", e.compressor_pct)}
    <line x1="185" y1="142" x2="345" y2="142" class="div opt"/>
    ${m.immersion ? `<g class="opt" data-entity="${esc(e.immersion)}">${m.immersion.on ? `<rect x="179" y="150" width="172" height="38" rx="6" fill="var(--atlas-warn-bg, #fff4dc)"/>` : ""}
      ${txt(185, 164, t.immersion, m.immersion.on ? "sm warn" : "lbl")}${txt(345, 164, m.immersion.text, m.immersion.on ? "sm warn strong" : "sm", e.immersion, "end")}
      ${immBar(185, 172, 9)}</g>
    <g class="short imm-compact" data-entity="${esc(e.immersion)}">${m.immersion.on ? `<rect x="179" y="142" width="172" height="46" rx="6" fill="var(--atlas-warn-bg, #fff4dc)"/>` : ""}
      ${txt(185, 163, t.immersionShort, m.immersion.on ? "lbl warn" : "lbl")}${txt(345, 163, m.immersion.short, m.immersion.on ? "sm warn strong" : "sm", e.immersion, "end")}
      ${immBar(185, 172, 10)}</g>` : ""}
    ${txt(185, 222, t.circuit, "link")}
  </g>

  ${pipe(360, 78, 560, 78, col.heatRet)}
  ${pipe(360, 110, 400, 110, col.sup)}
  <circle cx="418" cy="110" r="17" class="valve" stroke="${col.sup}"/>
  <path d="M-7 0h12M1 -5l5 5-5 5" transform="translate(418 110) rotate(${m.valveTap ? 90 : 0})" fill="none" class="valve-arrow" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${e.valve ? ` data-entity="${esc(e.valve)}"` : ""}/>
  ${pipe(436, 110, 560, 110, col.heat)}
  ${pipe(418, 128, 418, 248, col.hw)}${pipe(418, 248, 470, 248, col.hw)}
  <g${e.valve ? ` data-entity="${esc(e.valve)}"` : ""}><rect x="430" y="146" width="122" height="20" rx="10" class="pill opt"/>${txt(491, 160, `${t.valve} ${m.valveTap ? t.toTap : t.toHeat}`, "xs opt", "", "middle")}</g>
  ${pipe(330, 280, 470, 280, col.hwRet)}${pipe(330, 236, 330, 280, col.hwRet)}

  <g class="${m.heatOn || m.heatStop ? "" : "dim"}">
    <rect x="560" y="52" width="152" height="118" rx="12" class="box"/>
    ${txt(572, 72, t.radiators, "lbl")}
    ${txt(572, 94, t.supply, "sm")}${txt(700, 94, m.supply, "val", e.condenser_out, "end")}
    ${txt(572, 114, t.ret, "sm")}${txt(700, 114, m.ret, "val", e.condenser_in, "end")}
    ${txt(572, 132, `ΔT ${m.heatDt}`, "lbl opt")}
  </g>
  ${m.seasonKnown ? `<g class="season" data-entity="${esc(e.heating_season_stop)}">${m.integral ? `<title>${esc(m.integral)}</title>` : ""}<rect x="568" y="140" width="136" height="20" rx="10" class="pill ${m.heatStop ? "stop" : ""}"/>${txt(636, 154, (m.heatStop ? t.heatStopOn : t.heatStopOff)(m.stopLimit), `xs ${m.heatStop ? "stoptxt strong" : ""}`, "", "middle")}</g>` : ""}

  ${m.hgw ? `
  <g class="hgw" data-entity="${esc(e.hgw_supply)}">
    <rect x="272" y="190" width="82" height="20" rx="5" class="hgwchip ${m.hgw.alarm ? "alarm" : m.hgw.active ? "on" : ""}"/>
    ${txt(313, 204, m.hgw.alarm ? `${t.hgwShort} ${t.hgwAlarm.toLowerCase()}` : m.hgw.active ? `${t.hgwShort} ${m.hgw.supply}` : t.hgwShort, `xs strong ${m.hgw.alarm ? "warn" : m.hgw.active ? "" : "muted"}`, "", "middle")}
  </g>
  <g data-entity="${esc(e.discharge)}">${m.immersion
    ? `${txt(185, 204, `${t.hgwGas} ${m.hgw.gas}`, "sm")}`
    : `${txt(185, 164, t.hgwGas, "lbl")}${txt(345, 166, m.hgw.gas, "val big", e.discharge, "end")}`}</g>
  <path d="M354 200H410A8 8 0 0 1 426 200H470" fill="none" stroke="${col.hgw}" stroke-width="4" stroke-linecap="round"/>
  ${pipe(310, 304, 470, 304, col.hgwRet)}${pipe(310, 236, 310, 304, col.hgwRet)}
  ${pumpSym(386, 200, m.hgw.pumpPct, c.hgw, e.hgw_pump || e.hgw_active)}${m.hgw.pumpText ? txt(386, 226, m.hgw.pumpText, "xs", e.hgw_pump, "middle") : ""}
  ${arrow(450, 200, 0, col.hgw)}${arrow(390, 304, 180, col.hgwRet)}${arrow(310, 272, 270, col.hgwRet)}
  </g>` : ""}

  <g class="tank" data-action="tank" tabindex="0" role="button" aria-label="${esc(t.tankOpen)}">
    <rect x="470" y="176" width="72" height="148" rx="28" fill="url(#${tankId})" stroke="var(--divider-color, #c9cdd2)" class="tankbody"/>
    ${txt(506, 222, m.tankTop, `val ${m.tankTopC.dark ? "light" : ""}`, "", "middle")}
    ${txt(506, 258, t.tankExt1, `xs opt ${m.tankTopC.dark ? "light" : ""}`, "", "middle")}${txt(506, 272, t.tankExt2, `xs opt ${m.tankTopC.dark ? "light" : ""}`, "", "middle")}
    ${m.tankBotKnown ? txt(506, 308, m.tankBot, `val ${m.tankBotC.dark ? "light" : ""}`, "", "middle") : ""}
  </g>

  ${pipe(542, 190, 600, 190, col.tap)}${txt(606, 194, t.taps, "lbl")}${arrow(570, 190, 0, col.tap)}

  ${arrow(105, 120, 0, col.bIn)}${pumpSym(146, 120, m.brinePct, c.brineIn, e.brine_pump)}${txt(146, 146, m.brinePump, "xs", e.brine_pump, "middle")}${arrow(130, 160, 180, col.bOut)}
  ${arrow(16, 230, 90, col.bOut)}${arrow(30, 230, 270, col.bIn)}
  ${pumpSym(380, 110, m.condPct, col.sup === c.idle ? c.heat : col.sup, e.condenser_pump)}${txt(380, 140, m.condPump, "xs", e.condenser_pump, "middle")}${arrow(500, 110, 0, col.heat)}${arrow(470, 78, 180, col.heatRet)}
  ${arrow(418, 176, 90, col.hw)}${arrow(446, 248, 0, col.hw)}${arrow(400, 280, 180, col.hwRet)}${arrow(330, 262, 270, col.hwRet)}
</svg>`;
  }

  _html() {
    if (!this._hass || !this._config) return "";
    const t = this._t, e = this._config.entities;
    const m = this._model();
    const title = this._config.title ?? "Atlas";
    const stat = (label, value, ent) => value === null ? "" :
      `<div class="stat"${ent ? ` data-entity="${esc(ent)}"` : ""}><div class="lbl">${esc(label)}</div><div class="v">${esc(value)}</div></div>`;
    const head = [
      [t.outdoor, m.outdoor, e.outdoor],
      [t.power, m.power, e.power],
      [t.price, m.price, e.price],
    ].filter((x) => x[1] !== null).map(([l, v, ent]) => `<div class="hstat" data-entity="${esc(ent)}"><div class="lbl">${esc(l)}</div><div class="v">${esc(v)}</div></div>`).join("");

    let body;
    if (this._detail === "tank") {
      body = this._tankHtml();
    } else if (this._detail) {
      const d = this._detailModel();
      body = `<div class="detail">
        <div class="dhead"><div class="dtitle">${esc(t.circuit.replace(" ›", ""))}</div><button class="back" data-action="detail">${esc(t.back)}</button></div>
        <div class="dgrid">${d.slice(0, 2).map((x) => `<div class="dcard ${x.kind}" data-entity="${esc(x.entity)}"><div class="lbl">${esc(x.label)}</div><div class="v big">${esc(x.value)}</div><div class="lbl">${esc(x.sub)}</div></div>`).join("")}</div>
        <div class="drows">${d[2].rows.map((r) => r === null ? `<div class="hr"></div>` : `<div class="drow" data-entity="${esc(r[2])}"><span class="lbl">${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join("")}</div>
      </div>`;
    } else {
      body = `<div class="diagram">${this._svg(m)}</div>
      <div class="stats">
        ${stat(t.pumpToday, m.stats.pump, e.energy)}
        ${stat(t.brineMin, m.stats.brine, e.brine_in)}
        ${stat(t.immHours, m.stats.imm, Array.isArray(e.immersion_hours) ? e.immersion_hours[0] : e.immersion_hours)}
      </div>`;
    }
    return `
<ha-card>
  <div class="wrap${this._compact ? " compact" : ""}">
    <div class="head">
      <div class="tl"><div class="title">${esc(title)}</div><div class="chip ${m.chip.tone}" data-entity="${esc(e.demand)}">${esc(m.chip.text)}</div></div>
      <div class="hstats">${head}</div>
    </div>
    <div class="why ${m.tone}">${esc(m.why)}</div>
    ${body}
  </div>
</ha-card>`;
  }

  connectedCallback() {
    if (typeof ResizeObserver === "undefined" || this._ro) return;
    // Below ~560 px the full diagram's text gets too small; switch to a compact variant.
    this._ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width || 0;
      const compact = w > 0 && w < 560;
      if (compact !== !!this._compact) { this._compact = compact; this._render(); }
    });
    this._ro.observe(this);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = null;
  }

  _render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener?.("click", (ev) => this._onClick(ev));
      this.shadowRoot.addEventListener?.("keydown", (ev) => {
        if ((ev.key === "Enter" || ev.key === " ") && ev.target?.closest?.("[data-action]")) { ev.preventDefault(); this._onClick(ev); }
      });
    }
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>${this._html()}`;
  }

  _onClick(ev) {
    const path = ev.composedPath ? ev.composedPath() : [ev.target];
    for (const el of path) {
      if (!el?.getAttribute) continue;
      if (el.getAttribute("data-entity")) {
        this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: el.getAttribute("data-entity") } }));
        return;
      }
      const act = el.getAttribute("data-action");
      if (act === "detail") {
        // the refrigerant circuit's button, and every view's "Back"
        this._detail = this._detail ? false : "circuit";
        this._sig = null;
        this._render();
        return;
      }
      if (act === "tank" || act === "tankrange") {
        if (act === "tankrange") this._tankHours = Number(el.getAttribute("data-hours")) || 72;
        this._detail = "tank";
        this._sig = null;
        this._render();
        this._fetchTank();
        return;
      }
    }
  }
}

// Compressed history rows ({s, lu}) → [[ms, °C]], skipping non-numeric states
function tankPoints(rows) {
  const out = [];
  for (const r of rows || []) {
    const v = parseFloat(r.s), ts = (r.lu ?? r.lc) * 1000;
    if (Number.isFinite(v) && Number.isFinite(ts)) out.push([ts, v]);
  }
  return out;
}

// Spans where the pump's demand was "Anti legionella": [{start, end, ongoing}] in ms
function legionellaRuns(rows, nowMs) {
  const out = [];
  let cur = null;
  for (const r of rows || []) {
    const ts = (r.lu ?? r.lc) * 1000;
    if (!Number.isFinite(ts)) continue;
    if (r.s === "Anti legionella") { if (!cur) cur = { start: ts }; }
    else if (cur) { out.push({ start: cur.start, end: ts, ongoing: false }); cur = null; }
  }
  if (cur) out.push({ start: cur.start, end: nowMs, ongoing: true });
  return out;
}

// The next run: the last start plus the median gap between starts (a week when there is only one)
function nextLegionella(runs) {
  if (!runs?.length) return null;
  const gaps = runs.slice(1).map((r, i) => r.start - runs[i].start).filter((g) => g > 3600e3).sort((a, b) => a - b);
  const gap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 7 * 24 * 3600e3;
  return runs.at(-1).start + gap;
}

// "fre 23 okt 20:15"
function whenLong(ms, lang) {
  const d = new Date(ms);
  const day = d.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(/\.$/, "");
  return `${day} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// One line per series, averaged into time buckets so a week of 10-second readings stays light
function tankChart(h, start, stop, lang, legioLabel = "Legionella") {
  const W = 760, H = 260, L = 40, R = 748, T0 = 14, B = 230, buckets = 300;
  const t0 = h.start, t1 = h.end, span = Math.max(1, t1 - t0);
  const all = h.series.flat().map((p) => p[1]).concat([start, stop].filter((v) => v !== null));
  const lo = Math.floor((Math.min(...all) - 2) / 5) * 5, hi = Math.ceil((Math.max(...all) + 2) / 5) * 5;
  const x = (ms) => L + (ms - t0) / span * (R - L), y = (v) => B - (v - lo) / Math.max(1, hi - lo) * (B - T0);
  const line = (pts) => {
    const sums = new Map();
    for (const [ms, v] of pts) {
      if (ms < t0 || ms > t1) continue;
      const k = Math.min(buckets - 1, Math.floor((ms - t0) / span * buckets));
      const a = sums.get(k) || sums.set(k, [0, 0]).get(k);
      a[0] += v; a[1] += 1;
    }
    // Hold the value from before the period until the first reading in it
    const before = pts.filter(([ms]) => ms < t0).at(-1);
    const keys = [...sums.keys()].sort((a, b) => a - b);
    const xy = keys.map((k) => [t0 + (k + 0.5) / buckets * span, sums.get(k)[0] / sums.get(k)[1]]);
    if (before) xy.unshift([t0, before[1]]);
    if (xy.length) xy.push([t1, xy.at(-1)[1]]);
    return xy.map(([ms, v], i) => `${i ? "L" : "M"}${x(ms).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  };
  const step = hi - lo > 40 ? 10 : 5;
  let out = `<svg class="tchart" viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="${lang === "sv" ? "Tankens temperaturer" : "Tank temperatures"}">`;
  for (let v = lo; v <= hi; v += step) out += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${v}</text>`;
  // Time ticks: every 6 h for a day, every 12 h for three, midnights for a week
  const tickH = span <= 26 * 3600e3 ? 6 : span <= 80 * 3600e3 ? 12 : 24;
  const d = new Date(t0); d.setMinutes(0, 0, 0); d.setHours(Math.ceil(d.getHours() / tickH) * tickH);
  for (let ms = d.getTime(); ms <= t1; ms += tickH * 3600e3) {
    const dt = new Date(ms), mid = dt.getHours() === 0;
    const label = tickH === 24 || mid
      ? dt.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { weekday: "short", day: "numeric" })
      : `${String(dt.getHours()).padStart(2, "0")}:00`;
    out += `<line x1="${x(ms)}" x2="${x(ms)}" y1="${T0}" y2="${B}" class="grid${mid ? " mid" : ""}"/><text x="${x(ms)}" y="${B + 16}" text-anchor="middle" class="ax">${esc(label)}</text>`;
  }
  for (const v of [start, stop]) if (v !== null && v >= lo && v <= hi) out += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" class="lim"/><text x="${R}" y="${y(v) - 4}" text-anchor="end" class="ax">${v} °C</text>`;
  // Legionella cycles as shaded bands (at least 4 px wide, so a short run on a week still shows)
  for (const r of h.runs || []) {
    if (r.end < t0 || r.start > t1) continue;
    const xa = x(Math.max(r.start, t0)), xb = Math.max(xa + 4, x(Math.min(r.end, t1)));
    out += `<rect x="${xa.toFixed(1)}" y="${T0}" width="${(xb - xa).toFixed(1)}" height="${B - T0}" class="legio"><title>${esc(legioLabel)} ${esc(whenLong(r.start, lang))}</title></rect>`;
    out += `<text x="${((xa + xb) / 2).toFixed(1)}" y="${T0 - 3}" text-anchor="middle" class="ax legiotxt">${esc(legioLabel)}</text>`;
  }
  out += `<path d="${line(h.series[1])}" class="tl bot"/><path d="${line(h.series[0])}" class="tl top"/>`;
  return out + "</svg>";
}

const STYLE = `
:host { display: block; }
.wrap { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; color: var(--primary-text-color); }
.head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.tl { display: flex; align-items: center; gap: 10px; }
.title { font-size: 20px; font-weight: 500; }
.chip { font-size: 13px; font-weight: 500; padding: 4px 10px; border-radius: 999px; cursor: pointer;
  background: var(--secondary-background-color); color: var(--primary-text-color); }
.chip.heat { background: #fde7dc; color: #8a3412; }
.chip.hw { background: #fbe0de; color: #8c1d18; }
.chip.stop { background: #dff1ef; color: #00504a; }
.hstats { display: flex; gap: 18px; }
.hstat { display: flex; flex-direction: column; align-items: flex-end; cursor: pointer; }
.lbl { font-size: 11px; color: var(--secondary-text-color); }
.v { font-size: 16px; font-weight: 500; }
.v.big { font-size: 18px; }
.why { font-size: 13px; line-height: 1.4; padding: 8px 12px; border-radius: 8px; background: var(--secondary-background-color); }
.why.warn { background: #fff4dc; color: #6b4500; }
.why.stop { background: #e8f4f3; color: #00504a; }
.why.alert { background: #fde7e7; color: #8c1d18; }
.short { display: none; }
.compact .full, .compact .opt, .compact .season { display: none; }
.compact .short { display: inline; }
.compact svg text { font-size: 20px; }
.compact svg text.lbl, .compact svg text.link { font-size: 18px; }
.compact svg text.sm { font-size: 17px; }
.compact svg text.xs { font-size: 16px; }
.compact svg text.val, .compact svg text.big { font-size: 22px; }
.compact .hstats { width: 100%; justify-content: space-between; }
.compact .hstat { align-items: flex-start; }
.diagram svg { width: 100%; height: auto; display: block; font-family: inherit; }
svg text { fill: var(--primary-text-color); font-size: 13px; }
svg text.lbl { fill: var(--secondary-text-color); font-size: 11px; }
svg text.sm { font-size: 12px; }
svg text.xs { font-size: 11px; }
svg text.val { font-size: 13px; font-weight: 500; }
svg text.big { font-size: 15px; }
svg text.strong { font-weight: 500; }
svg text.light { fill: #fff; }
svg text.muted { fill: var(--secondary-text-color); }
svg text.warn { fill: #6b4500; }
svg text.stoptxt { fill: #00504a; }
svg text.link { fill: var(--primary-color); font-size: 12px; }
svg [data-entity] { cursor: pointer; }
svg .box { fill: var(--card-background-color, #fff); stroke: var(--divider-color, #d5d9de); }
svg .hpbox { fill: var(--secondary-background-color, #fafbfc); }
svg .box.warnbox { fill: #fff4dc; stroke: #e0b65c; }
svg .box.hgwbox { fill: rgba(168, 50, 122, 0.07); stroke: #a8327a; }
svg .hgwchip { fill: var(--secondary-background-color, #f6f7f9); stroke: var(--divider-color, #c9cdd2); }
svg .hgwchip.alarm { fill: #fff4dc; stroke: #e0b65c; }
svg .hgwchip.on { fill: rgba(168, 50, 122, 0.12); stroke: #a8327a; }
svg text.hgwtxt { fill: var(--primary-text-color); }
svg .hgw { cursor: pointer; }
svg .hp { cursor: pointer; outline: none; }
svg .hp:focus-visible .hpbox { stroke: var(--primary-color); stroke-width: 2; }
svg .div { stroke: var(--divider-color, #e3e6ea); }
svg .pill { fill: var(--secondary-background-color, #f1f3f4); }
svg .pill.stop { fill: #dff1ef; }
svg .valve { fill: var(--card-background-color, #fff); stroke-width: 2; }
svg .valve-arrow { stroke: var(--primary-text-color); }
svg .pumpbg { fill: var(--card-background-color, #fff); }
svg .pump { cursor: pointer; }
svg .spin { transform-box: fill-box; transform-origin: center; animation: atlas-spin 1.2s linear infinite; }
@keyframes atlas-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { svg .spin { animation: none; } }
svg .dim text { opacity: 0.6; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.stat { padding: 10px 12px; border-radius: 10px; background: var(--secondary-background-color); cursor: pointer; }
.detail { display: flex; flex-direction: column; gap: 12px; }
.dhead { display: flex; justify-content: space-between; align-items: center; }
.dtitle { font-size: 16px; font-weight: 500; }
.back { background: none; border: 0; color: var(--primary-color); font: inherit; font-size: 13px; cursor: pointer; padding: 8px; }
.dgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
.dcard { padding: 12px; border-radius: 10px; cursor: pointer; }
.dcard.warm { background: rgba(217, 98, 43, 0.12); }
.dcard.cold { background: rgba(47, 111, 179, 0.12); }
.drows { display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
.drow { display: flex; justify-content: space-between; cursor: pointer; }
.drow .lbl { font-size: 13px; }
.hr { height: 1px; background: var(--divider-color); }
svg .tank { cursor: pointer; outline: none; }
svg .tank:hover .tankbody, svg .tank:focus-visible .tankbody { stroke: var(--primary-color); stroke-width: 2; }
.thead { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.tlegs { display: flex; gap: 18px; flex-wrap: wrap; }
.tleg { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.tleg i { width: 14px; height: 4px; border-radius: 2px; display: inline-block; }
.tleg i.top, svg .tl.top { background: #d0453a; stroke: #d0453a; }
.tleg i.bot, svg .tl.bot { background: #2f6fb3; stroke: #2f6fb3; }
.tleg .lbl { font-size: 13px; }
.rngs { display: flex; gap: 4px; }
.rng { font: inherit; font-size: 12px; padding: 6px 10px; min-height: 32px; border-radius: 16px; border: 1px solid var(--divider-color, #d5d9de); background: none; color: var(--primary-text-color); cursor: pointer; }
.rng.on { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); }
.tlim { font-size: 12px; }
.tmsg { font-size: 13px; color: var(--secondary-text-color); padding: 40px 0; text-align: center; }
svg.tchart { width: 100%; height: auto; display: block; font-family: inherit; }
svg.tchart .grid { stroke: var(--divider-color, #e3e6ea); }
svg.tchart .grid.mid { stroke: var(--secondary-text-color); stroke-opacity: 0.35; }
svg.tchart .lim { stroke: var(--secondary-text-color); stroke-dasharray: 4 4; stroke-opacity: 0.7; }
svg.tchart text.ax { fill: var(--secondary-text-color); font-size: 11px; }
svg.tchart .tl { fill: none; stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
svg.tchart .legio { fill: rgba(217, 130, 43, 0.18); }
svg.tchart text.legiotxt { fill: #9a5a12; font-weight: 600; font-size: 10px; }
.lgsw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: rgba(217, 130, 43, 0.35); margin-right: 6px; vertical-align: -1px; }
`;

if (!customElements.get("atlas-card")) {
  customElements.define("atlas-card", AtlasCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "atlas-card",
    name: "Atlas Card",
    description: "Thermia Atlas with an external water heater and a hot gas heat exchanger (HGW): borehole, compressor, diverting valve, tank and HGW loop. Written without access to the hardware.",
    documentationURL: "https://github.com/JanJoh/atlas-card",
  });
  console.info(`%c ATLAS-CARD %c ${CARD_VERSION} `, "color:#fff;background:#a8327a;font-weight:600", "color:#a8327a;background:#fff");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AtlasCard, DEFAULT_ENTITIES, tankColor, fmt, sinceWhen, tankPoints, tankChart, legionellaRuns, nextLegionella };   // for the tests
}
