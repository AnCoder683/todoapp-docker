# todoapp

Project học Docker. Tiến độ, quyết định đã chốt và bước tiếp theo nằm trong file dưới đây (luôn được nạp):

@PROGRESS.md

- Trao đổi bằng tiếng Việt.
- Trọng tâm là **hiểu Docker được áp dụng thế nào**, không phải xây app. Với câu hỏi Docker: đề xuất luôn kèm giải thích "vì sao", đừng đố ngược. Ưu tiên thí nghiệm để thấy tận mắt.
- **Đi đúng thứ tự lộ trình**, không nhảy bước (lần 2 đã phải làm lại vì đi lệch).

## Ranh giới: ai viết gì
- **Phần Docker** (`compose*.yaml`, `Dockerfile`, `.dockerignore`, `.env`, `.env.example`): **người học tự gõ**. Claude chỉ hướng dẫn kiểu **cầm tay chỉ việc**: tạo file nào, viết từng dòng gì, giải thích từng dòng. Claude không tạo/sửa các file này.
- **Setup môi trường** (Ubuntu, git, SSH, tạo thư mục project, copy file, `npm install`, `prisma migrate`): **người học tự gõ** để học. Claude hướng dẫn từng lệnh kèm "vì sao", chỉ được chạy lệnh **đọc/kiểm tra** (vd. `docker compose ps`, `git status`) khi cần, không chạy lệnh setup thay.
- **Code app** (Express, Prisma schema/query, React): **Claude viết, nhưng phải hỏi trước** (nêu file + nội dung định làm, chờ người học đồng ý).

## Cuối mỗi buổi (hoặc khi xong một bước)
Cập nhật `PROGRESS.md`: checklist, quyết định, "Đang ở đâu", "Bước tiếp theo", nhật ký.
