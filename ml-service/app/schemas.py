from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ElbowRequest(BaseModel):
    records: List[Dict[str, Any]]
    feature_columns: List[str]
    min_k: int = Field(default=2, ge=2, le=15)
    max_k: int = Field(default=8, ge=2, le=15)
    scaler: str = Field(default="standard", pattern="^(standard|minmax|robust|none)$")
    missing_strategy: str = Field(default="mean", pattern="^(mean|median|drop|mode)$")

class ElbowPoint(BaseModel):
    k: int
    wcss: float
    silhouette: Optional[float] = None

class ElbowResponse(BaseModel):
    points: List[ElbowPoint]
    recommended_k: int
    features_used: List[str]
    total_samples: int

class ClusterRequest(BaseModel):
    records: List[Dict[str, Any]]
    id_column: Optional[str] = "CustomerID"
    feature_columns: List[str]
    n_clusters: int = Field(default=4, ge=2, le=20)
    scaler: str = Field(default="standard", pattern="^(standard|minmax|robust|none)$")
    missing_strategy: str = Field(default="mean", pattern="^(mean|median|drop|mode)$")
    random_state: int = 42
    run_decision_tree: bool = True

class SegmentProfile(BaseModel):
    segment_id: int
    name: str
    description: str
    count: int
    percentage: float
    feature_means: Dict[str, float]
    feature_medians: Dict[str, float]
    recommended_strategy: str
    key_characteristics: List[str]

class CustomerAssignment(BaseModel):
    id: Any
    segment_id: int
    segment_name: str
    pca_x: float
    pca_y: float
    distance_to_center: float

class ClusterResponse(BaseModel):
    n_clusters: int
    silhouette_score: float
    davies_bouldin_index: float
    calinski_harabasz_score: float
    features_used: List[str]
    profiles: List[SegmentProfile]
    assignments: List[CustomerAssignment]
    pca_explained_variance_ratio: List[float]
    decision_tree_rules: Optional[List[str]] = None
    data_summary: Dict[str, Any]
