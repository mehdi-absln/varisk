import json
import sys
import numpy as np
import scipy.stats as stats
import xlsxwriter

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# ---------------------------------------------------------------------------
# داده‌های فیکسچر آزمایشی کمّی (Synthetic Quantitative Test Fixture)
# ---------------------------------------------------------------------------
data = {
    "stocks": [
        {
            "name": "فولاد مبارکه",
            "quantity": 1000,
            "prices": [100.0, 110.0, 105.0, 120.0, 118.0, 125.0]
        },
        {
            "name": "بانک ملت",
            "quantity": 500,
            "prices": [200.0, 204.0, 199.0, 210.0, 214.0, 220.0]
        },
        {
            "name": "ایران خودرو",
            "quantity": 2000,
            "prices": [50.0, 49.0, 51.0, 52.0, 50.0, 53.0]
        }
    ],
    "marketPrices": [1000.0, 1020.0, 1010.0, 1050.0, 1045.0, 1070.0]
}

# 1. محاسبه بازدهی‌های روزانه
stock_returns = []
for s in data["stocks"]:
    p = np.array(s["prices"], dtype=np.float64)
    ret = (p[1:] - p[:-1]) / p[:-1]
    stock_returns.append(ret)

market_p = np.array(data["marketPrices"], dtype=np.float64)
market_ret = (market_p[1:] - market_p[:-1]) / market_p[:-1]
stock_returns = np.array(stock_returns)

# 2. ارزش و وزن‌ها
quantities = [s["quantity"] for s in data["stocks"]]
latest_prices = [s["prices"][-1] for s in data["stocks"]]
values = [q * p for q, p in zip(quantities, latest_prices)]
total_value = float(sum(values))
weights = np.array([v / total_value for v in values], dtype=np.float64)

# 3. شاخص‌های آماری
means = [float(np.mean(r)) for r in stock_returns]
variances = [float(np.var(r, ddof=1)) for r in stock_returns]
std_devs = [float(np.std(r, ddof=1)) for r in stock_returns]

# 4. ماتریس کوواریانس و همبستگی
cov_matrix = np.cov(stock_returns, ddof=1)
corr_matrix = np.corrcoef(stock_returns)

# 5. ضریب بتا
var_market = float(np.var(market_ret, ddof=1))
betas = []
for r in stock_returns:
    cov_m = float(np.cov(r, market_ret, ddof=1)[0, 1])
    betas.append(float(cov_m / var_market))

# 6. بازدهی و ریسک پرتفوی
port_mean = float(np.sum(weights * np.array(means)))
port_variance = float(weights @ cov_matrix @ weights)
port_std_dev = float(np.sqrt(port_variance))

# 7. سطوح VaR پارامتریک برای افق‌های ۱ روزه و ۱۰ روزه
confidences = [90, 95, 99]

var_1day = []
for conf in confidences:
    z = float(stats.norm.ppf(conf / 100.0))
    ratio = z * port_std_dev
    amount = ratio * total_value
    var_1day.append({
        "confidence": conf,
        "z": z,
        "ratio": ratio,
        "amount": amount
    })

var_10day = []
for conf in confidences:
    z = float(stats.norm.ppf(conf / 100.0))
    ratio = z * port_std_dev * np.sqrt(10.0)
    amount = ratio * total_value
    var_10day.append({
        "confidence": conf,
        "z": z,
        "ratio": ratio,
        "amount": amount
    })

# ذخیره در فیکسچر تست
benchmark_result = {
    "quantities": quantities,
    "values": values,
    "totalValue": total_value,
    "weights": weights.tolist(),
    "means": means,
    "variances": variances,
    "stdDevs": std_devs,
    "covariance": cov_matrix.tolist(),
    "correlation": corr_matrix.tolist(),
    "betas": betas,
    "portfolioMean": port_mean,
    "portfolioStdDev": port_std_dev,
    "var1Day": var_1day,
    "var10Day": var_10day
}

with open("e:/Projects/varisk/tests/fixtures/benchmark.json", "w", encoding="utf-8") as f:
    json.dump(benchmark_result, f, ensure_ascii=False, indent=2)

print("Fixture successfully saved to tests/fixtures/benchmark.json")

# ---------------------------------------------------------------------------
# ساخت فایل اکسل جامع با فرمول‌های واقعی و اعشار کامل
# ---------------------------------------------------------------------------
excel_file = "e:/Projects/varisk/varisk_validation_excel.xlsx"
wb = xlsxwriter.Workbook(excel_file)

