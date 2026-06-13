from decimal import Decimal


# ISO 4217 codes used by currently circulating currencies and accounting units.
# Less common currencies use the ISO code as their local display symbol.
ISO_CODES = """
AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD
BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY
COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP
GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD
IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR
LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR
MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON
RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC
SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU
UYW UZS VED VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF
XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL
""".split()

ZERO_DECIMAL = {
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "ISK",
    "JPY",
    "KMF",
    "KRW",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
}
THREE_DECIMAL = {"BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"}

DETAILS = {
    "USD": ("US Dollar", "$", "1"),
    "EUR": ("Euro", "€", "0.92"),
    "GBP": ("Pound Sterling", "£", "0.79"),
    "RUB": ("Russian Ruble", "₽", "71.9077"),
    "CNY": ("Chinese Yuan", "¥", "7.24"),
    "JPY": ("Japanese Yen", "¥", "157.50"),
    "KZT": ("Kazakhstani Tenge", "₸", "510.00"),
    "CAD": ("Canadian Dollar", "CA$", "1.37"),
    "AUD": ("Australian Dollar", "A$", "1.52"),
    "CHF": ("Swiss Franc", "CHF", "0.82"),
    "INR": ("Indian Rupee", "₹", "85.50"),
}
DEFAULT_ENABLED = set(DETAILS)


def currency_seed_rows() -> list[dict[str, object]]:
    rows = []
    for code in ISO_CODES:
        name, symbol, rate = DETAILS.get(code, (code, code, "1"))
        digits = 3 if code in THREE_DECIMAL else 0 if code in ZERO_DECIMAL else 2
        rows.append(
            {
                "code": code,
                "name": name,
                "symbol": symbol,
                "decimal_digits": digits,
                "rate_from_usd": Decimal(rate),
                "is_enabled": code in DEFAULT_ENABLED,
            }
        )
    return rows


def currency_digits_for(code: str) -> int:
    if code in THREE_DECIMAL:
        return 3
    if code in ZERO_DECIMAL:
        return 0
    return 2
