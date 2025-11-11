import { ProductOption } from '@/mocks/productOptions';
import { CustomizationValue } from '@/app/contexts/CartContext';

interface SelectionData {
  type: ProductOption['type'];
  code: string;
  value: string | boolean;
  price_delta: number;
  proof_required?: boolean;
}

export const CustomizationUtils = {
  priceForSelection: (base: number, selections: SelectionData[]): number => {
    const delta = selections.reduce((acc, s) => acc + (Number(s.price_delta) || 0), 0);
    return Number(base) + delta;
  },

  requiresProof: (optionsSelected: SelectionData[]): boolean => {
    return optionsSelected.some(s => !!s.proof_required);
  },

  validate: (optionDefs: ProductOption[], selections: Record<string, string | boolean>): string[] => {
    const byCode = selections;
    const errors: string[] = [];

    optionDefs.forEach(def => {
      const sel = byCode[def.code];
      if (def.required) {
        const hasValue =
          (def.type === "checkbox" && sel === true) ||
          (def.type === "text" && typeof sel === 'string' && sel.trim() !== '') ||
          (def.type === "textarea" && typeof sel === 'string' && sel.trim() !== '') ||
          (def.type === "select" && !!sel) ||
          (def.type === "file" && !!sel);
        if (!hasValue) errors.push(`${def.label} is required`);
      }
    });

    return errors;
  },

  buildSelectionData: (
    options: ProductOption[],
    customizationState: Record<string, string | boolean>,
    uploadedFiles: Record<string, { name: string; uri: string; mimeType: string }>
  ): SelectionData[] => {
    const result: SelectionData[] = [];

    options.forEach(opt => {
      let hasValue = false;
      let value: string | boolean = '';
      let priceDelta = opt.price_delta;

      if (opt.type === 'checkbox' && customizationState[opt.code]) {
        hasValue = true;
        value = true;
      } else if (opt.type === 'select' && customizationState[opt.code]) {
        const choice = opt.choices?.find(c => c.value === customizationState[opt.code]);
        if (choice) {
          hasValue = true;
          value = choice.value;
          priceDelta = choice.price_delta;
        }
      } else if ((opt.type === 'text' || opt.type === 'textarea') && customizationState[opt.code]) {
        hasValue = true;
        value = customizationState[opt.code] as string;
      } else if (opt.type === 'file' && uploadedFiles[opt.code]) {
        hasValue = true;
        value = uploadedFiles[opt.code].name;
      }

      if (hasValue) {
        result.push({
          type: opt.type,
          code: opt.code,
          value,
          price_delta: priceDelta,
          proof_required: opt.proof_required,
        });
      }
    });

    return result;
  },

  formatCustomizationsForCart: (
    options: ProductOption[],
    customizationState: Record<string, string | boolean>,
    uploadedFiles: Record<string, { name: string; uri: string; mimeType: string }>
  ): CustomizationValue[] => {
    const result: CustomizationValue[] = [];

    options.forEach(opt => {
      if (opt.type === 'checkbox' && customizationState[opt.code]) {
        result.push({ code: opt.code, label: opt.label, value: 'Yes', price_delta: opt.price_delta });
      } else if (opt.type === 'select' && customizationState[opt.code]) {
        const choice = opt.choices?.find(c => c.value === customizationState[opt.code]);
        if (choice) {
          result.push({ code: opt.code, label: opt.label, value: choice.label, price_delta: choice.price_delta });
        }
      } else if ((opt.type === 'text' || opt.type === 'textarea') && customizationState[opt.code]) {
        result.push({ code: opt.code, label: opt.label, value: customizationState[opt.code] as string, price_delta: opt.price_delta });
      } else if (opt.type === 'file' && uploadedFiles[opt.code]) {
        result.push({ code: opt.code, label: opt.label, value: uploadedFiles[opt.code].name, price_delta: opt.price_delta });
      }
    });

    return result;
  },
};
