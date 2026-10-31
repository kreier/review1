import os
import base64
import weasyprint
import pypdfium2 as pdfium

def get_base64_image(path):
    mime = "image/jpeg"
    if path.endswith(".png"):
        mime = "image/png"
    with open(path, "rb") as f:
        return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"

# Images
IMG_ASSISTANT = get_base64_image("target/APEC_mat_kinh_cho_nguoi_khiem_thi/docs/screenshots/assistant.png")
IMG_SETTINGS = get_base64_image("target/APEC_mat_kinh_cho_nguoi_khiem_thi/docs/screenshots/settings.png")
IMG_LIDAR = get_base64_image("target/APEC_mat_kinh_cho_nguoi_khiem_thi/docs/VL53L9CX_ToF.jpg")

COMMON_CSS = """
@page {
    size: A4 portrait;
    margin: 6mm 7mm 6mm 7mm;
}
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}
body {
    font-family: 'DejaVu Sans', 'Ubuntu', sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.22;
    font-size: 7.4pt;
    -webkit-print-color-adjust: exact;
}

/* Header */
.header-table {
    width: 100%;
    background: linear-gradient(135deg, #091a36 0%, #112d4e 60%, #1e4976 100%);
    color: white;
    border-radius: 5px;
    padding: 8px 12px;
    margin-bottom: 6px;
    border-collapse: collapse;
}
.header-badge {
    display: inline-block;
    background: #0ea5e9;
    color: #ffffff;
    font-size: 6.2pt;
    font-weight: bold;
    padding: 1.5px 6px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}
.header-title {
    font-size: 14pt;
    font-weight: bold;
    letter-spacing: -0.2px;
    margin: 1px 0;
    color: #ffffff;
}
.header-subtitle {
    font-size: 7.8pt;
    color: #bae6fd;
    font-weight: 500;
}
.header-meta {
    font-size: 6.2pt;
    color: #cbd5e1;
    border-left: 1px solid rgba(255,255,255,0.25);
    padding-left: 8px;
    line-height: 1.35;
    text-align: right;
    vertical-align: middle;
    width: 195px;
}
.header-meta strong {
    color: #38bdf8;
}

/* Quick Metrics Ribbon */
.metrics-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 5px 0;
    margin-bottom: 6px;
}
.metric-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-top: 3px solid #0284c7;
    border-radius: 4px;
    padding: 3px 5px;
    text-align: center;
    width: 25%;
}
.metric-box.green { border-top-color: #10b981; }
.metric-box.purple { border-top-color: #8b5cf6; }
.metric-box.amber { border-top-color: #f59e0b; }
.metric-val {
    font-size: 9.8pt;
    font-weight: bold;
    color: #0f172a;
}
.metric-label {
    font-size: 5.8pt;
    color: #64748b;
    font-weight: bold;
    text-transform: uppercase;
}

/* Two-Column Layout using Table */
.layout-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 6px 0;
}
.col-cell {
    width: 50%;
    vertical-align: top;
    padding: 0;
}

/* Cards */
.card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
}
.card-header {
    border-bottom: 1.5px solid #f1f5f9;
    padding-bottom: 3px;
    margin-bottom: 4px;
}
.card-icon {
    display: inline-block;
    width: 14px;
    height: 14px;
    line-height: 14px;
    text-align: center;
    background: #0284c7;
    color: white;
    border-radius: 3px;
    font-size: 7.2pt;
    font-weight: bold;
    margin-right: 4px;
}
.card-title {
    font-size: 8.2pt;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
}

/* Typography & Lists */
p {
    margin-bottom: 3px;
    text-align: justify;
}
ul {
    list-style: none;
    padding-left: 0;
}
li {
    position: relative;
    padding-left: 9px;
    margin-bottom: 3px;
    text-align: justify;
    font-size: 7.0pt;
    line-height: 1.2;
}
li::before {
    content: "■";
    position: absolute;
    left: 0;
    top: 0;
    color: #0284c7;
    font-size: 4.5pt;
}
.feature-title {
    font-weight: bold;
    color: #0f172a;
}
.badge-tag {
    display: inline-block;
    background: #e0f2fe;
    color: #0369a1;
    font-size: 5.6pt;
    font-weight: bold;
    padding: 0.5px 3.5px;
    border-radius: 2px;
    margin-right: 2px;
}
.badge-tag.green { background: #dcfce7; color: #15803d; }
.badge-tag.amber { background: #fef3c7; color: #b45309; }
.badge-tag.purple { background: #f3e8ff; color: #7e22ce; }

/* Workflow Flowchart */
.flow-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    padding: 4px 6px;
    margin: 3px 0;
}
.flow-step {
    margin-bottom: 2.5px;
    font-size: 6.8pt;
    line-height: 1.2;
}
.flow-num {
    background: #0284c7;
    color: white;
    padding: 0.5px 3.5px;
    border-radius: 8px;
    font-size: 5.8pt;
    font-weight: bold;
    margin-right: 3px;
}

/* Visual Strip */
.visual-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 4px 0;
    margin: 3px 0;
}
.img-box {
    text-align: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    padding: 3px;
}
.img-box img {
    border-radius: 2px;
    border: 1px solid #cbd5e1;
    display: block;
    margin: 0 auto;
}
.img-caption {
    font-size: 5.6pt;
    color: #64748b;
    margin-top: 2px;
    font-weight: bold;
}

/* Architecture Table */
.spec-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 3px;
    font-size: 6.6pt;
}
.spec-table th, .spec-table td {
    padding: 2.5px 4px;
    border: 1px solid #e2e8f0;
    text-align: left;
}
.spec-table th {
    background: #f1f5f9;
    color: #334155;
    font-weight: bold;
}
.spec-table tr:nth-child(even) { background: #fafafa; }

/* Footer */
.footer-table {
    width: 100%;
    border-top: 1px solid #cbd5e1;
    padding-top: 3px;
    margin-top: 4px;
    font-size: 5.8pt;
    color: #64748b;
}
"""

