from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Dict, Any
from app.schemas import ElbowRequest, ElbowResponse, ClusterRequest, ClusterResponse
from app.clustering import compute_elbow_curve, run_kmeans_clustering

app = FastAPI(
    title="CustomerSeg Machine Learning Service",
    description="Microservice providing K-Means clustering, PCA projection, Silhouette evaluation, and rule extraction.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CustomerSeg ML Service",
        "algorithms": ["K-Means", "PCA", "DecisionTree-Rules", "Silhouette", "Elbow"]
    }

@app.get("/api/ml/info")
def get_info():
    return {
        "name": "CustomerSeg ML Engine",
        "version": "1.0.0",
        "academic_affiliation": "IPS Academy, Indore - Department of Computer Science & Engineering",
        "guide": "Ms. Arpita Bhatia",
        "presented_by": "Avani Gupta",
        "academic_year": "2026-27",
        "supported_scalers": ["standard", "minmax", "robust", "none"],
        "supported_missing_strategies": ["mean", "median", "mode", "drop"]
    }

@app.post("/api/ml/elbow", response_model=ElbowResponse)
def get_elbow_analysis(req: ElbowRequest):
    if not req.records:
        raise HTTPException(status_code=400, detail="No data records provided.")
    if not req.feature_columns:
        raise HTTPException(status_code=400, detail="Feature columns must be specified.")

    df = pd.DataFrame(req.records)
    try:
        res = compute_elbow_curve(
            df=df,
            feature_columns=req.feature_columns,
            min_k=req.min_k,
            max_k=req.max_k,
            scaler=req.scaler,
            missing_strategy=req.missing_strategy
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

@app.post("/api/ml/cluster", response_model=ClusterResponse)
def perform_clustering(req: ClusterRequest):
    if not req.records:
        raise HTTPException(status_code=400, detail="No data records provided.")
    if not req.feature_columns:
        raise HTTPException(status_code=400, detail="Feature columns must be specified.")

    df = pd.DataFrame(req.records)
    try:
        res = run_kmeans_clustering(
            df=df,
            feature_columns=req.feature_columns,
            id_column=req.id_column,
            n_clusters=req.n_clusters,
            scaler=req.scaler,
            missing_strategy=req.missing_strategy,
            random_state=req.random_state,
            run_decision_tree=req.run_decision_tree
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