fmt_hdr = wb.add_format({'bold': True, 'bg_color': '#0F172A', 'font_color': '#F8FAFC', 'border': 1, 'align': 'center'})
fmt_cell = wb.add_format({'border': 1, 'align': 'center'})
fmt_num = wb.add_format({'border': 1, 'num_format': '#,##0.00', 'align': 'right'})
fmt_pct = wb.add_format({'border': 1, 'num_format': '0.0000%', 'align': 'right'})
fmt_dec = wb.add_format({'border': 1, 'num_format': '0.000000', 'align': 'right'})

# برگه ۱: داده‌ها و بازدهی
ws1 = wb.add_worksheet("داده‌ها و بازدهی")
ws1.right_to_left()

ws1.write(0, 0, "روز", fmt_hdr)
ws1.write(0, 1, "فولاد مبارکه (قیمت)", fmt_hdr)
ws1.write(0, 2, "بانک ملت (قیمت)", fmt_hdr)
ws1.write(0, 3, "ایران خودرو (قیمت)", fmt_hdr)
ws1.write(0, 4, "شاخص کل (قیمت)", fmt_hdr)

ws1.write(0, 6, "دوره", fmt_hdr)
ws1.write(0, 7, "بازدهی فولاد", fmt_hdr)
ws1.write(0, 8, "بازدهی ملت", fmt_hdr)
ws1.write(0, 9, "بازدهی خودرو", fmt_hdr)
ws1.write(0, 10, "بازدهی شاخص", fmt_hdr)

for i in range(len(data["marketPrices"])):
    r = i + 1
    ws1.write(r, 0, f"روز {i+1}", fmt_cell)
    ws1.write(r, 1, data["stocks"][0]["prices"][i], fmt_num)
    ws1.write(r, 2, data["stocks"][1]["prices"][i], fmt_num)
    ws1.write(r, 3, data["stocks"][2]["prices"][i], fmt_num)
    ws1.write(r, 4, data["marketPrices"][i], fmt_num)

for i in range(1, len(data["marketPrices"])):
    r = i
    r_src = i + 1
    r_prev = i
    ws1.write(r, 6, f"دوره {i}", fmt_cell)
    ws1.write_formula(r, 7, f"=(B{r_src+1}-B{r_prev+1})/B{r_prev+1}", fmt_pct)
    ws1.write_formula(r, 8, f"=(C{r_src+1}-C{r_prev+1})/C{r_prev+1}", fmt_pct)
    ws1.write_formula(r, 9, f"=(D{r_src+1}-D{r_prev+1})/D{r_prev+1}", fmt_pct)
    ws1.write_formula(r, 10, f"=(E{r_src+1}-E{r_prev+1})/E{r_prev+1}", fmt_pct)

# برگه ۲: محاسبات ریسک و VaR
ws2 = wb.add_worksheet("محاسبات آماری و VaR")
ws2.right_to_left()

names = ["فولاد مبارکه", "بانک ملت", "ایران خودرو"]
cols = ['H', 'I', 'J']

ws2.write(0, 0, "سهم", fmt_hdr)
ws2.write(0, 1, "تعداد سهم", fmt_hdr)
ws2.write(0, 2, "آخرین قیمت", fmt_hdr)
ws2.write(0, 3, "ارزش موضع (ریال)", fmt_hdr)
ws2.write(0, 4, "وزن در پرتفوی", fmt_hdr)
ws2.write(0, 5, "میانگین بازدهی", fmt_hdr)
ws2.write(0, 6, "واریانس نمونه (VAR.S)", fmt_hdr)
ws2.write(0, 7, "انحراف معیار (STDEV.S)", fmt_hdr)
ws2.write(0, 8, "بتا نسبت به بازار (SLOPE)", fmt_hdr)

for idx, name in enumerate(names):
    r = idx + 1
    c = cols[idx]
    ws2.write(r, 0, name, fmt_cell)
    ws2.write(r, 1, quantities[idx], fmt_num)
    ws2.write(r, 2, latest_prices[idx], fmt_num)
    ws2.write_formula(r, 3, f"=B{r+1}*C{r+1}", fmt_num)
    ws2.write_formula(r, 4, f"=D{r+1}/$D$5", fmt_pct)
    ws2.write_formula(r, 5, f"=AVERAGE('داده‌ها و بازدهی'!{c}$2:{c}$6)", fmt_pct)
    ws2.write_formula(r, 6, f"=VAR.S('داده‌ها و بازدهی'!{c}$2:{c}$6)", fmt_dec)
    ws2.write_formula(r, 7, f"=STDEV.S('داده‌ها و بازدهی'!{c}$2:{c}$6)", fmt_pct)
    ws2.write_formula(r, 8, f"=SLOPE('داده‌ها و بازدهی'!{c}$2:{c}$6, 'داده‌ها و بازدهی'!$K$2:$K$6)", fmt_dec)