HTML_EN = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>APEC Smart Glasses for the Visually Impaired</title>
<style>{COMMON_CSS}</style>
</head>
<body>

<!-- Header -->
<table class="header-table">
    <tr>
        <td style="vertical-align: middle;">
            <span class="header-badge">Assistive AI & Computer Vision Project</span>
            <div class="header-title">APEC SMART GLASSES FOR THE BLIND</div>
            <div class="header-subtitle">Real-Time Multimodal Vision AI, Local Vietnamese ASR & Tactile Accessibility</div>
        </td>
        <td class="header-meta">
            <div><strong>Repository:</strong> thanh1912-ut/APEC_mat_kinh...</div>
            <div><strong>Target SHA:</strong> d9ba1e0 (main)</div>
            <div><strong>Release:</strong> Android Pilot v0.4.0 (Code 8)</div>
            <div><strong>Core:</strong> Zipformer RNN-T + Gemini 3.8 Flash</div>
        </td>
    </tr>
</table>

<!-- Metrics Ribbon -->
<table class="metrics-table">
    <tr>
        <td class="metric-box">
            <div class="metric-val">&lt; 180 ms</div>
            <div class="metric-label">Local Speech STT Latency</div>
        </td>
        <td class="metric-box green">
            <div class="metric-val">100% Tactile</div>
            <div class="metric-label">Hardware Volume Key UX</div>
        </td>
        <td class="metric-box purple">
            <div class="metric-val">Zero Audio Leak</div>
            <div class="metric-label">Speech Stays On Server</div>
        </td>
        <td class="metric-box amber">
            <div class="metric-val">651 Test Cases</div>
            <div class="metric-label">322 Pytest + 329 Jest Suites</div>
        </td>
    </tr>
</table>

