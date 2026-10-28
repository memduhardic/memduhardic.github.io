---
title: "Kızılırmak Basin Master Plan"
excerpt: "Hydrological modelling for the master plan of Türkiye's longest river: seven models compared on gauged trial catchments, gridded forcing for HEC-HMS, and the sub-basin framework for the plan."
collection: portfolio
map_label: Kızılırmak Basin Master Plan
places:
  - { name: Kızılırmak, lon: 35.0, lat: 39.8 }
---

The **Kızılırmak Basin Master Plan**, initiated by the General Directorate of State Hydraulic Works (DSİ), sets out long-term water resources development for the basin. The terms of reference ask for several hydrological models to be tested on a small gauged trial catchment before the client chooses the model for the whole basin, with climate projections for 2025–2065. I work on the hydrology and hydrological modelling studies, remotely as a consultant since October 2026.

**Main contributions**
- Compiled the data inventory for the plan across hydrology, climate change modelling, remote sensing of irrigated land, water quality and GIS
- Tested seven models on two gauged catchments in the Delice and Yukarı Kızılırmak sub-basins: SWAT+, gridded HEC-HMS (soil moisture accounting, Clark unit hydrograph, temperature-index snow), GR2M, GR4J, CemaNeige-GR4J, HBV, and ANN and LSTM models
- Calibrated the models with SCE-UA in SPOTPY and compared them with NSE, KGE, RMSE, MAE, PBIAS, r² and water balance ratio
- Built the station-to-grid forcing workflow for gridded HEC-HMS (now the open-source tool StationGrid) and the model comparison workflow that became Calibration Studio
- Wrote the model evaluation and selection guidance, including computational cost and calibration time
- Prepared the sub-basin framework for the plan: eleven criterion-based alternatives, leading to four main sub-basins split into nine planning units

**Client**
- General Directorate of State Hydraulic Works (DSİ)

**Tools & Methods**
- SWAT+, HEC-HMS, GR2M, GR4J, CemaNeige-GR4J, HBV, LSTM, SPOTPY, QGIS, Python

**Type**
- Basin Master Planning
- Hydrological Modelling
- Climate Change Impact Assessment
