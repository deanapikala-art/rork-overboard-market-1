export type ProductOptionType = 'checkbox' | 'text' | 'textarea' | 'select' | 'file';

export interface SelectChoice {
  label: string;
  value: string;
  price_delta: number;
}

export interface ProductOption {
  id: string;
  product_ref: string;
  code: string;
  label: string;
  type: ProductOptionType;
  required: boolean;
  price_delta: number;
  helper_text?: string;
  proof_required?: boolean;
  choices?: SelectChoice[];
}

export const productOptions: ProductOption[] = [
  {
    id: 'opt1',
    product_ref: '1',
    code: 'monogram',
    label: 'Add Monogram',
    type: 'text',
    required: false,
    price_delta: 8,
    helper_text: 'Up to 3 letters (e.g., JAM)',
  },
  {
    id: 'opt2',
    product_ref: '1',
    code: 'gift_wrap',
    label: 'Gift Wrap',
    type: 'checkbox',
    required: false,
    price_delta: 5,
    helper_text: 'Beautiful presentation with ribbon',
  },
  {
    id: 'opt3',
    product_ref: '1',
    code: 'glaze_color',
    label: 'Glaze Color',
    type: 'select',
    required: true,
    price_delta: 0,
    helper_text: 'Choose your preferred glaze finish',
    choices: [
      { label: 'Ocean Blue', value: 'ocean_blue', price_delta: 0 },
      { label: 'Forest Green', value: 'forest_green', price_delta: 0 },
      { label: 'Sunset Orange', value: 'sunset_orange', price_delta: 3 },
      { label: 'Pearl White', value: 'pearl_white', price_delta: 0 },
    ],
  },
  {
    id: 'opt4',
    product_ref: '5',
    code: 'pet_photo',
    label: 'Pet Photo',
    type: 'file',
    required: true,
    price_delta: 0,
    helper_text: 'Upload a high-quality photo of your pet (JPG, PNG, or PDF)',
    proof_required: true,
  },
  {
    id: 'opt5',
    product_ref: '5',
    code: 'pet_name',
    label: 'Pet Name',
    type: 'text',
    required: true,
    price_delta: 0,
    helper_text: 'Name to include on the portrait',
  },
  {
    id: 'opt6',
    product_ref: '5',
    code: 'frame_color',
    label: 'Frame Color',
    type: 'select',
    required: true,
    price_delta: 0,
    helper_text: 'Custom frame color',
    choices: [
      { label: 'Natural Wood', value: 'natural', price_delta: 0 },
      { label: 'Black', value: 'black', price_delta: 0 },
      { label: 'White', value: 'white', price_delta: 0 },
      { label: 'Gold', value: 'gold', price_delta: 25 },
    ],
  },
  {
    id: 'opt7',
    product_ref: '4',
    code: 'engraving',
    label: 'Custom Engraving',
    type: 'textarea',
    required: false,
    price_delta: 15,
    helper_text: 'Add a personal message or names (up to 50 characters)',
  },
  {
    id: 'opt8',
    product_ref: '4',
    code: 'rush_order',
    label: 'Rush Order (2-3 days)',
    type: 'checkbox',
    required: false,
    price_delta: 25,
    helper_text: 'Priority production and shipping',
    proof_required: true,
  },
  {
    id: 'opt9',
    product_ref: '8',
    code: 'length',
    label: 'Scarf Length',
    type: 'select',
    required: true,
    price_delta: 0,
    helper_text: 'Choose your preferred length',
    choices: [
      { label: 'Short (60")', value: 'short', price_delta: 0 },
      { label: 'Medium (72")', value: 'medium', price_delta: 5 },
      { label: 'Long (84")', value: 'long', price_delta: 10 },
    ],
  },
  {
    id: 'opt10',
    product_ref: '8',
    code: 'dye_preference',
    label: 'Color Preference',
    type: 'textarea',
    required: false,
    price_delta: 0,
    helper_text: 'Describe your preferred colors or let us surprise you',
  },
];
