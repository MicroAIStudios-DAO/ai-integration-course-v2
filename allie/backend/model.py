import os
import threading
from typing import Optional, List

import numpy as np
from sentence_transformers import SentenceTransformer


_lock = threading.Lock()
_model: Optional[SentenceTransformer] = None
_model_name: Optional[str] = None


def _init_model() -> SentenceTransformer:
    global _model, _model_name
    if _model is not None:
        return _model
    with _lock:
        if _model is None:
            _model_name = os.getenv("ALLIE_EMBED_MODEL", "BAAI/bge-small-en-v1.5")
            device = os.getenv("ALLIE_DEVICE")  # e.g., 'cpu', 'cuda', 'mps'
            _model = SentenceTransformer(_model_name, device=device)
            max_len = os.getenv("ALLIE_MAX_SEQ_LENGTH")
            if max_len:
                try:
                    _model.max_seq_length = int(max_len)
                except ValueError:
                    pass
    return _model


def get_model_name() -> str:
    global _model_name
    # Ensure name reflects actual loaded model
    if _model is None:
        # Not yet initialized; return env default that will be used
        return os.getenv("ALLIE_EMBED_MODEL", "BAAI/bge-small-en-v1.5")
    return _model_name or ""


def get_embed_dim() -> int:
    model = _init_model()
    try:
        return model.get_sentence_embedding_dimension()
    except Exception:
        # Fallback: compute on a dummy input
        import numpy as np
        v = model.encode(["hello"], normalize_embeddings=True)
        v = np.asarray(v)
        return int(v.shape[-1])


def warmup() -> None:
    _ = _init_model()


def embed_texts(texts: List[str]) -> np.ndarray:
    """
    Returns an array of shape (n, d) with float32 dtype and L2-normalized rows.
    """
    model = _init_model()
    emb = model.encode(texts, normalize_embeddings=True)
    # Ensure float32 for DB/vector extension compatibility and memory footprint
    emb = np.asarray(emb, dtype=np.float32)
    return emb


def embed_text(text: str) -> np.ndarray:
    return embed_texts([text])[0]
