#!/usr/bin/env python3
"""
Production Two-Tower Deep Neural Network for E-Commerce Candidate Retrieval
Framework: PyTorch 2.x
Features:
- User Tower: Static tabular embeddings + Multi-Head Self-Attention over sequential click history
- Item Tower: Tabular metadata + Multimodal Semantic Projections + SwiGLU trunk
- Objective: In-Batch Sampled Softmax with LogQ Popularity Frequency Correction
- Export: ONNX graph export with dynamic axes for production serving
"""

import math
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Tuple


# ---------------------------------------------------------------------------
# 1. ARCHITECTURE COMPONENTS
# ---------------------------------------------------------------------------

class SwiGLU(nn.Module):
    """Swish Gated Linear Unit for superior dense feature mixing."""
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.w1 = nn.Linear(in_features, out_features, bias=False)
        self.w2 = nn.Linear(in_features, out_features, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.silu(self.w1(x)) * self.w2(x)


class UserTower(nn.Module):
    """
    User Tower: Encodes user static demographics and sequential interaction history
    into a normalized 128-dimensional latent vector.
    """
    def __init__(
        self,
        num_users: int = 100_000,
        num_items: int = 50_000,
        item_emb_dim: int = 64,
        latent_dim: int = 128,
        seq_len: int = 20,
        num_heads: int = 4,
    ):
        super().__init__()
        self.latent_dim = latent_dim
        self.seq_len = seq_len

        # Shared Item Embedding for sequence history
        self.item_embedding = nn.Embedding(num_items, item_emb_dim, padding_idx=0)
        self.pos_embedding = nn.Parameter(torch.randn(1, seq_len, item_emb_dim) * 0.02)

        # Transformer Self-Attention Layer for session temporal dynamics
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=item_emb_dim,
            nhead=num_heads,
            dim_feedforward=item_emb_dim * 2,
            dropout=0.1,
            activation="gelu",
            batch_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)

        # Static Demographics (User bucket, Device, City)
        self.user_embedding = nn.Embedding(num_users, 32)
        self.device_embedding = nn.Embedding(5, 8)
        self.city_embedding = nn.Embedding(100, 16)

        # Total input dimension to trunk: 64 (seq) + 32 + 8 + 16 = 120
        total_in = item_emb_dim + 32 + 8 + 16
        self.trunk = nn.Sequential(
            SwiGLU(total_in, 192),
            nn.LayerNorm(192),
            nn.Dropout(0.1),
            nn.Linear(192, latent_dim),
        )

    def forward(
        self,
        item_seq: torch.Tensor,       # [Batch, seq_len]
        seq_mask: torch.Tensor,       # [Batch, seq_len] (True for valid, False for padding)
        user_id: torch.Tensor,        # [Batch]
        device_id: torch.Tensor,      # [Batch]
        city_id: torch.Tensor,        # [Batch]
    ) -> torch.Tensor:
        # Sequential interaction embedding with positional encoding
        seq_emb = self.item_embedding(item_seq) + self.pos_embedding[:, :item_seq.size(1), :]
        
        # Transformer mask (PyTorch requires key_padding_mask: True where padding)
        key_padding_mask = ~seq_mask
        transformed = self.transformer(seq_emb, src_key_padding_mask=key_padding_mask)

        # Masked Average Pooling over valid sequence clicks
        mask_expanded = seq_mask.unsqueeze(-1).float()
        pooled_seq = (transformed * mask_expanded).sum(dim=1) / mask_expanded.sum(dim=1).clamp(min=1.0)

        # Static embeddings
        u_emb = self.user_embedding(user_id)
        d_emb = self.device_embedding(device_id)
        c_emb = self.city_embedding(city_id)

        # Concatenate and pass through trunk
        merged = torch.cat([pooled_seq, u_emb, d_emb, c_emb], dim=-1)
        latent = self.trunk(merged)

        # L2 Normalization ensures unit sphere projection
        return F.normalize(latent, p=2, dim=-1)


