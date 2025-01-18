from sklearn.feature_extraction.text import TfidfVectorizer
from gensim.models import Word2Vec

# TF-IDFを使ったベクトル化
def vectorize_tags_tfidf(tags_list):
    vectorizer = TfidfVectorizer()
    return vectorizer.fit_transform(tags_list).toarray()

# Word2Vecを使ったベクトル化
def vectorize_tags_word2vec(tags_list):
    model = Word2Vec(tags_list, vector_size=100, window=5, min_count=1, workers=4)
    return [model.wv[tag].mean(axis=0) for tag in tags_list]