---
title: "StationGrid: Station-to-Grid Meteorological Interpolation for HEC-HMS"
excerpt: "Developed an open-source desktop GIS tool that interpolates station precipitation and temperature observations onto watershed grids and exports CF-compliant NetCDF forcing for gridded hydrological modeling in HEC-HMS.<br/><img src='/images/stationgrid-cover.png'>"
collection: portfolio
---

**StationGrid** is an open-source desktop application I developed in Python to prepare **gridded meteorological forcing for distributed hydrological models**. It converts point observations from meteorological stations into regular gridded fields over a watershed and exports them as CF-compliant NetCDF, ready to be used as gridded precipitation and temperature input in the hydrological models.

Preparing gridded inputs usually requires several separate GIS steps: projecting station coordinates, building a grid over the basin, interpolating each time step, masking cells outside the watershed, and converting the results into a format the hydrological model can read. StationGrid brings these steps into a single interactive workflow, reducing manual processing and making forcing preparation consistent and reproducible.

**Main contributions**
- Designed and implemented the full application architecture in Python, with separate modules for data input/output, interpolation, a central data model, and the PySide6 user interface
- Implemented station CSV import with automatic detection of numeric variables, and watershed boundary import (Shapefile, GeoJSON, GeoPackage) with automatic UTM zone detection
- Developed regular grid generation in projected coordinates at a user-defined resolution, with cells masked to the watershed boundary
- Implemented a vectorized Inverse Distance Weighting (IDW) interpolator with adjustable power, a low-memory fallback for very fine grids, and per-date caching for instant navigation between time steps
- Built an interactive map viewer with free pan/zoom and independently toggled layers (watershed, grid mesh, stations, interpolated raster, optional basemap)
- Implemented compressed, CF-1.8 compliant NetCDF export with embedded projection (grid_mapping) metadata for import into the hydrological models
- Published the tool as open-source software with documentation and sample data

**Scope**
- Gridded precipitation and temperature forcing for any watershed with station-based observations

**Tools & Methods**
- Python, PySide6, GeoPandas, Shapely, pyproj, xarray, NetCDF4, Matplotlib, IDW interpolation

**Type**
- Software Development
- Hydrological Modeling
- GIS and Spatial Interpolation

**Period**
- 2026

**License**
- MIT (open source)

**Source Code**
- [github.com/memduhardic/stationgrid](https://github.com/memduhardic/stationgrid)
