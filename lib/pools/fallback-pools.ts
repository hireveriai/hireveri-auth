export type FallbackIndustry = {
  id: string;
  name: string;
  sortOrder: number;
};

export type FallbackCompanySize = {
  id: string;
  label: string;
  min: number;
  max: number | null;
  sortOrder: number;
};

export type FallbackRecruiterRole = {
  id: string;
  name: string;
  sortOrder: number;
  legacyRoleId: number;
};

export type FallbackCountry = {
  name: string;
  isoCode: string;
  phoneCode: string;
  flag: string;
};

export const fallbackIndustries: FallbackIndustry[] = [
  { id: "fallback-industry-technology", name: "Technology", sortOrder: 1 },
  { id: "fallback-industry-financial-services", name: "Financial Services", sortOrder: 2 },
  { id: "fallback-industry-healthcare", name: "Healthcare", sortOrder: 3 },
  { id: "fallback-industry-manufacturing", name: "Manufacturing", sortOrder: 4 },
  { id: "fallback-industry-retail", name: "Retail & E-commerce", sortOrder: 5 },
  { id: "fallback-industry-education", name: "Education", sortOrder: 6 },
  { id: "fallback-industry-consulting", name: "Consulting", sortOrder: 7 },
  { id: "fallback-industry-logistics", name: "Logistics & Supply Chain", sortOrder: 8 },
  { id: "fallback-industry-media", name: "Media & Entertainment", sortOrder: 9 },
  { id: "fallback-industry-energy", name: "Energy & Utilities", sortOrder: 10 },
];

export const fallbackCompanySizes: FallbackCompanySize[] = [
  { id: "fallback-company-size-1-10", label: "1-10", min: 1, max: 10, sortOrder: 1 },
  { id: "fallback-company-size-11-50", label: "11-50", min: 11, max: 50, sortOrder: 2 },
  { id: "fallback-company-size-51-200", label: "51-200", min: 51, max: 200, sortOrder: 3 },
  { id: "fallback-company-size-201-1000", label: "201-1000", min: 201, max: 1000, sortOrder: 4 },
  { id: "fallback-company-size-1000-plus", label: "1000+", min: 1001, max: null, sortOrder: 5 },
];

export const fallbackRecruiterRoles: FallbackRecruiterRole[] = [
  { id: "fallback-role-talent-acquisition", name: "Talent Acquisition", sortOrder: 1, legacyRoleId: 1 },
  { id: "fallback-role-hr-business-partner", name: "HR Business Partner", sortOrder: 2, legacyRoleId: 2 },
  { id: "fallback-role-founder-ceo", name: "Founder / CEO", sortOrder: 3, legacyRoleId: 3 },
  { id: "fallback-role-hiring-manager", name: "Hiring Manager", sortOrder: 4, legacyRoleId: 4 },
  { id: "fallback-role-recruitment-operations", name: "Recruitment Operations", sortOrder: 5, legacyRoleId: 5 },
  { id: "fallback-role-people-operations", name: "People Operations", sortOrder: 6, legacyRoleId: 6 },
];

export const fallbackCountries: FallbackCountry[] = [
  { name: "India", isoCode: "IN", phoneCode: "+91", flag: "🇮🇳" },
  { name: "United States", isoCode: "US", phoneCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", isoCode: "GB", phoneCode: "+44", flag: "🇬🇧" },
  { name: "Canada", isoCode: "CA", phoneCode: "+1", flag: "🇨🇦" },
  { name: "Australia", isoCode: "AU", phoneCode: "+61", flag: "🇦🇺" },
  { name: "Germany", isoCode: "DE", phoneCode: "+49", flag: "🇩🇪" },
  { name: "France", isoCode: "FR", phoneCode: "+33", flag: "🇫🇷" },
  { name: "Singapore", isoCode: "SG", phoneCode: "+65", flag: "🇸🇬" },
  { name: "United Arab Emirates", isoCode: "AE", phoneCode: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", isoCode: "SA", phoneCode: "+966", flag: "🇸🇦" },
  { name: "South Africa", isoCode: "ZA", phoneCode: "+27", flag: "🇿🇦" },
  { name: "Japan", isoCode: "JP", phoneCode: "+81", flag: "🇯🇵" },
  { name: "South Korea", isoCode: "KR", phoneCode: "+82", flag: "🇰🇷" },
  { name: "Indonesia", isoCode: "ID", phoneCode: "+62", flag: "🇮🇩" },
  { name: "Malaysia", isoCode: "MY", phoneCode: "+60", flag: "🇲🇾" },
  { name: "Thailand", isoCode: "TH", phoneCode: "+66", flag: "🇹🇭" },
  { name: "Vietnam", isoCode: "VN", phoneCode: "+84", flag: "🇻🇳" },
  { name: "Brazil", isoCode: "BR", phoneCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", isoCode: "MX", phoneCode: "+52", flag: "🇲🇽" },
  { name: "Netherlands", isoCode: "NL", phoneCode: "+31", flag: "🇳🇱" },
];
