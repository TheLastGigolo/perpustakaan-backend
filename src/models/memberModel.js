// src/models/memberModel.js
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
      whereClauses.push('(u.name LIKE ? OR m.member_code LIKE ? OR m.nim LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
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
    // Start transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user first
      const [userResult] = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [userData.name, userData.email, hashedPassword, 'anggota']
      );
      
      const userId = userResult.insertId;
      
      // Handle profile picture upload
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
      
      // Generate member code if not provided
      if (!memberData.member_code) {
        memberData.member_code = `MEM-${Date.now()}`;
      }
      
      // Create member record
      const [memberResult] = await conn.query(
        `INSERT INTO members 
         (user_id, member_code, nim, faculty, study_program, phone, address, join_date, status, profile_picture)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          memberData.member_code,
          memberData.nim,
          memberData.faculty || 'Fakultas',
          memberData.study_program,
          memberData.phone,
          memberData.address,
          memberData.join_date || new Date(),
          memberData.status || 'aktif',
          profilePicturePath
        ]
      );
      
      await conn.commit();
      return memberResult.insertId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
  
  static async updateMember(id, userData, memberData, profilePicture = null) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Get existing member data first
      const [existingMember] = await conn.query(
        'SELECT * FROM members WHERE id = ?', 
        [id]
      );
      
      if (!existingMember[0]) {
        throw new Error('Member not found');
      }

      // Update user data
      if (userData) {
        let userUpdateQuery = 'UPDATE users SET ';
        const userUpdateValues = [];
        const userUpdateFields = [];
        
        if (userData.name) {
          userUpdateFields.push('name = ?');
          userUpdateValues.push(userData.name);
        }
        if (userData.email) {
          userUpdateFields.push('email = ?');
          userUpdateValues.push(userData.email);
        }
        if (userData.password) {
          userUpdateFields.push('password = ?');
          userUpdateValues.push(await bcrypt.hash(userData.password, 12));
        }
        
        userUpdateQuery += userUpdateFields.join(', ') + ', updated_at = NOW() WHERE id = ?';
        userUpdateValues.push(existingMember[0].user_id);
        
        await conn.query(userUpdateQuery, userUpdateValues);
      }

      // Handle profile picture update
      let profilePicturePath = existingMember[0].profile_picture;
      if (profilePicture) {
        // Delete old picture if exists
        if (profilePicturePath) {
          const oldImagePath = path.join(__dirname, '../../', profilePicturePath);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Upload new picture
        const uploadDir = path.join(__dirname, '../../uploads/members');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const ext = path.extname(profilePicture.originalname);
        const filename = `member_${existingMember[0].user_id}_${Date.now()}${ext}`;
        profilePicturePath = path.join(uploadDir, filename);
        
        fs.writeFileSync(profilePicturePath, profilePicture.buffer);
        profilePicturePath = `/uploads/members/${filename}`;
      }

      // Update member data
      if (memberData) {
        let memberUpdateQuery = 'UPDATE members SET ';
        const memberUpdateValues = [];
        const memberUpdateFields = [];
        
        // Always keep the existing member_code if not provided
        if (memberData.member_code) {
          memberUpdateFields.push('member_code = ?');
          memberUpdateValues.push(memberData.member_code);
        } else {
          memberUpdateFields.push('member_code = ?');
          memberUpdateValues.push(existingMember[0].member_code);
        }
        
        if (memberData.nim) {
          memberUpdateFields.push('nim = ?');
          memberUpdateValues.push(memberData.nim);
        }
        if (memberData.faculty) {
          memberUpdateFields.push('faculty = ?');
          memberUpdateValues.push(memberData.faculty);
        }
        if (memberData.study_program) {
          memberUpdateFields.push('study_program = ?');
          memberUpdateValues.push(memberData.study_program);
        }
        if (memberData.phone) {
          memberUpdateFields.push('phone = ?');
          memberUpdateValues.push(memberData.phone);
        }
        if (memberData.address) {
          memberUpdateFields.push('address = ?');
          memberUpdateValues.push(memberData.address);
        }
        if (memberData.status) {
          memberUpdateFields.push('status = ?');
          memberUpdateValues.push(memberData.status);
        }
        if (profilePicture) {
          memberUpdateFields.push('profile_picture = ?');
          memberUpdateValues.push(profilePicturePath);
        }
        
        memberUpdateQuery += memberUpdateFields.join(', ') + ', updated_at = NOW() WHERE id = ?';
        memberUpdateValues.push(id);
        
        await conn.query(memberUpdateQuery, memberUpdateValues);
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
  
  static async deleteMember(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Get member data first
      const [member] = await conn.query(
        'SELECT profile_picture, user_id FROM members WHERE id = ?', 
        [id]
      );
      
      if (!member[0]) {
        throw new Error('Member not found');
      }

      // Delete profile picture if exists
      if (member[0].profile_picture) {
        const imagePath = path.join(__dirname, '../../', member[0].profile_picture);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete member and user records
      await conn.query('DELETE FROM members WHERE id = ?', [id]);
      await conn.query('DELETE FROM users WHERE id = ?', [member[0].user_id]);
      
      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
  
  static async getStatusOptions() {
    const [rows] = await db.query("SHOW COLUMNS FROM members LIKE 'status'");
    const type = rows[0].Type;
    const values = type.match(/enum\((.*)\)/)[1].replace(/'/g, '').split(',');
    return values;
  }
  
  static async getFacultyOptions() {
    const [rows] = await db.query(
      'SELECT DISTINCT faculty FROM members WHERE faculty IS NOT NULL ORDER BY faculty'
    );
    return rows.map(row => row.faculty);
  }
  
  static async getStudyProgramOptions() {
    const [rows] = await db.query(
      'SELECT DISTINCT study_program FROM members WHERE study_program IS NOT NULL ORDER BY study_program'
    );
    return rows.map(row => row.study_program);
  }
}

module.exports = Member;