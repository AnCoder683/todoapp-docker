# Tiến độ: Học Docker qua Todo App (lần 3: làm lại từ đầu, đi đúng lộ trình)

> File này ghi lại tiến độ để các session sau đọc và làm tiếp.
> Cập nhật cuối mỗi buổi: đánh dấu checklist, ghi quyết định mới, ghi bước tiếp theo.
> **Lần 1** (2026-10-13 → 10-15) ở repo cũ `D:\todoapp` (Windows), nhật ký ở `docs/lan-1/PROGRESS.md` của repo đó.
> **Lần 2** (2026-10-16 buổi sáng) trên Ubuntu: đi lệch lộ trình (compose trước Dockerfile) → **xoá sạch, làm lại từ đầu** (xem nhật ký).

## Mục tiêu
Tự build một app đơn giản để **thấy Docker được dùng thế nào** trong quy trình dev → build → production, rồi **deploy công khai lên VPS** làm portfolio (link demo + repo có README, CI).
Không cần app xịn.

**Nguyên tắc:** học ngay trên app, **chỉ cần Docker** (máy không cài Node), dev **trong container**, **một Dockerfile nhiều target** (dev/prod). Mỗi khái niệm thử bằng lệnh `docker` trước, rồi mới viết gọn bằng compose.

## Cách làm việc
- **Phần Docker + setup**: người học tự gõ. Claude hướng dẫn **cầm tay chỉ việc**: tạo file nào, từng dòng viết gì kèm giải thích.
- **Code app** (Express, Prisma schema/query, React): **Claude viết, nhưng phải hỏi trước** (nêu file + nội dung định làm, chờ đồng ý). Người học đọc lại, hỏi chỗ chưa hiểu.
- **Trọng tâm là HIỂU Docker, không phải xây app.** Với câu hỏi về Docker, Claude **đề xuất luôn kèm giải thích "vì sao"**, không đố ngược lại. Ưu tiên thí nghiệm để *thấy tận mắt*.
- **Có nhiều cách làm thì Claude nêu ra hết + cách đề xuất** ngay từ đầu.
- **Đi đúng thứ tự**, không nhảy bước.
- **Luật qua chặng:** chạy được **và** tự trả lời được các câu "Tự kiểm tra" (không nhìn tài liệu) thì mới sang chặng sau. Trả lời sai → Claude giải thích, làm lại thí nghiệm liên quan.
- Có thể làm thẻ Anki cho các câu "Tự kiểm tra" (skill `anki`) để ôn giữa các buổi.

## Môi trường
- **Ubuntu cài thẳng** (không WSL), máy Nitro AN515-56, user `antran`. Project ở **`~/workspace/todoapp`**.
- **Docker Engine 29.9 + Compose v5.6**, user `antran` đã ở nhóm `docker` (không cần `sudo`).
- **Chỉ cần Docker**: máy không cài Node. Mọi lệnh `npm`/`npx` chạy trong container. Trước khi có service `backend` trong compose, dùng mẫu:
  ```
  docker container run --rm -u "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:24-alpine <lệnh>
  ```
  - `-u` để file sinh ra thuộc `antran`, không phải root. Thêm `--network <tên mạng>` khi lệnh cần gọi `db` (vd. `prisma migrate`).

## Stack và kiến trúc
- **frontend**: React (Vite) · **backend**: Express 5 + **Prisma 7** · **db**: Postgres 17

```
DEV (máy mình)                         PROD (máy mình ở chặng C, VPS ở chặng D)
browser                                browser
  ├─ :5173 → frontend (target: dev)      └─ :80/:443 → frontend (target: runtime = nginx)
  └─ :3000 → backend  (target: dev)                      ├─ /     → file tĩnh React đã build
              └─ db (Postgres)                           └─ /api  → backend (target: runtime)
                                                                     └─ db (Postgres + volume)
```