ws2.write(4, 0, "مجموع پرتفوی", fmt_hdr)
ws2.write(4, 1, "", fmt_cell)
ws2.write(4, 2, "", fmt_cell)
ws2.write_formula(4, 3, "=SUM(D2:D4)", fmt_num)
ws2.write_formula(4, 4, "=SUM(E2:E4)", fmt_pct)
ws2.write_formula(4, 5, "=SUMPRODUCT(E2:E4, F2:F4)", fmt_pct)
ws2.write(4, 6, "-", fmt_cell)
ws2.write(4, 7, "-", fmt_cell)
ws2.write(4, 8, "-", fmt_cell)

# ماتریس کوواریانس
ws2.write(7, 0, "ماتریس کوواریانس (COVARIANCE.S)", fmt_hdr)
for j, name in enumerate(names):
    ws2.write(7, j+1, name, fmt_hdr)
    ws2.write(8+j, 0, name, fmt_hdr)

for i in range(3):
    for j in range(3):
        ci = cols[i]
        cj = cols[j]
        ws2.write_formula(8+i, 1+j, f"=COVARIANCE.S('داده‌ها و بازدهی'!{ci}$2:{ci}$6, 'داده‌ها و بازدهی'!{cj}$2:{cj}$6)", fmt_dec)

ws2.write(13, 0, "انحراف معیار پرتفوی (σₚ)", fmt_hdr)
ws2.write_formula(13, 1, "=SQRT(SUMPRODUCT(E2:E4, MMULT(B9:D11, E2:E4)))", fmt_pct)

# جدول VaR افق ۱ روزه
ws2.write(16, 0, "سطح اطمینان (افق ۱ روز)", fmt_hdr)
ws2.write(16, 1, "ضریب دقیق پیوسته (NORM.S.INV)", fmt_hdr)
ws2.write(16, 2, "نسبت ریسک (VaR %)", fmt_hdr)
ws2.write(16, 3, "مبلغ در معرض خطر ۱ روزه (ریال)", fmt_hdr)

for idx, conf in enumerate(confidences):
    r = 17 + idx
    ws2.write(r, 0, f"{conf}%", fmt_cell)
    ws2.write_formula(r, 1, f"=NORM.S.INV({conf/100})", fmt_dec)
    ws2.write_formula(r, 2, f"=B{r+1}*$B$14", fmt_pct)
    ws2.write_formula(r, 3, f"=C{r+1}*$D$5", fmt_num)

# جدول VaR افق ۱۰ روزه (Basel 10-day)
ws2.write(22, 0, "سطح اطمینان (افق ۱۰ روز)", fmt_hdr)
ws2.write(22, 1, "ضریب دقیق پیوسته (NORM.S.INV)", fmt_hdr)
ws2.write(22, 2, "نسبت ریسک ۱۰ روزه (VaR %)", fmt_hdr)
ws2.write(22, 3, "مبلغ در معرض خطر ۱۰ روزه (ریال)", fmt_hdr)

for idx, conf in enumerate(confidences):
    r = 23 + idx
    ws2.write(r, 0, f"{conf}% (افق ۱۰ روز)", fmt_cell)
    ws2.write_formula(r, 1, f"=NORM.S.INV({conf/100})", fmt_dec)
    ws2.write_formula(r, 2, f"=B{r+1}*$B$14*SQRT(10)", fmt_pct)
    ws2.write_formula(r, 3, f"=C{r+1}*$D$5", fmt_num)

wb.close()
print("Workbook saved successfully with 1-day and 10-day VaR formulas.")

print("=== مقادیر اعتبارسنجی مستقل (NumPy / SciPy / Excel) ===")
print(f"ارزش کل پرتفوی: {total_value:,.2f} ریال")
print(f"انحراف معیار پرتفوی: {port_std_dev:.12f}")
print("--- افق ۱ روزه ---")
for v in var_1day:
    print(f"سطح {v['confidence']}%: z={v['z']:.6f} | درصد={v['ratio']*100:.4f}% | مبلغ={v['amount']:,.2f} ریال")
print("--- افق ۱۰ روزه (Basel 10-day Horizon) ---")
for v in var_10day:
    print(f"سطح {v['confidence']}%: z={v['z']:.6f} | درصد={v['ratio']*100:.4f}% | مبلغ={v['amount']:,.2f} ریال")
