---
title: "Rainfall-Runoff Benchmark: Conceptual vs. Machine-Learning Models"
excerpt: "Compared GR4J, HBV, Random Forest, ANN and LSTM rainfall-runoff models on the same catchment, inputs and test period.<br/><img src='/images/rainfall-runoff-benchmark-cover.png'>"
collection: portfolio
---

A Python benchmark comparing **conceptual and machine-learning rainfall-runoff models** under the same conditions. All models use the same inputs and the same chronological split, and are scored on a test period none of them has seen.

**Main contributions**
- Set up GR4J (adapted from [A. MacDonald's Python version](https://github.com/amacd31/gr4j)) and an HBV model (structure after [Giuliani, Kollat, Herman et al.](https://github.com/mxgiuliani00/hbv)), calibrated with SCE-UA
- Built Random Forest and ANN models with scikit-learn and an LSTM with PyTorch, using only precipitation and PET as inputs
- Used one set of metrics (NSE, KGE, RMSE, MAE, PBIAS) for all models
- Tested on a 29-year public catchment: the LSTM performed best on the test period (NSE 0.82), while the Random Forest overfitted the training data

**Tools & Methods**
- Python, SPOTPY, scikit-learn, PyTorch, GR4J, HBV, Random Forest, ANN, LSTM

**Type**
- Hydrological Modeling
- Machine Learning

**Period**
- 2026

**Source Code**
- [github.com/memduhardic/rainfall-runoff-benchmark](https://github.com/memduhardic/rainfall-runoff-benchmark)
