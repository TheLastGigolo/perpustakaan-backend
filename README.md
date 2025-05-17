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
├── .env                  # Konfigurasi environment (DB, JWT)
├── package.json          # Konfigurasi npm & dependencies
├── perpustakaan.sql      # Skrip SQL seluruh tabel
└── src/
    ├── app.js                    # Entry point aplikasi
    ├── config/
    │   ├── database.js           # Koneksi database MySQL
    │   └── jwt.js                # Konfigurasi JWT
    ├── controllers/
    │   ├── adminController.js    # Logika dashboard admin
    │   └── authController.js     # Logika login & registrasi
    ├── middlewares/
    │   └── authMiddleware.js     # Middleware autentikasi & otorisasi
    ├── models/
    │   └── userModel.js          # Model user (query ke DB)
    ├── routes/
    │   ├── adminRoutes.js        # Routing dashboard admin
    │   └── authRoutes.js         # Routing autentikasi
    └── utils/
        ├── ahpCalculator.js      # Utility AHP (jika ada)
        └── response.js           # Helper response API
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

## Catatan

- Password user di-hash menggunakan bcryptjs.
- Token JWT wajib dikirim pada header `Authorization` untuk endpoint yang diproteksi.
- Role user (`admin`, `petugas`, `anggota`) membatasi akses fitur tertentu.

---

Dibuat untuk kebutuhan dashboard admin perpustakaan.


Dibuat dengan ❤️ untuk proyek perpustakaan | [@pembuat](https://github.com/TheLastGigolo)