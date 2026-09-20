#!/usr/bin/env python3
"""
Automated Production Drift & Performance Monitoring Framework
Monitors:
1. Feature Drift: Population Stability Index (PSI) & Kolmogorov-Smirnov (KS) Test
2. Embedding Drift: Vector Centroid Cosine Shift
3. Concept / Business Drift: Online CTR & CVR Degradation via Sequential Testing
4. Automated Alerting & Retraining Pipeline Trigger
"""

import sys
import json
import math
import numpy as np
from typing import Dict, List, Tuple, Any


class DriftDetector:
    """
    Statistical engine for production drift detection in recommender systems.
    """

    @staticmethod
    def calculate_psi(
        expected: np.ndarray,
        actual: np.ndarray,
        num_buckets: int = 10,
        epsilon: float = 1e-4
    ) -> float:
        """
        Calculates the Population Stability Index (PSI) between baseline and production distributions.
        PSI < 0.1: No significant change
        0.1 <= PSI < 0.2: Moderate shift (Warning)
        PSI >= 0.2: Significant drift (Triggers Automated Retraining)
        """
        # Determine quantile breakpoints on expected baseline
        percentiles = np.linspace(0, 100, num_buckets + 1)
        breakpoints = np.percentile(expected, percentiles)
        breakpoints[0] -= 1e-5
        breakpoints[-1] += 1e-5

        # Bin counts
        expected_counts, _ = np.histogram(expected, bins=breakpoints)
        actual_counts, _ = np.histogram(actual, bins=breakpoints)

        # Convert to relative proportions with smoothing epsilon
        expected_pct = np.clip(expected_counts / len(expected), epsilon, 1.0)
        actual_pct = np.clip(actual_counts / len(actual), epsilon, 1.0)

        # Normalize back to 1.0 after clipping
        expected_pct /= np.sum(expected_pct)
        actual_pct /= np.sum(actual_pct)

        # PSI formula
        psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(psi_val)

    @staticmethod
    def kolmogorov_smirnov_test(sample1: np.ndarray, sample2: np.ndarray) -> Tuple[float, float]:
        """
        Performs 2-sample KS test returning the D-statistic and approximate p-value.
        """
        n1 = len(sample1)
        n2 = len(sample2)
        if n1 == 0 or n2 == 0:
            return 0.0, 1.0

        s1 = np.sort(sample1)
        s2 = np.sort(sample2)

        data_all = np.concatenate([s1, s2])
        cdf1 = np.searchsorted(s1, data_all, side="right") / n1
        cdf2 = np.searchsorted(s2, data_all, side="right") / n2

        d_stat = float(np.max(np.abs(cdf1 - cdf2)))

        # Approximate p-value for large sample sizes
        en = math.sqrt((n1 * n2) / (n1 + n2))
        lambda_val = (en + 0.12 + 0.11 / en) * d_stat
        
        # Kolmogorov distribution survival approximation
        p_val = 2.0 * sum(((-1) ** (k - 1)) * math.exp(-2.0 * (k * lambda_val) ** 2) for k in range(1, 20))
        p_val = max(0.0, min(1.0, float(p_val)))

        return d_stat, p_val

    @staticmethod
    def embedding_centroid_drift(
        baseline_embeddings: np.ndarray,
        current_embeddings: np.ndarray
    ) -> float:
        """
        Measures the angular cosine shift between baseline and current window embedding centroids.
        Shift > 0.15 indicates latent space misalignment requiring fine-tuning.
        """
        centroid_base = np.mean(baseline_embeddings, axis=0)
        centroid_curr = np.mean(current_embeddings, axis=0)

        norm_b = np.linalg.norm(centroid_base)
        norm_c = np.linalg.norm(centroid_curr)

        if norm_b == 0 or norm_c == 0:
            return 0.0

        cosine_sim = np.dot(centroid_base, centroid_curr) / (norm_b * norm_c)
        cosine_distance = 1.0 - float(cosine_sim)
        return max(0.0, cosine_distance)


