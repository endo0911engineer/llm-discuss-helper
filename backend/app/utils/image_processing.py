import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image

# ResNetモデルのロード
resnet = models.resnet50(pretrained=True)
resnet = torch.nn.Sequential(*list(resnet.children())[:-1]) # 全結合層を除く
resnet.eval()

# 画像の前処理
def preprocess_image(image):
    transform = transforms.Compose([
        transform.Resize((224, 224)),
        transform.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]), 
    ])
    return transform(image).unsqueeze(0)

# 特徴ベクトルを抽出
def extract_image_features(image_path):
    image = Image.open(image_path).convert("RGB")
    input_tensor = preprocess_image(image)
    with torch.no_grad():
        features = resnet(input_tensor)
    return features.flatten().numpy()

