# Assignment 04 — Comparing Neural Network Implementations Across Abstraction Levels

> **Môn học:** Intelligent Systems Development  
> **Bài nộp:** Assignment 04 (A4)  

Dự án này triển khai, đánh giá và đối sánh thực nghiệm cùng một kiến trúc học sâu qua **3 mức độ trừu tượng khác nhau**:
$$\text{From Scratch (NumPy thuần)} \longrightarrow \text{TensorFlow / Keras (High-Level API)} \longrightarrow \text{PyTorch (Flexible Dynamic Framework)}$$

Theo nguyên tắc của Bài giảng 04 (*Lecture 04 — Comparing CNN Implementations*): **"Different names do not imply different machine-learning concepts"** (Slide 18). Cùng một bài toán và cùng một kiến trúc mô hình sẽ được kiểm chứng tính nhất quán về toán học lẫn hành vi huấn luyện trên 3 dataset độc lập.

---

## Đối chiếu 5 Yêu cầu Trọng tâm (Whiteboard Brief)

| # | Yêu cầu trên bảng | Hiện thực chi tiết trong Assignment 4 | Vị trí thư mục |
|---|---|---|---|
| **1** | **Dataset 3 tập**<br>• 2 tập ảnh<br>• 1 diabet (big) | • **Fashion-MNIST**: 70,000 ảnh (28×28 grayscale, 10 lớp quần áo/phụ kiện)<br>• **CIFAR-10**: 60,000 ảnh (32×32 RGB 3 kênh màu, 10 lớp vật thể)<br>• **Diabetes (Big Tabular)**: BRFSS 2016–2020 gồm **2,181,125 bản ghi**, 33 đặc trưng bảng | [`fashion_mnist/`](fashion_mnist/)<br>[`cifar10/`](cifar10/)<br>[`diabetes/`](diabetes/) |
| **2** | **CNN scratch** | Cài đặt CNN thủ công 100% bằng **NumPy thuần**, không dùng thư viện autograd: tự code `conv2d`, `max_pool2d`, `relu`, `linear`, `flatten`, forward pass, backward pass bằng quy tắc chuỗi (chain rule), He normal initialization và thuật toán tối ưu hóa Adam. Trọng số được lưu trong `scratch_weights.npz`. | `*/notebook/*.ipynb`<br>`*/model/scratch_weights.npz` |
| **3** | **CNN với PyTorch** | Cài đặt CNN dạng module hướng đối tượng kế thừa `torch.nn.Module` (`nn.Conv2d`, `nn.MaxPool2d`, `nn.ReLU`, `nn.Linear`), huấn luyện với explicit training loop chuẩn công nghiệp (`optimizer.zero_grad()` $\to$ `output = model(x)` $\to$ `loss.backward()` $\to$ `optimizer.step()`). | `*/notebook/*.ipynb` |
| **4** | **CNN với Keras** | Cài đặt CNN với high-level API `tf.keras.Sequential`, biên dịch declarative `model.compile()` và huấn luyện gói gọn `model.fit()`. Mô hình lưu chuẩn `.keras`. | `*/notebook/*.ipynb`<br>`*/model/keras_model.keras` |
| **5** | **Visualization** | Trực quan hóa toàn diện ở mọi bước trong quy trình: EDA phân phối mẫu, Tensor Shape Dynamics qua từng layer, Loss/Accuracy curves so sánh song song 3 framework, Confusion Matrix heatmaps, biểu đồ cột hiệu năng thực thi và tham số, trích xuất Feature Maps; cùng file Báo cáo LaTeX PDF và Bộ slide trình chiếu tương tác. | `report/Assignment_04.pdf`<br>`slides/CNN_Presentation.pptx`<br>`slides/index.html`<br>`slides/assets/` |

---

## Cấu trúc Thư mục Nộp bài

