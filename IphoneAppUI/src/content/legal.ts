/**
 * Legal copy mirrored from insider-flow/web (terms + privacy pages).
 * Localized for zh-Hant / zh-Hans; ko falls back to zh-Hans; English kept as fallback.
 */

import type { Locale } from "@/i18n/types";

export const CONTACT_EMAIL = "team@insiderflow.asia";

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  id: "terms" | "privacy";
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  relatedLabel: string;
  relatedPath: "/legal/privacy" | "/legal/terms";
};

const TERMS_EN: LegalDocument = {
  id: "terms",
  title: "Terms of Service",
  lastUpdated: "2026-05-05",
  sections: [
    {
      heading: "Service scope",
      body: "Insider Flow provides informational tooling around market and insider-trading-related data. Content is provided on an as-is basis and may be delayed, incomplete, or corrected over time.",
    },
    {
      heading: "No investment advice",
      body: "Insider Flow is not investment, legal, accounting, or tax advice. You are solely responsible for your decisions and should consult qualified professionals where needed.",
    },
    {
      heading: "Accounts and acceptable use",
      body: "You are responsible for safeguarding your account credentials. Abuse, scraping beyond allowed limits, credential sharing, reverse engineering, or attempts to degrade service availability are prohibited.",
    },
    {
      heading: "Subscriptions and billing",
      body: "Paid plans (if enabled) renew based on your selected billing cycle unless canceled. Billing, refunds, and platform-specific terms may be managed by the provider handling your purchase (for example Stripe, Apple, or Google) and are subject to their policies.",
    },
    {
      heading: "Availability and changes",
      body: "We may modify, suspend, or discontinue features at any time. We may update these terms when required by legal, security, or product changes.",
    },
    {
      heading: "Liability limits",
      body: "To the maximum extent allowed by law, Insider Flow is not liable for indirect, incidental, special, consequential, or punitive damages, including trading losses or missed opportunities.",
    },
    {
      heading: "Contact",
      body: `Questions about these terms: ${CONTACT_EMAIL}`,
    },
  ],
  relatedLabel: "Privacy Policy",
  relatedPath: "/legal/privacy",
};

const PRIVACY_EN: LegalDocument = {
  id: "privacy",
  title: "Privacy Policy",
  lastUpdated: "2026-05-05",
  sections: [
    {
      heading: "What we collect",
      body: "Account email, authentication identifiers (Google/Facebook when used), session data, watchlist and app preferences, and usage logs required for reliability and abuse prevention.",
    },
    {
      heading: "How we use data",
      body: "We use your data to authenticate users, provide app features, send transactional emails (verification/password reset), improve product stability, and secure the platform.",
    },
    {
      heading: "Payments",
      body: "Payments and subscriptions are processed by third-party providers (for example Stripe, Apple, Google, RevenueCat). We do not store full card numbers in Insider Flow.",
    },
    {
      heading: "Sharing",
      body: "We share data only with service providers required to operate Insider Flow (hosting, database, authentication, email, billing) and when legally required.",
    },
    {
      heading: "Retention",
      body: "We keep data while your account is active and as needed for security, legal obligations, and auditability. Data is deleted or anonymized when no longer required.",
    },
    {
      heading: "Your controls",
      body: `You can request account deletion and data export by emailing ${CONTACT_EMAIL}. We may verify account ownership before processing requests.`,
    },
    {
      heading: "Contact",
      body: `Privacy questions: ${CONTACT_EMAIL}`,
    },
  ],
  relatedLabel: "Terms of Service",
  relatedPath: "/legal/terms",
};

const TERMS_ZH_HANT: LegalDocument = {
  id: "terms",
  title: "服務條款",
  lastUpdated: "2026-05-05",
  sections: [
    {
      heading: "服務範圍",
      body: "Insider Flow 提供與市場及內幕交易相關的資訊工具。內容按「現狀」提供，可能延遲、不完整，或隨時間更正。",
    },
    {
      heading: "非投資建議",
      body: "Insider Flow 不構成投資、法律、會計或稅務建議。您須自行對決策負責，並在需要時諮詢合資格專業人士。",
    },
    {
      heading: "帳戶與合理使用",
      body: "您須妥善保管帳戶憑證。禁止濫用、超出允許範圍的爬取、共用憑證、逆向工程，或試圖影響服務可用性。",
    },
    {
      heading: "訂閱與帳單",
      body: "付費方案（如已啟用）將按您選擇的帳單週期自動續期，直至取消。帳單、退款及平台相關條款可能由處理您購買的供應商（例如 Stripe、Apple 或 Google）管理，並受其政策約束。",
    },
    {
      heading: "可用性與變更",
      body: "我們可隨時修改、暫停或終止功能。因法律、安全或產品需要，我們可能更新本條款。",
    },
    {
      heading: "責任限制",
      body: "在法律允許的最大範圍內，Insider Flow 不對間接、附帶、特殊、後果性或懲罰性損害負責，包括交易損失或錯失機會。",
    },
    {
      heading: "聯絡我們",
      body: `有關本條款的問題：${CONTACT_EMAIL}`,
    },
  ],
  relatedLabel: "私隱政策",
  relatedPath: "/legal/privacy",
};

