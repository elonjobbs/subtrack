export interface CancelLink {
  merchant: string;
  url: string;
  instructions?: string;
}

// Database of cancel links for common subscriptions
export const CANCEL_LINKS: CancelLink[] = [
  {
    merchant: 'netflix',
    url: 'https://www.netflix.com/cancelplan',
    instructions: 'Sign in and click Cancel Membership'
  },
  {
    merchant: 'spotify',
    url: 'https://www.spotify.com/account/subscription/',
    instructions: 'Click "Change plan" then "Cancel Premium"'
  },
  {
    merchant: 'amazon prime',
    url: 'https://www.amazon.com/mc?ref_=ya_d_l_prime_mc',
    instructions: 'Click "End Membership and Benefits"'
  },
  {
    merchant: 'disney',
    url: 'https://www.disneyplus.com/account',
    instructions: 'Go to Billing Details and click Cancel Subscription'
  },
  {
    merchant: 'hulu',
    url: 'https://secure.hulu.com/account',
    instructions: 'Click Cancel under Your Subscription'
  },
  {
    merchant: 'youtube',
    url: 'https://www.youtube.com/paid_memberships',
    instructions: 'Click on membership and select Cancel membership'
  },
  {
    merchant: 'apple',
    url: 'https://apps.apple.com/account/subscriptions',
    instructions: 'Find subscription and click Cancel Subscription'
  },
  {
    merchant: 'hbo',
    url: 'https://www.max.com/account',
    instructions: 'Click on your subscription and Cancel'
  },
  {
    merchant: 'paramount',
    url: 'https://www.paramountplus.com/account/',
    instructions: 'Go to Plan & Billing and click Cancel Subscription'
  },
  {
    merchant: 'audible',
    url: 'https://www.audible.com/account',
    instructions: 'Go to Account Details and click Cancel membership'
  },
  {
    merchant: 'adobe',
    url: 'https://account.adobe.com/plans',
    instructions: 'Click Manage plan then Cancel plan'
  },
  {
    merchant: 'microsoft',
    url: 'https://account.microsoft.com/services',
    instructions: 'Find subscription and click Cancel'
  },
  {
    merchant: 'dropbox',
    url: 'https://www.dropbox.com/account/plan',
    instructions: 'Click Cancel plan'
  },
  {
    merchant: 'linkedin',
    url: 'https://www.linkedin.com/premium/manage',
    instructions: 'Click Cancel subscription'
  },
  {
    merchant: 'canva',
    url: 'https://www.canva.com/settings/billing-and-teams',
    instructions: 'Click on your plan and Cancel subscription'
  },
  {
    merchant: 'grammarly',
    url: 'https://account.grammarly.com/subscription',
    instructions: 'Click Cancel Subscription'
  },
  {
    merchant: 'notion',
    url: 'https://www.notion.so/settings',
    instructions: 'Go to Settings & members > Billing > Cancel plan'
  },
  {
    merchant: 'zoom',
    url: 'https://zoom.us/billing',
    instructions: 'Click Cancel Subscription'
  },
  {
    merchant: 'nordvpn',
    url: 'https://my.nordaccount.com/dashboard/subscriptions/',
    instructions: 'Click on subscription and Cancel Auto-Renewal'
  },
  {
    merchant: 'expressvpn',
    url: 'https://www.expressvpn.com/subscriptions',
    instructions: 'Click Turn off automatic renewal'
  },
  {
    merchant: 'crunchyroll',
    url: 'https://www.crunchyroll.com/acct/?action=service',
    instructions: 'Click Cancel membership'
  },
  {
    merchant: 'duolingo',
    url: 'https://www.duolingo.com/settings/subscriptions',
    instructions: 'Click Cancel subscription'
  }
];

export function findCancelLink(merchantName: string): CancelLink | null {
  const normalized = merchantName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  
  for (const link of CANCEL_LINKS) {
    if (normalized.includes(link.merchant)) {
      return link;
    }
  }
  
  return null;
}
