# perpustakaan-backend

# REST API Perpustakaan - Login & Authentication

Repositori ini berisi backend REST API sederhana untuk sistem login dan autentikasi pengguna pada aplikasi perpustakaan.

## Fitur Utama

- **Registrasi & Login**: Autentikasi menggunakan JWT.
- **Manajemen User**: Mendukung peran (role) `admin`, `petugas`, dan `anggota`.
- **Proteksi Endpoint**: Middleware untuk validasi token JWT.
- **Koneksi Database**: Menggunakan MySQL.

## Struktur Folder

```
api-login/
├── .env                # Konfigurasi environment (DB, JWT)
├── package.json        # Konfigurasi npm & dependencies
├── perpustakaan.sql    # Skrip SQL untuk tabel user
└── src/
    ├── app.js                  # Entry point aplikasi
    ├── config/
    │   ├── database.js         # Koneksi database MySQL
    │   └── jwt.js              # Konfigurasi JWT
    ├── controllers/
    │   └── authController.js   # Logika login & registrasi
    ├── middlewares/
    │   └── authMiddleware.js   # Middleware autentikasi JWT
    ├── models/
    │   └── userModel.js        # Model user (query ke DB)
    ├── routes/
    │   └── authRoutes.js       # Routing autentikasi
    └── utils/
        └── response.js         # Helper response API
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

## Endpoint Utama

- `POST /api/auth/login` — Login user & mendapatkan JWT
- Endpoint lain dapat ditambahkan sesuai kebutuhan

## Catatan

- Password user di-hash menggunakan bcryptjs.
- Token JWT digunakan untuk autentikasi dan harus dikirim pada header `Authorization` untuk mengakses endpoint yang diproteksi.
- Role user (`admin`, `petugas`, `anggota`) dapat digunakan untuk membatasi akses fitur tertentu.

---

