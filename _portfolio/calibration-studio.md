---
title: "Calibration Studio: Multi-Model Hydrological Calibration and Evaluation Tool"
excerpt: "Developed an open-source desktop tool that compares multiple hydrological model outputs against observed streamflow, computes goodness-of-fit metrics for calibration and validation periods, and produces report-ready hydrographs.<br/><img src='/images/calibration-studio-cover.png'>"
collection: portfolio
---

**Calibration Studio** is an open-source desktop application I developed in Python to **evaluate and compare hydrological models against observed streamflow**. It reads a single CSV with observed and simulated series, splits the record into calibration and validation periods, and reports the standard performance metrics for each model side by side with the hydrograph.

I built it while comparing several models (SWAT, HEC-HMS, GR4J, CemaNeige-GR4J, HBV and LSTM) on the same basin. Instead of recalculating metrics and redrawing figures in separate scripts for every model run, the whole evaluation is done in one place, and the figures keep the same style from one report to the next.

**Main contributions**
- Designed and implemented the application in Python with a PySide6 interface and a Matplotlib-based chart engine
- Implemented NSE, KGE, RMSE, MAE, PBIAS, Pearson r, R² and volume ratio (Rv), computed separately for calibration and validation periods with pair-wise handling of missing values
- Built a hydrograph view with shaded calibration/validation periods and precipitation shown as hanging columns on an inverted secondary axis, with daily, weekly or monthly aggregation
- Added automatic detection of time, observed and precipitation columns, supporting both English and Turkish column names
- Added full control over series colours, line styles, names, visibility, drawing order, axis limits and legend layout
- Implemented export of the metrics table (CSV) and one high-resolution hydrograph per model (PNG)
- Added persistent settings (auto-save and named settings files) so figures stay consistent across reports

**Scope**
- Calibration and validation assessment for any set of hydrological models with daily or sub-daily output

**Tools & Methods**
- Python, PySide6, pandas, NumPy, Matplotlib, NSE, KGE, PBIAS, SWAT, HEC-HMS, GR4J, HBV

**Type**
- Software Development
- Hydrological Modeling
- Model Calibration and Validation

**Period**
- 2026

**License**
- MIT (open source)

**Source Code**
- [github.com/memduhardic/calibration-studio](https://github.com/memduhardic/calibration-studio)
