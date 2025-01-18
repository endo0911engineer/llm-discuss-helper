from rest_framework.views import APIView
from rest_framework.views import Response
from .models import Post
from .utils.image_processing import extract_image_features
from .utils.text_processing import vectorize_tags_tfidf
from utils.similarity import calculate_similarity

class RecommendPostsAPIView(APIView):
    def post(self, request):
        # ユーザー投稿の処理
        image = request.FILES['image']
        tags = request.data.get('tags')

        # 特徴ベクトル生成
        image_features = extract_image_features(image)
        tags_vector = vectorize_tags_tfidf([tags])[0] # 単一の投稿をベクトル化

        # 類似検索
        all_posts = Post.objects.all()
        existing_vectors = [post.vector_representation for post in all_posts] # 保存済みベクトル
        similarities = calculate_similarity(image_features + tags_vector, existing_vectors)

        # 類似度が高い投稿を取得
        similar_posts = [all_posts[i] for i in similarities[:5]]
        data = [{"id": post.id, "tags": post.tags, "image": post.image.url} for post in similar_posts]

        return Response(data)