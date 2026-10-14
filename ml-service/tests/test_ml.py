import pytest
import pandas as pd
import numpy as np
from app.preprocessing import preprocess_features
from app.clustering import run_kmeans_clustering, compute_elbow_curve

def test_preprocessing_standard():
    df = pd.DataFrame({
        "income": [20, 30, 40, np.nan, 60],
        "spend": [10, 20, 30, 40, 50]
    })
    scaled, processed_df, summary, scaler = preprocess_features(
        df, ["income", "spend"], missing_strategy="mean", scaler_type="standard"
    )
    assert len(processed_df) == 5
    assert summary["nulls_detected"] == 1
    assert processed_df["income"].isna().sum() == 0
    assert scaled.shape == (5, 2)

def test_missing_value_drop_strategy():
    df = pd.DataFrame({
        "income": [20, 30, np.nan, 50],
        "spend": [10, 20, 30, 40]
    })
    scaled, processed_df, summary, _ = preprocess_features(
        df, ["income", "spend"], missing_strategy="drop"
    )
    assert len(processed_df) == 3
    assert summary["rows_dropped"] == 1

def test_constant_feature_handling():
    df = pd.DataFrame({
        "income": [50, 50, 50, 50],
        "spend": [10, 20, 30, 40]
    })
    scaled, processed_df, summary, _ = preprocess_features(
        df, ["income", "spend"], missing_strategy="mean"
    )
    assert "income" in summary["constant_features"]

def test_invalid_feature_selection_raises():
    df = pd.DataFrame({"a": [1, 2, 3]})
    with pytest.raises(ValueError):
        preprocess_features(df, ["non_existent_column"])

def test_kmeans_clustering_reproducibility():
    np.random.seed(123)
    df = pd.DataFrame({
        "CustomerID": [f"C{i}" for i in range(50)],
        "Income": np.random.normal(50, 15, 50),
        "Score": np.random.normal(50, 20, 50)
    })
    res1 = run_kmeans_clustering(df, ["Income", "Score"], n_clusters=3, random_state=42)
    res2 = run_kmeans_clustering(df, ["Income", "Score"], n_clusters=3, random_state=42)

    # Identical cluster assignments
    assignments1 = [a["segment_id"] for a in res1["assignments"]]
    assignments2 = [a["segment_id"] for a in res2["assignments"]]
    assert assignments1 == assignments2
    assert res1["silhouette_score"] == res2["silhouette_score"]
    assert len(res1["profiles"]) == 3

def test_elbow_curve_calculation():
    df = pd.DataFrame({
        "Income": [15, 16, 17, 80, 82, 85, 120, 125, 130],
        "Score": [20, 22, 25, 80, 85, 82, 20, 22, 25]
    })
    elbow = compute_elbow_curve(df, ["Income", "Score"], min_k=2, max_k=4)
    assert len(elbow["points"]) == 3
    assert elbow["recommended_k"] in [2, 3, 4]
    for pt in elbow["points"]:
        assert pt["wcss"] > 0

def test_small_dataset_cluster_count_validation():
    df = pd.DataFrame({
        "Income": [10, 20],
        "Score": [30, 40]
    })
    with pytest.raises(ValueError, match="must be greater than or equal to n_clusters"):
        run_kmeans_clustering(df, ["Income", "Score"], n_clusters=4)
