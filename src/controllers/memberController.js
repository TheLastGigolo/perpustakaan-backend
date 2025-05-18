// src/controllers/memberController.js
const Member = require('../models/memberModel');
const { successResponse, errorResponse } = require('../utils/response');

class MemberController {
  static async getAllMembers(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      
      const filters = {
        status: req.query.status,
        faculty: req.query.faculty,
        study_program: req.query.study_program
      };
      
      const { members, total } = await Member.getAllMembers({
        search,
        filters,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      const totalPages = Math.ceil(total / limit);
      
      return successResponse(res, 200, {
        members,
        pagination: {
          total,
          total_pages: totalPages,
          current_page: parseInt(page),
          per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting members:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async getMemberById(req, res) {
    try {
      const member = await Member.getMemberById(req.params.id);
      
      if (!member) {
        return errorResponse(res, 404, 'Member not found');
      }
      
      return successResponse(res, 200, member);
    } catch (error) {
      console.error('Error getting member:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async createMember(req, res) {
    try {
      const { name, email, password, ...memberData } = req.body;
      
      // Validasi required fields
      if (!name || !email || !password || !memberData.member_code || !memberData.nim) {
        return errorResponse(res, 400, 'Name, email, password, member code and NIM are required');
      }
      
      const profilePicture = req.file;
      
      const memberId = await Member.createMember(
        { name, email, password },
        memberData,
        profilePicture
      );
      
      return successResponse(res, 201, { id: memberId }, 'Member created successfully');
    } catch (error) {
      console.error('Error creating member:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 400, 'Email or member code already exists');
      }
      
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async updateMember(req, res) {
    try {
      const { id } = req.params;
      const memberData = req.body;
      const profilePicture = req.file;
      
      // Check if member exists
      const existingMember = await Member.getMemberById(id);
      if (!existingMember) {
        return errorResponse(res, 404, 'Member not found');
      }
      
      await Member.updateMember(id, memberData, profilePicture);
      
      return successResponse(res, 200, null, 'Member updated successfully');
    } catch (error) {
      console.error('Error updating member:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 400, 'Member code already exists');
      }
      
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async deleteMember(req, res) {
    try {
      const { id } = req.params;
      
      // Check if member exists
      const existingMember = await Member.getMemberById(id);
      if (!existingMember) {
        return errorResponse(res, 404, 'Member not found');
      }
      
      await Member.deleteMember(id);
      
      return successResponse(res, 200, null, 'Member deleted successfully');
    } catch (error) {
      console.error('Error deleting member:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async getFilterOptions(req, res) {
    try {
      const [statuses, faculties, studyPrograms] = await Promise.all([
        Member.getStatusOptions(),
        Member.getFacultyOptions(),
        Member.getStudyProgramOptions()
      ]);
      
      return successResponse(res, 200, {
        statuses,
        faculties,
        study_programs: studyPrograms
      });
    } catch (error) {
      console.error('Error getting filter options:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
}

module.exports = MemberController;