import { CustomizationValue } from '@/app/contexts/CartContext';

export interface PaymentMemoData {
  orderIntentId: string;
  productTitle: string;
  customizations?: CustomizationValue[];
}

export function generateCompressedSummary(customizations?: CustomizationValue[]): string {
  if (!customizations || customizations.length === 0) {
    return '';
  }

  return customizations
    .map((custom) => {
      const key = custom.code.toUpperCase().substring(0, 8);
      let val = '';
      
      if (typeof custom.value === 'boolean') {
        val = custom.value ? 'YES' : 'NO';
      } else {
        val = String(custom.value).substring(0, 12);
      }

      if (custom.price_delta > 0) {
        val += `:+${custom.price_delta}`;
      } else if (custom.price_delta < 0) {
        val += `:${custom.price_delta}`;
      }

      return `${key}:${val}`;
    })
    .join(';');
}

export function generatePaymentMemo(data: PaymentMemoData): string {
  const summary = generateCompressedSummary(data.customizations);
  const productTitle = data.productTitle.substring(0, 30);
  
  if (summary) {
    return `ON-${data.orderIntentId} ${productTitle} ${summary}`;
  }
  
  return `ON-${data.orderIntentId} ${productTitle}`;
}

export function generateVenmoDeeplink(
  username: string,
  amount: number,
  memo: string
): string {
  const encodedNote = encodeURIComponent(memo);
  return `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount.toFixed(2)}&note=${encodedNote}`;
}

export function generatePayPalMeLink(
  username: string,
  amount: number
): string {
  return `https://paypal.me/${username}/${amount.toFixed(2)}`;
}

export function generateEcommerceUrl(
  baseUrl: string,
  memo: string,
  amount?: number
): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.append('ref', memo);
    if (amount) {
      url.searchParams.append('amount', amount.toFixed(2));
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}
