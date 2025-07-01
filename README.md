# perpustakaan-backend

## Deskripsi
API backend sederhana untuk sistem perpustakaan, dilengkapi fitur autentikasi login menggunakan JWT.

## Fitur Login
Endpoint login digunakan untuk melakukan autentikasi user dan mendapatkan token JWT.

- **Endpoint:** `POST /api/auth/login`
- **Body Request:**  
  ```json
  {
    "email": "admin@perpustakaan.com",
    "password": "admin123"
  }
  ```
- **Response Sukses:**
  ```json
  {
    "status": "success",
    "message": "Login berhasil",
    "data": {
      "user": {
        "id": 1,
        "name": "Admin Perpustakaan",
        "email": "admin@perpustakaan.com",
        "role": "admin",
        "created_at": "...",
        "updated_at": "..."
      },
      "token": "..."
    }
  }
  ```
- **Response Gagal:**  
  Jika email atau password salah, akan mengembalikan status error dan pesan yang sesuai.

---

## Cara Instalasi & Menjalankan

1. **Clone repository**
   ```bash
   git clone <url-repo-anda>
   cd perpustakaan-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi environment**
   - Salin file `.env` dan sesuaikan dengan konfigurasi database MySQL Anda.

4. **Setup database**
   - Buat database sesuai nama di `.env` (misal: `perpustakaan`).
   - Jalankan script SQL pada file `perpustakaan.sql` untuk membuat tabel dan user contoh:
     ```bash
     mysql -u <user> -p < nama_database < perpustakaan.sql
     ```

5. **Jalankan aplikasi**
   - Untuk mode development (otomatis restart jika ada perubahan):
     ```bash
     npm run dev
     ```
   - Untuk mode production:
     ```bash
     npm start
     ```

6. **Tes login**
   - Gunakan Postman atau aplikasi sejenis untuk mengakses endpoint `/api/auth/login` dengan email dan password yang sudah ada di database.

---

## Fitur Baru: Dashboard Admin

### Kegunaan
Fitur dashboard admin digunakan untuk menampilkan ringkasan data penting di sistem perpustakaan, seperti total buku, total anggota, jumlah buku yang sedang dipinjam, jumlah antrian peminjaman, serta rekomendasi buku populer berdasarkan metode AHP (Analytical Hierarchy Process).

### Endpoint

- **Endpoint:** `GET /api/admin/dashboard`
- **Akses:** Hanya untuk user dengan role admin (wajib login & token JWT)
- **Header:**  
  `Authorization: Bearer <token_admin>`

#### Contoh Response Sukses
```json
{
  "status": "success",
  "data": {
    "total_books": 120,
    "total_members": 45,
    "borrowed_books": 18,
    "queued_borrows": 3,
    "popular_books": [
      {
        "id": 1,
        "title": "Algoritma Pemrograman",
        "author": "Budi Santoso",
        "score": "0.85",
        "borrow_count": 25,
        "stock": 3
      },
      {
        "id": 2,
        "title": "Database Lanjut",
        "author": "Siti Aminah",
        "score": "0.80",
        "borrow_count": 20,
        "stock": 2
      }
      // ...maksimal 5 buku teratas
    ]
  }
}
```

#### Contoh Response Gagal
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

### Penjelasan Fitur

- **Dashboard Admin**: Menyediakan data statistik utama untuk admin, sehingga memudahkan monitoring aktivitas perpustakaan.
- **Rekomendasi Buku Populer**: Menggunakan metode AHP untuk menentukan buku yang paling direkomendasikan berdasarkan frekuensi peminjaman, ketersediaan stok, dan kebaruan buku.
- **Keamanan**: Hanya admin yang dapat mengakses endpoint ini, menggunakan middleware autentikasi JWT.

---

## Fitur Baru: Pencarian & Manajemen Buku

### Kegunaan
Fitur ini menambahkan kemampuan pencarian buku dengan **FULLTEXT search** (otomatis membuat index jika belum ada), filter buku berdasarkan berbagai kriteria, serta endpoint CRUD (Create, Read, Update, Delete) buku untuk admin.  
Selain itu, endpoint publik juga tersedia untuk pencarian dan detail buku tanpa login.

### Endpoint Utama

#### 1. **Pencarian Buku (Publik)**
- **Endpoint:** `GET /api/books`
- **Query:**  
  - `search` (opsional): kata kunci pencarian  
  - `author`, `publication_year`, `category`, `is_active` (opsional): filter  
  - `page`, `limit` (opsional): paginasi
- **Contoh:**  
  `/api/books?search=algoritma&page=1&limit=10`
- **Response:**
  ```json
  {
    "status": "success",
    "data": {
      "books": [
        {
          "id": 1,
          "title": "Algoritma Pemrograman",
          "author": "Budi Santoso",
          "description": "...",
          "isbn": "...",
          "publisher": "...",
          "publication_year": 2022,
          "stock": 3,
          "cover_url": "...",
          "is_active": true,
          "categories": ["Teknik", "Pemrograman"]
        }
        // ...
      ],
      "pagination": {
        "total": 20,
        "total_pages": 2,
        "current_page": 1,
        "per_page": 10
      }
    }
  }
  ```

#### 2. **Pencarian Buku dengan FULLTEXT**
- **Endpoint:** `GET /api/books/search?q=kata_kunci`
- **Kegunaan:**  
  Pencarian lebih relevan dan cepat menggunakan FULLTEXT index pada judul, penulis, dan deskripsi buku.

#### 3. **Manajemen Buku (Admin)**
- **Endpoint:**  
  - `POST /api/admin/books` (tambah buku)
  - `PUT /api/admin/books/:id` (update buku)
  - `DELETE /api/admin/books/:id` (hapus buku)
  - `GET /api/admin/books/:id` (detail buku)
- **Akses:** Hanya admin (wajib login & JWT)
- **Header:**  
  `Authorization: Bearer <token_admin>`

#### 4. **Dashboard Admin**
- **Endpoint:** `GET /api/admin/dashboard`
- **Kegunaan:** Menampilkan statistik utama (total buku, anggota, peminjaman, antrian, dan rekomendasi buku populer dengan AHP).
- **Akses:** Hanya admin (wajib login & JWT)
- **Response:**
  ```json
  {
    "status": "success",
    "data": {
      "total_books": 120,
      "total_members": 45,
      "borrowed_books": 18,
      "queued_borrows": 3,
      "popular_books": [
        {
          "id": 1,
          "title": "Algoritma Pemrograman",
          "author": "Budi Santoso",
          "score": "0.85",
          "borrow_count": 25,
          "stock": 3
        }
        // ...maksimal 5 buku teratas
      ]
    }
  }
  ```

---

### Penjelasan Fitur

- **Pencarian Buku FULLTEXT:**  
  Memungkinkan pencarian cepat dan relevan pada judul, penulis, dan deskripsi buku. Index FULLTEXT akan otomatis dibuat saat aplikasi dijalankan jika belum ada.
- **Filter & Pagination:**  
  Mendukung filter berdasarkan penulis, tahun terbit, kategori, status aktif, serta paginasi hasil.
- **Manajemen Buku (CRUD):**  
  Admin dapat menambah, mengubah, dan menghapus data buku melalui endpoint khusus.
- **Dashboard Admin:**  
  Menyediakan data statistik utama dan rekomendasi buku populer berbasis AHP (Analytical Hierarchy Process).
- **Keamanan:**  
  Endpoint admin hanya dapat diakses oleh user dengan role admin menggunakan JWT.

---

## Fitur Baru: Manajemen Anggota

### Kegunaan
Fitur ini memungkinkan admin atau petugas untuk mengelola data anggota perpustakaan, termasuk menambah, mengubah, menghapus, serta melihat daftar anggota. Fitur ini juga mendukung upload foto profil anggota.

### Endpoint Utama

#### 1. **Daftar Anggota (Admin/Petugas)**
- **Endpoint:** `POST /api/admin/members`
- **Akses:** Hanya admin/petugas (wajib login & JWT)
- **Header:**  
  `Authorization: Bearer <token_admin>`
- **Body:** `multipart/form-data`  
  - Field data anggota (name, email, password, member_code, nim, dst)
  - Field file: `profile_picture` (opsional, tipe file gambar)
- **Contoh di Postman:**  
  Pilih `Body > form-data`, masukkan field sesuai kebutuhan, dan upload file pada `profile_picture`.

#### 2. **Update Anggota**
- **Endpoint:** `PUT /api/admin/members/:id`
- **Akses:** Admin/petugas
- **Body:** `multipart/form-data` (bisa update data & foto profil)

#### 3. **Hapus Anggota**
- **Endpoint:** `DELETE /api/admin/members/:id`
- **Akses:** Admin/petugas

#### 4. **Daftar & Filter Anggota**
- **Endpoint:** `GET /api/admin/members`
- **Query:**  
  - `search` (opsional): cari nama, kode anggota, atau NIM  
  - `status`, `faculty`, `study_program` (opsional): filter  
  - `page`, `limit` (opsional): paginasi

#### 5. **Detail Anggota**
- **Endpoint:** `GET /api/admin/members/:id`

#### 6. **Opsi Filter**
- **Endpoint:** `GET /api/admin/members/filters`
- **Fungsi:** Mendapatkan daftar status, fakultas, dan program studi unik untuk filter di frontend.

---

### Contoh Penggunaan Upload Foto Profil Anggota

- **Body di Postman:**  
  - Pilih `form-data`
  - Tambahkan field:  
    - `name`, `email`, `password`, `member_code`, `nim`, dst (text)
    - `profile_picture` (type: File, upload gambar)

---

## Catatan

- Endpoint anggota hanya bisa diakses oleh admin/petugas (role di JWT).
- File foto profil anggota akan disimpan di folder `/uploads/members/` dan dapat diakses via URL `/uploads/members/nama-file.jpg`.
- Endpoint publik buku (`/api/books`, `/api/books/search`, `/api/books/:id`) dapat diakses tanpa login.

---

## Struktur Direktori

```
perpustakaan-backend
├── .gitignore
├── .eslintrc.json
├── .env
├── package.json
├── package-lock.json
├── perpustakaan.sql
├── README.md
└── src
    ├── app.js
    ├── config
    │   ├── checkFulltext.js         # [BARU] Cek & buat FULLTEXT index otomatis
    │   ├── database.js
    │   └── jwt.js
    ├── controllers
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── bookController.js        # [BARU] Controller untuk buku
    │   └── memberController.js      # [BARU] Controller untuk anggota
    ├── middlewares
    │   ├── authMiddleware.js
    │   └── bookModel.js             # [BARU] Model buku (bisa dipindah ke /models)
    ├── models
    │   ├── userModel.js
    │   └── memberModel.js           # [BARU] Model anggota
    ├── routes
    │   ├── adminRoutes.js
    │   ├── authRoutes.js
    │   ├── bookRoutes.js            # [BARU] Route untuk buku (admin)
    │   ├── publicBookRoutes.js      # [BARU] Route untuk buku (publik)
    │   └── memberRoutes.js          # [BARU] Route untuk anggota (admin)
    └── utils
        ├── ahpCalculator.js
        └── response.js