class ItemTower(nn.Module):
    """
    Item Tower: Encodes item metadata, category, price, and multimodal text/image vectors.
    """
    def __init__(
        self,
        num_categories: int = 500,
        num_brands: int = 2000,
        multimodal_dim: int = 384,  # e.g., sentence-transformer text embedding
        latent_dim: int = 128,
    ):
        super().__init__()
        self.cat_emb = nn.Embedding(num_categories, 32)
        self.brand_emb = nn.Embedding(num_brands, 32)
        self.multimodal_adapter = nn.Linear(multimodal_dim, 64)
        
        # Continuous feature projection (Price, Discount, Margin)
        self.continuous_proj = nn.Linear(3, 16)

        # Total in: 32 + 32 + 64 + 16 = 144
        total_in = 32 + 32 + 64 + 16
        self.trunk = nn.Sequential(
            SwiGLU(total_in, 192),
            nn.LayerNorm(192),
            nn.Dropout(0.1),
            nn.Linear(192, latent_dim),
        )

    def forward(
        self,
        cat_id: torch.Tensor,         # [Batch]
        brand_id: torch.Tensor,       # [Batch]
        multimodal_vec: torch.Tensor, # [Batch, 384]
        continuous_feats: torch.Tensor # [Batch, 3]
    ) -> torch.Tensor:
        c_emb = self.cat_emb(cat_id)
        b_emb = self.brand_emb(brand_id)
        m_emb = F.gelu(self.multimodal_adapter(multimodal_vec))
        cont_emb = F.gelu(self.continuous_proj(continuous_feats))

        merged = torch.cat([c_emb, b_emb, m_emb, cont_emb], dim=-1)
        latent = self.trunk(merged)

        return F.normalize(latent, p=2, dim=-1)


# ---------------------------------------------------------------------------
# 2. OBJECTIVE FUNCTION (SAMPLED SOFTMAX WITH LOGQ CORRECTION)
# ---------------------------------------------------------------------------

class LogQSampledSoftmaxLoss(nn.Module):
    """
    In-batch sampled softmax loss with explicit logQ correction.
    Removes popularity bias so niche items aren't suppressed by head items.
    """
    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.tau = nn.Parameter(torch.tensor(temperature))

    def forward(
        self,
        user_vectors: torch.Tensor, # [B, D]
        item_vectors: torch.Tensor, # [B, D]
        item_log_q: torch.Tensor,   # [B] marginal sample probability log(Q)
    ) -> torch.Tensor:
        batch_size = user_vectors.size(0)
        
        # Cosine similarity matrix scaled by learnable temperature tau
        logits = torch.matmul(user_vectors, item_vectors.T) / self.tau.clamp(min=0.01)

        # Subtract logQ from columns to penalize popular items
        log_q_expanded = item_log_q.unsqueeze(0).expand(batch_size, -1)
        adjusted_logits = logits - log_q_expanded

        # Positive pairs are on the diagonal
        labels = torch.arange(batch_size, device=user_vectors.device)
        return F.cross_entropy(adjusted_logits, labels)


# ---------------------------------------------------------------------------
# 3. EVALUATION METRICS
# ---------------------------------------------------------------------------

def evaluate_retrieval(
    user_vecs: torch.Tensor,
    item_vecs: torch.Tensor,
    k_list: List[int] = [10, 20, 50]
) -> Dict[str, float]:
    """Computes Recall@K and NDCG@K over batch similarities."""
    with torch.no_grad():
        sim_matrix = torch.matmul(user_vecs, item_vecs.T)
        _, topk_indices = torch.topk(sim_matrix, k=max(k_list), dim=1)
        targets = torch.arange(user_vecs.size(0), device=user_vecs.device).unsqueeze(1)

        metrics = {}
        for k in k_list:
            hits = (topk_indices[:, :k] == targets).any(dim=1).float()
            metrics[f"Recall@{k}"] = hits.mean().item()

            # NDCG@K
            ranks = (topk_indices[:, :k] == targets).nonzero()
            dcg = 1.0 / torch.log2(ranks[:, 1].float() + 2.0)
            metrics[f"NDCG@{k}"] = (dcg.sum() / user_vecs.size(0)).item()

        return metrics


# ---------------------------------------------------------------------------
# 4. EXPORT TO PRODUCTION ONNX
# ---------------------------------------------------------------------------

