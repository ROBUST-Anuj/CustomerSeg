import pandas as pd
import numpy as np
from typing import List, Dict, Any

def generate_segment_profiles(
    df_features: pd.DataFrame,
    labels: np.ndarray,
    feature_columns: List[str]
) -> List[Dict[str, Any]]:
    """
    Analyzes cluster centroids relative to overall dataset distribution and creates
    interpretable, data-backed segment names, descriptions, and recommended actions.
    """
    total_samples = len(df_features)
    unique_labels = sorted(list(set(labels)))
    overall_means = df_features.mean()
    overall_stds = df_features.std().replace(0, 1.0)

    profiles = []

    for cluster_id in unique_labels:
        mask = (labels == cluster_id)
        cluster_df = df_features[mask]
        cluster_size = int(len(cluster_df))
        percentage = round((cluster_size / total_samples) * 100, 2)

        feat_means = {col: round(float(cluster_df[col].mean()), 2) for col in feature_columns}
        feat_medians = {col: round(float(cluster_df[col].median()), 2) for col in feature_columns}

        # Calculate relative z-scores compared to dataset average
        relative_levels = {}
        for col in feature_columns:
            diff = feat_means[col] - overall_means[col]
            std = overall_stds[col]
            z = diff / std if std > 0 else 0
            if z > 0.6:
                level = "high"
            elif z < -0.6:
                level = "low"
            else:
                level = "moderate"
            relative_levels[col] = (level, z)

        # Identify prominent characteristics
        key_chars = []
        for col, (level, z) in relative_levels.items():
            if level == "high":
                key_chars.append(f"Above-average {col} (avg: {feat_means[col]})")
            elif level == "low":
                key_chars.append(f"Below-average {col} (avg: {feat_means[col]})")
            else:
                key_chars.append(f"Moderate {col} (avg: {feat_means[col]})")

        # Determine semantic segment name based on actual available columns
        lower_cols = {c.lower(): c for c in feature_columns}
        
        income_col = next((c for c in feature_columns if 'income' in c.lower() or 'salary' in c.lower()), None)
        spend_col = next((c for c in feature_columns if 'spending' in c.lower() or 'spend' in c.lower() or 'monetary' in c.lower()), None)
        freq_col = next((c for c in feature_columns if 'freq' in c.lower() or 'orders' in c.lower() or 'purchase' in c.lower()), None)
        recency_col = next((c for c in feature_columns if 'recency' in c.lower() or 'days' in c.lower()), None)

        name = f"Segment {cluster_id + 1}"
        desc = f"Cluster of {cluster_size} customers ({percentage}% of dataset)."
        strategy = "Standard engagement and personalized offers based on usage."

        if income_col and spend_col:
            inc_level = relative_levels[income_col][0]
            spd_level = relative_levels[spend_col][0]
            if inc_level == "high" and spd_level == "high":
                name = f"Segment {cluster_id + 1}: Affluent High-Spenders"
                desc = "Customers with high income and high spending appetite. Core driver of top-line revenue."
                strategy = "VIP loyalty rewards, early product previews, premium concierge support, and exclusive upsells."
            elif inc_level == "low" and spd_level == "high":
                name = f"Segment {cluster_id + 1}: Enthusiastic Spenders"
                desc = "Moderate-to-low income but highly active spending index. High affinity for trend products."
                strategy = "Promotional discounts, bundled deals, installment financing, and seasonal flash sales."
            elif inc_level == "high" and spd_level == "low":
                name = f"Segment {cluster_id + 1}: Conservative Affluents"
                desc = "High purchasing capacity but conservative spending patterns. High untapped lifetime value."
                strategy = "Value-focused marketing, highlighting durability, quality guarantees, and personalized product recommendations."
            elif inc_level == "low" and spd_level == "low":
                name = f"Segment {cluster_id + 1}: Budget-Conscious Customers"
                desc = "Careful spenders with lower discretionary income and low shopping frequency."
                strategy = "Cost-effective entry packages, price-drop alerts, and loyalty coupon incentives."
            else:
                name = f"Segment {cluster_id + 1}: Balanced Middle-Market"
                desc = "Consistent mid-tier income and spending metrics representing stable core shoppers."
                strategy = "Steady nurture campaigns, cross-sell related categories, and seasonal discount triggers."
        elif freq_col and recency_col:
            freq_level = relative_levels[freq_col][0]
            rec_level = relative_levels[recency_col][0] # higher recency = longer days since last purchase
            if rec_level == "low" and freq_level == "high":
                name = f"Segment {cluster_id + 1}: Active Loyalists"
                desc = "Recently purchased with high cumulative frequency. Highly engaged with the brand."
                strategy = "Brand advocacy programs, referral perks, and membership tiers."
            elif rec_level == "high" and freq_level == "low":
                name = f"Segment {cluster_id + 1}: Dormant / Inactive"
                desc = "Long duration since last order and low overall order count."
                strategy = "Re-activation campaigns, survey requests, and limited-time return incentives."

        profiles.append({
            "segment_id": int(cluster_id),
            "name": name,
            "description": desc,
            "count": cluster_size,
            "percentage": percentage,
            "feature_means": feat_means,
            "feature_medians": feat_medians,
            "recommended_strategy": strategy,
            "key_characteristics": key_chars
        })

    return profiles