```

**Keterangan [BARU]:**
- `checkFulltext.js`: Membuat FULLTEXT index otomatis jika belum ada.
- `bookController.js`, `bookRoutes.js`, `publicBookRoutes.js`, `bookModel.js`: Mendukung fitur pencarian, filter, dan CRUD buku.
- `memberController.js`, `memberModel.js`, `memberRoutes.js`: Mendukung fitur CRUD anggota, filter, dan upload foto profil anggota.

---

## Cara Penggunaan Endpoint Anggota (Member)

### 1. **Daftar Anggota (Admin/Petugas)**
- **Endpoint:** `POST /api/admin/members`
- **Akses:** Hanya admin/petugas (wajib login & JWT)
- **Header:**  
  `Authorization: Bearer <token_admin>`
- **Body:** `multipart/form-data`  
  - Field data anggota (name, email, password, member_code, nim, dst)
  - Field file: `profile_picture` (opsional, tipe file gambar)
- **Contoh di Postman:**  
  Pilih `Body > form-data`, masukkan field sesuai kebutuhan, dan upload file pada `profile_picture`.

### 2. **Update Anggota**
- **Endpoint:** `PUT /api/admin/members/:id`
- **Akses:** Admin/petugas
- **Body:** `multipart/form-data` (bisa update data & foto profil)

### 3. **Hapus Anggota**
- **Endpoint:** `DELETE /api/admin/members/:id`
- **Akses:** Admin/petugas

### 4. **Daftar & Filter Anggota**
- **Endpoint:** `GET /api/admin/members`
- **Query:**  
  - `search` (opsional): cari nama, kode anggota, atau NIM  
  - `status`, `faculty`, `study_program` (opsional): filter  
  - `page`, `limit` (opsional): paginasi

### 5. **Detail Anggota**
- **Endpoint:** `GET /api/admin/members/:id`

### 6. **Opsi Filter**
- **Endpoint:** `GET /api/admin/members/filters`
- **Fungsi:** Mendapatkan daftar status, fakultas, dan program studi unik untuk filter di frontend.

---

## Contoh Penggunaan Upload Foto Profil Anggota

- **Body di Postman:**  
  - Pilih `form-data`
  - Tambahkan field:  
    - `name`, `email`, `password`, `member_code`, `nim`, dst (text)
    - `profile_picture` (type: File, upload gambar)

---

## Catatan

- Endpoint anggota hanya bisa diakses oleh admin/petugas (role di JWT).
- File foto profil anggota akan disimpan di folder `/uploads/members/` dan dapat diakses via URL `/uploads/members/nama-file.jpg`.
- Endpoint publik buku (`/api/books`, `/api/books/search`, `/api/books/:id`) dapat diakses tanpa login.

---



