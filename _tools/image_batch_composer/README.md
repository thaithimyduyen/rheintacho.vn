# Ghép nền và resize ảnh hàng loạt

Tool Python có giao diện để chọn ảnh hoặc folder ảnh, ghép nền, resize vào khung cố định và xuất ra PNG/JPG/WEBP.

## Chạy nhanh trên Windows

1. Cài Python 3.10+ nếu máy chưa có: https://www.python.org/downloads/
2. Khi cài Python, tick **Add Python to PATH**.
3. Mở file `run_image_batch_composer.bat`.

Nếu muốn chạy bằng lệnh:

```powershell
cd "_tools\image_batch_composer"
py -m pip install -r requirements.txt
py image_batch_composer.py
```

## Chức năng chính

- Chọn nhiều ảnh, một folder, hoặc folder có sub-folder.
- Chọn folder output.
- Xuất giữ nguyên cấu trúc sub-folder hoặc gộp tất cả vào một folder.
- Ghép nền trắng, nền màu tự chọn, nền ảnh, hoặc giữ trong suốt.
- Tự co ảnh vào khung như `600x800`, `800x1000`, `1000x1000`, `1200x1200`, hoặc kích thước tự nhập.
- Tăng/giảm độ lớn ảnh trong khung bằng thanh kéo.
- Cắt viền trong suốt trước khi ghép để ảnh sản phẩm nằm gọn và cân hơn.
- Xuất `PNG`, `JPG`, `WEBP`, có chỉnh chất lượng cho JPG/WEBP.
- Có nút xem thử ảnh đầu tiên trước khi chạy hàng loạt.

## CSV chỉ định riêng từng ảnh

Nếu muốn một vài ảnh dùng nền/kích thước/định dạng khác, chọn file CSV ở mục **Chỉ định riêng**.

Các cột hỗ trợ:

- `image`: tên file, stem, hoặc đường dẫn tương đối, ví dụ `product.png` hoặc `folder-a/product.png`.
- `background`: `white`, `transparent`, mã màu như `#f4f4f4`, hoặc đường dẫn ảnh nền.
- `color`: mã màu nền, ví dụ `#ffffff`.
- `background_image`: đường dẫn ảnh nền.
- `scale`: độ lớn ảnh trong khung, ví dụ `90`.
- `canvas_width`, `canvas_height`: kích thước khung riêng.
- `format`: `PNG`, `JPG`, hoặc `WEBP`.
- `quality`: chất lượng 1-100.

Xem file mẫu: `background_map_example.csv`.

## Gợi ý dùng

- Ảnh PNG transparent nên bật **Cắt viền trong suốt trước khi đặt vào khung**.
- Nếu bán hàng online, thường dùng `800x1000` hoặc `1000x1000`, nền trắng, ảnh chiếm khoảng `85-95%`.
- Nếu không muốn giữ sub-folder, bỏ tick **Giữ nguyên cấu trúc sub-folder trong folder xuất**.