const PRIVACY_ZH_HANT: LegalDocument = {
  id: "privacy",
  title: "私隱政策",
  lastUpdated: "2026-05-05",
  sections: [
    {
      heading: "我們收集的資料",
      body: "帳戶電郵、身份驗證識別碼（如使用 Google/Facebook）、工作階段資料、關注清單與應用偏好，以及為可靠性與防止濫用所需的日誌。",
    },
    {
      heading: "資料用途",
      body: "我們使用您的資料以驗證用戶、提供應用功能、發送交易電郵（驗證/重設密碼）、提升產品穩定性及保障平台安全。",
    },
    {
      heading: "付款",
      body: "付款與訂閱由第三方處理（例如 Stripe、Apple、Google、RevenueCat）。Insider Flow 不儲存完整卡號。",
    },
    {
      heading: "分享",
      body: "我們僅與營運 Insider Flow 所需的服務供應商（託管、資料庫、身份驗證、電郵、帳單）分享資料，或在法律要求時分享。",
    },
    {
      heading: "保留",
      body: "在帳戶有效期間及為安全、法律義務與審計所需而保留資料；不再需要時將刪除或匿名化。",
    },
    {
      heading: "您的控制權",
      body: `您可電郵 ${CONTACT_EMAIL} 要求刪除帳戶或匯出資料。我們可能在處理前核實帳戶擁有權。`,
    },
    {
      heading: "聯絡我們",
      body: `私隱相關問題：${CONTACT_EMAIL}`,
    },
  ],
  relatedLabel: "服務條款",
  relatedPath: "/legal/terms",
};

const TERMS_ZH_HANS: LegalDocument = {
  id: "terms",
  title: "服务条款",
  lastUpdated: "2026-05-05",
  sections: [
    {
      heading: "服务范围",
      body: "Insider Flow 提供与市场及内幕交易相关的信息工具。内容按「现状」提供，可能延迟、不完整，或随时间更正。",
    },
    {
      heading: "非投资建议",
      body: "Insider Flow 不构成投资、法律、会计或税务建议。您须自行对决策负责，并在需要时咨询合资格专业人士。",
    },
    {
      heading: "账户与合理使用",
      body: "您须妥善保管账户凭证。禁止滥用、超出允许范围的爬取、共用凭证、逆向工程，或试图影响服务可用性。",
    },
    {
      heading: "订阅与账单",
      body: "付费方案（如已启用）将按您选择的账单周期自动续期，直至取消。账单、退款及平台相关条款可能由处理您购买的供应商（例如 Stripe、Apple 或 Google）管理，并受其政策约束。",
    },
    {
      heading: "可用性与变更",
      body: "我们可随时修改、暂停或终止功能。因法律、安全或产品需要，我们可能更新本条款。",
    },
    {
      heading: "责任限制",
      body: "在法律允许的最大范围内，Insider Flow 不对间接、附带、特殊、后果性或惩罚性损害负责，包括交易损失或错失机会。",
    },
    {
      heading: "联系我们",
      body: `有关本条款的问题：${CONTACT_EMAIL}`,
    },
  ],
  relatedLabel: "隐私政策",
  relatedPath: "/legal/privacy",
};

const PRIVACY_ZH_HANS: LegalDocument = {
  id: "privacy",
  title: "隐私政策",
  lastUpdated: "2026-05-05",
  sections: [
    {
      heading: "我们收集的资料",
      body: "账户邮箱、身份验证标识（如使用 Google/Facebook）、会话数据、关注清单与应用偏好，以及为可靠性与防止滥用所需的日志。",
    },
    {
      heading: "资料用途",
      body: "我们使用您的资料以验证用户、提供应用功能、发送交易邮件（验证/重置密码）、提升产品稳定性及保障平台安全。",
    },
    {
      heading: "付款",
      body: "付款与订阅由第三方处理（例如 Stripe、Apple、Google、RevenueCat）。Insider Flow 不存储完整卡号。",
    },
    {
      heading: "分享",
      body: "我们仅与营运 Insider Flow 所需的服务供应商（托管、数据库、身份验证、邮件、账单）分享资料，或在法律要求时分享。",
    },
    {
      heading: "保留",
      body: "在账户有效期间及为安全、法律义务与审计所需而保留资料；不再需要时将删除或匿名化。",
    },
    {
      heading: "您的控制权",
      body: `您可电邮 ${CONTACT_EMAIL} 要求删除账户或导出资料。我们可能在处理前核实账户拥有权。`,
    },
    {
      heading: "联系我们",
      body: `隐私相关问题：${CONTACT_EMAIL}`,
    },
  ],
  relatedLabel: "服务条款",
  relatedPath: "/legal/terms",
};

const BY_LOCALE: Record<Locale, { terms: LegalDocument; privacy: LegalDocument }> = {
  "zh-Hant": { terms: TERMS_ZH_HANT, privacy: PRIVACY_ZH_HANT },
  "zh-Hans": { terms: TERMS_ZH_HANS, privacy: PRIVACY_ZH_HANS },
  ko: { terms: TERMS_ZH_HANS, privacy: PRIVACY_ZH_HANS },
};

export function getLegalDocument(id: string, locale: Locale = "zh-Hant"): LegalDocument | null {
  const pack = BY_LOCALE[locale] ?? BY_LOCALE["zh-Hant"];
  const fallback = { terms: TERMS_EN, privacy: PRIVACY_EN };
  if (id === "terms") return pack.terms ?? fallback.terms;
  if (id === "privacy") return pack.privacy ?? fallback.privacy;
  return null;
}

/** @deprecated use getLegalDocument(id, locale) */
export const TERMS_DOCUMENT = TERMS_EN;
export const PRIVACY_DOCUMENT = PRIVACY_EN;