<!-- Main Body -->
<table class="layout-table">
    <tr>
        <!-- Left Column -->
        <td class="col-cell">
            <!-- Card 1 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">1</span>
                    <span class="card-title">Mission, Goals & Target Scope</span>
                </div>
                <p>
                    <strong>APEC Smart Glasses</strong> is an assistive intelligence platform engineered specifically for blind and visually impaired users. It removes visual dependency through audio-spatial reasoning and tactile controls.
                </p>
                <ul>
                    <li><span class="feature-title">True Non-Visual UX:</span> Eliminates error-prone touchscreens; maps interactions directly to hardware volume buttons and acoustic earcons.</li>
                    <li><span class="feature-title">Privacy-Preserving Speech:</span> Streaming speech-to-text runs locally via Zipformer; raw human voice audio is never transmitted to cloud APIs.</li>
                    <li><span class="feature-title">Appliance Guidance (v0.4.0):</span> Interactive tactile assistance to locate, identify, and verify buttons on remotes, ACs, and appliances.</li>
                    <li><span class="feature-title">Spatial Vision Roadmap:</span> Pre-engineered architecture to interface Direct Time-of-Flight (dToF) LiDAR for 3D hazard avoidance.</li>
                </ul>
            </div>

            <!-- Card 2 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">2</span>
                    <span class="card-title">System Architecture & Pipeline</span>
                </div>
                <div class="flow-container">
                    <div class="flow-step"><span class="flow-num">A</span><strong>Mobile Client:</strong> React Native / Expo captures rear camera JPEG (&le;1280px) and voice query in M4A/AAC via volume keys.</div>
                    <div class="flow-step"><span class="flow-num">B</span><strong>FastAPI Gateway:</strong> Validates SHA-256 Bearer Token, enforces 4 MiB limits, and queues into memory WorkGate (max 2 tasks).</div>
                    <div class="flow-step"><span class="flow-num">C</span><strong>Local ASR Worker:</strong> PyAV resamples audio to mono 16 kHz; sherpa-onnx runs Vietnamese Zipformer RNN-T in memory.</div>
                    <div class="flow-step"><span class="flow-num">D</span><strong>Vision Reasoning:</strong> JPEG image and text transcript queried to Gemini 3.8 Flash / 3.1 Flash Lite with <code>store=false</code>.</div>
                    <div class="flow-step"><span class="flow-num">E</span><strong>Speech Delivery:</strong> Structured JSON outputs read out via Android TTS and earcons without TalkBack clash.</div>
                </div>

                <table class="spec-table">
                    <tr><th>Component</th><th>Technology Stack</th><th>Key Specification</th></tr>
                    <tr><td>Mobile App</td><td>React Native / Expo 57, TS</td><td>Native Volume Key Module</td></tr>
                    <tr><td>Backend API</td><td>FastAPI, PyAV, Uvicorn</td><td>In-Memory Concurrency Gate</td></tr>
                    <tr><td>Local STT</td><td>sherpa-onnx (Zipformer)</td><td>51MB fp16 ONNX, ~60-180ms</td></tr>
                    <tr><td>Vision AI</td><td>Gemini 3.8 Flash / Lite</td><td>Structured JSON, store=false</td></tr>
                    <tr><td>Guidance DB</td><td>PostgreSQL + Redis</td><td>CAS Lock & Verification State</td></tr>
                </table>
            </div>
        </td>

        <!-- Right Column -->
        <td class="col-cell">
            <!-- Card 3 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">3</span>
                    <span class="card-title">Key Technical Implementations</span>
                </div>
                <ul>
                    <li>
                        <span class="badge-tag">UX</span><span class="feature-title">Hardware Volume Key Controls:</span>
                        Short-press <em>Volume Up</em> arms voice input (beeps and listens); second press captures image and sends request. Short-press <em>Volume Down</em> instantly stops speech readout or aborts pending requests. Long press preserves Android OS volume adjustments.
                    </li>
                    <li>
                        <span class="badge-tag green">PRIVACY</span><span class="feature-title">Local Streaming Speech Recognition:</span>
                        Integrates <code>hynt/Zipformer-30M-RNNT-Streaming-6000h</code>. Speech packets are processed in temporary RAM buffers; audio is deleted immediately after inference without disk retention.
                    </li>
                    <li>
                        <span class="badge-tag purple">AI AGENT</span><span class="feature-title">Verified Remote Appliance Guidance:</span>
                        Enforces tactile anchors and visual verification gates before guiding next steps (e.g. power button vs mode switch), avoiding hazardous AI hallucinations.
                    </li>
                    <li>
                        <span class="badge-tag amber">HARDWARE</span><span class="feature-title">ToF LiDAR Sensor Extension:</span>
                        STMicroelectronics VL53L9CX Direct Time-of-Flight sensor with 54&times;44 matrix (2,376 distance zones) for millimeter-level obstacle proximity mapping.
                    </li>
                </ul>
            </div>

            <!-- Card 4 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">4</span>
                    <span class="card-title">Engineering Rigor & Visual Assets</span>
                </div>
                <p style="font-size: 6.8pt; margin-bottom: 2px;">
                    <strong>Verification Suite:</strong> 322 automated Python tests (WebRTC, tokens, WorkGate) + 329 Jest mobile tests across 17 suites with zero regressions.
                </p>

                <!-- Visual Strip -->
                <table class="visual-table">
                    <tr>
                        <td class="img-box" style="width: 28%;">
                            <img src="{IMG_ASSISTANT}" style="height: 85px;" alt="Assistant UI">
                            <div class="img-caption">Assistant UI</div>
                        </td>
                        <td class="img-box" style="width: 28%;">
                            <img src="{IMG_SETTINGS}" style="height: 85px;" alt="Settings UI">
                            <div class="img-caption">Settings UI</div>
                        </td>
                        <td class="img-box" style="width: 44%;">
                            <img src="{IMG_LIDAR}" style="height: 85px; width: 100%; object-fit: cover;" alt="VL53L9CX LiDAR">
                            <div class="img-caption">VL53L9CX 2376-Zone ToF</div>
                        </td>
                    </tr>
                </table>

                <div style="font-size: 6.6pt; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 5px; border-radius: 3px; margin-top: 3px;">
                    <strong>Security Architecture:</strong> Zero API keys in client APK; tokens stored in Expo SecureStore with SHA-256 verification. Strict single-turn concurrency gate prevents server DoS.
                </div>
            </div>
        </td>
    </tr>