Mỗi app có **một** `Dockerfile` nhiều stage (`base`, `deps`, `build`, `dev`, `prod-deps`, `runtime`; giống cấu trúc Epic Stack):
```
backend/Dockerfile                               ──► FROM (đứng trên)   ┄┄► COPY --from (lấy đồ)
  base ──► deps ──► build ──► dev                 base: node:24-alpine + WORKDIR, đổi version ở MỘT chỗ
    │      npm ci   prisma    (compose: target: dev)
    │      (đủ)     generate
    │                 ┆ generated/prisma
    ├──► prod-deps    ┆
    │    npm ci --omit=dev
    │        ┆ node_modules
    └──► runtime ◄┄┄┄┘                           stage cuối = mặc định = prod
frontend/Dockerfile
  base ──► deps ──► dev                           (Vite dev server)
             └────► build ┄┄ dist ┄┄► runtime     runtime FROM nginx (không cần Node)
```
- `deps` = cài **đủ** (dependencies + devDependencies); `prod-deps` = chỉ dependencies.
- `build` = bước biến đổi (backend: `prisma generate`; frontend: `npm run build`).
- **Prisma 7**: client sinh ra ở `backend/generated/prisma/` (file `.ts`, Node 24 chạy thẳng được nhờ type stripping), **không** nằm trong `node_modules/.prisma` như Prisma 6. `migrate dev` **không tự generate**.
- Bài học từ lần 2: `prisma init` của Prisma 7 sinh ra `prisma7.config.ts` → phải đổi tên thành `prisma.config.ts` (CLI chỉ tìm tên này), và tạo thêm thư mục rỗng `.claude/`, `.windsurf/` (xoá đi).

## Hiện trạng project
```
todoapp/
├── .git/         # repo rỗng, chưa có commit (có thể xoá để tự git init ở 0.8)
├── CLAUDE.md
└── PROGRESS.md
```
Docker: không còn container/volume/mạng nào của todoapp.

