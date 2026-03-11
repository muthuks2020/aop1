/**
 * yearlyTargetApi.js — v5 Live Backend
 *
 * Yearly target methods are now integrated into each role's API service
 * (TBMApiService, ABMApiService, ZBMApiService, SalesHeadApiService).
 *
 * This file provides a standalone export for backward-compatibility
 * with any components that still import from yearlyTargetApi.js directly.
 *
 * @version 5.1.0 — Migrated from mock to live API
 */

import { apiRequest } from './apiClient';

/**
 * Standalone yearly target methods.
 * 
 * Usage:
 *   import yearlyTargetMethods from './yearlyTargetApi';
 *   const data = await yearlyTargetMethods.getYearlyTargets('2026-27', 'tbm');
 *
 * Or merge into an existing service:
 *   export const TBMApiService = { ...existingMethods, ...yearlyTargetMethods };
 *
 * @param {string} rolePath — URL prefix: 'tbm', 'abm', 'zbm', 'saleshead'
 */
export const yearlyTargetMethods = {

  /**
   * GET /{role}/yearly-targets?fy={fiscalYear}
   */
  async getYearlyTargets(fiscalYear, rolePath = 'tbm') {
    return apiRequest(`/${rolePath}/yearly-targets?fy=${fiscalYear}`);
  },

  /**
   * POST /{role}/yearly-targets/save
   */
  async saveYearlyTargets(fiscalYear, members, rolePath = 'tbm') {
    return apiRequest(`/${rolePath}/yearly-targets/save`, {
      method: 'POST',
      body: JSON.stringify({
        fiscalYear,
        members: members.map((m) => ({
          id: m.id,
          cyTarget: m.cyTarget,
          cyTargetValue: m.cyTargetValue,
          categoryBreakdown: m.categoryBreakdown?.map((c) => ({
            id: c.id,
            cyTarget: c.cyTarget,
            cyTargetValue: c.cyTargetValue,
          })),
        })),
      }),
    });
  },

  /**
   * POST /{role}/yearly-targets/publish
   */
  async publishYearlyTargets(fiscalYear, memberIds, rolePath = 'tbm') {
    return apiRequest(`/${rolePath}/yearly-targets/publish`, {
      method: 'POST',
      body: JSON.stringify({ fiscalYear, memberIds }),
    });
  },
};

export default yearlyTargetMethods;
