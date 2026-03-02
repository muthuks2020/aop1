/**
 * normalizers.js — Shared Field Normalizers
 *
 * Single source of truth for backend → frontend field name mapping.
 * All service files import from here instead of duplicating inline normalizers.
 *
 * Backend v5 returns:
 *   productName, productCode, productFamily, unitCost, monthly_targets,
 *   category_id, color_class, is_revenue_only, display_order,
 *   employee_name, employee_code, territory_name, area_name, zone_name
 *
 * Frontend v4 components expect:
 *   name, code, subcategory, listPrice, monthlyTargets,
 *   categoryId, color, isRevenueOnly, displayOrder,
 *   salesRepName/tbmName/abmName/zbmName, territory, area, zone
 *
 * All normalizers use fallback chains (p.name || p.productName || '')
 * so they're safe to call on already-normalized data.
 *
 * @version 5.1.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. PRODUCT / COMMITMENT  (target entry grids, product cards)
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeProduct = (p) => {
  if (!p) return p;
  return {
    ...p,
    id:            p.id,
    name:          p.name          || p.productName    || p.product_name   || '',
    code:          p.code          || p.productCode    || p.product_code   || '',
    subcategory:   p.subcategory   || p.productFamily  || p.product_family || '',
    listPrice:     p.listPrice     ?? p.unitCost       ?? p.unit_cost      ?? 0,
    categoryId:    p.categoryId    || p.category_id    || p.productCategory || '',
    unit:          p.unit          || '',
    currency:      p.currency      || 'INR',
    monthlyTargets: p.monthlyTargets || p.monthly_targets || {},
    status:        p.status        || 'not_started',
    submittedAt:   p.submittedAt   || p.submitted_at   || null,
    approvedAt:    p.approvedAt    || p.approved_at     || null,
    approvedByCode: p.approvedByCode || p.approved_by_code || null,
    approvedByName: p.approvedByName || p.approved_by_name || null,
    territory:     p.territory     || p.territoryName  || p.territory_name || '',
    area:          p.area          || p.areaName       || p.area_name      || '',
    zone:          p.zone          || p.zoneName       || p.zone_name      || '',
    territoryCode: p.territoryCode || p.territory_code || '',
    areaCode:      p.areaCode      || p.area_code      || '',
    zoneCode:      p.zoneCode      || p.zone_code      || '',
    employeeCode:  p.employeeCode  || p.employee_code  || '',
    employeeName:  p.employeeName  || p.employee_name  || '',
    employeeRole:  p.employeeRole  || p.employee_role  || '',
    fiscalYearCode: p.fiscalYearCode || p.fiscal_year_code || '',
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. CATEGORY
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeCategory = (c) => {
  if (!c) return c;
  return {
    ...c,
    id:            c.id,
    name:          c.name,
    icon:          c.icon          || '',
    color:         c.color         || c.color_class    || '',
    isRevenueOnly: c.isRevenueOnly ?? c.is_revenue_only ?? false,
    displayOrder:  c.displayOrder  ?? c.display_order  ?? 99,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. SUBMISSION  (approval views)
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeSubmission = (s) => {
  if (!s) return s;
  const base = normalizeProduct(s);
  const empName = s.employeeName || s.employee_name || s.salesRepName || s.tbmName || s.abmName || s.zbmName || '';
  const empCode = s.employeeCode || s.employee_code || s.salesRepId   || s.tbmId   || s.abmId   || s.zbmId   || '';
  return {
    ...base,
    salesRepName: empName, salesRepId: empCode,
    tbmName: empName, tbmId: empCode,
    abmName: empName, abmId: empCode,
    zbmName: empName, zbmId: empCode,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. GEOGRAPHY TARGET
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeGeoTarget = (t) => {
  if (!t) return t;
  return {
    ...normalizeProduct(t),
    area: t.area || t.areaName || t.area_name || '',
    zone: t.zone || t.zoneName || t.zone_name || '',
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. ADMIN PRODUCT
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeAdminProduct = (p) => {
  if (!p) return p;
  return {
    ...p,
    name:        p.name        || p.productName   || p.product_name  || '',
    code:        p.code        || p.productCode   || p.product_code  || '',
    subcategory: p.subcategory || p.productFamily  || p.product_family || '',
    listPrice:   p.listPrice   ?? p.unitCost       ?? p.unit_cost     ?? 0,
    categoryId:  p.categoryId  || p.category_id    || p.productCategory || '',
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. USER / HIERARCHY
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeUser = (u) => {
  if (!u) return u;
  return {
    ...u,
    name:         u.name         || u.fullName     || u.full_name      || '',
    employeeCode: u.employeeCode || u.employee_code || '',
    role:         u.role         || '',
    territory:    u.territory    || u.territoryName || u.territory_name || '',
    area:         u.area         || u.areaName      || u.area_name     || '',
    zone:         u.zone         || u.zoneName      || u.zone_name     || '',
    reportsTo:    u.reportsTo    || u.reports_to    || '',
    isActive:     u.isActive     ?? u.is_active     ?? true,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. ARRAY HELPER
// ═══════════════════════════════════════════════════════════════════════════

export const normalizeArray = (arr, normalizer) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizer);
};
