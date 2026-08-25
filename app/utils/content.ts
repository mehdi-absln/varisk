/**
 * The project text, from the specification document (۱۴۰۰/۰۳/۱۴).
 *
 * The document is a copy deck, not a design: it gives a headline, three short
 * feature blurbs, long explanatory sections and a closing statement. Editing is
 * typographic only — half-spaces (نیم‌فاصله), Persian quotation marks, and
 * sentence breaks where the original ran clauses together with commas. The one
 * exception is a retitled section, flagged where it happens.
 *
 * The «تیم سازندهٔ نرم‌افزار» block is not carried over: it named the original
 * commissioning organisations, which this build does not claim. The credit it
 * stood for now lives in `BUILDER`, rendered as the footer credit.
 */

/** Product name. Everything renders from here — one edit renames the app. */
export const SITE_NAME = 'واریسک'

/** Who designed and built it. */
export const BUILDER = 'مهدی آبسالان'

export interface CopyBlock {
  title: string
  body: string
}

/** Headline pair, used by the hero and repeated by the closing band. */
export const HEADLINE = {
  title: 'به راحتی ارزش در معرض خطر را محاسبه کنید!',
  subtitle:
    'نرم‌افزار آنلاین محاسبهٔ ریسک بازار یا ارزش در معرض خطر (VAR) پرتفوی معاملاتی سهام بانک‌ها',
} as const

/** The three short blurbs — one line each, shown as cards under the hero. */
export const FEATURES: (CopyBlock & { icon: 'clock' | 'link' | 'share' })[] = [
  {
    icon: 'clock',
    title: 'صرفه‌جویی در زمان',
    body: 'این نرم‌افزار صرفه‌جویی قابل توجهی در منابع برای کاربران به ارمغان می‌آورد.',
  },
  {
    icon: 'link',
    title: 'اتصال مستقیم',
    body: 'این نرم‌افزار قادر به محاسبهٔ آنلاین و آفلاین ارزش در معرض خطر می‌باشد.',
  },
  {
    icon: 'share',
    title: 'اشتراک‌گذاری',
    body: 'اشتراک‌گذاری در این نرم‌افزار برای سایر کاربران امکان‌پذیر می‌باشد.',
  },
]

/** The long sections, in document order. */
export const SECTIONS: CopyBlock[] = [
  {
    // The document titles this «صرفه‌جویی در زمان», the same words the feature
    // strip above already uses. One page cannot carry the heading twice, so the
    // long form takes the argument it actually makes as its title instead.
    title: 'پایان محاسبات زمان‌بر',
    body:
      'استفاده از این نرم‌افزار صرفه‌جویی‌های قابل توجهی در منابع (زمان، هزینه‌ها و ...) '
      + 'برای کاربران به همراه دارد. محاسبهٔ ارزش در معرض خطر سهام پرتفوی برای کاربران '
      + 'زمان‌بر یا اصطلاحاً (time consuming) می‌باشد؛ لازم به ذکر است که با وجود این '
      + 'نرم‌افزار این معضل برطرف گردیده است.',
  },
  {
    title: 'ارزش در معرض خطر',
    body:
      'ارزش در معرض خطر (VAR) یک معیار اندازه‌گیری ریسک است که حداکثر زیان مورد انتظار '
      + 'را در یک موقعیت سرمایه‌گذاری خاص و سطح اطمینان مطمئنی تخمین می‌زند. ارزش '
      + 'سرمایه‌گذاری از ضرب تعداد سهام نماد آن سرمایه‌گذاری در قیمت پایانی (Close) '
      + 'قیمت روز قبل از محاسبه به دست می‌آید.',
  },
]

/** Closing statement: the regulatory basis for the calculation. */
export const CLOSING = {
  title: HEADLINE.title,
  body:
    'این نرم‌افزار با توجه به مقررات جاری کمیتهٔ بال (BCBS) با بهره‌گیری از مدل '
    + 'ریسک‌سنجی با رویکرد ماتریس ریسک اقدام به احتساب مقدار سرمایهٔ لازم برای پوشش '
    + 'ریسک بازار یا ارزش در معرض خطر (VAR) سهام پرتفوی معاملاتی می‌نماید.',
} as const