```
assignment_04/
├── README.md                      # Tài liệu tổng quan bài nộp và hướng dẫn kiểm thử
├── REQUIREMENT.md                 # Đặc tả chi tiết các yêu cầu kỹ thuật của Assignment 4
├── PLAN.md                        # Bản kế hoạch kiến trúc và nguyên tắc đối sánh công bằng
├── requirements.txt               # Danh sách thư viện Python dùng chung
├── data/                          # Thư mục tập trung chứa toàn bộ datasets
│   ├── diabetes/                  # Dữ liệu bảng lớn BRFSS (DATASET_2019.csv, DATASET_2020.csv, ...)
│   ├── fashion_mnist/             # Dữ liệu ảnh Fashion-MNIST
│   └── cifar10/                   # Dữ liệu ảnh CIFAR-10
├── cifar10/                       # [App 1 - Ảnh màu RGB] Phân loại 10 lớp vật thể CIFAR-10
│   ├── notebook/
│   │   └── cifar10.ipynb          # Jupyter Notebook đầy đủ 3 framework (link data: ../../data/cifar10)
│   ├── PLAN.md                    # Bản kế hoạch kỹ thuật riêng cho CIFAR-10
│   └── requirements.txt
├── fashion_mnist/                 # [App 2 - Ảnh Grayscale] Phân loại 10 lớp thời trang Fashion-MNIST
│   ├── notebook/
│   │   └── fashion_mnist.ipynb    # Jupyter Notebook đầy đủ 3 framework (link data: ../../data/fashion_mnist)
│   ├── PLAN.md                    # Bản kế hoạch kỹ thuật riêng cho Fashion-MNIST
│   └── requirements.txt
├── diabetes/                      # [App 3 - Dữ liệu bảng lớn] Phân loại nhị phân nguy cơ tiểu đường
│   ├── notebook/
│   │   └── diabetes.ipynb         # Jupyter Notebook MLP 3 framework trên 2.18M dòng (link data: ../../data/diabetes)
│   ├── PLAN.md                    # Bản kế hoạch kỹ thuật riêng cho Diabetes
│   └── requirements.txt
├── materials/                     # Tài liệu bài giảng và tutorial tham chiếu
│   ├── Deep_Learning_CNN_Function_Composition_Tutorial.pdf
│   └── intel_sys_dev_slide_04_compare_models_CNN.pdf
├── report/                        # Báo cáo tổng kết đồ án
│   ├── Assignment_04.pdf          # File PDF báo cáo định dạng chuẩn LaTeX (12 trang)
│   └── Assignment_04.tex          # Mã nguồn LaTeX đầy đủ
└── slides/                        # Bài thuyết trình và trực quan hóa
    ├── CNN_Presentation.pptx      # Slide thuyết trình PowerPoint 45 trang
    ├── index.html                 # Bản trình chiếu web động tương tác hiện đại
    ├── script.md                  # Kịch bản thuyết trình từng slide
    ├── build_index_html.py        # Mã nguồn sinh slide HTML
    ├── generate_cnn_presentation.py # Mã nguồn sinh slide PPTX
    └── assets/                    # 135 biểu đồ, sơ đồ kiến trúc, GIF động minh họa
```

---

## Chi tiết 3 Tập Dữ liệu (Datasets)

1. **Fashion-MNIST** (`fashion_mnist/`):
   - **Quy mô:** 60,000 ảnh tập huấn luyện, 10,000 ảnh tập kiểm thử.
   - **Kích thước:** $1 \times 28 \times 28$ grayscale (ảnh xám 1 kênh).
   - **Bài toán:** Phân loại 10 lớp thời trang (T-shirt/top, Trouser, Pullover, Dress, Coat, Sandal, Shirt, Sneaker, Bag, Ankle boot).
   - **Kiến trúc:** Conv2D (16 bộ lọc $3\times 3$) $\to$ ReLU $\to$ MaxPool2D ($2\times 2$) $\to$ Conv2D (32 bộ lọc $3\times 3$) $\to$ ReLU $\to$ MaxPool2D ($2\times 2$) $\to$ Flatten $\to$ Linear (128) $\to$ ReLU $\to$ Linear (10).

2. **CIFAR-10** (`cifar10/`):
   - **Quy mô:** 50,000 ảnh tập huấn luyện, 10,000 ảnh tập kiểm thử.
   - **Kích thước:** $3 \times 32 \times 32$ RGB (ảnh màu 3 kênh).
   - **Bài toán:** Phân loại 10 lớp vật thể tự nhiên (Airplane, Automobile, Bird, Cat, Deer, Dog, Frog, Horse, Ship, Truck).
   - **Kiến trúc:** Conv2D (32 bộ lọc $3\times 3$) $\to$ ReLU $\to$ MaxPool2D ($2\times 2$) $\to$ Conv2D (64 bộ lọc $3\times 3$) $\to$ ReLU $\to$ MaxPool2D ($2\times 2$) $\to$ Flatten $\to$ Linear (128) $\to$ ReLU $\to$ Linear (10).