## Chặng 0: Setup
- [x] **0.1 Docker trên Ubuntu**: Docker Engine + Compose chạy, user trong nhóm `docker`.
- [x] **0.2 Ubuntu cơ bản.** User thường vs `sudo`, cây thư mục, `ls -la`, quyền file (`rwx`, chủ sở hữu, UID/GID). Phần 3 (`mkdir`/`cp -r`/`mv`/`rm`) **bỏ qua** theo yêu cầu, học dần khi dùng.
- [x] **0.3 Git + SSH.** **Học SSH từ số 0** theo 7 bài (dưới); đã học lại từ đầu ngày 2026-10-20, xong Bài 1–4 + câu 5. Xong SSH mới làm `git config --global user.name/user.email` (email noreply GitHub, `init.defaultBranch main`).
  - SSH, nguồn chính thức: GitHub Docs (tạo key, test kết nối, fingerprint), RFC 4252 §7, SSH Academy.
  - **Mức sâu (2026-10-21):** người học hỏi "có cần biết hết đống này không" → chỉ dạy mức khái niệm (DH = ống kín; chữ ký + máy soi biết trước = biết đầu kia là ai; MITM; 2 lần so ở bước ②: so key với `known_hosts` rồi mới kiểm chữ ký). Toán bên trong (Schnorr, `S = r + H·a`) chỉ là đọc thêm, nói rõ là tuỳ chọn.
  - Ẩn dụ khi dạy (sửa 2026-10-20): private key = **con dấu biến hình** (ngăn kéo khoá bằng passphrase), public key = **máy soi** (bật đèn xanh/đỏ), chữ ký = **hoa văn**, mỗi tờ giấy (session ID) một hoa văn khác. **Bỏ tên "mẫu dấu"**: nó làm người học tưởng chữ ký trông giống public key và lấy được public key từ chữ ký. Fingerprint = số seri máy soi. Widget: https://claude.ai/artifact/GjjDk14xEk7LpheabjkVgo. ed25519 là **ký**, không phải mã hoá. Bài viết kiểu "server mã hoá, client giải mã" là cách cũ (SSH-1/RSA), cùng ý tưởng.
  - Máy: OpenSSH 10.2, ssh-agent của GNOME chạy sẵn (`SSH_AUTH_SOCK=/run/user/1000/gcr/ssh`), chưa cài openssh-server. Ubuntu bật sẵn `HashKnownHosts` (tên host trong `known_hosts` bị băm `|1|...`) và `UpdateHostKeys` (sau khi xác minh, tự lưu thêm host key RSA/ECDSA của server).
  - **Key hiện tại (2026-10-20):** `~/.ssh/id_ed25519`, có passphrase, fingerprint `SHA256:0IGPGE...`, ghi chú `antran`. Trên GitHub (tài khoản `AnCoder683`) title `antran-nitro`, loại Authentication. Không tick "Automatically unlock" của GNOME (để học Bài 5).
  - [x] Bài 1: SSH là gì, 3 bước một lần kết nối (① Diffie-Hellman dựng ống mã hoá, ẩn dụ pha màu; ② host key server; ③ user key ký lên session id → không replay). Thí nghiệm: `ssh-keygen -t ed25519 -C "antran-nitro"` (đặt passphrase), `ls -la ~/.ssh`, `cat ~/.ssh/id_ed25519.pub`. Tự kiểm tra 4 câu: câu 1, 2 đúng; câu 4 đúng nửa (đã giải thích `UNPROTECTED PRIVATE KEY FILE`); câu 3 (vì sao không replay được) trả lời lại đúng: session ID mỗi phiên khác nhau.
  - [x] Bài 2: fingerprint, `ssh-keygen -lf ~/.ssh/id_ed25519.pub`.
  - [x] Bài 3: dán `.pub` lên GitHub, `ssh -T git@github.com`, so fingerprint host (`SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU`), `known_hosts`. Đã làm trọn từ số 0 (xoá key + known_hosts, tạo lại, TOFU gõ `yes`, lần 2 không hỏi gì). Câu 5 (`REMOTE HOST IDENTIFICATION HAS CHANGED!`) **đã trả lời đúng** (2026-10-21): host key khác `known_hosts` → MITM hoặc host thay key → so fingerprint qua kênh tin cậy; trùng thì `ssh-keygen -R <host>`, không trùng thì dừng.
  - [x] Thí nghiệm (cho câu 4 Bài 1): `chmod 644 ~/.ssh/id_ed25519` → `ssh -T` bị từ chối → `chmod 600` lại. Kết quả (2026-10-21): không ra `UNPROTECTED PRIVATE KEY FILE` mà ra `signing failed ... from agent: agent refused operation` (agent GNOME nạp key qua `ssh-add`, `ssh-add` từ chối file 644). Muốn thấy thông báo kinh điển: `ssh -o IdentityAgent=none -T git@github.com` (tuỳ chọn).
  - [x] Bài 4: `ssh -vT git@github.com`, đọc cuộc trò chuyện. Đã khoanh từng dòng `debug1` vào 0 → ① (`kex`, `mlkem768x25519` = X25519 + ML-KEM chống lượng tử) → ② (`Found key in known_hosts:1`) → `NEWKEYS` → ③ (`Offering`/`Server accepts`) → 4 (`Exit status 1` là bình thường với GitHub). **Phát hiện:** agent còn giữ key cũ `tFwl...` dù file đã `rm` → `ssh-add -D` → agent GNOME tự nạp lại key từ đĩa, chỉ còn `0IGPGE...`. Bài học: thu hồi key phải làm ở 3 nơi (file, agent, server).
  - [x] Bài 5 (**rút gọn** 2026-10-21 theo yêu cầu): passphrase khoá file key trên đĩa, không rời máy; agent = thư ký giữ key đã mở khoá trong RAM, `ssh` nhờ ký qua `SSH_AUTH_SOCK`, không lộ key; `ssh-add -l`. Không làm thí nghiệm, không thi.
  - Bài 6 (`~/.ssh/config`) và Bài 7 (`authorized_keys`) **dời sang D1** (2026-10-21): chỉ có ý nghĩa khi có VPS thật; học đúng lúc dùng. Mức SSH cần: dùng được + gỡ lỗi thường gặp, không cần bên trong.
  - `git config` xong (2026-10-21): `user.email=119518114+AnCoder683@users.noreply.github.com` (Claude chạy giúp theo yêu cầu), GitHub bật "Keep my email addresses private" + "Block command line pushes that expose my email".
  - Đã kiểm tra (2026-10-21): `.pub` trùng `github.com/AnCoder683.keys`, `known_hosts` có 3 host key GitHub đúng fingerprint, `ssh -T` OK.
