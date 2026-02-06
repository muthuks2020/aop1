// Checker (Validator) Dashboard Page
import React, { useState } from 'react';
import { 
  ListChecks, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  User,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Eye,
  FileText
} from 'lucide-react';
import { Header, Card, StatCard, Button, Badge } from '../../components/common';
import { colors, shadows, borderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for pending validations
const mockPendingValidations = [
  {
    "id": "INS-2026-0350",
    "jobId": "JOB-AACS-173",
    "batchNo": "25-12-002",
    "productName": "3PIN GILLARD MALE & FEMALE",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2025-12-27T09:00:00",
    "checkpoints": 3,
    "passedCheckpoints": 3,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "normal",
    "notes": "All checkpoints passed. Visual inspection completed."
  },
  {
    "id": "RCNA-001",
    "jobId": "JOB-RCNA-001",
    "batchNo": "26-01-001",
    "productName": "CHANNEL FRAME - REGULAR",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-14T09:30:00",
    "checkpoints": 20,
    "passedCheckpoints": 20,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "high",
    "notes": "Comprehensive dimensional inspection completed. All 18 measurement checkpoints within tolerance."
  },
  {
    "id": "VAL-003",
    "jobId": "JOB-RCNA-011",
    "batchNo": "26-01-002",
    "productName": "CHANNEL CORRUGATED BOX-R",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-09T10:00:00",
    "checkpoints": 6,
    "passedCheckpoints": 6,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "normal",
    "notes": "Packaging material inspection. Dimensions and ply count verified."
  },
  {
    "id": "VAL-004",
    "jobId": "JOB-RCNA-034",
    "batchNo": "25-11-001",
    "productName": "BEARING-6008",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2025-11-26T09:00:00",
    "checkpoints": 3,
    "passedCheckpoints": 3,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "normal",
    "notes": "Visual inspection for bearing part number and damage check completed."
  },
  {
    "id": "VAL-005",
    "jobId": "JOB-RCNA-035",
    "batchNo": "26-01-003",
    "productName": "90 DEGREE LOCK & NUT",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-13T09:30:00",
    "checkpoints": 10,
    "passedCheckpoints": 10,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "high",
    "notes": "Precision dimensional inspection completed. All measurements within specified tolerances."
  },
  {
    "id": "INS-2026-0354",
    "jobId": "JOB-RCNA-104",
    "batchNo": "25-11-001",
    "productName": "EC REP STICKER",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2025-11-13T09:00:00",
    "checkpoints": 3,
    "passedCheckpoints": 3,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "normal",
    "notes": "Artwork verification and visual inspection completed."
  },
  {
    "id": "VAL-007",
    "jobId": "JOB-RSFA-061",
    "batchNo": "26-01-001",
    "productName": "3M.M HD WASHER",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-09T10:30:00",
    "checkpoints": 5,
    "passedCheckpoints": 5,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "normal",
    "notes": "Washer dimensional inspection - inner/outer diameter and thickness verified."
  },
  {
    "id": "VAL-008",
    "jobId": "JOB-EEWA-029",
    "batchNo": "26-01-002",
    "productName": "2 CORE WIRE COIL-23/60 T.F.R",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-19T09:00:00",
    "checkpoints": 3,
    "passedCheckpoints": 3,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "normal",
    "notes": "Electrical wire coil specification and damage check completed."
  },
  {
    "id": "INS-2026-0228",
    "jobId": "JOB-EETD-034",
    "batchNo": "26-01-003",
    "productName": "29V/3A TRANSFORMER",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-13T11:00:00",
    "checkpoints": 6,
    "passedCheckpoints": 6,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "high",
    "notes": "Electrical output voltage testing completed. All voltage outputs within tolerance."
  },
  {
    "id": "INS-2026-0276",
    "jobId": "JOB-RUBA-001",
    "batchNo": "26-01-001",
    "productName": "M.S BASE PLATE",
    "maker": "Radhakrishnan.S",
    "makerDept": "QC Department",
    "submittedAt": "2026-01-14T10:00:00",
    "checkpoints": 10,
    "passedCheckpoints": 10,
    "failedCheckpoints": 0,
    "status": "approved",
    "priority": "high",
    "notes": "Metal base plate dimensional inspection. All measurements verified."
  },
  {
    id: 'RCNA-001',
    jobId: 'JOB-002',
    batchNo: 'BATCH-2026-002',
    productName: 'Transducer Cable Assembly',
    maker: 'Priya Sharma',
    makerDept: 'QC Department',
    submittedAt: '2026-01-31T11:15:00',
    checkpoints: 8,
    passedCheckpoints: 8,
    failedCheckpoints: 0,
    status: 'pending_review',
    priority: 'medium',
    notes: 'All checkpoints passed',
  },
  {
    id: 'VAL-003',
    jobId: 'JOB-003',
    batchNo: 'BATCH-2026-003',
    productName: 'Display Panel Module',
    maker: 'Arun Patel',
    makerDept: 'QC Department',
    submittedAt: '2026-01-30T16:45:00',
    checkpoints: 15,
    passedCheckpoints: 13,
    failedCheckpoints: 2,
    status: 'pending_review',
    priority: 'high',
    notes: 'Visual defects found on 2 samples',
  },
];

const CheckerDashboard = () => {
  const { user } = useAuth();
  const [validations, setValidations] = useState(mockPendingValidations);
  const [selectedTab, setSelectedTab] = useState('pending');

  const stats = [
    { label: 'Pending Review', value: '6', change: '+2 today', icon: ListChecks, color: colors.roles.checker.primary },
    { label: 'Validated Today', value: '14', change: '+25% vs avg', icon: CheckCircle2, color: colors.success },
    { label: 'Rejected', value: '2', change: 'This week', icon: XCircle, color: colors.danger },
    { label: 'Avg. Review Time', value: '18 min', change: '-5 min', icon: Clock, color: colors.primary },
  ];

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: 6 },
    { id: 'validated', label: 'Validated', count: 14 },
    { id: 'rejected', label: 'Rejected', count: 2 },
  ];

  const handleValidate = (validationId, approved) => {
    // Handle validation action
    console.log(`Validation ${validationId}: ${approved ? 'Approved' : 'Rejected'}`);
    alert(`Inspection ${validationId} ${approved ? 'approved' : 'rejected'}!`);
  };

  const handleViewDetails = (validationId) => {
    window.location.href = `/checker/review/${validationId}`;
  };

  return (
    <div style={styles.page}>
      <Header 
        title="QC Validation Center" 
        subtitle={`Welcome, ${user?.name || 'Validator'}! Review and validate QC inspections.`}
        showSearch
      />

      <div style={styles.content}>
        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Validations Section */}
        <section style={styles.section}>
          {/* Tabs */}
          <div style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                style={{
                  ...styles.tab,
                  borderBottomColor: selectedTab === tab.id ? colors.roles.checker.primary : 'transparent',
                  color: selectedTab === tab.id ? colors.roles.checker.primary : colors.neutral[500],
                }}
              >
                {tab.label}
                <span style={{
                  ...styles.tabCount,
                  background: selectedTab === tab.id ? colors.roles.checker.light : colors.neutral[100],
                  color: selectedTab === tab.id ? colors.roles.checker.primary : colors.neutral[600],
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Validations List */}
          <div style={styles.validationsList}>
            {validations.map((validation) => (
              <ValidationCard
                key={validation.id}
                validation={validation}
                onValidate={handleValidate}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </section>

        {/* Summary Section */}
        <div style={styles.summaryRow}>
          <Card>
            <h3 style={styles.cardTitle}>Today's Summary</h3>
            <div style={styles.summaryStats}>
              <SummaryItem 
                icon={CheckCircle2} 
                label="Approved" 
                value="12" 
                color={colors.success} 
              />
              <SummaryItem 
                icon={XCircle} 
                label="Rejected" 
                value="2" 
                color={colors.danger} 
              />
              <SummaryItem 
                icon={AlertTriangle} 
                label="Issues Found" 
                value="4" 
                color={colors.warning} 
              />
            </div>
          </Card>

          <Card>
            <h3 style={styles.cardTitle}>Top Makers This Week</h3>
            <div style={styles.leaderboard}>
              {[
                { name: 'Ravi Kumar', count: 28, rate: '98%' },
                { name: 'Priya Sharma', count: 24, rate: '96%' },
                { name: 'Arun Patel', count: 22, rate: '95%' },
              ].map((maker, idx) => (
                <div key={idx} style={styles.leaderboardItem}>
                  <div style={styles.leaderboardRank}>#{idx + 1}</div>
                  <div style={styles.leaderboardInfo}>
                    <span style={styles.leaderboardName}>{maker.name}</span>
                    <span style={styles.leaderboardMeta}>{maker.count} inspections</span>
                  </div>
                  <div style={styles.leaderboardRate}>{maker.rate}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Validation Card Component
const ValidationCard = ({ validation, onValidate, onViewDetails }) => {
  const passRate = Math.round((validation.passedCheckpoints / validation.checkpoints) * 100);
  const hasIssues = validation.failedCheckpoints > 0;

  return (
    <Card style={styles.validationCard}>
      <div style={styles.validationHeader}>
        <div style={styles.validationBadges}>
          <Badge type="priority" value={validation.priority} size="sm" />
          {hasIssues && (
            <Badge 
              type="status" 
              value="rejected" 
              size="sm"
              style={{ background: colors.warningLight, color: colors.warning }}
            >
              {validation.failedCheckpoints} Issues
            </Badge>
          )}
        </div>
        <span style={styles.submittedTime}>
          Submitted {formatTimeAgo(validation.submittedAt)}
        </span>
      </div>

      <div style={styles.validationMain}>
        <div style={styles.validationInfo}>
          <h3 style={styles.validationTitle}>{validation.productName}</h3>
          <div style={styles.validationMeta}>
            <span><strong>Batch:</strong> {validation.batchNo}</span>
            <span>
              <User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {validation.maker}
            </span>
          </div>
          {validation.notes && (
            <p style={styles.validationNotes}>
              <strong>Notes:</strong> {validation.notes}
            </p>
          )}
        </div>

        <div style={styles.validationResults}>
          <div style={styles.resultCircle}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke={colors.neutral[100]}
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke={hasIssues ? colors.warning : colors.success}
                strokeWidth="6"
                strokeDasharray={`${passRate * 2.2} ${220 - passRate * 2.2}`}
                strokeDashoffset="55"
                strokeLinecap="round"
              />
            </svg>
            <div style={styles.resultValue}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{passRate}%</span>
              <span style={{ fontSize: '10px', color: colors.neutral[500] }}>Pass Rate</span>
            </div>
          </div>
          <div style={styles.checkpointSummary}>
            <div style={styles.checkpointItem}>
              <CheckCircle2 size={14} color={colors.success} />
              <span>{validation.passedCheckpoints} Passed</span>
            </div>
            <div style={styles.checkpointItem}>
              <XCircle size={14} color={colors.danger} />
              <span>{validation.failedCheckpoints} Failed</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.validationFooter}>
        <Button 
          variant="ghost" 
          size="sm"
          icon={Eye}
          onClick={() => onViewDetails(validation.id)}
        >
          View Details
        </Button>
        <div style={styles.actionButtons}>
          <Button 
            variant="outline" 
            size="sm"
            icon={ThumbsDown}
            style={{ borderColor: colors.danger, color: colors.danger }}
            onClick={() => onValidate(validation.id, false)}
          >
            Reject
          </Button>
          <Button 
            variant="success" 
            size="sm"
            icon={ThumbsUp}
            onClick={() => onValidate(validation.id, true)}
          >
            Approve
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Summary Item Component
const SummaryItem = ({ icon: Icon, label, value, color }) => (
  <div style={styles.summaryItem}>
    <div style={{ ...styles.summaryIcon, background: `${color}15`, color }}>
      <Icon size={20} />
    </div>
    <div style={styles.summaryContent}>
      <span style={styles.summaryValue}>{value}</span>
      <span style={styles.summaryLabel}>{label}</span>
    </div>
  </div>
);

// Utility functions
const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.neutral[50],
  },

  content: {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  tabsContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: `1px solid ${colors.neutral[200]}`,
  },

  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    marginBottom: '-1px',
  },

  tabCount: {
    padding: '2px 8px',
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 600,
  },

  validationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  validationCard: {
    // Card styles are inherited
  },

  validationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },

  validationBadges: {
    display: 'flex',
    gap: '8px',
  },

  submittedTime: {
    fontSize: '12px',
    color: colors.neutral[500],
  },

  validationMain: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
  },

  validationInfo: {
    flex: 1,
  },

  validationTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.neutral[800],
    margin: '0 0 8px',
  },

  validationMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: colors.neutral[600],
    marginBottom: '8px',
  },

  validationNotes: {
    fontSize: '13px',
    color: colors.neutral[600],
    padding: '8px 12px',
    background: colors.neutral[50],
    borderRadius: borderRadius.md,
    margin: 0,
  },

  validationResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },

  resultCircle: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultValue: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: colors.neutral[800],
  },

  checkpointSummary: {
    display: 'flex',
    gap: '16px',
  },

  checkpointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: colors.neutral[600],
  },

  validationFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.neutral[100]}`,
  },

  actionButtons: {
    display: 'flex',
    gap: '8px',
  },

  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  },

  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.neutral[800],
    margin: '0 0 20px',
  },

  summaryStats: {
    display: 'flex',
    justifyContent: 'space-around',
  },

  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  summaryIcon: {
    width: '44px',
    height: '44px',
    borderRadius: borderRadius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
  },

  summaryValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: colors.neutral[800],
  },

  summaryLabel: {
    fontSize: '12px',
    color: colors.neutral[500],
  },

  leaderboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: colors.neutral[50],
    borderRadius: borderRadius.md,
  },

  leaderboardRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: colors.roles.checker.light,
    color: colors.roles.checker.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },

  leaderboardInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  leaderboardName: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.neutral[800],
  },

  leaderboardMeta: {
    fontSize: '12px',
    color: colors.neutral[500],
  },

  leaderboardRate: {
    fontSize: '14px',
    fontWeight: 700,
    color: colors.success,
  },
};

export default CheckerDashboard;
