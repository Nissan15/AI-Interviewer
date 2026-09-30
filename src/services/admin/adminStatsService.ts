import { AdminDashboardStats } from '../../types/admin';
import { questionService } from './questionService';
import { testManagementService } from './testManagementService';

export const adminStatsService = {
  /**
   * Aggregate high-level statistics for Admin Dashboard Overview
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [qStats, testsResult] = await Promise.all([
      questionService.getQuestionStats(),
      testManagementService.getTests('all', 'all'),
    ]);

    const tests = testsResult.data || [];
    const publishedTests = tests.filter((t) => t.status === 'published').length;
    const draftTests = tests.filter((t) => t.status === 'draft').length;

    return {
      totalAptitudeQuestions: qStats.totalAptitude,
      totalTechnicalQuestions: qStats.totalTechnical,
      activeQuestions: qStats.totalActive,
      publishedTests,
      draftTests,
      totalQuestions: qStats.totalAptitude + qStats.totalTechnical,
      totalTests: tests.length,
    };
  },
};