- [ ] **0.4 Repo.** `git init`, `.gitignore`, `.gitattributes` (`* text=auto eol=lf`), commit đầu (`CLAUDE.md`, `PROGRESS.md`), tạo repo GitHub mới, `git remote add origin ...`, `git push -u origin main`.

Tự kiểm tra 0:
1. `sudo` để làm gì? Vì sao không làm việc hằng ngày bằng root?
2. Linux xác định chủ file bằng tên hay bằng số (UID/GID)? `ls -la` cho biết gì?
3. SSH key: file nào giữ bí mật, file nào dán lên GitHub?

## Lộ trình

### Chặng A: Dev trong container
- [ ] **A0. Khung backend (chạy bằng container tạm).** Người học: `mkdir backend`, `npm init -y`, `npm install express@5` qua `docker container run --rm -u ... -v ... -w ...` (vì sao cần `-u`, vì sao cờ phải đứng trước tên image). Claude (hỏi trước): `src/index.js` với `GET /api/health`, bắt SIGTERM. Chạy thử bằng `docker container run ... -p 3000:3000 node:24-alpine node src/index.js`.
- [ ] **A1. Dockerfile đầu tiên.** `backend/Dockerfile` stage `base` + `deps` + `dev` (thêm `build` khi có Prisma ở A3); `backend/.dockerignore` (`node_modules`, `generated`, `.env`). `docker build --target dev -t todo-api:dev ./backend`. Học: build context, `.dockerignore`, **cache layer** (sửa `src` → chỉ `COPY . .` chạy lại; sửa `package.json` → `npm ci` chạy lại), `docker history`, exec form vs shell form, `FROM ... AS`, `--target`.
- [ ] **A2. Postgres bằng `docker run`.** `postgres:17-alpine`, `-e POSTGRES_*`, named volume `pgdata`, `psql` qua `docker exec`. Thí nghiệm: xoá container rồi chạy lại → dữ liệu còn; đổi `POSTGRES_PASSWORD` sau khi có dữ liệu → không tác dụng (vì sao).
- [ ] **A3. Network + Prisma.** `docker network create todo-net`, chạy db và backend chung mạng, gọi `db:5432`. Thí nghiệm: dùng `localhost` → lỗi; mạng `bridge` mặc định không gọi nhau bằng tên được. Rồi: cài Prisma 7, model `Todo`, `migrate dev --name init` + `prisma generate`; Claude (hỏi trước) viết API todos. Thêm stage `build` vào Dockerfile.
- [ ] **A4. Hot reload.** Bind mount `-v "$PWD/backend":/app` + volume ẩn danh `-v /app/node_modules` (che / không che). `node --watch` tự restart khi sửa file.
- [ ] **A5. Compose.** Viết lại A2–A4 thành `compose.yaml`: `db` (healthcheck `pg_isready -h 127.0.0.1`, `$$`, cổng `127.0.0.1:5432:5432`, volume) + `backend` (`build: target: dev`, `depends_on: condition: service_healthy`, `DATABASE_URL` qua `environment`). **Một `.env` ở gốc** + `.env.example`. `down` vs `down -v`. So sánh với các lệnh `docker` đã gõ.
- [ ] **A6. Service `frontend`.** `frontend/Dockerfile` stage `base` + `deps` + `dev` (`--host`), `.dockerignore`; compose: proxy `/api` tới `http://backend:3000`, bind mount + volume ẩn danh.
- [ ] **A7. Vòng đời dev.** `docker compose exec backend npx prisma migrate dev` + `prisma generate`; thêm thư viện bằng `exec ... npm install` rồi `up -d --build -V`.
- [ ] **A8. Dev Containers** (tuỳ chọn): `.devcontainer/devcontainer.json` trỏ vào service backend.