</table>

<!-- Footer -->
<table class="footer-table">
    <tr>
        <td><strong>APEC Assistive Technologies Project</strong> &bull; Open-Source Engineering for the Visually Impaired</td>
        <td style="text-align: right;">Target Commit: <code>d9ba1e0</code> &bull; Research &amp; Open Pilot &bull; A4 Poster Summary</td>
    </tr>
</table>

</body>
</html>
"""

HTML_VI = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>APEC Mắt Kính Cho Người Khiếm Thị</title>
<style>{COMMON_CSS}</style>
</head>
<body>

<!-- Header -->
<table class="header-table">
    <tr>
        <td style="vertical-align: middle;">
            <span class="header-badge">Dự Án Trí Tuệ Nhân Tạo & Thị Giác Hỗ Trợ</span>
            <div class="header-title">APEC MẮT KÍNH CHO NGƯỜI KHIẾM THỊ</div>
            <div class="header-subtitle">Thị Giác AI Đa Phương Thức, Nhận Diện Giọng Nói Cục Bộ & Tương Tác Phi Thị Giác</div>
        </td>
        <td class="header-meta">
            <div><strong>Mã nguồn:</strong> thanh1912-ut/APEC_mat_kinh...</div>
            <div><strong>Git SHA:</strong> d9ba1e0 (main)</div>
            <div><strong>Bản dựng:</strong> Android Pilot v0.4.0 (Code 8)</div>
            <div><strong>Cốt lõi:</strong> Zipformer RNN-T + Gemini 3.8 Flash</div>
        </td>
    </tr>
</table>

<!-- Metrics Ribbon -->
<table class="metrics-table">
    <tr>
        <td class="metric-box">
            <div class="metric-val">&lt; 180 ms</div>
            <div class="metric-label">Độ trễ nhận diện giọng nói</div>
        </td>
        <td class="metric-box green">
            <div class="metric-val">100% Xúc Giác</div>
            <div class="metric-label">Điều khiển phím âm lượng</div>
        </td>
        <td class="metric-box purple">
            <div class="metric-val">Bảo Mật Tuyệt Đối</div>
            <div class="metric-label">Audio không gửi lên đám mây</div>
        </td>
        <td class="metric-box amber">
            <div class="metric-val">651 Bài Test</div>
            <div class="metric-label">322 Pytest + 329 Jest Suites</div>
        </td>
    </tr>
</table>

<!-- Main Body -->
<table class="layout-table">
    <tr>
        <!-- Left Column -->
        <td class="col-cell">
            <!-- Card 1 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">1</span>
                    <span class="card-title">Sứ Mệnh, Mục Tiêu & Phạm Vi</span>
                </div>
                <p>
                    <strong>APEC Mắt Kính</strong> là nền tảng trợ năng thông minh được thiết kế chuyên biệt cho người khiếm thị, xóa bỏ hoàn toàn rào cản phụ thuộc vào thị giác bằng khả năng suy luận không gian âm thanh và phím bấm vật lý.
                </p>
                <ul>
                    <li><span class="feature-title">Tương Tác Phi Thị Giác:</span> Thay thế màn hình cảm ứng bằng phím bấm âm lượng vật lý và âm báo âm thanh (earcons) có tính định hướng.</li>
                    <li><span class="feature-title">Bảo Mật Giọng Nói Cục Bộ:</span> STT chạy trực tiếp bằng mô hình Zipformer; dữ liệu giọng nói thô không bao giờ truyền ra API đám mây.</li>
                    <li><span class="feature-title">Hướng Dẫn Remote (v0.4.0):</span> Hướng dẫn xúc giác từng bước giúp người khiếm thị định vị và bấm chính xác nút điều khiển từ xa.</li>
                    <li><span class="feature-title">Định Hướng Không Gian 3D:</span> Kiến trúc sẵn sàng giao tiếp cảm biến Direct ToF LiDAR phát hiện chướng ngại vật theo thời gian thực.</li>
                </ul>
            </div>

            <!-- Card 2 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">2</span>
                    <span class="card-title">Kiến Trúc Hệ Thống & Luồng Dữ Liệu</span>
                </div>
                <div class="flow-container">
                    <div class="flow-step"><span class="flow-num">A</span><strong>App Mobile:</strong> React Native / Expo chụp ảnh JPEG (&le;1280px) và ghi âm M4A/AAC qua phím âm lượng.</div>
                    <div class="flow-step"><span class="flow-num">B</span><strong>FastAPI Gateway:</strong> Xác thực SHA-256 Bearer Token, chặn request quá 4 MiB, điều phối qua WorkGate trong RAM.</div>
                    <div class="flow-step"><span class="flow-num">C</span><strong>Xử Lý Giọng Nói:</strong> PyAV đổi âm thanh sang mono 16 kHz; sherpa-onnx chạy Zipformer tiếng Việt trực tiếp trên CPU.</div>
                    <div class="flow-step"><span class="flow-num">D</span><strong>Suy Luận Thị Giác:</strong> Ảnh JPEG và câu hỏi được gửi đến Gemini 3.8 Flash / Lite với <code>store=false</code>.</div>
                    <div class="flow-step"><span class="flow-num">E</span><strong>Đọc Kết Quả:</strong> Phản hồi JSON có cấu trúc được phát qua TTS và âm báo, không xung đột với TalkBack.</div>
                </div>

                <table class="spec-table">
                    <tr><th>Thành Phần</th><th>Công Nghệ Cốt Lõi</th><th>Thông Số Kỹ Thuật</th></tr>
                    <tr><td>Ứng dụng Mobile</td><td>React Native / Expo 57, TS</td><td>Module phím bấm vật lý native</td></tr>
                    <tr><td>Máy chủ Backend</td><td>FastAPI, PyAV, Uvicorn</td><td>Cổng điều phối WorkGate trong RAM</td></tr>
                    <tr><td>Chép lời STT</td><td>sherpa-onnx (Zipformer)</td><td>ONNX fp16 51MB, ~60-180ms</td></tr>
                    <tr><td>Trí tuệ nhân tạo</td><td>Gemini 3.8 Flash / Lite</td><td>JSON có cấu trúc, store=false</td></tr>
                    <tr><td>Kho Tri Thức</td><td>PostgreSQL + Redis</td><td>Khóa CAS & Lưu trạng thái phiên</td></tr>
                </table>
            </div>
        </td>

        <!-- Right Column -->
        <td class="col-cell">
            <!-- Card 3 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">3</span>
                    <span class="card-title">Tính Năng Đột Phá & Kỹ Thuật</span>
                </div>
                <ul>
                    <li>
                        <span class="badge-tag">TRỢ NĂNG</span><span class="feature-title">Điều Khiển Phím Âm Lượng Xúc Giác:</span>
                        Nhấn ngắn <em>Tăng âm lượng</em> để mở nghe (phát âm báo); nhấn lần hai để chụp ảnh và gửi đi. Nhấn ngắn <em>Giảm âm lượng</em> để dừng đọc ngay lập tức hoặc hủy lượt. Giữ lâu phím vẫn chỉnh âm lượng Android bình thường.
                    </li>
                    <li>
                        <span class="badge-tag green">BẢO MẬT</span><span class="feature-title">Nhận Diện Giọng Nói Cục Bộ:</span>
                        Tích hợp <code>hynt/Zipformer-30M-RNNT-Streaming-6000h</code>. Gói âm thanh được xử lý trong RAM tạm thời và xóa sạch sau khi nhận diện, không ghi vết lên đĩa cứng.
                    </li>
                    <li>
                        <span class="badge-tag purple">AI AGENT</span><span class="feature-title">Hướng Dẫn Remote Có Xác Minh:</span>
                        Bắt buộc xác thực mốc sờ nắn và tem model trước khi cho phép tiến hành thao tác tiếp theo, ngăn ngừa rủi ro AI suy đoán sai lệch trên thiết bị điện gia dụng.
                    </li>
                    <li>
                        <span class="badge-tag amber">PHẦN CỨNG</span><span class="feature-title">Mở Rộng Cảm Biến ToF LiDAR:</span>
                        Cảm biến Direct Time-of-Flight STMicroelectronics VL53L9CX ma trận 54&times;44 (2.376 vùng đo khoảng cách) hỗ trợ đo độ sâu vật cản chính xác.
                    </li>
                </ul>
            </div>

            <!-- Card 4 -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">4</span>
                    <span class="card-title">Chất Lượng Kiểm Thử & Hình Ảnh Thực Tế</span>
                </div>
                <p style="font-size: 6.8pt; margin-bottom: 2px;">
                    <strong>Quy Chuẩn Kiểm Thử:</strong> Đạt 322 bài kiểm thử tự động pytest Python (WebRTC, token, WorkGate) + 329 bài Jest mobile qua 17 bộ test suites đạt 100%.
                </p>

                <!-- Visual Strip -->
                <table class="visual-table">
                    <tr>
                        <td class="img-box" style="width: 28%;">
                            <img src="{IMG_ASSISTANT}" style="height: 85px;" alt="Giao diện Trợ lý">
                            <div class="img-caption">Màn hình Trợ lý</div>
                        </td>
                        <td class="img-box" style="width: 28%;">
                            <img src="{IMG_SETTINGS}" style="height: 85px;" alt="Giao diện Cài đặt">
                            <div class="img-caption">Màn hình Cài đặt</div>
                        </td>
                        <td class="img-box" style="width: 44%;">
                            <img src="{IMG_LIDAR}" style="height: 85px; width: 100%; object-fit: cover;" alt="Cảm biến LiDAR">
                            <div class="img-caption">ToF LiDAR VL53L9CX</div>
                        </td>
                    </tr>
                </table>

                <div style="font-size: 6.6pt; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 5px; border-radius: 3px; margin-top: 3px;">
                    <strong>An Toàn Kiến Trúc:</strong> Tuyệt đối không lưu API key trong APK; Token Bearer lưu an toàn trong SecureStore với mã băm SHA-256. Cổng WorkGate chống cạn kiệt tài nguyên máy chủ.
                </div>
            </div>
        </td>
    </tr>
</table>

<!-- Footer -->
<table class="footer-table">
    <tr>
        <td><strong>Dự Án Công Nghệ Trợ Năng APEC</strong> &bull; Kỹ thuật nguồn mở vì cộng đồng người khiếm thị</td>
        <td style="text-align: right;">Commit mục tiêu: <code>d9ba1e0</code> &bull; Bản thử nghiệm nghiên cứu &bull; Poster Tóm Tắt Khổ A4</td>
    </tr>
</table>

</body>
</html>
"""

