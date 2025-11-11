export type SafetyRuleType = 'keyword' | 'pattern' | 'url' | 'contact_info' | 'payment_method';
export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';
export type SafetyAction = 'warn' | 'block' | 'flag' | 'review';

export interface SafetyFilterRule {
  ruleId: string;
  ruleType: SafetyRuleType;
  pattern: string;
  severity: SafetySeverity;
  action: SafetyAction;
  description: string;
  isActive: boolean;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  shouldBlock: boolean;
  shouldWarn: boolean;
  shouldFlag: boolean;
  matchedRules: {
    rule: SafetyFilterRule;
    matchedContent: string;
  }[];
  warnings: string[];
}

const defaultRules: SafetyFilterRule[] = [
  {
    ruleId: 'RULE_URL_SUSPICIOUS',
    ruleType: 'url',
    pattern: '(bit\\.ly|tinyurl|goo\\.gl|t\\.co|ow\\.ly)',
    severity: 'high',
    action: 'warn',
    description: 'Suspicious shortened URL detected',
    isActive: true,
  },
  {
    ruleId: 'RULE_OFFSITE_PAYMENT',
    ruleType: 'keyword',
    pattern: '(wire transfer|western union|moneygram|gift card|bitcoin|crypto|cashapp|cash app)',
    severity: 'critical',
    action: 'warn',
    description: 'Off-platform payment method mentioned',
    isActive: true,
  },
  {
    ruleId: 'RULE_CONTACT_PHONE',
    ruleType: 'pattern',
    pattern: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
    severity: 'medium',
    action: 'warn',
    description: 'Phone number detected',
    isActive: true,
  },
  {
    ruleId: 'RULE_CONTACT_EMAIL',
    ruleType: 'pattern',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
    severity: 'medium',
    action: 'warn',
    description: 'Email address detected',
    isActive: true,
  },
  {
    ruleId: 'RULE_URGENT_SCAM',
    ruleType: 'keyword',
    pattern: '(urgent|act now|limited time|expire|suspended account|verify account|claim prize)',
    severity: 'high',
    action: 'flag',
    description: 'Urgency scam language',
    isActive: true,
  },
  {
    ruleId: 'RULE_IMPERSONATION',
    ruleType: 'keyword',
    pattern: '(overboard support|overboard admin|customer service|technical support)',
    severity: 'critical',
    action: 'flag',
    description: 'Potential platform impersonation',
    isActive: true,
  },
  {
    ruleId: 'RULE_PERSONAL_INFO',
    ruleType: 'keyword',
    pattern: '(social security|ssn|credit card|bank account|routing number|password)',
    severity: 'critical',
    action: 'block',
    description: 'Requesting sensitive personal information',
    isActive: true,
  },
  {
    ruleId: 'RULE_OFFSITE_DEAL',
    ruleType: 'keyword',
    pattern: '(better deal|cheaper|discount|contact me directly|meet outside|skip fees)',
    severity: 'high',
    action: 'warn',
    description: 'Attempting to move transaction off-platform',
    isActive: true,
  },
  {
    ruleId: 'RULE_VENMO_PAYPAL',
    ruleType: 'keyword',
    pattern: '(venmo|paypal|zelle|send money)',
    severity: 'medium',
    action: 'warn',
    description: 'Direct payment app mention (use with caution)',
    isActive: true,
  },
];

export function checkMessageSafety(
  message: string,
  customRules?: SafetyFilterRule[]
): SafetyCheckResult {
  const rules = customRules || defaultRules;
  const matchedRules: { rule: SafetyFilterRule; matchedContent: string }[] = [];
  const warnings: string[] = [];

  let shouldBlock = false;
  let shouldWarn = false;
  let shouldFlag = false;

  const lowerMessage = message.toLowerCase();

  for (const rule of rules) {
    if (!rule.isActive) continue;

    try {
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = lowerMessage.match(regex);

      if (matches) {
        matchedRules.push({
          rule,
          matchedContent: matches[0],
        });

        if (rule.action === 'block') {
          shouldBlock = true;
        } else if (rule.action === 'warn') {
          shouldWarn = true;
          warnings.push(getWarningMessage(rule));
        } else if (rule.action === 'flag') {
          shouldFlag = true;
        }
      }
    } catch (error) {
      console.error(`[SafetyFilters] Error checking rule ${rule.ruleId}:`, error);
    }
  }

  return {
    isSafe: matchedRules.length === 0,
    shouldBlock,
    shouldWarn,
    shouldFlag,
    matchedRules,
    warnings,
  };
}

function getWarningMessage(rule: SafetyFilterRule): string {
  switch (rule.ruleId) {
    case 'RULE_URL_SUSPICIOUS':
      return '⚠️ This message contains a shortened URL. Be cautious clicking links from people you don\'t know.';
    case 'RULE_OFFSITE_PAYMENT':
      return '🚨 Warning: Never use wire transfers, gift cards, or cryptocurrency for Overboard Market purchases. These payment methods are not protected.';
    case 'RULE_CONTACT_PHONE':
      return '📱 Phone number detected. Be cautious sharing personal contact information before completing a transaction.';
    case 'RULE_CONTACT_EMAIL':
      return '✉️ Email address detected. Keep communications on Overboard Market for your protection.';
    case 'RULE_OFFSITE_DEAL':
      return '⚠️ This message may be attempting to move the transaction off-platform. Always complete purchases through Overboard Market.';
    case 'RULE_VENMO_PAYPAL':
      return '💳 This message mentions direct payment apps. Use Overboard Market\'s checkout for buyer/seller protection.';
    case 'RULE_PERSONAL_INFO':
      return '🛡️ Never share sensitive personal information like SSN, credit cards, or passwords through messages.';
    default:
      return '⚠️ This message may contain unsafe content. Please proceed with caution.';
  }
}

export function sanitizeMessage(message: string): string {
  const sensitivePatterns = [
    { pattern: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, replacement: '[SSN REDACTED]' },
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD NUMBER REDACTED]' },
  ];

  let sanitized = message;

  for (const { pattern, replacement } of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

export function getSeverityColor(severity: SafetySeverity): string {
  switch (severity) {
    case 'low':
      return '#10B981';
    case 'medium':
      return '#F59E0B';
    case 'high':
      return '#EF4444';
    case 'critical':
      return '#DC2626';
    default:
      return '#6B7280';
  }
}

export function getSeverityLabel(severity: SafetySeverity): string {
  switch (severity) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    case 'critical':
      return 'Critical Risk';
    default:
      return 'Unknown';
  }
}