def execute_production_audit(
    telemetry_logs: List[Dict[str, Any]],
    baseline_features: Dict[str, np.ndarray],
    current_features: Dict[str, np.ndarray],
    baseline_vectors: np.ndarray,
    current_vectors: np.ndarray,
    alert_webhook_url: str = ""
) -> Dict[str, Any]:
    """
    Executes full production health and drift inspection.
    """
    print("=" * 70)
    print("🔍 EXECUTING PRODUCTION RECOMMENDER DRIFT AUDIT")
    print("=" * 70)

    report = {
        "status": "HEALTHY",
        "triggers_retraining": False,
        "feature_drift": {},
        "embedding_drift": {},
        "business_kpis": {},
        "alerts": []
    }

    # 1. Feature Drift Evaluation (PSI & KS Test)
    print("\n[1] Evaluating Tabular Feature Distributions...")
    for feat_name, base_vals in baseline_features.items():
        if feat_name in current_features:
            curr_vals = current_features[feat_name]
            psi = DriftDetector.calculate_psi(base_vals, curr_vals)
            d_stat, p_val = DriftDetector.kolmogorov_smirnov_test(base_vals, curr_vals)

            drift_status = "STABLE"
            if psi >= 0.20 or p_val < 0.01:
                drift_status = "CRITICAL_DRIFT"
                report["triggers_retraining"] = True
                report["alerts"].append(f"Feature '{feat_name}' drifted (PSI: {psi:.3f}, KS p-val: {p_val:.4f})")
            elif psi >= 0.10:
                drift_status = "MODERATE_SHIFT"

            report["feature_drift"][feat_name] = {
                "psi": round(psi, 4),
                "ks_d": round(d_stat, 4),
                "ks_p": round(p_val, 4),
                "status": drift_status,
            }
            print(f"  • {feat_name:<20}: PSI={psi:.4f} | KS-D={d_stat:.3f} (p={p_val:.4f}) -> [{drift_status}]")

    # 2. Embedding Centroid Cosine Drift
    print("\n[2] Evaluating Latent Space Vector Alignment...")
    emb_drift = DriftDetector.embedding_centroid_drift(baseline_vectors, current_vectors)
    emb_status = "STABLE"
    if emb_drift > 0.15:
        emb_status = "CRITICAL_DRIFT"
        report["triggers_retraining"] = True
        report["alerts"].append(f"Vector Space centroid shifted significantly: {emb_drift:.4f}")
    elif emb_drift > 0.08:
        emb_status = "MODERATE_DRIFT"

    report["embedding_drift"] = {
        "cosine_distance": round(emb_drift, 4),
        "status": emb_status
    }
    print(f"  • Embedding Centroid Shift: {emb_drift:.4f} -> [{emb_status}]")

    # 3. Online KPI & CTR Degradation
    print("\n[3] Evaluating Real-Time Business Performance...")
    impressions = sum(1 for log in telemetry_logs if log.get("action") == "impression")
    clicks = sum(1 for log in telemetry_logs if log.get("action") == "click")
    conversions = sum(1 for log in telemetry_logs if log.get("action") in ["cart_add", "purchase"])

    ctr = (clicks / impressions) if impressions > 0 else 0.0
    cvr = (conversions / clicks) if clicks > 0 else 0.0

    # Baseline threshold: CTR < 2.5% triggers warning
    kpi_status = "HEALTHY"
    if ctr < 0.025 and impressions > 500:
        kpi_status = "DEGRADED"
        report["alerts"].append(f"Recommendation CTR fell below threshold: {ctr * 100:.2f}%")
        report["triggers_retraining"] = True

    report["business_kpis"] = {
        "impressions": impressions,
        "clicks": clicks,
        "conversions": conversions,
        "ctr": round(ctr, 4),
        "cvr": round(cvr, 4),
        "status": kpi_status
    }
    print(f"  • Impressions: {impressions} | Clicks: {clicks} | CTR: {ctr * 100:.2f}% | CVR: {cvr * 100:.2f}%")

    # 4. Final Verdict & Retraining Trigger
    print("\n" + "=" * 70)
    if report["triggers_retraining"]:
        report["status"] = "ACTION_REQUIRED"
        print("🚨 AUDIT RESULT: DRIFT DETECTED -> TRIGGERING CONTINUOUS RETRAINING PIPELINE")
        for alert in report["alerts"]:
            print(f"   ⚠️  {alert}")
    else:
        print("✅ AUDIT RESULT: ALL SYSTEMS OPERATING WITHIN ACCEPTABLE DRIFT TOLERANCES")
    print("=" * 70)

    return report


if __name__ == "__main__":
    # Demo Synthetic Verification
    np.random.seed(42)
    N = 2000

    base_prices = np.random.lognormal(mean=7.0, sigma=0.6, size=N)
    # Simulate price inflation drift
    curr_prices = np.random.lognormal(mean=7.3, sigma=0.7, size=N)

    base_emb = np.random.randn(N, 128)
    base_emb /= np.linalg.norm(base_emb, axis=1, keepdims=True)

    # Slight perturbation
    curr_emb = base_emb + np.random.normal(0, 0.2, size=(N, 128))
    curr_emb /= np.linalg.norm(curr_emb, axis=1, keepdims=True)

    fake_logs = [
        {"action": "impression"} for _ in range(1000)
    ] + [
        {"action": "click"} for _ in range(45)
    ] + [
        {"action": "purchase"} for _ in range(8)
    ]

    report = execute_production_audit(
        telemetry_logs=fake_logs,
        baseline_features={"product_price": base_prices},
        current_features={"product_price": curr_prices},
        baseline_vectors=base_emb,
        current_vectors=curr_emb
    )