def generate_pdf(html_content, output_path):
    print(f"Generating PDF: {output_path}...")
    doc = weasyprint.HTML(string=html_content)
    doc.write_pdf(output_path)
    
    pdf = pdfium.PdfDocument(output_path)
    page_count = len(pdf)
    print(f"-> Generated {output_path} with {page_count} page(s).")
    
    preview_path = output_path.replace(".pdf", "_preview.png")
    page = pdf[0]
    img = page.render(scale=2).to_pil()
    img.save(preview_path)
    print(f"-> Saved preview image: {preview_path}")
    return page_count

with open("posters/poster_en.html", "w", encoding="utf-8") as f:
    f.write(HTML_EN)
with open("posters/poster_vi.html", "w", encoding="utf-8") as f:
    f.write(HTML_VI)

p1 = generate_pdf(HTML_EN, "posters/APEC_Smart_Glasses_Poster_EN.pdf")
p2 = generate_pdf(HTML_VI, "posters/APEC_Mat_Kinh_Poster_VI.pdf")

import shutil
shutil.copy("posters/APEC_Smart_Glasses_Poster_EN.pdf", "APEC_Smart_Glasses_Poster_EN.pdf")
shutil.copy("posters/APEC_Mat_Kinh_Poster_VI.pdf", "APEC_Mat_Kinh_Poster_VI.pdf")
print("PDFs updated and copied to root successfully!")