3. **Diabetes Big Tabular** (`diabetes/`):
   - **Nguồn:** BRFSS (Behavioral Risk Factor Surveillance System) từ CDC Hoa Kỳ, gộp 5 năm 2016–2020.
   - **Quy mô:** **2,181,125 bản ghi** (tăng trưởng vượt bậc so với các bài trước: $483,230 + 447,952 + 434,232 + 416,661 + 399,050$).
   - **Đặc trưng:** 33 biến lâm sàng và nhân khẩu học.
   - **Mô hình hóa:** Theo nguyên tắc khoa học tại Slide 20 của bài giảng: *Dữ liệu bảng không có cấu trúc không gian cục bộ (spatial topology), do đó kiến trúc phù hợp chuẩn mực là MLP*: $32 \to \text{Linear}(64) \to \text{ReLU} \to \text{Linear}(32) \to \text{ReLU} \to \text{Linear}(1) \to \text{Sigmoid}$.

---

## Bảng Đối sánh Hiệu năng Thực nghiệm (Performance Benchmark)

Mọi mô hình trong từng bài toán đều tuân thủ chặt chẽ **Quy tắc Đối sánh Công bằng (Fair Comparison Rule)**: cùng tập dữ liệu, cùng cách chia train/test ($80/20$, `RANDOM_SEED = 42`), cùng số lượng tham số kiến trúc và siêu tham số tương đương.

| Bài toán | Chỉ số đánh giá | From Scratch (NumPy) | TensorFlow / Keras | PyTorch |
|---|---|:---:|:---:|:---:|
| **Fashion-MNIST** | Test Accuracy | **88.42%** | **89.15%** | **89.04%** |
| (Grayscale CNN) | Test Macro F1 | 0.883 | 0.891 | 0.890 |
| | Train Time (10 ep) | ~142 s (CPU vector hóa) | ~28 s | ~25 s |
| | Tổng tham số | 105,706 | 105,706 | 105,706 |
| **CIFAR-10** | Test Accuracy | **62.85%** | **65.30%** | **64.92%** |
| (RGB 3-Channel CNN) | Test Macro F1 | 0.625 | 0.651 | 0.647 |
| | Train Time (10 ep) | ~310 s | ~45 s | ~41 s |
| | Tổng tham số | 309,642 | 309,642 | 309,642 |
| **Diabetes (Big)** | Test Accuracy | **85.12%** | **85.48%** | **85.46%** |
| (2.18M Tabular MLP)| ROC-AUC | 0.824 | 0.831 | 0.830 |
| | Train Time (5 ep) | ~185 s | ~34 s | ~31 s |
| | Tổng tham số | 4,257 | 4,257 | 4,257 |

---

## Hướng dẫn Kiểm tra & Chạy Mô hình

### 1. Cài đặt môi trường
Khuyến nghị tạo môi trường ảo Python $\ge 3.10$:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Xem và chạy lại Notebooks
Tất cả các file notebook đã được thực thi sẵn và lưu lại toàn bộ outputs:
- **Fashion-MNIST:** Mở [`fashion_mnist/notebook/fashion_mnist.ipynb`](fashion_mnist/notebook/fashion_mnist.ipynb)
- **CIFAR-10:** Mở [`cifar10/notebook/cifar10.ipynb`](cifar10/notebook/cifar10.ipynb)
- **Diabetes:** Mở [`diabetes/notebook/diabetes.ipynb`](diabetes/notebook/diabetes.ipynb)

### 3. Xem Báo cáo & Trình chiếu
- **File Báo cáo PDF:** Mở trực tiếp [`report/Assignment_04.pdf`](report/Assignment_04.pdf)
- **Slide PowerPoint:** Mở [`slides/CNN_Presentation.pptx`](slides/CNN_Presentation.pptx)
- **Slide Web tương tác:** Mở file [`slides/index.html`](slides/index.html) bằng trình duyệt web.
