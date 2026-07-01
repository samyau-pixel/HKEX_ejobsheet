/**
 * Leader Review Service
 * 
 * Handles operator leader review authentication and validation logic.
 * Uses existing JWT + bcrypt password hashing system.
 * 
 * Note: No lockout mechanism - unlimited attempts allowed (physical presence requirement)
 * 
 * Date: 2026-06-22
 * Feature: Operator Leader Review (003-operator-lead-review)
 */

import bcryptjs from 'bcryptjs';
import { getDatabase } from '../db/schema.js';
import { JobCompletionModel } from '../models/job-completion.model.js';

const db = getDatabase();

// Simple logger for leader review actions
const logLeaderReview = (action: string, details: any) => {
  const logEntry = {
    action: `leader_review:${action}`,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  // Log to console (structured JSON)
  if (action === 'success' || action === 'failure') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
};

export interface LeaderReviewResult {
  success: boolean;
  message: string;
  error?: string;
}

export class LeaderReviewService {
  /**
   * Validate leader credentials by checking password
   * @param userId - The leader's user ID
   * @param password - The plain text password to validate
   * @returns Promise<boolean> - True if password is valid
   */
  static async validateLeaderCredentials(userId: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT password FROM users WHERE id = ? AND status = "active"',
        [userId],
        async (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!row) {
            resolve(false);
            return;
          }
          
          try {
            const isValid = await bcryptjs.compare(password, row.password);
            resolve(isValid);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Submit leader review for a job
   * @param executionId - The execution jobsheet ID
   * @param jobId - The job ID to review
   * @param userId - The leader's user ID
   * @param password - The leader's password for authentication
   * @returns Promise<LeaderReviewResult>
   */
  static async submitLeaderReview(
    executionId: string,
    jobId: string,
    userId: string,
    password: string
  ): Promise<LeaderReviewResult> {
    try {
      // Validate leader credentials
      const isValid = await this.validateLeaderCredentials(userId, password);
      
      if (!isValid) {
        logLeaderReview('failure', {
          executionId,
          jobId,
          userId,
          reason: 'invalid_password'
        });
        return {
          success: false,
          message: 'Invalid password',
          error: 'AUTH_FAILED'
        };
      }

      // Record the leader review
      await JobCompletionModel.recordLeaderReview(executionId, jobId, userId);
      
      logLeaderReview('success', {
        executionId,
        jobId,
        userId
      });
      
      return {
        success: true,
        message: 'Leader review recorded successfully'
      };
    } catch (error: any) {
      logLeaderReview('error', {
        executionId,
        jobId,
        userId,
        error: error.message
      });
      console.error('Error submitting leader review:', error);
      return {
        success: false,
        message: 'Failed to record leader review',
        error: error.message
      };
    }
  }

  /**
   * Handle leader review timeout
   * Reverts the job completion and invalidates the review
   * @param executionId - The execution jobsheet ID
   * @param jobId - The job ID
   */
  static async handleLeaderReviewTimeout(executionId: string, jobId: string): Promise<void> {
    try {
      // Invalidate the leader review
      await JobCompletionModel.invalidateLeaderReview(executionId, jobId);
      console.log(`Leader review timeout handled for execution ${executionId}, job ${jobId}`);
    } catch (error: any) {
      console.error('Error handling leader review timeout:', error);
      throw error;
    }
  }

  /**
   * Check if all jobs in an execution have been leader reviewed
   * @param executionId - The execution jobsheet ID
   * @returns Promise<{allReviewed: boolean, pendingCount: number, reviewedCount: number}>
   */
  static async checkAllJobsReviewed(executionId: string): Promise<{
    allReviewed: boolean;
    pendingCount: number;
    reviewedCount: number;
  }> {
    try {
      return await JobCompletionModel.allJobsLeaderReviewed(executionId);
    } catch (error: any) {
      console.error('Error checking job review status:', error);
      throw error;
    }
  }

  /**
   * Get leader review status for a specific job
   * @param executionId - The execution jobsheet ID
   * @param jobId - The job ID
   * @returns Promise<{leader_reviewed: boolean, leader_reviewed_by: string | null, leader_reviewed_at: string | null}>
   */
  static async getJobReviewStatus(executionId: string, jobId: string): Promise<{
    leader_reviewed: boolean;
    leader_reviewed_by: string | null;
    leader_reviewed_at: string | null;
  }> {
    try {
      return await JobCompletionModel.getLeaderReviewStatus(executionId, jobId);
    } catch (error: any) {
      console.error('Error getting job review status:', error);
      throw error;
    }
  }

  /**
   * Get all leader reviews for an execution jobsheet
   * @param executionId - The execution jobsheet ID
   * @returns Promise<any[]> - Array of review records with leader names
   */
  static async getExecutionReviews(executionId: string): Promise<any[]> {
    try {
      return await JobCompletionModel.getAllLeaderReviews(executionId);
    } catch (error: any) {
      console.error('Error getting execution reviews:', error);
      throw error;
    }
  }
}
