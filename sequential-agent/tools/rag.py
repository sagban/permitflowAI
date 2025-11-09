"""Vertex AI RAG Engine tool - custom function tool."""

import os
from typing import Dict, Any, List, Optional
from google.adk.tools import FunctionTool
from ..config.settings import GCP_PROJECT_ID, GCP_REGION, RAG_CORPUS


def rag_search(
    query: str,
    namespace: Optional[str] = None,
    top_k: int = 5,
    filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Search the Vertex AI RAG corpus for relevant safety information from incidents and historical permits.
    Use this to find similar past incidents, lessons learned, and permit examples.
    
    Args:
        query: Search query string (required)
        namespace: Optional namespace filter (e.g., "incidents" or "historical_permits")
        top_k: Number of top results to return (default: 5)
        filters: Optional metadata filters (e.g., {"site": "Plant-A"})
    
    Returns:
        Dictionary with search results containing id, title, snippet, score, and meta fields
    """
    try:
        # Try to use Vertex AI RAG API
        from vertexai.preview import rag
        
        rag_corpus_resource = os.getenv("RAG_CORPUS")
        
        if not rag_corpus_resource and GCP_PROJECT_ID:
            location = GCP_REGION
            corpus = RAG_CORPUS or "permitflowai-corpus"
            rag_corpus_resource = f"projects/{GCP_PROJECT_ID}/locations/{location}/ragCorpora/{corpus}"
        
        if rag_corpus_resource:
            # Create RAG resource
            rag_resource = rag.RagResource(rag_corpus=rag_corpus_resource)
            
            # Use Vertex AI RAG retrieve_context
            from vertexai.preview.rag import retrieve_context
            
            retrieval_config = rag.RetrievalConfig(
                similarity_top_k=top_k,
                vector_distance_threshold=0.6,
            )
            
            contexts = retrieve_context(
                rag_resources=[rag_resource],
                query=query,
                config=retrieval_config,
            )
            
            # Format results
            results = []
            for i, context in enumerate(contexts):
                results.append({
                    "id": f"rag_result_{i}",
                    "title": getattr(context, "title", f"Result {i+1}"),
                    "snippet": getattr(context, "text", str(context)),
                    "score": getattr(context, "score", 0.8),
                    "meta": {
                        "source": getattr(context, "source", ""),
                        "namespace": namespace or "default"
                    }
                })
            
            return {
                "results": results,
                "query": query,
                "namespace": namespace,
                "total": len(results)
            }
        else:
            # RAG not configured, return mock data
            raise ValueError("RAG_CORPUS not configured")
            
    except Exception as e:
        # Fallback: return mock data if RAG is not configured or fails
        return {
            "results": [
                {
                    "id": "mock_1",
                    "title": f"Mock {namespace or 'Safety'} Information",
                    "snippet": f"Relevant safety information for query: {query}. This is mock data returned when RAG corpus is not configured.",
                    "score": 0.8,
                    "meta": {
                        "namespace": namespace or "default",
                        "note": "RAG not configured, using mock data",
                        "error": str(e) if str(e) else None
                    }
                }
            ],
            "query": query,
            "namespace": namespace,
            "total": 1
        }


def search_rag() -> FunctionTool:
    """
    Create a custom RAG search function tool.
    
    Returns:
        FunctionTool instance for RAG search
    """
    return FunctionTool(func=rag_search)