Tự kiểm tra A:
1. Image và container khác nhau thế nào? `docker build .` không có `--target` thì ra stage nào?
2. Vì sao `COPY package*.json` + `RUN npm ci` **trước** `COPY . .`?
3. `FROM build AS dev` (đứng trên) khác `FROM base` + `COPY --from=build` (lấy đồ) thế nào? Vì sao có stage `base`?
4. `-p 127.0.0.1:5432:5432`: từng phần nghĩa là gì? Vì sao app trong container phải nghe `0.0.0.0` (`--host`)?
5. Biến `POSTGRES_*` có tác dụng lúc nào? Vì sao ghi rõ `postgres:17-alpine`?
6. Named volume, bind mount, volume ẩn danh: mỗi loại dùng khi nào? "Che" là gì?
7. Trong container backend, `localhost:5432` trỏ đi đâu? Vì sao gọi được `db:5432`? Vì sao container chạy bằng `docker container run` phải thêm `--network ...`?
8. Vì sao thêm thư viện phải `up -d --build -V`? Vì sao `migrate dev` xong phải `prisma generate` (Prisma 7)?
9. `$$` trong healthcheck của compose nghĩa là gì?
10. Máy không cài Node thì VS Code gợi ý code bằng cách nào?

### Chặng B: Image prod
- [ ] B1. `prod-deps` + `runtime` (`FROM base`) trong `backend/Dockerfile`: `npm ci --omit=dev`, `COPY --from` lấy `node_modules` từ `prod-deps` + `generated/` từ `build`, `NODE_ENV=production`, `USER node`, `CMD ["node", "src/index.js"]`. `runtime` để **cuối file**.
- [ ] B2. `build` (`npm run build`) + `runtime` (`FROM nginx`, phục vụ `dist`, proxy `/api`) trong `frontend/Dockerfile`, file `nginx.conf`.
- [ ] B2b. Cache mount `RUN --mount=type=cache,target=/root/.npm npm ci`.
- [ ] B3. So kích thước dev vs prod (`docker images`), `whoami`, `docker history`.
- [ ] B4. Chạy image prod nối vào db bằng `docker run --network ...`.

Tự kiểm tra B:
1. Image cuối của multi-stage gồm những gì?
2. Vì sao `runtime` của backend phải `FROM base` (cùng `node:24-alpine` với `build`)?
3. Vì sao chạy `USER node` và để code thuộc root?
4. Vì sao `CMD ["node", ...]` thay vì `npm start`? (Gợi ý: SIGTERM.)
5. Vì sao React ở prod gọi `/api` tương đối mà không gắn cứng URL?

### Chặng C: Mô phỏng production trên máy
- [ ] C1. `compose.prod.yaml`: target `runtime`, db không có `ports`, `restart: unless-stopped`, mật khẩu mạnh.
- [ ] C2. Migrate ở prod: service chạy một lần dùng `target: build` + `migrate deploy`.
- [ ] C3. Tag image `v1`, `v2`; rollback về `v1`.
- [ ] C4. Backup/restore db (`pg_dump` / `psql` qua `exec`).
- [ ] C5. Secrets: `.env` riêng cho prod, không đưa vào image (kiểm tra bằng `docker history`).

