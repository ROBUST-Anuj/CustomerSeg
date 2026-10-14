import pandas as pd
import numpy as np
from typing import List, Tuple, Dict, Any
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

def preprocess_features(
    df: pd.DataFrame,
    feature_columns: List[str],
    missing_strategy: str = "mean",
    scaler_type: str = "standard"
) -> Tuple[np.ndarray, pd.DataFrame, Dict[str, Any], Any]:
    """
    Preprocess selected feature columns from a DataFrame:
    - Verifies feature columns exist
    - Converts to numeric where applicable
    - Handles missing values
    - Drops zero-variance/constant features if necessary
    - Applies selected scaler
    Returns: (scaled_array, processed_df, summary_dict, scaler_instance)
    """
    if not feature_columns:
        raise ValueError("At least one feature column must be specified for segmentation.")
    
    missing_cols = [c for c in feature_columns if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Feature columns not found in dataset: {missing_cols}")

    work_df = df[feature_columns].copy()
    initial_rows = len(work_df)

    # Convert to numeric
    for col in feature_columns:
        work_df[col] = pd.to_numeric(work_df[col], errors='coerce')

    nulls_detected = int(work_df.isna().sum().sum())
    rows_dropped = 0

    if missing_strategy == "drop":
        work_df = work_df.dropna()
        rows_dropped = initial_rows - len(work_df)
        if len(work_df) == 0:
            raise ValueError("All rows were dropped due to missing values. Choose an imputation strategy (mean or median).")
    elif missing_strategy == "median":
        for col in feature_columns:
            median_val = work_df[col].median()
            if pd.isna(median_val):
                median_val = 0.0
            work_df[col] = work_df[col].fillna(median_val)
    elif missing_strategy == "mode":
        for col in feature_columns:
            mode_vals = work_df[col].mode()
            fill_val = mode_vals.iloc[0] if not mode_vals.empty else 0.0
            work_df[col] = work_df[col].fillna(fill_val)
    else:  # mean default
        for col in feature_columns:
            mean_val = work_df[col].mean()
            if pd.isna(mean_val):
                mean_val = 0.0
            work_df[col] = work_df[col].fillna(mean_val)

    # Check for constant features
    constant_features = [col for col in feature_columns if work_df[col].nunique() <= 1]
    
    # Scaling
    scaler = None
    if scaler_type == "standard":
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(work_df)
    elif scaler_type == "minmax":
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(work_df)
    elif scaler_type == "robust":
        scaler = RobustScaler()
        scaled_data = scaler.fit_transform(work_df)
    else:
        scaled_data = work_df.to_numpy()

    summary = {
        "initial_rows": initial_rows,
        "processed_rows": len(work_df),
        "rows_dropped": rows_dropped,
        "nulls_detected": nulls_detected,
        "imputation_strategy": missing_strategy,
        "scaler_used": scaler_type,
        "constant_features": constant_features
    }

    return scaled_data, work_df, summary, scaler
