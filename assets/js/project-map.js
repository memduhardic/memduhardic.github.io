/*
 * Project map for the homepage (AcademicPages theme).
 * MapLibre GL with self-hosted Natural Earth layers: no tile server, no API key.
 * Türkiye's 25 river basins come from assets/data/tr-basins.geojson (`name` property).
 * Basins named in a portfolio page's `places:` are coloured and clickable;
 * places that are not a Turkish basin (e.g. Ribble Estuary) are drawn as points.
 * On load the map zooms to fit every project, so new projects are always in view.
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

  // ---------- colours -------------------------------------------------------
  // One hue per basin you have worked in; light and dark variants.
  var HUES_LIGHT = ["#2f7f93", "#e0a458", "#6aa56e", "#c4706a", "#5b8fd1", "#9a7cc4", "#3fa7a0", "#d1b048", "#8a6d55", "#d38ab0"];
  var HUES_DARK  = ["#58b4c9", "#f0b86c", "#86c48a", "#e08c86", "#7eaaf0", "#b69be0", "#5ccbc3", "#e8c766", "#b8977b", "#eaa3c6"];

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
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  function palette() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { return cs.getPropertyValue(n).trim() || d; }
    var bg = getComputedStyle(document.body).backgroundColor || "#ffffff";
    var basec = v("--global-base-color", "#2f7f93");
    var text = v("--global-text-color", "#494e52");
    var dark = isDark();
    return {
      land: bg,
      sea: mix(bg, basec, dark ? 0.18 : 0.12),
      border: v("--global-border-color", "#e3e5e6"),
      basinLine: mix(bg, text, dark ? 0.4 : 0.45),
      river: v("--global-link-color", "#52adc8"),
      point: dark ? v("--global-link-color", "#52adc8") : basec,
      stroke: bg,
      ink: text,
      hues: dark ? HUES_DARK : HUES_LIGHT
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
    center: [35, 39],
    zoom: 4.5,
    minZoom: 1,
    renderWorldCopies: false,
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

  var work, popup, basinsGeo = null, basinNames = [], worked = [], byBasin = {}, selected = -1;
  var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-item]"));
  var PAD = { top: 40, bottom: 30, left: 30, right: 110 };

  // Hover label (HTML, so no font server is needed)
  var tip = document.createElement("div");
  tip.className = "pmap__tip";
  mapEl.appendChild(tip);

  function itemCoords(list) {
    var cs = [];
    list.forEach(function (it) { (it.places || []).forEach(function (p) { cs.push([p.lon, p.lat]); }); });
    return cs;
  }
  function featureBounds(names) {
    var b = new maplibregl.LngLatBounds(), any = false;
    (basinsGeo ? basinsGeo.features : []).forEach(function (f) {
      if (names.indexOf(f.properties.name) < 0) return;
      var g = f.geometry, polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      polys.forEach(function (poly) { poly[0].forEach(function (c) { b.extend(c); any = true; }); });
    });
    return any ? b : null;
  }
  function fitTo(item, animate) {
    var items = item ? [item] : work.items;
    var names = [], pts = [];
    items.forEach(function (it) {
      (it.places || []).forEach(function (p) {
        if (basinNames.indexOf(p.name) >= 0) names.push(p.name); else pts.push([p.lon, p.lat]);
      });
    });
    var b = featureBounds(names) || new maplibregl.LngLatBounds();
    pts.forEach(function (c) { b.extend(c); });
    if (b.isEmpty()) return;
    map.fitBounds(b, { padding: PAD, maxZoom: names.length ? 6.5 : 5, duration: animate && !reduce ? 900 : 0 });
  }

  function projectList(name) {
    return (byBasin[name] || []).map(function (i) {
      var it = work.items[i];
      return '<li><a href="' + esc(it.url) + '">' + esc(it.title) + "</a></li>";
    }).join("");
  }
  function openBasinPopup(name, lngLat) {
    if (popup) popup.remove();
    popup = new maplibregl.Popup({ closeButton: true, maxWidth: "290px", offset: 6, className: "pmap__pop" })
      .setLngLat(lngLat)
      .setHTML('<p class="pmap__place">River basin</p><p class="pmap__title">' + esc(name) + " Basin</p>" +
        '<ul class="pmap__projects">' + projectList(name) + "</ul>")
      .addTo(map);
  }
  function openItemPopup(i, coords, place) {
    var it = work.items[i];
    if (popup) popup.remove();
    popup = new maplibregl.Popup({ closeButton: true, maxWidth: "290px", offset: 10, className: "pmap__pop" })
      .setLngLat(coords)
      .setHTML('<p class="pmap__place">' + esc(place) + (basinNames.indexOf(place) >= 0 ? " Basin" : "") + "</p>" +
        '<p class="pmap__title">' + esc(it.title) + "</p>" +
        "<p>" + esc(it.summary) + "</p>" +
        '<a href="' + esc(it.url) + '">Read about the project</a>')
      .addTo(map);
  }

  function hueExpr() {
    var e = ["match", ["get", "name"]];
    worked.forEach(function (n, k) { e.push(n, C.hues[k % C.hues.length]); });
    e.push(C.basinLine);
    return e;
  }
  function opacityExpr() {
    if (selected < 0) return ["case", ["in", ["get", "name"], ["literal", worked]], 0.42, 0.1];
    var names = work.items[selected].places.map(function (p) { return p.name; });
    return ["case",
      ["in", ["get", "name"], ["literal", names]], 0.7,
      ["in", ["get", "name"], ["literal", worked]], 0.14, 0.06];
  }

  function select(i, zoom) {
    selected = i;
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-item") === i)); });
    if (map.getLayer("basins-fill")) {
      map.setPaintProperty("basins-fill", "fill-opacity", opacityExpr());
      var names = i >= 0 ? work.items[i].places.map(function (p) { return p.name; }) : [];
      map.setFilter("basins-active", ["in", ["get", "name"], ["literal", names]]);
    }
    if (map.getLayer("pts-active")) map.setFilter("pts-active", ["==", ["get", "i"], i]);
    if (!zoom || i < 0) return;
    var it = work.items[i];
    fitTo(it, true);
    if (popup) popup.remove();
    var lone = it.places.filter(function (p) { return basinNames.indexOf(p.name) < 0; });
    if (lone.length && lone.length === it.places.length) openItemPopup(i, [lone[0].lon, lone[0].lat], lone[0].name);
  }

  function applyColours() {
    C = palette();
    function set(l, p, val) { if (map.getLayer(l)) map.setPaintProperty(l, p, val); }
    set("bg", "background-color", C.sea);
    set("land", "fill-color", C.land);
    set("lakes", "fill-color", C.sea);
    set("borders", "line-color", C.border);
    set("rivers", "line-color", C.river);
    set("basins-fill", "fill-color", hueExpr());
    set("basins-line", "line-color", C.basinLine);
    set("basins-active", "line-color", C.ink);
    set("basins-hover", "line-color", C.ink);
    set("pts", "circle-color", C.point);
    set("pts", "circle-stroke-color", C.stroke);
    set("pts-active", "circle-stroke-color", C.ink);
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
      basinsGeo = r[5];
      basinNames = basinsGeo ? basinsGeo.features.map(function (f) { return f.properties.name; }) : [];
      var feats = [];
      work.items.forEach(function (it, i) {
        (it.places || []).forEach(function (p) {
          if (basinNames.indexOf(p.name) >= 0) {
            if (worked.indexOf(p.name) < 0) worked.push(p.name);
            (byBasin[p.name] = byBasin[p.name] || []).push(i);
          } else {
            feats.push({ type: "Feature", properties: { i: i, place: p.name },
              geometry: { type: "Point", coordinates: [p.lon, p.lat] } });
          }
        });
      });

      map.addSource("land", { type: "geojson", data: r[1] });
      map.addSource("borders", { type: "geojson", data: r[2] });
      map.addSource("rivers", { type: "geojson", data: r[3] });
      map.addSource("lakes", { type: "geojson", data: r[4] });
      map.addLayer({ id: "land", type: "fill", source: "land", paint: { "fill-color": C.land } });

      if (basinsGeo) {
        map.addSource("basins", { type: "geojson", data: basinsGeo, promoteId: "name" });
        map.addLayer({ id: "basins-fill", type: "fill", source: "basins",
          paint: { "fill-color": hueExpr(), "fill-opacity": opacityExpr(),
            "fill-opacity-transition": { duration: reduce ? 0 : 300 } } });
      }
      map.addLayer({ id: "lakes", type: "fill", source: "lakes", paint: { "fill-color": C.sea } });
      map.addLayer({ id: "rivers", type: "line", source: "rivers",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": C.river, "line-opacity": 0.55,
          "line-width": ["interpolate", ["linear"], ["zoom"],
            3, ["interpolate", ["linear"], ["get", "r"], 1, 1.4, 12, 0.3],
            7, ["interpolate", ["linear"], ["get", "r"], 1, 3, 12, 0.9]] } });
      map.addLayer({ id: "borders", type: "line", source: "borders", paint: { "line-color": C.border, "line-width": 0.8 } });

      if (basinsGeo) {
        map.addLayer({ id: "basins-line", type: "line", source: "basins",
          paint: { "line-color": C.basinLine, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.9, 7, 1.4] } });
        map.addLayer({ id: "basins-hover", type: "line", source: "basins", filter: ["==", ["get", "name"], ""],
          paint: { "line-color": C.ink, "line-width": 1.6 } });
        map.addLayer({ id: "basins-active", type: "line", source: "basins", filter: ["in", ["get", "name"], ["literal", []]],
          paint: { "line-color": C.ink, "line-width": 2 } });

        map.on("mousemove", "basins-fill", function (e) {
          var name = e.features[0].properties.name;
          var isWorked = worked.indexOf(name) >= 0;
          map.getCanvas().style.cursor = isWorked ? "pointer" : "";
          map.setFilter("basins-hover", ["==", ["get", "name"], name]);
          tip.textContent = name + (isWorked ? "" : "");
          tip.style.transform = "translate(" + (e.point.x + 12) + "px," + (e.point.y + 12) + "px)";
          tip.classList.add("is-on");
          tip.classList.toggle("is-worked", isWorked);
        });
        map.on("mouseleave", "basins-fill", function () {
          map.getCanvas().style.cursor = "";
          map.setFilter("basins-hover", ["==", ["get", "name"], ""]);
          tip.classList.remove("is-on");
        });
        map.on("click", "basins-fill", function (e) {
          var name = e.features[0].properties.name;
          if (worked.indexOf(name) < 0) return;
          tip.classList.remove("is-on");
          openBasinPopup(name, e.lngLat);
        });
      }

      // Places that are not a Turkish basin: points
      map.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: feats } });
      map.addLayer({ id: "pts", type: "circle", source: "pts",
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 7, 7, 10],
          "circle-color": C.point, "circle-stroke-color": C.stroke, "circle-stroke-width": 2 } });
      map.addLayer({ id: "pts-active", type: "circle", source: "pts", filter: ["==", ["get", "i"], -1],
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 9, 7, 13],
          "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": C.ink, "circle-stroke-width": 2 } });
      map.on("click", "pts", function (e) {
        var f = e.features[0];
        select(f.properties.i, false);
        openItemPopup(f.properties.i, f.geometry.coordinates, f.properties.place);
      });
      map.on("mouseenter", "pts", function () { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "pts", function () { map.getCanvas().style.cursor = ""; });

      // Name label next to each point (HTML, so no font server is needed)
      feats.forEach(function (f) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = "pmap__label";
        el.textContent = f.properties.place;
        el.addEventListener("click", function () {
          select(f.properties.i, false);
          openItemPopup(f.properties.i, f.geometry.coordinates, f.properties.place);
        });
        new maplibregl.Marker({ element: el, anchor: "left", offset: [12, 0] })
          .setLngLat(f.geometry.coordinates).addTo(map);
      });

      buttons.forEach(function (b) {
        b.addEventListener("click", function (ev) { ev.preventDefault(); select(+b.getAttribute("data-item"), true); });
      });
      var reset = root.querySelector("[data-reset]");
      if (reset) reset.addEventListener("click", function () {
        if (popup) popup.remove();
        select(-1, false);
        fitTo(null, true);
      });

      fitTo(null, false);

      // The theme can still be settling its layout after load: keep the map sized
      // and re-fit the overview until the visitor moves the map themselves.
      var touched = false;
      map.on("dragstart", function () { touched = true; });
      map.on("zoomstart", function (e) { if (e.originalEvent) touched = true; });
      if ("ResizeObserver" in window) {
        var lastW = mapEl.clientWidth;
        new ResizeObserver(function () {
          if (mapEl.clientWidth === lastW) return;
          lastW = mapEl.clientWidth;
          map.resize();
          if (!touched && selected < 0) fitTo(null, false);
        }).observe(mapEl);
      }
    }).catch(function () {
      fail("The map data could not be loaded. The project links below still work.");
    });
  });

  // Follow the site's light/dark toggle and the system setting
  new MutationObserver(applyColours).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", function () { setTimeout(applyColours, 50); });
})();