def export_models_to_onnx(
    user_tower: UserTower,
    item_tower: ItemTower,
    output_dir: str = "./models"
):
    import os
    os.makedirs(output_dir, exist_ok=True)
    user_tower.eval()
    item_tower.eval()

    device = next(user_tower.parameters()).device

    # Dummy inputs for User Tower
    dummy_seq = torch.randint(1, 1000, (2, 20), device=device)
    dummy_mask = torch.ones((2, 20), dtype=torch.bool, device=device)
    dummy_user = torch.tensor([12, 45], device=device)
    dummy_device = torch.tensor([1, 2], device=device)
    dummy_city = torch.tensor([3, 5], device=device)

    user_onnx_path = os.path.join(output_dir, "user_tower.onnx")
    torch.onnx.export(
        user_tower,
        (dummy_seq, dummy_mask, dummy_user, dummy_device, dummy_city),
        user_onnx_path,
        input_names=["item_seq", "seq_mask", "user_id", "device_id", "city_id"],
        output_names=["user_embedding"],
        dynamic_axes={
            "item_seq": {0: "batch_size", 1: "seq_len"},
            "seq_mask": {0: "batch_size", 1: "seq_len"},
            "user_id": {0: "batch_size"},
            "device_id": {0: "batch_size"},
            "city_id": {0: "batch_size"},
            "user_embedding": {0: "batch_size"},
        },
        opset_version=17,
    )
    print(f"✅ User Tower exported successfully to: {user_onnx_path}")

    # Dummy inputs for Item Tower
    dummy_cat = torch.tensor([5, 12], device=device)
    dummy_brand = torch.tensor([10, 20], device=device)
    dummy_mm = torch.randn((2, 384), device=device)
    dummy_cont = torch.randn((2, 3), device=device)

    item_onnx_path = os.path.join(output_dir, "item_tower.onnx")
    torch.onnx.export(
        item_tower,
        (dummy_cat, dummy_brand, dummy_mm, dummy_cont),
        item_onnx_path,
        input_names=["cat_id", "brand_id", "multimodal_vec", "continuous_feats"],
        output_names=["item_embedding"],
        dynamic_axes={
            "cat_id": {0: "batch_size"},
            "brand_id": {0: "batch_size"},
            "multimodal_vec": {0: "batch_size"},
            "continuous_feats": {0: "batch_size"},
            "item_embedding": {0: "batch_size"},
        },
        opset_version=17,
    )
    print(f"✅ Item Tower exported successfully to: {item_onnx_path}")


if __name__ == "__main__":
    print("🚀 Initializing Production Two-Tower Neural Recommender...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    u_tower = UserTower().to(device)
    i_tower = ItemTower().to(device)
    loss_fn = LogQSampledSoftmaxLoss().to(device)
    
    print(f"⚡ Device: {device} | User Tower Params: {sum(p.numel() for p in u_tower.parameters()):,}")
    print(f"⚡ Item Tower Params: {sum(p.numel() for p in i_tower.parameters()):,}")

    # Demo Synthetic Forward Pass
    B = 32
    seq = torch.randint(1, 5000, (B, 20), device=device)
    mask = torch.ones((B, 20), dtype=torch.bool, device=device)
    uid = torch.randint(0, 10000, (B,), device=device)
    dev = torch.randint(0, 4, (B,), device=device)
    city = torch.randint(0, 80, (B,), device=device)

    cid = torch.randint(0, 400, (B,), device=device)
    bid = torch.randint(0, 1500, (B,), device=device)
    mm = torch.randn(B, 384, device=device)
    cont = torch.randn(B, 3, device=device)
    log_q = torch.full((B,), -math.log(10000), device=device)

    u_vecs = u_tower(seq, mask, uid, dev, city)
    i_vecs = i_tower(cid, bid, mm, cont)

    loss = loss_fn(u_vecs, i_vecs, log_q)
    print(f"🎯 Initial Batch Softmax Loss: {loss.item():.4f}")

    metrics = evaluate_retrieval(u_vecs, i_vecs)
    for k, v in metrics.items():
        print(f"📊 {k}: {v:.4f}")

    # Export to ONNX
    export_models_to_onnx(u_tower, i_tower, output_dir="./models/recommendation")
    print("✨ Model pipeline verification complete.")
