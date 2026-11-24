// Clock for the lotus. Bloom is the fraction of the current hour.
// `?t=HH:MM:SS` holds the clock there; the scrubber does the same.

import { bloomFraction, mountLotus } from "./lotus.js";

const canvas = document.getElementById("flower");
const view = mountLotus(canvas);
const speciesEl = document.getElementById("species");
const timeEl = document.getElementById("time");
const bloomEl = document.getElementById("bloom-label");
const hourEl = document.getElementById("hour");
const progressEl = document.getElementById("progress");
const liveBtn = document.getElementById("live");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let mode = "live";
let frozen = null;
let dragging = false;
let editingHour = false;
let raf = 0;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function format(date) {
  return pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
}

function secondsInto(date) {
  return date.getMinutes() * 60 + date.getSeconds();
}

function parseTime(value) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  const s = match[3] == null ? 0 : Number(match[3]);
  if (h > 23 || min > 59 || s > 59) return null;
  const date = new Date();
  date.setHours(h, min, s, 0);
  return date;
}

function currentDate() {
  return mode === "live" ? new Date() : frozen;
}

function resize() {
  view.resize(window.innerWidth, window.innerHeight);
}

function syncInputs(date) {
  if (!dragging) progressEl.value = String(secondsInto(date));
  if (!editingHour) hourEl.value = String(date.getHours());
  progressEl.setAttribute("aria-valuenow", progressEl.value);
  progressEl.setAttribute("aria-valuetext", format(date));
  liveBtn.setAttribute("aria-pressed", mode === "live" ? "true" : "false");
}

function writeQuery(date) {
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("t", format(date));
  history.replaceState(null, "", url.pathname + url.search);
}

function clearQuery() {
  history.replaceState(null, "", location.pathname);
}

function setScrub(hour, into) {
  const h = clamp(Math.round(Number(hour) || 0), 0, 23);
  const sec = clamp(Math.round(Number(into) || 0), 0, 3599);
  const date = new Date();
  date.setHours(h, Math.floor(sec / 60), sec % 60, 0);
  frozen = date;
  mode = "scrub";
  writeQuery(date);
  syncInputs(date);
}

function goLive() {
  mode = "live";
  frozen = null;
  clearQuery();
}

function frame(nowMs) {
  raf = 0;
  if (document.hidden) return;

  const date = currentDate();
  const bloom = bloomFraction(date);
  const stats = view.render(date, nowMs / 1000, reduceMotion);

  speciesEl.textContent = "Lotus";
  timeEl.textContent = format(date);
  bloomEl.textContent = "bloom " + Math.round(bloom * 100) + "%";

  canvas.dataset.species = stats.species;
  canvas.dataset.hour = String(date.getHours());
  canvas.dataset.bloom = bloom.toFixed(4);
  canvas.dataset.spread = stats.radius.toFixed(3);
  canvas.dataset.seed = String(stats.seed);
  canvas.dataset.petals = String(stats.petals);
  canvas.dataset.inner = String(stats.inner);
  canvas.dataset.mode = mode;

  syncInputs(date);
  raf = requestAnimationFrame(frame);
}

function start() {
  if (raf) return;
  raf = requestAnimationFrame(frame);
}

progressEl.addEventListener("pointerdown", function () { dragging = true; });
window.addEventListener("pointerup", function () { dragging = false; });
progressEl.addEventListener("input", function () {
  setScrub(hourEl.value, progressEl.value);
});
hourEl.addEventListener("focus", function () { editingHour = true; });
hourEl.addEventListener("blur", function () { editingHour = false; });
hourEl.addEventListener("change", function () {
  setScrub(hourEl.value, progressEl.value);
});
liveBtn.addEventListener("click", goLive);

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  } else {
    start();
  }
});

window.addEventListener("resize", resize);

const initial = parseTime(new URLSearchParams(location.search).get("t"));
if (initial) {
  frozen = initial;
  mode = "scrub";
}

resize();
syncInputs(currentDate());
start();
