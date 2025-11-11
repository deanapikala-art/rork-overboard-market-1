export type PolicyType = 'privacy' | 'terms' | 'codeOfConduct' | 'trustSafety';

export const OVERBOARD_COLORS = {
  primary: '#4C7D7C',
  text: '#2B3440', 
  accent: '#EE6E56',
  white: '#FFFFFF',
} as const;

export interface PolicyTemplate {
  type: PolicyType;
  icon: string;
  title: string;
  bannerTitle: (version: number) => string;
  bannerMessage: string;
  emailSubject: (version: number) => string;
  emailSummaryPoints: string[];
  ctaLabel: string;
}

export const POLICY_TEMPLATES: Record<Exclude<PolicyType, 'trustSafety'>, PolicyTemplate> = {
  terms: {
    type: 'terms',
    icon: '📜',
    title: 'Terms of Use',
    bannerTitle: (version: number) => `Terms of Use Updated (v${version})`,
    bannerMessage: "We've clarified our vendor and buyer responsibilities and updated our dispute process. Please review and accept the new Terms to continue using Overboard Market.",
    emailSubject: (version: number) => `We've updated our Terms of Use 🌊 (v${version})`,
    emailSummaryPoints: [
      'Clearer language about vendor responsibilities and dispute resolution',
      'Streamlined policies for payments and shipping',
      'New acknowledgment process for updated terms',
    ],
    ctaLabel: 'Review Terms',
  },
  privacy: {
    type: 'privacy',
    icon: '🔒',
    title: 'Privacy Policy',
    bannerTitle: (version: number) => `Privacy Policy Updated (v${version})`,
    bannerMessage: "We've improved transparency on how your data is used and stored securely. Please review and accept the new Privacy Policy.",
    emailSubject: (version: number) => `Overboard Market Privacy Policy has been updated 🔒 (v${version})`,
    emailSummaryPoints: [
      'Clarified what data we collect and why',
      'Added transparency around third-party partners (e.g., payment apps)',
      'Reaffirmed that Overboard Market never sells personal data',
    ],
    ctaLabel: 'Review Policy',
  },
  codeOfConduct: {
    type: 'codeOfConduct',
    icon: '🌊',
    title: 'Code of Conduct',
    bannerTitle: (version: number) => `Community Code of Conduct Updated (v${version})`,
    bannerMessage: "We've added new guidelines for respectful communication and safe local pickups. Please review and accept the updated Code of Conduct.",
    emailSubject: (version: number) => `Our Code of Conduct just got even better 🌊 (v${version})`,
    emailSummaryPoints: [
      'More detail about pickup safety and respectful communication',
      'Updated review guidelines for transparency',
      'Reminder about zero-tolerance for harassment or scams',
    ],
    ctaLabel: 'Review Code of Conduct',
  },
};

export const TRUST_SAFETY_TEMPLATE: PolicyTemplate & { type: 'trustSafety' } = {
  type: 'trustSafety',
  icon: '🛡️',
  title: 'Trust & Safety Policy',
  bannerTitle: (version: number) => `Trust & Safety Policy Updated (v${version})`,
  bannerMessage: "We've enhanced reporting tools and scam prevention measures. Please review the updated Trust & Safety Policy.",
  emailSubject: (version: number) => `We've strengthened your Trust & Safety protections 🛡️ (v${version})`,
  emailSummaryPoints: [
    'Expanded reporting and dispute-resolution tools',
    'Added scam-detection filters in messages',
    'Simplified vendor verification process',
  ],
  ctaLabel: 'Review Policy',
};

export const ALL_POLICY_TEMPLATES: Record<PolicyType, PolicyTemplate | (PolicyTemplate & { type: 'trustSafety' })> = {
  ...POLICY_TEMPLATES,
  trustSafety: TRUST_SAFETY_TEMPLATE,
};

export interface PolicyEmailTemplate {
  subject: string;
  preheader: string;
  greeting: (firstName: string) => string;
  intro: (policyTitle: string, version: number) => string;
  summaryPoints: string[];
  ctaLabel: string;
  ctaLink: string;
  disclaimer: (policyTitle: string) => string;
  signature: string;
  footer: string;
}

export const generatePolicyEmail = (
  policyType: PolicyType,
  version: number,
  firstName: string,
  baseUrl: string
): PolicyEmailTemplate => {
  const template = POLICY_TEMPLATES[policyType];
  
  return {
    subject: template.emailSubject(version),
    preheader: `Important update to Overboard Market ${template.title}`,
    greeting: (name: string) => `Hi ${name},`,
    intro: (title: string, v: number) => 
      `We've updated our **${title} (v${v})** to make Overboard Market safer, more transparent, and easier to use.`,
    summaryPoints: template.emailSummaryPoints,
    ctaLabel: 'Read Updated Policy',
    ctaLink: `${baseUrl}/legal/policy-center?tab=${policyType}`,
    disclaimer: (title: string) => 
      `By continuing to use Overboard Market, you agree to the new ${title}.`,
    signature: 'The Overboard Market Team 🌊',
    footer: "You're receiving this message because you have an active Overboard Market account. Need help? Contact info@overboardnorth.com.",
  };
};

export const getPolicyIcon = (policyType: PolicyType): string => {
  if (policyType === 'trustSafety') return TRUST_SAFETY_TEMPLATE.icon;
  return POLICY_TEMPLATES[policyType]?.icon || '📄';
};

export const getPolicyTitle = (policyType: PolicyType): string => {
  if (policyType === 'trustSafety') return TRUST_SAFETY_TEMPLATE.title;
  return POLICY_TEMPLATES[policyType]?.title || 'Policy';
};

export const getPolicyBannerTitle = (policyType: PolicyType, version: number): string => {
  if (policyType === 'trustSafety') return TRUST_SAFETY_TEMPLATE.bannerTitle(version);
  return POLICY_TEMPLATES[policyType]?.bannerTitle(version) || `Policy Updated (v${version})`;
};

export const getPolicyBannerMessage = (policyType: PolicyType): string => {
  if (policyType === 'trustSafety') return TRUST_SAFETY_TEMPLATE.bannerMessage;
  return POLICY_TEMPLATES[policyType]?.bannerMessage || 'Please review and accept the new policy.';
};

export const getPolicyCTALabel = (policyType: PolicyType): string => {
  if (policyType === 'trustSafety') return TRUST_SAFETY_TEMPLATE.ctaLabel;
  return POLICY_TEMPLATES[policyType]?.ctaLabel || 'Review Policy';
};

export interface NotificationPayload {
  title: string;
  message: string;
  link: string;
  policyType: PolicyType;
  oldVersion: number | null;
  newVersion: number;
}

export const generateNotificationPayload = (
  policyType: PolicyType,
  oldVersion: number | null,
  newVersion: number
): NotificationPayload => {
  const template = policyType === 'trustSafety' ? TRUST_SAFETY_TEMPLATE : POLICY_TEMPLATES[policyType];
  
  const tabMapping: Record<PolicyType, string> = {
    privacy: 'privacy',
    terms: 'terms',
    codeOfConduct: 'conduct',
    trustSafety: 'safety',
  };
  
  return {
    title: template.bannerTitle(newVersion),
    message: template.bannerMessage,
    link: `/legal/policy-center?tab=${tabMapping[policyType]}`,
    policyType,
    oldVersion,
    newVersion,
  };
};
