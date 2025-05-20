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

## Struktur Direktori

```
perpustakaan-backend
├── .gitignore                # File untuk mengecualikan file/folder tertentu dari git
├── .eslintrc.json            # Konfigurasi ESLint untuk code style
├── .env                      # Konfigurasi environment (database, secret, dll)
├── package.json              # Konfigurasi npm dan daftar dependencies
├── package-lock.json         # Lock file npm
├── perpustakaan.sql          # Script SQL untuk membuat database & tabel awal
├── README.md                 # Dokumentasi proyek
└── src                       # Folder source code utama
    ├── app.js                # Entry point aplikasi Express
    ├── config                # Konfigurasi aplikasi
    │   ├── database.js       # Koneksi ke database MySQL
    │   └── jwt.js            # Konfigurasi JWT
    ├── controllers           # Logic untuk menangani request
    │   ├── adminController.js    # [BARU] Controller untuk fitur admin
    │   └── authController.js     # Controller untuk autentikasi/login
    ├── middlewares           # Middleware Express (misal: auth)
    │   └── authMiddleware.js     # Middleware untuk proteksi route
    ├── models                # Model untuk akses data/database
    │   └── userModel.js          # Model user (query ke tabel user)
    ├── perpustakaan.sql          # Script SQL (duplikat, bisa dihapus jika sudah di root)
    ├── routes                # Routing endpoint API
    │   ├── adminRoutes.js        # [BARU] Route untuk fitur admin
    │   └── authRoutes.js         # Route untuk autentikasi/login
    └── utils                 # Utility/helper functions
        ├── ahpCalculator.js      # [BARU] Helper untuk perhitungan AHP
        └── response.js           # Helper untuk format response API
```

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



