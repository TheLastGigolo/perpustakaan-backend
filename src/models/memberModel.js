// src/models/memberModel.js
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

class Member {
  static async getAllMembers({ search = '', filters = {}, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let query = `SELECT m.*, u.name, u.email 
                 FROM members m
                 JOIN users u ON m.user_id = u.id`;
    
    const whereClauses = [];
    const params = [];
    
    // Search
    if (search) {
      whereClauses.push('(u.name LIKE ? OR m.member_code LIKE ? OR m.nim LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Filters
    if (filters.status) {
      whereClauses.push('m.status = ?');
      params.push(filters.status);
    }
    
    if (filters.faculty) {
      whereClauses.push('m.faculty = ?');
      params.push(filters.faculty);
    }
    
    if (filters.study_program) {
      whereClauses.push('m.study_program = ?');
      params.push(filters.study_program);
    }
    
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [members] = await db.query(query, params);
    
    // Count total
    let countQuery = `SELECT COUNT(*) as total 
                      FROM members m
                      JOIN users u ON m.user_id = u.id`;
    
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    const [totalResult] = await db.query(countQuery, params.slice(0, -2));
    const total = totalResult[0].total;
    
    return { members, total };
  }
  
  static async getMemberById(id) {
    const [rows] = await db.query(
      `SELECT m.*, u.name, u.email 
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [id]
    );
    return rows[0];
  }
  
  static async createMember(userData, memberData, profilePicture = null) {
    // Mulai transaction
    await db.query('START TRANSACTION');
    
    try {
      // Buat user dulu
      const [userResult] = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, userData.password, 'anggota']
      );
      
      const userId = userResult.insertId;
      
      // Handle upload gambar
      let profilePicturePath = null;
      if (profilePicture) {
        const uploadDir = path.join(__dirname, '../../uploads/members');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const ext = path.extname(profilePicture.originalname);
        const filename = `member_${userId}_${Date.now()}${ext}`;
        profilePicturePath = path.join(uploadDir, filename);
        
        fs.writeFileSync(profilePicturePath, profilePicture.buffer);
        profilePicturePath = `/uploads/members/${filename}`;
      }
      
      // Buat member
      const [memberResult] = await db.query(
        `INSERT INTO members 
         (user_id, member_code, nim, faculty, study_program, phone, address, join_date, status, profile_picture)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          memberData.member_code,
          memberData.nim,
          memberData.faculty,
          memberData.study_program,
          memberData.phone,
          memberData.address,
          memberData.join_date || new Date(),
          memberData.status || 'pending',
          profilePicturePath
        ]
      );
      
      await db.query('COMMIT');
      return memberResult.insertId;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  
  static async updateMember(id, memberData, profilePicture = null) {
    let profilePicturePath = null;
    
    // Handle upload gambar jika ada
    if (profilePicture) {
      const uploadDir = path.join(__dirname, '../../uploads/members');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const ext = path.extname(profilePicture.originalname);
      const filename = `member_${id}_${Date.now()}${ext}`;
      profilePicturePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(profilePicturePath, profilePicture.buffer);
      profilePicturePath = `/uploads/members/${filename}`;
      
      // Hapus gambar lama jika ada
      const [existingMember] = await db.query('SELECT profile_picture FROM members WHERE id = ?', [id]);
      if (existingMember[0].profile_picture) {
        const oldImagePath = path.join(__dirname, '../../', existingMember[0].profile_picture);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    const updateData = {
      ...memberData,
      updated_at: new Date()
    };
    
    if (profilePicturePath) {
      updateData.profile_picture = profilePicturePath;
    }
    
    const setClause = Object.keys(updateData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(updateData);
    values.push(id);
    
    await db.query(
      `UPDATE members SET ${setClause} WHERE id = ?`,
      values
    );
    
    return true;
  }
  
  static async deleteMember(id) {
    // Hapus gambar profil jika ada
    const [member] = await db.query('SELECT profile_picture, user_id FROM members WHERE id = ?', [id]);
    
    if (member[0].profile_picture) {
      const imagePath = path.join(__dirname, '../../', member[0].profile_picture);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Hapus member dan user terkait dalam transaction
    await db.query('START TRANSACTION');
    try {
      await db.query('DELETE FROM members WHERE id = ?', [id]);
      await db.query('DELETE FROM users WHERE id = ?', [member[0].user_id]);
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
    
    return true;
  }
  
  static async getStatusOptions() {
    const [rows] = await db.query("SHOW COLUMNS FROM members LIKE 'status'");
    const type = rows[0].Type;
    const values = type.match(/enum\((.*)\)/)[1].replace(/'/g, '').split(',');
    return values;
  }
  
  static async getFacultyOptions() {
    const [rows] = await db.query('SELECT DISTINCT faculty FROM members WHERE faculty IS NOT NULL ORDER BY faculty');
    return rows.map(row => row.faculty);
  }
  
  static async getStudyProgramOptions() {
    const [rows] = await db.query('SELECT DISTINCT study_program FROM members WHERE study_program IS NOT NULL ORDER BY study_program');
    return rows.map(row => row.study_program);
  }
}

module.exports = Member;