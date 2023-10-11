import { SupportedLanguagesCodeUnion } from './langCodes';
import { GenerateMappedNever, LiteralUnion } from './utils';

export type MessageType =
  | 'audio'
  | 'contacts'
  | 'document'
  | 'image'
  | 'interactive'
  | 'location'
  | 'sticker'
  | 'template'
  | 'text'
  | 'video'
  | 'reaction';

export type Message = {
  /**
   * Defaults to text
   */
  type?: MessageType;
  messaging_product: LiteralUnion<'whatsapp'>;
  recipient_type?: LiteralUnion<'individual'>;
  /**
   * WhatsApp ID or phone number for the person you want to send a message to.
   * See https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers#formatting for more information.
   */
  to: string;
  /**
   * Required when type=template.
   */
  template?: TemplateMessage;
};

export type TemplateMessageParameter = {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  /**
   * required for type=text
   */
  text?: string;
  /**
   * required for type=currency
   */
  currency?: {
    fallback_value: string;
    /**
     * Currency code as defined in ISO 4217.
     */
    code: string;
    /**
     * Amount multiplied by 1000.
     */
    amount_1000: string;
  };
  date_time?: {
    fallback_value: string;
  };
};

//Adding never types to still have autocompletion when doing a union
export type TemplateMessageButtonParameter =
  GenerateMappedNever<TemplateMessageParameter> & {
    type: 'payload' | 'text' | 'catalog';
    /**
     * required for quick_reply buttons
     * Developer-defined payload that is returned when the button is clicked in addition to the display text on the button.
     */
    payload?: any;
    /**
     * required for url buttons
     */
    text?: string;
  };

export type TemplateMessageComponent = {
  type: 'header' | 'body' | 'button';
  /**
   * required when type=button
   */
  sub_type?: 'quick_reply' | 'url';
  /**
   * required when type=button
   */
  parameters?: TemplateMessageButtonParameter[] | TemplateMessageParameter[];
  /**
   * required when type=button
   */
  index?: number;
};

export type TemplateMessageLanguage = {
  /**
   * The code of the language or locale to use. Accepts both language and language_locale formats (e.g., en and en_US).
   */
  code: SupportedLanguagesCodeUnion;
};

export type TemplateMessage = {
  name: string;
  language: TemplateMessageLanguage;
  components: TemplateMessageComponent[];
};
