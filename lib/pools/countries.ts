export type HireVeriCountry = {
  name: string;
  isoCode: string;
  phoneCode: string;
};

function toFlag(isoCode: string) {
  return isoCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

const countryPool: HireVeriCountry[] = [
  { name: "Australia", isoCode: "AU", phoneCode: "+61" },
  { name: "Brazil", isoCode: "BR", phoneCode: "+55" },
  { name: "Canada", isoCode: "CA", phoneCode: "+1" },
  { name: "France", isoCode: "FR", phoneCode: "+33" },
  { name: "Germany", isoCode: "DE", phoneCode: "+49" },
  { name: "India", isoCode: "IN", phoneCode: "+91" },
  { name: "Indonesia", isoCode: "ID", phoneCode: "+62" },
  { name: "Ireland", isoCode: "IE", phoneCode: "+353" },
  { name: "Italy", isoCode: "IT", phoneCode: "+39" },
  { name: "Japan", isoCode: "JP", phoneCode: "+81" },
  { name: "Kenya", isoCode: "KE", phoneCode: "+254" },
  { name: "Malaysia", isoCode: "MY", phoneCode: "+60" },
  { name: "Mexico", isoCode: "MX", phoneCode: "+52" },
  { name: "Netherlands", isoCode: "NL", phoneCode: "+31" },
  { name: "New Zealand", isoCode: "NZ", phoneCode: "+64" },
  { name: "Nigeria", isoCode: "NG", phoneCode: "+234" },
  { name: "Philippines", isoCode: "PH", phoneCode: "+63" },
  { name: "Poland", isoCode: "PL", phoneCode: "+48" },
  { name: "Saudi Arabia", isoCode: "SA", phoneCode: "+966" },
  { name: "Singapore", isoCode: "SG", phoneCode: "+65" },
  { name: "South Africa", isoCode: "ZA", phoneCode: "+27" },
  { name: "South Korea", isoCode: "KR", phoneCode: "+82" },
  { name: "Spain", isoCode: "ES", phoneCode: "+34" },
  { name: "Sweden", isoCode: "SE", phoneCode: "+46" },
  { name: "Switzerland", isoCode: "CH", phoneCode: "+41" },
  { name: "Thailand", isoCode: "TH", phoneCode: "+66" },
  { name: "United Arab Emirates", isoCode: "AE", phoneCode: "+971" },
  { name: "United Kingdom", isoCode: "GB", phoneCode: "+44" },
  { name: "United States", isoCode: "US", phoneCode: "+1" },
  { name: "Vietnam", isoCode: "VN", phoneCode: "+84" },
];

export const hireVeriCountries = countryPool
  .slice()
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((country) => ({
    ...country,
    flag: toFlag(country.isoCode),
  }));
