import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.decomposition import PCA
from sklearn.tree import DecisionTreeClassifier, export_text
from app.preprocessing import preprocess_features
from app.profiling import generate_segment_profiles

def compute_elbow_curve(
    df: pd.DataFrame,
    feature_columns: List[str],
    min_k: int = 2,
    max_k: int = 8,
    scaler: str = "standard",
    missing_strategy: str = "mean"
) -> Dict[str, Any]:
    scaled_data, _, summary, _ = preprocess_features(df, feature_columns, missing_strategy, scaler)
    n_samples = len(scaled_data)

    if n_samples < 3:
        raise ValueError("At least 3 samples are required to perform clustering evaluation.")

    actual_max_k = min(max_k, n_samples - 1)
    actual_min_k = min(min_k, actual_max_k)

    points = []
    best_sil = -1.0
    recommended_k = actual_min_k

    for k in range(actual_min_k, actual_max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(scaled_data)
        wcss = float(km.inertia_)

        sil = None
        if len(set(labels)) > 1:
            try:
                sil = float(silhouette_score(scaled_data, labels))
                if sil > best_sil:
                    best_sil = sil
                    recommended_k = k
            except Exception:
                sil = None

        points.append({
            "k": k,
            "wcss": round(wcss, 2),
            "silhouette": round(sil, 4) if sil is not None else None
        })

    return {
        "points": points,
        "recommended_k": recommended_k,
        "features_used": feature_columns,
        "total_samples": n_samples
    }

def run_kmeans_clustering(
    df: pd.DataFrame,
    feature_columns: List[str],
    id_column: Optional[str] = "CustomerID",
    n_clusters: int = 4,
    scaler: str = "standard",
    missing_strategy: str = "mean",
    random_state: int = 42,
    run_decision_tree: bool = True
) -> Dict[str, Any]:
    scaled_data, processed_df, summary, _ = preprocess_features(df, feature_columns, missing_strategy, scaler)
    n_samples = len(scaled_data)

    if n_samples < n_clusters:
        raise ValueError(f"Number of samples ({n_samples}) must be greater than or equal to n_clusters ({n_clusters}).")

    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    labels = kmeans.fit_predict(scaled_data)

    # Evaluation metrics
    try:
        sil_score = float(silhouette_score(scaled_data, labels))
    except Exception:
        sil_score = 0.0

    try:
        db_score = float(davies_bouldin_score(scaled_data, labels))
    except Exception:
        db_score = 0.0

    try:
        ch_score = float(calinski_harabasz_score(scaled_data, labels))
    except Exception:
        ch_score = 0.0

    # PCA 2D projection for visualization
    pca = PCA(n_components=min(2, scaled_data.shape[1]))
    pca_coords = pca.fit_transform(scaled_data)
    if pca_coords.shape[1] == 1:
        # Pad with zeros if only 1 feature
        pca_coords = np.column_stack([pca_coords, np.zeros(n_samples)])

    explained_var = [round(float(v), 4) for v in pca.explained_variance_ratio_]

    # Generate Profiles
    profiles = generate_segment_profiles(processed_df, labels, feature_columns)
    profile_map = {p["segment_id"]: p["name"] for p in profiles}

    # Extract customer IDs if column exists
    customer_ids = []
    if id_column and id_column in df.columns:
        customer_ids = df[id_column].tolist()
    else:
        customer_ids = [f"ID_{i+1}" for i in range(n_samples)]

    # Compute distances to cluster center
    centers = kmeans.cluster_centers_
    assignments = []
    for i in range(n_samples):
        cluster_idx = int(labels[i])
        center = centers[cluster_idx]
        dist = float(np.linalg.norm(scaled_data[i] - center))
        assignments.append({
            "id": customer_ids[i] if i < len(customer_ids) else f"ID_{i+1}",
            "segment_id": cluster_idx,
            "segment_name": profile_map.get(cluster_idx, f"Segment {cluster_idx + 1}"),
            "pca_x": round(float(pca_coords[i, 0]), 3),
            "pca_y": round(float(pca_coords[i, 1]), 3),
            "distance_to_center": round(dist, 3)
        })

    # Optional: Decision Tree classification for white-box rule extraction
    dt_rules = []
    if run_decision_tree and n_samples >= 10:
        try:
            clf = DecisionTreeClassifier(max_depth=3, min_samples_leaf=5, random_state=random_state)
            clf.fit(processed_df, labels)
            tree_text = export_text(clf, feature_names=feature_columns)
            dt_rules = [line for line in tree_text.split('\n') if line.strip()]
        except Exception as e:
            dt_rules = [f"Decision tree rule extraction skipped: {str(e)}"]

    return {
        "n_clusters": n_clusters,
        "silhouette_score": round(sil_score, 4),
        "davies_bouldin_index": round(db_score, 4),
        "calinski_harabasz_score": round(ch_score, 2),
        "features_used": feature_columns,
        "profiles": profiles,
        "assignments": assignments,
        "pca_explained_variance_ratio": explained_var,
        "decision_tree_rules": dt_rules,
        "data_summary": summary
    }
