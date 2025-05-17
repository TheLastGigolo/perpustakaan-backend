# perpustakaan-backend

# REST API Perpustakaan - Admin Dashboard

Repositori ini berisi backend REST API untuk sistem dashboard admin pada aplikasi perpustakaan.

## Fitur Utama

- **Login & Autentikasi**: Menggunakan JWT.
- **Manajemen User**: Mendukung role `admin`, `petugas`, dan `anggota`.
- **Manajemen Buku, Anggota, dan Peminjaman**: CRUD data perpustakaan.
- **Proteksi Endpoint**: Middleware validasi token JWT & role admin.
- **Koneksi Database**: MySQL.

## Struktur Folder

```
perpustakaan-backend/
├── .env                      # Konfigurasi environment (DB, JWT)
├── .eslintrc.json            # Konfigurasi ESLint
├── .gitignore                # File/folder yang diabaikan git
├── package.json              # Konfigurasi npm & dependencies
├── perpustakaan.sql          # Skrip SQL seluruh tabel & data awal
├── README.md                 # Dokumentasi backend (file ini)
├── src/
│   ├── app.js                # Entry point aplikasi Express
│   ├── config/
│   │   ├── database.js       # Koneksi database MySQL
│   │   └── jwt.js            # Konfigurasi JWT
│   ├── controllers/
│   │   ├── adminController.js# Logika dashboard admin
│   │   ├── authController.js # Logika login & registrasi
│   │   └── bookController.js # Logika CRUD buku
│   ├── middlewares/
│   │   └── authMiddleware.js # Middleware autentikasi & otorisasi
│   ├── models/
│   │   ├── bookModel.js      # Model/query buku ke DB
│   │   └── userModel.js      # Model/query user ke DB
│   ├── routes/
│   │   ├── adminRoutes.js    # Routing dashboard admin
│   │   ├── authRoutes.js     # Routing autentikasi
│   │   └── bookRoutes.js     # Routing buku
│   └── utils/
│       ├── ahpCalculator.js  # Utility AHP (jika ada)
│       └── response.js       # Helper response API
├── uploads/                  # Folder upload file (misal: cover buku)
```

## Instalasi

1. **Clone repositori ini**
2. **Masuk ke folder `perpustakaan-backend`**
3. **Install dependencies**
   ```sh
   npm install
   ```
4. **Buat file `.env`** (lihat contoh di repo)
5. **Setup database**
   - Jalankan skrip SQL di `perpustakaan.sql` pada MySQL Anda.

## Menjalankan Aplikasi

```sh
npm run dev
```
atau
```sh
npm start
```

## Contoh Cek GET Dashboard Admin dengan JWT

1. **Login** untuk mendapatkan token JWT:
   ```
   POST /api/auth/login
   ```
   Body:
   ```json
   {
     "email": "admin@perpustakaan.com",
     "password": "admin123"
   }
   ```
   Simpan token JWT dari response.

2. **Akses endpoint dashboard admin** (misal: `/api/admin/dashboard`) dengan header Authorization:
   ```sh
   curl -H "Authorization: Bearer <TOKEN_JWT_ANDA>" http://localhost:3000/api/admin/dashboard
   ```
   Ganti `<TOKEN_JWT_ANDA>` dengan token JWT yang didapat saat login.

## Endpoint Utama

- `POST /api/auth/login` — Login user & mendapatkan JWT
- `GET /api/admin/dashboard` — Data dashboard admin (hanya untuk role admin)
- Endpoint lain: CRUD buku, anggota, peminjaman, dsb.

## Daftar Endpoint API (Khusus Halaman Admin)

> **Catatan:**  
> Semua endpoint pada backend ini **hanya untuk kebutuhan dashboard/admin**. Penggunaan API di luar role admin/petugas tidak didukung.

### Autentikasi
- **POST `/api/auth/login`**  
  Login user & mendapatkan JWT.

### Dashboard Admin
- **GET `/api/admin/dashboard`**  
  Mendapatkan data ringkasan dashboard (khusus admin).

### Manajemen Buku
- **GET `/api/books`**  
  Mendapatkan daftar semua buku.
- **GET `/api/books/:id`**  
  Mendapatkan detail buku berdasarkan ID.
- **POST `/api/books`**  
  Menambah buku baru.
- **PUT `/api/books/:id`**  
  Mengubah data buku.
- **DELETE `/api/books/:id`**  
  Menghapus buku.

### Manajemen Anggota
- **GET `/api/members`**  
  Mendapatkan daftar anggota.
- **GET `/api/members/:id`**  
  Mendapatkan detail anggota.
- **POST `/api/members`**  
  Menambah anggota baru.
- **PUT `/api/members/:id`**  
  Mengubah data anggota.
- **DELETE `/api/members/:id`**  
  Menghapus anggota.

### Manajemen Peminjaman
- **GET `/api/borrowings`**  
  Mendapatkan daftar peminjaman.
- **GET `/api/borrowings/:id`**  
  Mendapatkan detail peminjaman.
- **POST `/api/borrowings`**  
  Membuat peminjaman baru.
- **PUT `/api/borrowings/:id`**  
  Update status peminjaman (misal: pengembalian).
- **DELETE `/api/borrowings/:id`**  
  Menghapus data peminjaman.

### Manajemen Kategori Buku
- **GET `/api/book-categories`**  
  Mendapatkan daftar kategori buku.
- **POST `/api/book-categories`**  
  Menambah kategori buku.
- **PUT `/api/book-categories/:id`**  
  Mengubah kategori buku.
- **DELETE `/api/book-categories/:id`**  
  Menghapus kategori buku.

---

> **Seluruh endpoint di atas hanya dapat diakses oleh user dengan role `admin` atau `petugas` yang telah login dan memiliki token JWT yang valid.**

## Catatan

- Password user di-hash menggunakan bcryptjs.
- Token JWT wajib dikirim pada header `Authorization` untuk endpoint yang diproteksi.
- Role user (`admin`, `petugas`, `anggota`) membatasi akses fitur tertentu.

---

Dibuat untuk kebutuhan dashboard admin perpustakaan.


Dibuat dengan ❤️ untuk proyek perpustakaan | [@pembuat](https://github.com/TheLastGigolo)