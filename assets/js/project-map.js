/*
 * Project map for the homepage (AcademicPages theme).
 * MapLibre GL with self-hosted Natural Earth layers: no tile server, no API key.
 * Optional layer: assets/data/tr-basins.geojson (Türkiye's river basins, `name` property).
 */
(function () {
  "use strict";

  var root = document.getElementById("pmap");
  var mapEl = document.getElementById("pmap-map");
  if (!root || !mapEl) return;
  var base = root.getAttribute("data-base") || "";

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch (e) { return false; }
  }
  function fail(msg) { mapEl.innerHTML = '<p class="pmap__fallback">' + msg + "</p>"; mapEl.style.height = "auto"; }
  if (!window.maplibregl || !hasWebGL()) {
    fail("The interactive map needs WebGL. The project links below still work.");
    return;
  }

  // ---------- colours taken from the site theme (light / dark toggle) ------
  function parse(c) {
    c = (c || "").trim();
    var h = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (h) {
      var x = h[1].length === 3 ? h[1].replace(/./g, "$&$&") : h[1];
      return [0, 2, 4].map(function (i) { return parseInt(x.substr(i, 2), 16); });
    }
    var m = c.match(/\d+(\.\d+)?/g);
    return m ? m.slice(0, 3).map(Number) : [255, 255, 255];
  }
  function mix(a, b, t) {
    var x = parse(a), y = parse(b);
    return "rgb(" + x.map(function (v, i) { return Math.round(v * (1 - t) + y[i] * t); }).join(",") + ")";
  }
  function palette() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { return cs.getPropertyValue(n).trim() || d; }
    var bg = getComputedStyle(document.body).backgroundColor || "#ffffff";
    var basec = v("--global-base-color", "#2f7f93");
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
      land: bg,
      sea: mix(bg, basec, dark ? 0.18 : 0.12),
      border: v("--global-border-color", "#e3e5e6"),
      river: v("--global-link-color", "#52adc8"),
      point: dark ? v("--global-link-color", "#52adc8") : basec,
      stroke: bg,
      ring: v("--global-text-color", "#494e52")
    };
  }
  var C = palette();

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var map = new maplibregl.Map({
    container: mapEl,
    style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": C.sea } }] },
    center: [34, 39],
    zoom: 4.5,
    minZoom: 2,
    maxZoom: 9,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    cooperativeGestures: true,
    attributionControl: false
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.addControl(new maplibregl.AttributionControl({
    compact: true,
    customAttribution: 'Base map: <a href="https://www.naturalearthdata.com/">Natural Earth</a>'
  }), "bottom-right");

  var work, popup;
  var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-item]"));
  var PAD = { top: 40, bottom: 40, left: 40, right: 60 };

  function allCoords(list) {
    var cs = [];
    list.forEach(function (it) { (it.places || []).forEach(function (p) { cs.push([p.lon, p.lat]); }); });
    return cs;
  }
  function fit(cs, animate) {
    var b = new maplibregl.LngLatBounds();
    cs.forEach(function (c) { b.extend(c); });
    map.fitBounds(b, { padding: PAD, maxZoom: 6.5, duration: animate && !reduce ? 900 : 0 });
  }
  function openPopup(i, coords, place) {
    var it = work.items[i];
    if (popup) popup.remove();
    popup = new maplibregl.Popup({ closeButton: true, maxWidth: "280px", offset: 10, className: "pmap__pop" })
      .setLngLat(coords)
      .setHTML('<p class="pmap__place">' + esc(place) + " Basin</p>" +
        '<p class="pmap__title">' + esc(it.title) + "</p>" +
        "<p>" + esc(it.summary) + "</p>" +
        '<a href="' + esc(it.url) + '">Read about the project</a>')
      .addTo(map);
  }
  function select(i, zoom) {
    map.setFilter("pts-active", ["==", ["get", "i"], i]);
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-item") === i)); });
    if (!zoom) return;
    var it = work.items[i];
    fit(allCoords([it]), true);
    openPopup(i, [it.places[0].lon, it.places[0].lat], it.places[0].name);
  }

  function applyColours() {
    C = palette();
    function set(l, p, val) { if (map.getLayer(l)) map.setPaintProperty(l, p, val); }
    set("bg", "background-color", C.sea);
    set("land", "fill-color", C.land);
    set("lakes", "fill-color", C.sea);
    set("borders", "line-color", C.border);
    set("rivers", "line-color", C.river);
    set("basins-fill", "fill-color", C.point);
    set("basins-line", "line-color", C.border);
    set("pts", "circle-color", C.point);
    set("pts", "circle-stroke-color", C.stroke);
    set("pts-active", "circle-stroke-color", C.ring);
  }

  map.on("load", function () {
    Promise.all([
      getJSON(base + "/assets/data/work.json"),
      getJSON(base + "/assets/data/land.geojson"),
      getJSON(base + "/assets/data/borders.geojson"),
      getJSON(base + "/assets/data/rivers.geojson"),
      getJSON(base + "/assets/data/lakes.geojson"),
      getJSON(base + "/assets/data/tr-basins.geojson").catch(function () { return null; })
    ]).then(function (r) {
      work = r[0];
      var feats = [], names = [];
      work.items.forEach(function (it, i) {
        (it.places || []).forEach(function (p) {
          names.push(p.name);
          feats.push({ type: "Feature", properties: { i: i, place: p.name },
            geometry: { type: "Point", coordinates: [p.lon, p.lat] } });
        });
      });

      map.addSource("land", { type: "geojson", data: r[1] });
      map.addSource("borders", { type: "geojson", data: r[2] });
      map.addSource("rivers", { type: "geojson", data: r[3] });
      map.addSource("lakes", { type: "geojson", data: r[4] });
      map.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: feats } });

      map.addLayer({ id: "land", type: "fill", source: "land", paint: { "fill-color": C.land } });
      map.addLayer({ id: "lakes", type: "fill", source: "lakes", paint: { "fill-color": C.sea } });
      if (r[5]) {
        map.addSource("basins", { type: "geojson", data: r[5] });
        map.addLayer({ id: "basins-fill", type: "fill", source: "basins",
          filter: ["in", ["get", "name"], ["literal", names]],
          paint: { "fill-color": C.point, "fill-opacity": 0.12 } });
        map.addLayer({ id: "basins-line", type: "line", source: "basins",
          paint: { "line-color": C.border, "line-width": 0.8 } });
      }
      map.addLayer({ id: "borders", type: "line", source: "borders", paint: { "line-color": C.border, "line-width": 0.8 } });
      map.addLayer({ id: "rivers", type: "line", source: "rivers",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": C.river, "line-opacity": 0.6,
          "line-width": ["interpolate", ["linear"], ["zoom"],
            3, ["interpolate", ["linear"], ["get", "r"], 1, 1.4, 12, 0.3],
            7, ["interpolate", ["linear"], ["get", "r"], 1, 3, 12, 0.9]] } });
      map.addLayer({ id: "pts", type: "circle", source: "pts",
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 7, 8],
          "circle-color": C.point, "circle-stroke-color": C.stroke, "circle-stroke-width": 2 } });
      map.addLayer({ id: "pts-active", type: "circle", source: "pts", filter: ["==", ["get", "i"], -1],
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 9, 7, 13],
          "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": C.ring, "circle-stroke-width": 2 } });

      map.on("click", "pts", function (e) {
        var f = e.features[0];
        select(f.properties.i, false);
        openPopup(f.properties.i, f.geometry.coordinates, f.properties.place);
      });
      map.on("mouseenter", "pts", function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "pts", function () { map.getCanvas().style.cursor = ""; });

      buttons.forEach(function (b) {
        b.addEventListener("click", function (ev) { ev.preventDefault(); select(+b.getAttribute("data-item"), true); });
      });
      var reset = root.querySelector("[data-reset]");
      if (reset) reset.addEventListener("click", function () {
        if (popup) popup.remove();
        select(-1, false);
        fit(allCoords(work.items), true);
      });

      fit(allCoords(work.items), false);
    }).catch(function () {
      fail("The map data could not be loaded. The project links below still work.");
    });
  });

  // Follow the site's light/dark toggle and the system setting
  new MutationObserver(applyColours).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", function () { setTimeout(applyColours, 50); });
})();
