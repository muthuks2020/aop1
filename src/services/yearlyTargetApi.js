import { apiRequest } from './apiClient';

export const yearlyTargetMethods = {

  async getYearlyTargets(fiscalYear, rolePath = 'tbm') {
    return apiRequest(`/${rolePath}/yearly-targets?fy=${fiscalYear}`);
  },

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

  async publishYearlyTargets(fiscalYear, memberIds, rolePath = 'tbm') {
    return apiRequest(`/${rolePath}/yearly-targets/publish`, {
      method: 'POST',
      body: JSON.stringify({ fiscalYear, memberIds }),
    });
  },
};

export default yearlyTargetMethods;