### Chặng D: Deploy công khai (portfolio)
- [ ] D1. Mua VPS (Ubuntu LTS, ≥ 2 GB RAM, amd64, vùng SG/VN), SSH key, firewall, cài Docker Engine. Học luôn SSH Bài 6 (`~/.ssh/config`, alias `ssh vps`) + Bài 7 (`authorized_keys`, tắt đăng nhập bằng mật khẩu) dời từ 0.3.
- [ ] D2. GitHub Actions build image → push GHCR (tag theo git SHA + `vX.Y.Z`).
- [ ] D3. VPS pull image + `compose.prod.yaml`; tên miền + HTTPS (Caddy).
- [ ] D4. Chống spam demo (reset DB định kỳ hoặc giới hạn số todo).
- [ ] D5. README: sơ đồ, cách chạy dev/prod, các quyết định và **vì sao** (bảng dưới).

## Quyết định đã chốt
| # | Quyết định | Lý do |
|---|---|---|
| 1 | Monorepo: `frontend/`, `backend/`, compose ở gốc | Dễ học, một lệnh chạy cả hệ thống |
| 2 | **Prisma 7** ghim `@7` (`prisma-client` generator, `@prisma/adapter-pg` + `pg`) | Quen tay; `latest` đang là 8.0 RC. Bài học Docker: `migrate dev` (dev) khác `migrate deploy` (prod) |
| 3 | Ở prod, React gọi API qua đường dẫn tương đối `/api` (nginx proxy) | Tránh bẫy URL API bị gắn cứng lúc build; cùng origin nên không CORS |
| 4 | Image `postgres:17-alpine` (ghi rõ major) | Dữ liệu Postgres không tương thích giữa các bản major. Không dùng 18 vì đổi đường dẫn thư mục dữ liệu |
| 5 | **Named volume** cho dữ liệu DB | Container dùng xong vứt, volume mới giữ dữ liệu |
| 6 | Cổng db `127.0.0.1:5432:5432` ở dev; prod bỏ hẳn `ports` | Chỉ máy mình vào được, không lộ ra mạng LAN |
| 7 | **Một `.env` ở gốc** (không commit) + `.env.example` (commit); trong container biến do compose bơm vào | Compose tự đọc `.env` ở gốc |
| 8 | `prisma.config.ts` đọc `process.env.DATABASE_URL` | Image build được mà không cần biết nó chạy ở đâu |
| 9 | `.gitattributes`: `* text=auto eol=lf` | Ép LF để build giống nhau trên mọi máy/CI |
| 10 | **Code app: Claude viết, hỏi trước.** Không đụng phần Docker | Phần app không phải trọng tâm |
| 11 | Deploy công khai làm portfolio; **mua VPS ở chặng D** | VPS tính tiền theo tháng |
| 12 | **Một `Dockerfile` nhiều target** mỗi app (`base → deps → build → dev` + `prod-deps` + `runtime` cuối file) | Dev và prod dùng chung base + bước cài; `docker build .` mặc định ra prod |
| 13 | Dev **trong container** từ đầu; mỗi khái niệm thử bằng lệnh `docker` trước, compose sau | Compose chỉ là viết gọn của lệnh `docker` |
| 14 | **Chỉ cần Docker** (không cài Node trên máy), Node 24 LTS (`node:24-alpine`) chỉ trong image | Sát thực tế VPS |
| 15 | Người học **tự setup** môi trường, Claude chỉ hướng dẫn | Học luôn Linux |
| 16 | **Ubuntu cài thẳng** thay cho WSL2 | Giống VPS hơn |
| 17 | **Lần 3: làm lại từ thư mục trống**, đi đúng thứ tự lộ trình | Lần 2 đi lệch (compose trước Dockerfile) |

## App (kế hoạch, chưa có code)
- Bảng `Todo`: `id` (autoincrement), `title`, `completed` (mặc định false), `createdAt`, `updatedAt` (`@updatedAt`)
- API (`backend/src`): `GET /api/health`, `GET/POST /api/todos`, `PATCH/DELETE /api/todos/:id`. Validate: 400 nếu title rỗng / id không phải số / JSON sai; 404 nếu không có todo (Prisma `P2025`). Đóng server + `prisma.$disconnect()` khi nhận SIGTERM.

