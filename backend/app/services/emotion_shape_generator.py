"""
情绪形状生成器
Emotion Shape Generator for Wordclouds
"""

import numpy as np
from PIL import Image, ImageDraw
from typing import Dict, Any, Tuple
import io
import base64


class EmotionShapeGenerator:
    """情绪形状生成器类"""
    
    def __init__(self, canvas_size: Tuple[int, int] = (400, 400)):
        self.canvas_size = canvas_size
        self.center_x = canvas_size[0] // 2
        self.center_y = canvas_size[1] // 2
    
    def generate_shape_mask(self, emotion: str, dominant_keywords: list = None) -> np.ndarray:
        """
        根据情绪生成对应的形状蒙版
        
        Args:
            emotion: 主导情绪 (happy, sad, angry, anxious, neutral, love, etc.)
            dominant_keywords: 主要关键词列表，用于辅助形状选择
            
        Returns:
            numpy数组，黑色(0)区域为文字区域，白色(255)区域为背景
        """
        
        # 创建PIL图像
        image = Image.new('RGB', self.canvas_size, color='white')
        draw = ImageDraw.Draw(image)
        
        # 根据情绪选择形状
        if emotion in ['happy', 'joy', 'excited', 'positive']:
            mask = self._draw_happy_face(draw)
        elif emotion in ['love', 'romantic', 'affection']:
            mask = self._draw_heart_shape(draw)
        elif emotion in ['sad', 'depression', 'melancholy']:
            mask = self._draw_teardrop_shape(draw)
        elif emotion in ['angry', 'rage', 'frustration']:
            mask = self._draw_lightning_shape(draw)
        elif emotion in ['anxious', 'anxiety', 'nervous', 'worry']:
            mask = self._draw_brain_shape(draw)
        elif emotion in ['thinking', 'contemplation', 'study']:
            mask = self._draw_lightbulb_shape(draw)
        elif emotion in ['stress', 'pressure', 'overwhelmed']:
            mask = self._draw_wave_shape(draw)
        else:  # neutral or unknown
            mask = self._draw_cloud_shape(draw)
        
        # 转换为numpy数组
        mask_array = np.array(image)
        
        # 转换为灰度并反转（wordcloud需要黑色为文字区域）
        gray_mask = np.mean(mask_array, axis=2)
        
        # 反转颜色：白色背景(255) -> 黑色文字区域(0)
        inverted_mask = 255 - gray_mask
        
        return inverted_mask.astype(np.uint8)
    
    def _draw_happy_face(self, draw: ImageDraw.Draw) -> None:
        """绘制笑脸形状"""
        # 外圆 - 脸部轮廓
        face_radius = min(self.canvas_size) // 3
        face_bbox = [
            self.center_x - face_radius,
            self.center_y - face_radius,
            self.center_x + face_radius,
            self.center_y + face_radius
        ]
        draw.ellipse(face_bbox, fill='black')
        
        # 眼睛
        eye_radius = face_radius // 8
        left_eye_x = self.center_x - face_radius // 3
        right_eye_x = self.center_x + face_radius // 3
        eye_y = self.center_y - face_radius // 4
        
        # 左眼
        draw.ellipse([
            left_eye_x - eye_radius, eye_y - eye_radius,
            left_eye_x + eye_radius, eye_y + eye_radius
        ], fill='white')
        
        # 右眼
        draw.ellipse([
            right_eye_x - eye_radius, eye_y - eye_radius,
            right_eye_x + eye_radius, eye_y + eye_radius
        ], fill='white')
        
        # 笑嘴 - 使用弧形
        mouth_radius = face_radius // 2
        mouth_bbox = [
            self.center_x - mouth_radius // 2,
            self.center_y - mouth_radius // 4,
            self.center_x + mouth_radius // 2,
            self.center_y + mouth_radius // 2
        ]
        draw.arc(mouth_bbox, start=0, end=180, fill='white', width=8)
    
    def _draw_heart_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制心形"""
        scale = min(self.canvas_size) // 4
        
        # 心形的数学公式参数
        points = []
        for t in np.linspace(0, 2 * np.pi, 100):
            # 心形参数方程
            x = 16 * np.sin(t) ** 3
            y = -(13 * np.cos(t) - 5 * np.cos(2*t) - 2 * np.cos(3*t) - np.cos(4*t))
            
            # 缩放和平移到画布中心
            screen_x = self.center_x + x * scale // 16
            screen_y = self.center_y + y * scale // 16
            points.append((screen_x, screen_y))
        
        draw.polygon(points, fill='black')
    
    def _draw_teardrop_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制泪滴形状"""
        # 泪滴由圆形和三角形组成
        drop_radius = min(self.canvas_size) // 4
        
        # 下方的圆形部分
        circle_y = self.center_y + drop_radius // 2
        draw.ellipse([
            self.center_x - drop_radius,
            circle_y - drop_radius,
            self.center_x + drop_radius,
            circle_y + drop_radius
        ], fill='black')
        
        # 上方的尖角部分
        tip_y = self.center_y - drop_radius
        points = [
            (self.center_x, tip_y),
            (self.center_x - drop_radius // 2, circle_y - drop_radius // 2),
            (self.center_x + drop_radius // 2, circle_y - drop_radius // 2)
        ]
        draw.polygon(points, fill='black')
    
    def _draw_lightning_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制闪电形状（愤怒）"""
        width = min(self.canvas_size) // 3
        height = min(self.canvas_size) // 2
        
        # 闪电的锯齿形状
        points = [
            (self.center_x - width // 4, self.center_y - height // 2),  # 顶部左
            (self.center_x + width // 6, self.center_y - height // 4),   # 中上右
            (self.center_x - width // 6, self.center_y),                # 中心左
            (self.center_x + width // 4, self.center_y + height // 4),   # 中下右
            (self.center_x - width // 8, self.center_y + height // 2),   # 底部中
            (self.center_x - width // 3, self.center_y + height // 6),   # 中下左
            (self.center_x - width // 6, self.center_y - height // 6),   # 中上左
        ]
        draw.polygon(points, fill='black')
    
    def _draw_brain_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制大脑形状（焦虑/思考）"""
        brain_width = min(self.canvas_size) // 3
        brain_height = min(self.canvas_size) // 4
        
        # 大脑外轮廓 - 左半球
        left_hemisphere = [
            self.center_x - brain_width // 2,
            self.center_y - brain_height,
            self.center_x,
            self.center_y + brain_height
        ]
        draw.ellipse(left_hemisphere, fill='black')
        
        # 大脑外轮廓 - 右半球
        right_hemisphere = [
            self.center_x,
            self.center_y - brain_height,
            self.center_x + brain_width // 2,
            self.center_y + brain_height
        ]
        draw.ellipse(right_hemisphere, fill='black')
        
        # 添加大脑皱褶纹理
        for i in range(3):
            y_offset = self.center_y - brain_height // 2 + i * brain_height // 3
            draw.arc([
                self.center_x - brain_width // 3,
                y_offset - 10,
                self.center_x + brain_width // 3,
                y_offset + 10
            ], start=0, end=180, fill='white', width=3)
    
    def _draw_lightbulb_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制灯泡形状（想法/学习）"""
        bulb_radius = min(self.canvas_size) // 5
        
        # 灯泡主体 - 圆形
        bulb_body = [
            self.center_x - bulb_radius,
            self.center_y - bulb_radius,
            self.center_x + bulb_radius,
            self.center_y + bulb_radius // 2
        ]
        draw.ellipse(bulb_body, fill='black')
        
        # 灯泡底座 - 矩形
        base_width = bulb_radius
        base_height = bulb_radius // 3
        draw.rectangle([
            self.center_x - base_width // 2,
            self.center_y + bulb_radius // 2,
            self.center_x + base_width // 2,
            self.center_y + bulb_radius // 2 + base_height
        ], fill='black')
        
        # 灯丝 - 交叉线
        draw.line([
            self.center_x - bulb_radius // 3, self.center_y - bulb_radius // 3,
            self.center_x + bulb_radius // 3, self.center_y + bulb_radius // 3
        ], fill='white', width=2)
        draw.line([
            self.center_x + bulb_radius // 3, self.center_y - bulb_radius // 3,
            self.center_x - bulb_radius // 3, self.center_y + bulb_radius // 3
        ], fill='white', width=2)
    
    def _draw_wave_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制波浪形状（压力/波动）"""
        wave_width = min(self.canvas_size) // 2
        wave_height = min(self.canvas_size) // 6
        
        # 绘制多层波浪
        for wave_num in range(3):
            y_pos = self.center_y - wave_height + wave_num * wave_height
            points = []
            
            for x in range(0, wave_width, 10):
                wave_x = self.center_x - wave_width // 2 + x
                wave_y = y_pos + wave_height // 3 * np.sin(x * 2 * np.pi / (wave_width // 3))
                points.append((wave_x, wave_y))
            
            # 创建波浪形状的多边形
            if len(points) > 2:
                # 添加底部边界使其成为封闭形状
                points.extend([
                    (points[-1][0], y_pos + wave_height // 2),
                    (points[0][0], y_pos + wave_height // 2)
                ])
                draw.polygon(points, fill='black')
    
    def _draw_cloud_shape(self, draw: ImageDraw.Draw) -> None:
        """绘制云朵形状（中性/默认）"""
        cloud_radius = min(self.canvas_size) // 6
        
        # 云朵由多个圆形组成
        circles = [
            (self.center_x - cloud_radius, self.center_y, cloud_radius),
            (self.center_x + cloud_radius, self.center_y, cloud_radius),
            (self.center_x, self.center_y - cloud_radius // 2, cloud_radius * 1.2),
            (self.center_x - cloud_radius // 2, self.center_y + cloud_radius // 2, cloud_radius * 0.8),
            (self.center_x + cloud_radius // 2, self.center_y + cloud_radius // 2, cloud_radius * 0.8),
        ]
        
        for x, y, r in circles:
            draw.ellipse([
                x - r, y - r,
                x + r, y + r
            ], fill='black')
    
    def get_emotion_from_keywords(self, keywords: list) -> str:
        """根据关键词判断主导情绪"""
        if not keywords:
            return 'neutral'
        
        # 情绪关键词映射
        emotion_keywords = {
            'happy': ['开心', '快乐', '高兴', '兴奋', '愉快', '喜悦', '满足', '幸福'],
            'love': ['爱', '喜欢', '恋爱', '浪漫', '温暖', '关爱', '亲情'],
            'sad': ['难过', '伤心', '悲伤', '沮丧', '失落', '痛苦', '绝望'],
            'angry': ['愤怒', '生气', '烦躁', '恼火', '不满', '气愤', '怒火'],
            'anxious': ['焦虑', '紧张', '担心', '害怕', '恐惧', '不安', '忧虑'],
            'thinking': ['学习', '思考', '学业', '考试', '作业', '研究', '知识'],
            'stress': ['压力', '疲惫', '累', '忙碌', '紧张', '繁重', '负担']
        }
        
        # 统计各情绪的关键词出现次数
        emotion_scores = {}
        for emotion, emotion_words in emotion_keywords.items():
            score = sum(1 for keyword in keywords for emotion_word in emotion_words if emotion_word in keyword)
            if score > 0:
                emotion_scores[emotion] = score
        
        # 返回得分最高的情绪，如果没有匹配则返回neutral
        if emotion_scores:
            return max(emotion_scores, key=emotion_scores.get)
        else:
            return 'neutral'
    
    def save_mask_as_base64(self, mask: np.ndarray) -> str:
        """将蒙版保存为base64字符串"""
        image = Image.fromarray(mask, mode='L')
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        
        base64_string = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{base64_string}"


def test_shape_generator():
    """测试形状生成器"""
    generator = EmotionShapeGenerator()
    
    test_emotions = ['happy', 'love', 'sad', 'angry', 'anxious', 'thinking', 'stress', 'neutral']
    
    for emotion in test_emotions:
        mask = generator.generate_shape_mask(emotion)
        base64_mask = generator.save_mask_as_base64(mask)
        print(f"生成 {emotion} 形状蒙版，大小: {mask.shape}")
        print(f"Base64长度: {len(base64_mask)}")
        print()


if __name__ == "__main__":
    test_shape_generator()
