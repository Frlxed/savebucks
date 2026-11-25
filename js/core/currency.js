const currencyCodes = (() => {
  try { return Intl.supportedValuesOf('currency'); }
  catch { return ['AED','ARS','AUD','BDT','BGN','BHD','BRL','CAD','CHF','CLP','CNY','COP','CZK','DKK','EGP','EUR','GBP','GHS','HKD','HUF','IDR','ILS','INR','ISK','JPY','KES','KRW','KWD','LKR','MAD','MXN','MYR','NGN','NOK','NZD','OMR','PHP','PKR','PLN','QAR','RON','RUB','SAR','SEK','SGD','THB','TRY','TWD','TZS','UAH','UGX','USD','UYU','VND','ZAR']; }
})();
const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
export const CURRENCIES = [...new Set([...currencyCodes, 'USD'])].sort().map((code) => {
  let name;
  try { name = displayNames.of(code); } catch { name = code; }
  return { code, name: name && name !== code ? name : code };
});
export const getCurrency = (state) => state?.preferences?.currency || 'USD';
export function money(value, currency = 'USD') {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0); }
  catch { return `${currency} ${(Number(value) || 0).toFixed(2)}`; }
}
export function currencyOptions(selected = 'USD') {
  if (!CURRENCIES.some(({ code }) => code === selected)) CURRENCIES.push({ code: selected, name: selected });
  return CURRENCIES.map(({ code, name }) => `<option value="${code}" ${code === selected ? 'selected' : ''}>${code} — ${name}</option>`).join('');
}
