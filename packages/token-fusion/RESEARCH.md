# 🔬 Deep Research: Token Fusion

**Date:** 2026-07-12
**Methodology:** GitHub MCP search (repos, code, issues, commits) + cross-referenced with papers' own repos

---

## 📋 Executive Summary

"Token Fusion" is **not a single technique** — it's an umbrella term spanning **three interconnected research lineages** that converge on the same core idea: **intelligently combine, merge, or compress tokens to reduce compute while preserving semantic information.**

| Lineage | Core Idea | Maturity | Key Papers |
|---------|-----------|----------|------------|
| **LLM Token Compression Pipelines** | Zero-inference-cost compression of LLM context via multi-stage fusion pipelines | 🟢 Production-ready | Claw Compactor (2026) |
| **Multimodal Token Fusion** | Fuse tokens across modalities (vision, depth, text, audio) in transformer architectures | 🟡 Active research | TokenFusion (CVPR'22), MyGO (AAAI'25), FreeFuse (2025) |
| **Token Merging (ToMe) for Efficiency** | Merge redundant tokens within a single transformer to reduce sequence length | 🟢 Mature research | ToMe (ICML'23), Co-Me (CVPR'26), FrameFusion (ICCV'25) |

---

## 🏆 1. LLM Token Compression Pipelines

### 🥇 Claw Compactor ⭐ 2,188 [repo](https://github.com/open-compress/claw-compactor)

**The dominant force in this space.** A 14-stage "Fusion Pipeline" for LLM token compression.

**Key stats:**
- 15–82% compression depending on content type
- **Zero LLM inference cost** — all compression is algorithmic
- Reversible (hash-addressed RewindStore for retrieval)
- 1,600+ tests, 12,000+ lines Python
- MIT licensed

**Architecture — The 14 Fusion Stages:**

| # | Stage | What It Does |
|:-:|:------|:-------------|
| 1 | **QuantumLock** | Isolates dynamic content in system prompts to maximize KV-cache hit rate |
| 2 | **Cortex** | Auto-detects content type + programming language (16 languages) |
| 3 | **Photon** | Detects and compresses base64-encoded images |
| 4 | **RLE** | Path shorthand (`$WS`), IP prefix compression, enum compaction |
| 5 | **SemanticDedup** | SimHash fingerprint dedup across content blocks |
| 6 | **Ionizer** | JSON array statistical sampling with schema discovery |
| 7 | **LogCrunch** | Folds repeated log lines with occurrence counts |
| 8 | **SearchCrunch** | Deduplicates search/grep results |
| 9 | **DiffCrunch** | Folds unchanged context lines in git diffs |
| 10 | **StructuralCollapse** | Merges import blocks, collapses repeated patterns |
| 11 | **Neurosyntax** | **AST-aware code compression** via tree-sitter (never shortens identifiers) |
| 12 | **Nexus** | ML token-level compression (falls back to stopword removal without model) |
| 13 | **TokenOpt** | Tokenizer format optimization — strips formatting markers, normalizes whitespace |
| 14 | **Abbrev** | Natural language abbreviation (text only) |

**Key design principles:**
- **Immutable data flow** — `FusionContext` is frozen; every stage produces a new `FusionResult`
- **Gate-before-compress** — each stage inspects context type/language/role before doing work
- **Content-aware routing** — Cortex detects type (code/JSON/logs/diffs/search) → downstream stages adapt

**Benchmarks:**
```
Content Type    | Legacy Regex | FusionEngine | Improvement
Python source   |    7.3%      |    25.0%     |   3.4x
JSON (100 items)|   12.6%      |    81.9%     |   6.5x
Build logs      |    5.5%      |    24.1%     |   4.4x
Agent convos    |    5.7%      |    31.0%     |   5.4x
Git diffs       |    6.2%      |    15.0%     |   2.4x
Search results  |    5.3%      |    40.7%     |   7.7x
```

**vs LLMLingua-2 (ROUGE-L Fidelity):**
| Compression | Claw Compactor | LLMLingua-2 | Delta |
|:------------|:--------------:|:-----------:|:-----:|
| 0.3         | **0.653**      | 0.346       | +88.2% |
| 0.5         | **0.723**      | 0.570       | +26.8% |

**Bottom line:** Claw Compactor is the most mature, well-engineered token compression system available. It's deployed in OpenClaw AI agents and the OpenCompress API. The fusion pipeline architecture is extensible (custom stages via `FusionStage` subclass).

---

## 👁️ 2. Multimodal Token Fusion

### TokenFusion (CVPR 2022) ⭐ 187 [repo](https://github.com/yikaiw/TokenFusion)

**"Multimodal Token Fusion for Vision Transformers"** — the paper that named the concept.

**Idea:** In vision transformers processing multiple modalities (e.g., RGB + depth for semantic segmentation), instead of fusing at the feature level or decision level, fuse at the **token level**. Tokens from different modalities are selectively merged within the transformer's self-attention layers.

**Architecture:**
- Each modality has its own ViT branch
- A **TokenFusion module** is inserted between transformer layers
- Relevant tokens from one modality are "fused" into the other's token sequence
- Fusion is learned via a gating mechanism that decides which tokens to fuse
- Supports both homogeneous (same task, different inputs) and heterogeneous (different modalities, different tasks) predictions

**Results:**
| Task | Dataset | Metric | Score |
|:-----|:--------|:-------|:-----:|
| RGB-D Segmentation | NYUDv2 | mIoU | **54.8%** (vs 51.6% SOTA) |
| Texture+Shade→RGB | Taskonomy | FID | **45.5** (vs 62.6 baseline) |

**Meaning:** Token-level fusion outperforms feature-level fusion because it preserves spatial alignment between modalities and lets the transformer attend to cross-modal relationships at a finer granularity.

---

### MyGO — AAAI 2025 ⭐ 286 [repo](https://github.com/zjukg/MyGO)

**"Tokenization, Fusion, and Augmentation: Towards Fine-grained Multi-modal Entity Representation"**

**Domain:** Multi-modal knowledge graph completion (KG entities have text + images)

**Idea:** 
1. **Tokenize** each modality into tokens (BEiT/VQGAN for images, BERT/RoBERTa/LLaMA for text)
2. **Fuse** token sequences via cross-modal attention with learnable fusion
3. **Augment** with contrastive learning to align modalities

**Key contribution:** First fine-grained multi-modal fusion for KG entities — instead of whole-entity embeddings, they operate on token sequences, enabling per-token cross-modal interaction.

**Architecture:**
- Visual tokens: VQGAN/BEiT → max 8 visual tokens per entity
- Textual tokens: BERT/RoBERTa/LLaMA → max 4 text tokens per entity
- Fusion via multi-head cross-attention decoder
- Contrastive loss (μ=0.01) for modality alignment

**Datasets:** DB15K, MKG-W, MKG-Y

---

### FreeFuse ⭐ 228 [repo](https://github.com/yaoliliu/FreeFuse)

**"Multi-Subject LoRA Fusion via Adaptive Token-Level Routing at Test Time"**

**Domain:** Text-to-image generation (Flux, SDXL, Z-Image)

**Idea:** When you have multiple LoRA adapters (each trained to generate a specific subject/person/character), **FreeFuse** dynamically routes each LoRA's tokens to the correct spatial region in the generated image — **at inference time, no retraining.**

**Key mechanism — FreeFuseAttn:**
- Exploits the model's intrinsic semantic alignment (flow matching)
- At early denoising timesteps, identifies which tokens belong to which subject
- Routes each subject-LoRA's output to its region only
- Prevents LoRA feature conflicts without masks or segmentation models

**Results:** Superior identity preservation and compositional fidelity vs. prior multi-LoRA fusion approaches. Works with ControlNet, IP-Adapter, Redux, Krea2.

**Supported models:** Flux.dev, Flux.2-klein-4B/9B, SDXL, Z-Image-turbo, ComfyUI

---

### FrameFusion — ICCV 2025 ⭐ 76 [repo](https://github.com/thu-nics/FrameFusion)

**"Combining Similarity and Importance for Video Token Reduction on Large Visual Language Models"**

**Domain:** Video LLMs / LVLMs (LLaVA-Video, Qwen2-VL, InternVL2.5, NVILA)

**Idea:** Video LVLMs choke on the massive number of tokens from video frames. FrameFusion combines:
1. **Similarity-based merging** — merge adjacent frame tokens that are similar
2. **Importance-based pruning** — keep only the most informative tokens

**Results:**
- 70% vision token reduction
- 3.4–4.4× LLM speedup
- 1.6–1.9× end-to-end speedup
- Minimal performance degradation across benchmarks

**API:** Single Python function `apply_framefusion(model, cost=0.3, similarity_lower_bound=0.6, ratio_lower_bound=0.1)`

---

## 🔗 3. Token Merging (ToMe) Family

This is the **largest and most active** research lineage. All of these techniques operate within a **single transformer** to reduce token count by merging similar tokens.

### ToMe (Token Merging) — ICML 2023

**The original.** Meta/FAIR paper by Bolya et al. "Token Merging: Your ViT But Faster."

**Idea:** In each transformer layer, merge the most similar tokens. Unlike pruning (which discards information), merging combines similar tokens by averaging. The merged token retains the information of both.

**Key insight:** Many tokens in vision transformers are redundant (background patches). Merging them reduces sequence length without losing semantic content.

### Co-Me — CVPR 2026 ⭐ 189 [repo](https://github.com/co-me-tokens/CoMe)

**"Confidence-Guided Token Merging for Visual Geometric Transformers"**

**State-of-the-art** in token merging for geometric vision tasks (depth estimation, pose estimation).

**Key innovation:** Instead of naive similarity-based merging, use a **confidence predictor** (trained via knowledge distillation from the full model) to decide which tokens matter and should NOT be merged.

**Results:**
- Co-Me on VGGT: **5× speedup** (6671ms → 1319ms) with minimal accuracy loss
- Custom CUDA kernels for FlashAttention integration
- Supports: VGGT, DepthAnything3, Pi3/Pi3X, MapAnything

**Advanced features:**
- Confidence-guided token merging (not just similarity)
- Customized FlashAttention kernels for merged token sequences
- Runs on H100, A100, RTX Ada6000, RTX 5090, NVIDIA Jetson Thor

### DiffRate — ICCV 2023 ⭐ 103

**"Differentiable Token Pruning and Merging"** — jointly optimizes pruning and merging decisions with differentiable compression rates.

### PiToMe ⭐ 56

**"Spectrum-Preserving Token Merging"** — uses spectral analysis to identify which tokens to merge, preserving the model's spectral properties.

### vid-TLDR — CVPR 2024 ⭐ 55

**Training-free token merging for video transformers.** Merges tokens across both spatial and temporal dimensions.

### DTEM — NeurIPS 2024 ⭐ 9

**"Decoupled Token Merging"** — separates the merging decision into two learned components: which tokens to merge, and how to compute the merged representation.

### Other papers (recent):
- **Fourier Token Merging** (2025) — frequency-domain token merging for diffusion models
- **G2TM** (VISAPP 2026) — Graph-Guided Token Merging using graph theory
- **SAD-TM** (2026) — Saliency-Driven Token Merging
- **MedToMe** (2025) — Medical image classification with ToMe
- **LGM** (ICML'26) — Variable-length tokenization via learnable global merging for DiTs

---

## 🧠 Synthesis: What "Token Fusion" Actually Means

After deep analysis, **Token Fusion breaks down into three distinct mechanisms:**

### Mechanism A: Pipeline Fusion (Claw Compactor)
**Multiple stages chain together**, each handling a different compression strategy. Like a factory assembly line for token reduction. Content is analyzed, classified, then routed through appropriate compression stages. ❌ Not ML-based — algorithmic, reversible.

### Mechanism B: Cross-Modal Token Fusion (TokenFusion, MyGO, FreeFuse)
**Tokens from different modalities are intermixed** within transformer layers. This is true "fusion" — creating new hybrid representations by combining tokens from different sources. The fusion is learned end-to-end. ✅ ML-based.

### Mechanism C: Intra-Model Token Merging (Co-Me, ToMe, FrameFusion)
**Similar tokens within the same model are merged** to reduce sequence length. This is "reduction via fusion" — you merge to throw away less than you would by pruning. Often called **Token Merging** rather than Token Fusion. ✅ ML-based, often training-free.

---

## 📊 Landscape Matrix

| Project | Category | Training Free? | Reversible? | ML Deps? | Production Ready? |
|---------|----------|:-------------:|:-----------:|:--------:|:-----------------:|
| Claw Compactor | Pipeline Fusion | ✅ | ✅ | ❌ | ✅ |
| TokenFusion (CVPR'22) | Cross-Modal Fusion | ❌ | ❌ | ✅ (PyTorch) | ⚠️ Research |
| MyGO (AAAI'25) | Cross-Modal Fusion | ❌ | ❌ | ✅ (PyTorch) | ⚠️ Research |
| FreeFuse | Cross-Modal Fusion | ✅ | ❌ | ✅ (Diffusers) | ⚠️ Early |
| FrameFusion (ICCV'25) | Token Merging | ✅ | ❌ | ✅ (HF) | ⚠️ Research |
| Co-Me (CVPR'26) | Token Merging | ❌ (has trained conf) | ❌ | ✅ (CUDA) | ⚠️ Research |
| ToMe (ICML'23) | Token Merging | ✅ | ❌ | ✅ (PyTorch) | ✅ Widely used |
| DiffRate (ICCV'23) | Token Merging+Pruning | ❌ | ❌ | ✅ (PyTorch) | ⚠️ Research |

---

## 🚀 Future Directions & Gaps

1. **Pipeline + ML hybrid** — Nobody has combined Claw Compactor's reversible pipeline architecture with learned token merging (Co-Me/ToMe). The fusion of fusion pipelines and learned merging is an open opportunity.

2. **Token fusion for reasoning tokens** — As LLMs adopt chain-of-thought and "thinking" tokens, compressing intermediate reasoning tokens is unexplored.

3. **Multi-modal fusion + token merging** — FreeFuse does adaptive routing; Co-Me does confidence-guided merging. Combining them would provide token-level adaptive fusion with merge-based efficiency.

4. **Fusion for multi-agent systems** — When multiple LLM agents communicate, they exchange tokens. Token fusion could compress inter-agent messages without losing semantic content.

5. **Reversible fusion for audit** — Claw Compactor's RewindStore concept (hash-addressed retrieval of original tokens after compression) is a powerful idea not yet applied in the token merging literature.

---

## 📚 Key Papers (BibTeX)

```bibtex
@inproceedings{wang2022tokenfusion,
  title={Multimodal Token Fusion for Vision Transformers},
  author={Wang, Yikai and Chen, Xinghao and Cao, Lele and Huang, Wenbing and Sun, Fuchun and Wang, Yunhe},
  booktitle={CVPR},
  year={2022}
}

@article{chen2025come,
  title={Co-Me: Confidence-Guided Token Merging for Visual Geometric Transformers},
  author={Chen, Yutian and Qiu, Yuheng and Li, Ruogu and Agha, Ali and others},
  journal={arXiv:2511.14751},
  year={2025}
}

@inproceedings{fu2025framefusion,
  title={FrameFusion: Combining Similarity and Importance for Video Token Reduction},
  author={Fu, Tianyu and Liu, Tengxuan and others},
  booktitle={ICCV},
  year={2025}
}

@inproceedings{zhang2025mygo,
  title={Tokenization, Fusion, and Augmentation: Towards Fine-grained Multi-modal Entity Representation},
  author={Zhang, Yichi and Chen, Zhuo and others},
  booktitle={AAAI},
  year={2025}
}

@article{liu2025freefuse,
  title={FreeFuse: Multi-Subject LoRA Fusion via Adaptive Token-Level Routing at Test Time},
  author={Liu, Yaoli and others},
  journal={arXiv:2510.23515},
  year={2025}
}
```
