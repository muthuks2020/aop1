export const TARGET_THRESHOLDS = {

  ABNORMAL_HIGH_MULTIPLIER: 2.5,
  ABNORMAL_LOW_MULTIPLIER:  0.25,

  DEFAULT_MAX_MONTHLY_QTY: 99999,

  CATEGORY_MONTHLY_CAPS: {
    equipment: 500,
    iol:       50000,
    ovd:       20000,
    pharma:    100000,
    mis:       999999,
    others:    999999,
  },

  CY_VS_LY_WARN_THRESHOLD: 1.0,

  GUIDANCE_MIN_PCT: 0.90,
};

export default TARGET_THRESHOLDS;
