from sklearn.metrics.pairwise import cosine_similarity

# ベクトル間の類似度計算
def calculate_similarity(query_vector, target_vectors):
    similarities = cosine_similarity([query_vector], target_vectors)
    return similarities[0].argsort()[::-1] # 類似度が高い順にインデックスを返す。