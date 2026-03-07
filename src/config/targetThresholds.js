/**
 * targetThresholds.js — Target Entry Validation Thresholds
 *
 * Single config file for all business validation benchmarks.
 * Business can update these values here without touching component code.
 *
 * PART 2 — Items 2, 3, 13
 *
 * @version 1.0.0
 */

export const TARGET_THRESHOLDS = {

  // ─────────────────────────────────────────────────────────────────
  // ITEM 2 — Abnormal monthly entry vs LY (per product per month)
  // Warning fires when CY entry is suspiciously high or low vs LY.
  // Only triggered when LY value > 0 (can't benchmark against zero).
  // ─────────────────────────────────────────────────────────────────
  ABNORMAL_HIGH_MULTIPLIER: 2.5,   // CY > 250% of LY monthly qty → warn
  ABNORMAL_LOW_MULTIPLIER:  0.25,  // CY < 25%  of LY monthly qty → warn

  // ─────────────────────────────────────────────────────────────────
  // ITEM 13 — Absolute monthly unit ceiling per product
  // Applies regardless of LY history. Prevents runaway entries.
  // Update per-category limits in CATEGORY_MONTHLY_CAPS below.
  // ─────────────────────────────────────────────────────────────────
  DEFAULT_MAX_MONTHLY_QTY: 99999,  // fallback if no category-specific cap

  CATEGORY_MONTHLY_CAPS: {
    equipment: 500,    // Equipment: max 500 units/month per product
    iol:       50000,  // IOL: max 50 000 units/month per product
    ovd:       20000,  // OVD: max 20 000 units/month per product
    pharma:    100000, // Pharma: max 100 000 units/month
    mis:       999999, // MIS: revenue-only, no qty cap needed
    others:    999999, // Others: revenue-only
  },

  // ─────────────────────────────────────────────────────────────────
  // ITEM 3 — CY yearly total vs LY achievement
  // Warning fires when total CY across all products is below LY total.
  // Set to 1.0 to warn on any shortfall; lower to allow some headroom.
  // ─────────────────────────────────────────────────────────────────
  CY_VS_LY_WARN_THRESHOLD: 1.0,   // warn if CY total < 100% of LY total

  // ─────────────────────────────────────────────────────────────────
  // ITEM 10 — ZBM Approval: guidance compliance (ABM level)
  // ABM is flagged "below guidance" if their total submitted CY
  // is less than GUIDANCE_MIN_PCT × their assigned yearly target.
  // ─────────────────────────────────────────────────────────────────
  GUIDANCE_MIN_PCT: 0.90,  // 90% of guidance must be covered to avoid flag
};

export default TARGET_THRESHOLDS;