## Đang ở đâu
**2026-10-21:** **0.3 xong** (SSH đủ dùng, Bài 6–7 dời sang D1; `git config` email noreply).

**Bước tiếp theo:**
1. **0.4 Repo**: `git init` (đã có `.git/` rỗng), `.gitignore`, `.gitattributes`, commit đầu, tạo repo GitHub, push. **Lưu ý:** GitHub đã có repo cũ `AnCoder683/TodoApp` → chọn tên khác hoặc xử lý repo cũ trước.
2. Trả lời "Tự kiểm tra 0" → sang **A0**.

## Nhật ký
- **2026-10-13 → 10-15 (lần 1)**: Windows, chặng 0–1 + đầu chặng 2. Quyết định deploy làm portfolio, Dockerfile nhiều target. Thấy nền chưa vững → làm lại.
- **2026-10-16 (lần 2)**: chuyển sang Ubuntu cài thẳng, `~/code/todoapp`. Đã làm (ngoài thứ tự): compose với db, Prisma 7 + migration, API Express trong container tạm, test curl OK. Học được: cờ `-u "$(id -u):$(id -g)"`, cờ phải đứng trước tên image, `$$` trong healthcheck, `prisma7.config.ts` phải đổi tên. Cuối buổi thấy đã đi lệch lộ trình → `docker compose down -v`, **xoá sạch thư mục**, viết lại `CLAUDE.md` + `PROGRESS.md`, lộ trình thêm **A0** (khung backend) và chuyển Prisma vào A3. Bắt đầu lần 3 từ 0.2.
- **2026-10-16 (lần 3, buổi chiều)**: 0.2 xong phần 1–2 (UID/GID, `/etc/passwd`, `/etc/shadow`, `sudo`, nhóm `sudo`/`docker`/`lxd`), bỏ qua phần 3. Sang 0.3: SSH khó → dùng ẩn dụ con dấu/mẫu dấu + widget 7 bước, giải thích host key/known_hosts. Tìm nguồn chính thức, soạn lộ trình SSH 7 bài. Người học chưa đọc lý thuyết → tạm dừng, **buổi sau học SSH lại từ số 0**.
- **2026-10-20**: SSH thực hành từ số 0 (key cũ của lần trước bị ghi đè/xoá). Vấp: gõ `ed255519`; `ssh-keygen` không chạy được qua `!` trong chat (cần terminal riêng vì hỏi passphrase); lần đầu bỏ qua bước ② vì `known_hosts` còn cũ → xoá hết làm lại một mạch, lần này có so fingerprint host + `yes`. Học thêm: hộp thoại unlock của GNOME agent, `UpdateHostKeys` (1 lần `yes` → 3 dòng), `HashKnownHosts`, `git` không tham gia `ssh -T` (git chỉ mượn ống ssh khi push/pull).
- **2026-10-21**: hỏi vì sao cần public key để biết là server/client → giải thích MITM (DH đúng luật vẫn bị đứng giữa), chữ ký gắn session ID nên không chuyển tiếp được, 2 lần so ở bước ②. Đi sâu vào cách soi (pha hai bát) thì người học thấy quá sâu → chốt 5 ý tối thiểu. Câu 5 đúng; bổ sung `ssh-keygen -R`, vụ GitHub đổi RSA host key 3/2023, rebuild VPS ở chặng D. Thí nghiệm `chmod 644`: agent từ chối ký (`agent refused operation`) thay vì cảnh báo `UNPROTECTED`; `chmod 600` → OK. Người học hỏi có cần biết sâu không → chốt mức "dùng được + gỡ lỗi": Bài 5 rút gọn, Bài 6–7 dời sang D1. Sang `git config`. `git config` email noreply + bật 2 công tắc email trên GitHub → **0.3 xong**.
