import { useMemo, useState } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

// Full international country/territory list.
// The closed selector shows the ISO alpha-3 country code (e.g. NGA, GBR, IRL).
// The open list shows the flag, full country name and currency code.
const COUNTRIES = [
  { "name": "Afghanistan", "code": "AF", "code3": "AFG", "currency": "AFN" },
  { "name": "Albania", "code": "AL", "code3": "ALB", "currency": "ALL" },
  { "name": "Algeria", "code": "DZ", "code3": "DZA", "currency": "DZD" },
  { "name": "American Samoa", "code": "AS", "code3": "ASM", "currency": "USD" },
  { "name": "Andorra", "code": "AD", "code3": "AND", "currency": "EUR" },
  { "name": "Angola", "code": "AO", "code3": "AGO", "currency": "AOA" },
  { "name": "Anguilla", "code": "AI", "code3": "AIA", "currency": "XCD" },
  { "name": "Antarctica", "code": "AQ", "code3": "ATA", "currency": "" },
  { "name": "Antigua and Barbuda", "code": "AG", "code3": "ATG", "currency": "XCD" },
  { "name": "Argentina", "code": "AR", "code3": "ARG", "currency": "ARS" },
  { "name": "Armenia", "code": "AM", "code3": "ARM", "currency": "AMD" },
  { "name": "Aruba", "code": "AW", "code3": "ABW", "currency": "AWG" },
  { "name": "Australia", "code": "AU", "code3": "AUS", "currency": "AUD" },
  { "name": "Austria", "code": "AT", "code3": "AUT", "currency": "EUR" },
  { "name": "Azerbaijan", "code": "AZ", "code3": "AZE", "currency": "AZN" },
  { "name": "Bahamas", "code": "BS", "code3": "BHS", "currency": "BSD" },
  { "name": "Bahrain", "code": "BH", "code3": "BHR", "currency": "BHD" },
  { "name": "Bangladesh", "code": "BD", "code3": "BGD", "currency": "BDT" },
  { "name": "Barbados", "code": "BB", "code3": "BRB", "currency": "BBD" },
  { "name": "Belarus", "code": "BY", "code3": "BLR", "currency": "BYN" },
  { "name": "Belgium", "code": "BE", "code3": "BEL", "currency": "EUR" },
  { "name": "Belize", "code": "BZ", "code3": "BLZ", "currency": "BZD" },
  { "name": "Benin", "code": "BJ", "code3": "BEN", "currency": "XOF" },
  { "name": "Bermuda", "code": "BM", "code3": "BMU", "currency": "BMD" },
  { "name": "Bhutan", "code": "BT", "code3": "BTN", "currency": "INR" },
  { "name": "Bolivia, Plurinational State of", "code": "BO", "code3": "BOL", "currency": "BOB" },
  { "name": "Bonaire, Sint Eustatius and Saba", "code": "BQ", "code3": "BES", "currency": "USD" },
  { "name": "Bosnia and Herzegovina", "code": "BA", "code3": "BIH", "currency": "BAM" },
  { "name": "Botswana", "code": "BW", "code3": "BWA", "currency": "BWP" },
  { "name": "Bouvet Island", "code": "BV", "code3": "BVT", "currency": "NOK" },
  { "name": "Brazil", "code": "BR", "code3": "BRA", "currency": "BRL" },
  { "name": "British Indian Ocean Territory", "code": "IO", "code3": "IOT", "currency": "USD" },
  { "name": "Brunei Darussalam", "code": "BN", "code3": "BRN", "currency": "BND" },
  { "name": "Bulgaria", "code": "BG", "code3": "BGR", "currency": "BGN" },
  { "name": "Burkina Faso", "code": "BF", "code3": "BFA", "currency": "XOF" },
  { "name": "Burundi", "code": "BI", "code3": "BDI", "currency": "BIF" },
  { "name": "Cabo Verde", "code": "CV", "code3": "CPV", "currency": "CVE" },
  { "name": "Cambodia", "code": "KH", "code3": "KHM", "currency": "KHR" },
  { "name": "Cameroon", "code": "CM", "code3": "CMR", "currency": "XAF" },
  { "name": "Canada", "code": "CA", "code3": "CAN", "currency": "CAD" },
  { "name": "Cayman Islands", "code": "KY", "code3": "CYM", "currency": "KYD" },
  { "name": "Central African Republic", "code": "CF", "code3": "CAF", "currency": "XAF" },
  { "name": "Chad", "code": "TD", "code3": "TCD", "currency": "XAF" },
  { "name": "Chile", "code": "CL", "code3": "CHL", "currency": "CLP" },
  { "name": "China", "code": "CN", "code3": "CHN", "currency": "CNY" },
  { "name": "Christmas Island", "code": "CX", "code3": "CXR", "currency": "AUD" },
  { "name": "Cocos (Keeling) Islands", "code": "CC", "code3": "CCK", "currency": "AUD" },
  { "name": "Colombia", "code": "CO", "code3": "COL", "currency": "COP" },
  { "name": "Comoros", "code": "KM", "code3": "COM", "currency": "KMF" },
  { "name": "Congo", "code": "CG", "code3": "COG", "currency": "XAF" },
  { "name": "Congo, The Democratic Republic of the", "code": "CD", "code3": "COD", "currency": "CDF" },
  { "name": "Cook Islands", "code": "CK", "code3": "COK", "currency": "NZD" },
  { "name": "Costa Rica", "code": "CR", "code3": "CRI", "currency": "CRC" },
  { "name": "Croatia", "code": "HR", "code3": "HRV", "currency": "EUR" },
  { "name": "Cuba", "code": "CU", "code3": "CUB", "currency": "CUP" },
  { "name": "Curaçao", "code": "CW", "code3": "CUW", "currency": "XCG" },
  { "name": "Cyprus", "code": "CY", "code3": "CYP", "currency": "EUR" },
  { "name": "Czechia", "code": "CZ", "code3": "CZE", "currency": "CZK" },
  { "name": "Côte d'Ivoire", "code": "CI", "code3": "CIV", "currency": "XOF" },
  { "name": "Denmark", "code": "DK", "code3": "DNK", "currency": "DKK" },
  { "name": "Djibouti", "code": "DJ", "code3": "DJI", "currency": "DJF" },
  { "name": "Dominica", "code": "DM", "code3": "DMA", "currency": "XCD" },
  { "name": "Dominican Republic", "code": "DO", "code3": "DOM", "currency": "DOP" },
  { "name": "Ecuador", "code": "EC", "code3": "ECU", "currency": "USD" },
  { "name": "Egypt", "code": "EG", "code3": "EGY", "currency": "EGP" },
  { "name": "El Salvador", "code": "SV", "code3": "SLV", "currency": "USD" },
  { "name": "Equatorial Guinea", "code": "GQ", "code3": "GNQ", "currency": "XAF" },
  { "name": "Eritrea", "code": "ER", "code3": "ERI", "currency": "ERN" },
  { "name": "Estonia", "code": "EE", "code3": "EST", "currency": "EUR" },
  { "name": "Eswatini", "code": "SZ", "code3": "SWZ", "currency": "SZL" },
  { "name": "Ethiopia", "code": "ET", "code3": "ETH", "currency": "ETB" },
  { "name": "Falkland Islands (Malvinas)", "code": "FK", "code3": "FLK", "currency": "FKP" },
  { "name": "Faroe Islands", "code": "FO", "code3": "FRO", "currency": "DKK" },
  { "name": "Fiji", "code": "FJ", "code3": "FJI", "currency": "FJD" },
  { "name": "Finland", "code": "FI", "code3": "FIN", "currency": "EUR" },
  { "name": "France", "code": "FR", "code3": "FRA", "currency": "EUR" },
  { "name": "French Guiana", "code": "GF", "code3": "GUF", "currency": "EUR" },
  { "name": "French Polynesia", "code": "PF", "code3": "PYF", "currency": "XPF" },
  { "name": "French Southern Territories", "code": "TF", "code3": "ATF", "currency": "EUR" },
  { "name": "Gabon", "code": "GA", "code3": "GAB", "currency": "XAF" },
  { "name": "Gambia", "code": "GM", "code3": "GMB", "currency": "GMD" },
  { "name": "Georgia", "code": "GE", "code3": "GEO", "currency": "GEL" },
  { "name": "Germany", "code": "DE", "code3": "DEU", "currency": "EUR" },
  { "name": "Ghana", "code": "GH", "code3": "GHA", "currency": "GHS" },
  { "name": "Gibraltar", "code": "GI", "code3": "GIB", "currency": "GIP" },
  { "name": "Greece", "code": "GR", "code3": "GRC", "currency": "EUR" },
  { "name": "Greenland", "code": "GL", "code3": "GRL", "currency": "DKK" },
  { "name": "Grenada", "code": "GD", "code3": "GRD", "currency": "XCD" },
  { "name": "Guadeloupe", "code": "GP", "code3": "GLP", "currency": "EUR" },
  { "name": "Guam", "code": "GU", "code3": "GUM", "currency": "USD" },
  { "name": "Guatemala", "code": "GT", "code3": "GTM", "currency": "GTQ" },
  { "name": "Guernsey", "code": "GG", "code3": "GGY", "currency": "GBP" },
  { "name": "Guinea", "code": "GN", "code3": "GIN", "currency": "GNF" },
  { "name": "Guinea-Bissau", "code": "GW", "code3": "GNB", "currency": "XOF" },
  { "name": "Guyana", "code": "GY", "code3": "GUY", "currency": "GYD" },
  { "name": "Haiti", "code": "HT", "code3": "HTI", "currency": "HTG" },
  { "name": "Heard Island and McDonald Islands", "code": "HM", "code3": "HMD", "currency": "AUD" },
  { "name": "Holy See (Vatican City State)", "code": "VA", "code3": "VAT", "currency": "EUR" },
  { "name": "Honduras", "code": "HN", "code3": "HND", "currency": "HNL" },
  { "name": "Hong Kong", "code": "HK", "code3": "HKG", "currency": "HKD" },
  { "name": "Hungary", "code": "HU", "code3": "HUN", "currency": "HUF" },
  { "name": "Iceland", "code": "IS", "code3": "ISL", "currency": "ISK" },
  { "name": "India", "code": "IN", "code3": "IND", "currency": "INR" },
  { "name": "Indonesia", "code": "ID", "code3": "IDN", "currency": "IDR" },
  { "name": "Iran, Islamic Republic of", "code": "IR", "code3": "IRN", "currency": "IRR" },
  { "name": "Iraq", "code": "IQ", "code3": "IRQ", "currency": "IQD" },
  { "name": "Ireland", "code": "IE", "code3": "IRL", "currency": "EUR" },
  { "name": "Isle of Man", "code": "IM", "code3": "IMN", "currency": "GBP" },
  { "name": "Israel", "code": "IL", "code3": "ISR", "currency": "ILS" },
  { "name": "Italy", "code": "IT", "code3": "ITA", "currency": "EUR" },
  { "name": "Jamaica", "code": "JM", "code3": "JAM", "currency": "JMD" },
  { "name": "Japan", "code": "JP", "code3": "JPN", "currency": "JPY" },
  { "name": "Jersey", "code": "JE", "code3": "JEY", "currency": "GBP" },
  { "name": "Jordan", "code": "JO", "code3": "JOR", "currency": "JOD" },
  { "name": "Kazakhstan", "code": "KZ", "code3": "KAZ", "currency": "KZT" },
  { "name": "Kenya", "code": "KE", "code3": "KEN", "currency": "KES" },
  { "name": "Kiribati", "code": "KI", "code3": "KIR", "currency": "AUD" },
  { "name": "Korea, Democratic People's Republic of", "code": "KP", "code3": "PRK", "currency": "KPW" },
  { "name": "Korea, Republic of", "code": "KR", "code3": "KOR", "currency": "KRW" },
  { "name": "Kosovo", "code": "XK", "code3": "XKX", "currency": "EUR" },
  { "name": "Kuwait", "code": "KW", "code3": "KWT", "currency": "KWD" },
  { "name": "Kyrgyzstan", "code": "KG", "code3": "KGZ", "currency": "KGS" },
  { "name": "Lao People's Democratic Republic", "code": "LA", "code3": "LAO", "currency": "LAK" },
  { "name": "Latvia", "code": "LV", "code3": "LVA", "currency": "EUR" },
  { "name": "Lebanon", "code": "LB", "code3": "LBN", "currency": "LBP" },
  { "name": "Lesotho", "code": "LS", "code3": "LSO", "currency": "ZAR" },
  { "name": "Liberia", "code": "LR", "code3": "LBR", "currency": "LRD" },
  { "name": "Libya", "code": "LY", "code3": "LBY", "currency": "LYD" },
  { "name": "Liechtenstein", "code": "LI", "code3": "LIE", "currency": "CHF" },
  { "name": "Lithuania", "code": "LT", "code3": "LTU", "currency": "EUR" },
  { "name": "Luxembourg", "code": "LU", "code3": "LUX", "currency": "EUR" },
  { "name": "Macao", "code": "MO", "code3": "MAC", "currency": "MOP" },
  { "name": "Madagascar", "code": "MG", "code3": "MDG", "currency": "MGA" },
  { "name": "Malawi", "code": "MW", "code3": "MWI", "currency": "MWK" },
  { "name": "Malaysia", "code": "MY", "code3": "MYS", "currency": "MYR" },
  { "name": "Maldives", "code": "MV", "code3": "MDV", "currency": "MVR" },
  { "name": "Mali", "code": "ML", "code3": "MLI", "currency": "XOF" },
  { "name": "Malta", "code": "MT", "code3": "MLT", "currency": "EUR" },
  { "name": "Marshall Islands", "code": "MH", "code3": "MHL", "currency": "USD" },
  { "name": "Martinique", "code": "MQ", "code3": "MTQ", "currency": "EUR" },
  { "name": "Mauritania", "code": "MR", "code3": "MRT", "currency": "MRU" },
  { "name": "Mauritius", "code": "MU", "code3": "MUS", "currency": "MUR" },
  { "name": "Mayotte", "code": "YT", "code3": "MYT", "currency": "EUR" },
  { "name": "Mexico", "code": "MX", "code3": "MEX", "currency": "MXN" },
  { "name": "Micronesia, Federated States of", "code": "FM", "code3": "FSM", "currency": "USD" },
  { "name": "Moldova, Republic of", "code": "MD", "code3": "MDA", "currency": "MDL" },
  { "name": "Monaco", "code": "MC", "code3": "MCO", "currency": "EUR" },
  { "name": "Mongolia", "code": "MN", "code3": "MNG", "currency": "MNT" },
  { "name": "Montenegro", "code": "ME", "code3": "MNE", "currency": "EUR" },
  { "name": "Montserrat", "code": "MS", "code3": "MSR", "currency": "XCD" },
  { "name": "Morocco", "code": "MA", "code3": "MAR", "currency": "MAD" },
  { "name": "Mozambique", "code": "MZ", "code3": "MOZ", "currency": "MZN" },
  { "name": "Myanmar", "code": "MM", "code3": "MMR", "currency": "MMK" },
  { "name": "Namibia", "code": "NA", "code3": "NAM", "currency": "ZAR" },
  { "name": "Nauru", "code": "NR", "code3": "NRU", "currency": "AUD" },
  { "name": "Nepal", "code": "NP", "code3": "NPL", "currency": "NPR" },
  { "name": "Netherlands", "code": "NL", "code3": "NLD", "currency": "EUR" },
  { "name": "New Caledonia", "code": "NC", "code3": "NCL", "currency": "XPF" },
  { "name": "New Zealand", "code": "NZ", "code3": "NZL", "currency": "NZD" },
  { "name": "Nicaragua", "code": "NI", "code3": "NIC", "currency": "NIO" },
  { "name": "Niger", "code": "NE", "code3": "NER", "currency": "XOF" },
  { "name": "Nigeria", "code": "NG", "code3": "NGN", "currency": "NGN" },
  { "name": "Niue", "code": "NU", "code3": "NIU", "currency": "NZD" },
  { "name": "Norfolk Island", "code": "NF", "code3": "NFK", "currency": "AUD" },
  { "name": "North Macedonia", "code": "MK", "code3": "MKD", "currency": "MKD" },
  { "name": "Northern Mariana Islands", "code": "MP", "code3": "MNP", "currency": "USD" },
  { "name": "Norway", "code": "NO", "code3": "NOR", "currency": "NOK" },
  { "name": "Oman", "code": "OM", "code3": "OMN", "currency": "OMR" },
  { "name": "Pakistan", "code": "PK", "code3": "PAK", "currency": "PKR" },
  { "name": "Palau", "code": "PW", "code3": "PLW", "currency": "USD" },
  { "name": "Palestine, State of", "code": "PS", "code3": "PSE", "currency": "ILS" },
  { "name": "Panama", "code": "PA", "code3": "PAN", "currency": "PAB" },
  { "name": "Papua New Guinea", "code": "PG", "code3": "PNG", "currency": "PGK" },
  { "name": "Paraguay", "code": "PY", "code3": "PRY", "currency": "PYG" },
  { "name": "Peru", "code": "PE", "code3": "PER", "currency": "PEN" },
  { "name": "Philippines", "code": "PH", "code3": "PHL", "currency": "PHP" },
  { "name": "Pitcairn", "code": "PN", "code3": "PCN", "currency": "NZD" },
  { "name": "Poland", "code": "PL", "code3": "POL", "currency": "PLN" },
  { "name": "Portugal", "code": "PT", "code3": "PRT", "currency": "EUR" },
  { "name": "Puerto Rico", "code": "PR", "code3": "PRI", "currency": "USD" },
  { "name": "Qatar", "code": "QA", "code3": "QAT", "currency": "QAR" },
  { "name": "Romania", "code": "RO", "code3": "ROU", "currency": "RON" },
  { "name": "Russian Federation", "code": "RU", "code3": "RUS", "currency": "RUB" },
  { "name": "Rwanda", "code": "RW", "code3": "RWA", "currency": "RWF" },
  { "name": "Réunion", "code": "RE", "code3": "REU", "currency": "EUR" },
  { "name": "Saint Barthélemy", "code": "BL", "code3": "BLM", "currency": "EUR" },
  { "name": "Saint Helena, Ascension and Tristan da Cunha", "code": "SH", "code3": "SHN", "currency": "SHP" },
  { "name": "Saint Kitts and Nevis", "code": "KN", "code3": "KNA", "currency": "XCD" },
  { "name": "Saint Lucia", "code": "LC", "code3": "LCA", "currency": "XCD" },
  { "name": "Saint Martin (French part)", "code": "MF", "code3": "MAF", "currency": "EUR" },
  { "name": "Saint Pierre and Miquelon", "code": "PM", "code3": "SPM", "currency": "EUR" },
  { "name": "Saint Vincent and the Grenadines", "code": "VC", "code3": "VCT", "currency": "XCD" },
  { "name": "Samoa", "code": "WS", "code3": "WSM", "currency": "WST" },
  { "name": "San Marino", "code": "SM", "code3": "SMR", "currency": "EUR" },
  { "name": "Sao Tome and Principe", "code": "ST", "code3": "STP", "currency": "STN" },
  { "name": "Saudi Arabia", "code": "SA", "code3": "SAU", "currency": "SAR" },
  { "name": "Senegal", "code": "SN", "code3": "SEN", "currency": "XOF" },
  { "name": "Serbia", "code": "RS", "code3": "SRB", "currency": "RSD" },
  { "name": "Seychelles", "code": "SC", "code3": "SYC", "currency": "SCR" },
  { "name": "Sierra Leone", "code": "SL", "code3": "SLE", "currency": "SLE" },
  { "name": "Singapore", "code": "SG", "code3": "SGP", "currency": "SGD" },
  { "name": "Sint Maarten (Dutch part)", "code": "SX", "code3": "SXM", "currency": "XCG" },
  { "name": "Slovakia", "code": "SK", "code3": "SVK", "currency": "EUR" },
  { "name": "Slovenia", "code": "SI", "code3": "SVN", "currency": "EUR" },
  { "name": "Solomon Islands", "code": "SB", "code3": "SLB", "currency": "SBD" },
  { "name": "Somalia", "code": "SO", "code3": "SOM", "currency": "SOS" },
  { "name": "South Africa", "code": "ZA", "code3": "ZAF", "currency": "ZAR" },
  { "name": "South Georgia and the South Sandwich Islands", "code": "GS", "code3": "SGS", "currency": "GBP" },
  { "name": "South Sudan", "code": "SS", "code3": "SSD", "currency": "SSP" },
  { "name": "Spain", "code": "ES", "code3": "ESP", "currency": "EUR" },
  { "name": "Sri Lanka", "code": "LK", "code3": "LKA", "currency": "LKR" },
  { "name": "Sudan", "code": "SD", "code3": "SDN", "currency": "SDG" },
  { "name": "Suriname", "code": "SR", "code3": "SUR", "currency": "SRD" },
  { "name": "Svalbard and Jan Mayen", "code": "SJ", "code3": "SJM", "currency": "NOK" },
  { "name": "Sweden", "code": "SE", "code3": "SWE", "currency": "SEK" },
  { "name": "Switzerland", "code": "CH", "code3": "CHE", "currency": "CHF" },
  { "name": "Syrian Arab Republic", "code": "SY", "code3": "SYR", "currency": "SYP" },
  { "name": "Taiwan, Province of China", "code": "TW", "code3": "TWN", "currency": "TWD" },
  { "name": "Tajikistan", "code": "TJ", "code3": "TJK", "currency": "TJS" },
  { "name": "Tanzania, United Republic of", "code": "TZ", "code3": "TZA", "currency": "TZS" },
  { "name": "Thailand", "code": "TH", "code3": "THA", "currency": "THB" },
  { "name": "Timor-Leste", "code": "TL", "code3": "TLS", "currency": "USD" },
  { "name": "Togo", "code": "TG", "code3": "TGO", "currency": "XOF" },
  { "name": "Tokelau", "code": "TK", "code3": "TKL", "currency": "NZD" },
  { "name": "Tonga", "code": "TO", "code3": "TON", "currency": "TOP" },
  { "name": "Trinidad and Tobago", "code": "TT", "code3": "TTO", "currency": "TTD" },
  { "name": "Tunisia", "code": "TN", "code3": "TUN", "currency": "TND" },
  { "name": "Turkmenistan", "code": "TM", "code3": "TKM", "currency": "TMT" },
  { "name": "Turks and Caicos Islands", "code": "TC", "code3": "TCA", "currency": "USD" },
  { "name": "Tuvalu", "code": "TV", "code3": "TUV", "currency": "AUD" },
  { "name": "Türkiye", "code": "TR", "code3": "TUR", "currency": "TRY" },
  { "name": "Uganda", "code": "UG", "code3": "UGA", "currency": "UGX" },
  { "name": "Ukraine", "code": "UA", "code3": "UKR", "currency": "UAH" },
  { "name": "United Arab Emirates", "code": "AE", "code3": "ARE", "currency": "AED" },
  { "name": "United Kingdom", "code": "GB", "code3": "GBR", "currency": "GBP" },
  { "name": "United States", "code": "US", "code3": "USA", "currency": "USD" },
  { "name": "United States Minor Outlying Islands", "code": "UM", "code3": "UMI", "currency": "USD" },
  { "name": "Uruguay", "code": "UY", "code3": "URY", "currency": "UYU" },
  { "name": "Uzbekistan", "code": "UZ", "code3": "UZB", "currency": "UZS" },
  { "name": "Vanuatu", "code": "VU", "code3": "VUT", "currency": "VUV" },
  { "name": "Venezuela, Bolivarian Republic of", "code": "VE", "code3": "VEN", "currency": "VES" },
  { "name": "Viet Nam", "code": "VN", "code3": "VNM", "currency": "VND" },
  { "name": "Virgin Islands, British", "code": "VG", "code3": "VGB", "currency": "USD" },
  { "name": "Virgin Islands, U.S.", "code": "VI", "code3": "VIR", "currency": "USD" },
  { "name": "Wallis and Futuna", "code": "WF", "code3": "WLF", "currency": "XPF" },
  { "name": "Western Sahara", "code": "EH", "code3": "ESH", "currency": "MAD" },
  { "name": "Yemen", "code": "YE", "code3": "YEM", "currency": "YER" },
  { "name": "Zambia", "code": "ZM", "code3": "ZMB", "currency": "ZMW" },
  { "name": "Zimbabwe", "code": "ZW", "code3": "ZWE", "currency": "USD" },
  { "name": "Åland Islands", "code": "AX", "code3": "ALA", "currency": "EUR" }
];

const flagUrl = (alpha2) => `https://flagcdn.com/24x18/${alpha2.toLowerCase()}.png`;

export default function CountrySelector({
  value,
  onChange,
  buttonClassName = '',
}) {
  // Fall back to the app-wide currency context if this component
  // is dropped in with no props (e.g. <CountrySelector /> in Navbar.jsx)
  const currencyCtx = useCurrency();
  const isControlled = value !== undefined && onChange !== undefined;
  const activeCode = isControlled ? value : currencyCtx.country;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // "picking" = browsing the list, "confirming" = showing the Update card
  const [step, setStep] = useState('picking');
  const [pending, setPending] = useState(activeCode);

  const selected =
    COUNTRIES.find((c) => c.code === activeCode) ||
    COUNTRIES.find((c) => c.code === 'NG');

  const pendingCountry =
    COUNTRIES.find((c) => c.code === pending) || selected;

  const filteredCountries = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return COUNTRIES;
    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search) ||
      country.code3.toLowerCase().includes(search) ||
      country.currency.toLowerCase().includes(search)
    );
  }, [query]);

  function openModal() {
    setPending(activeCode);
    setStep('picking');
    setOpen(true);
  }

  function pickCountry(country) {
    setPending(country.code);
    setStep('confirming'); // <-- shows the Update card instead of closing immediately
  }

  function confirmUpdate() {
    const country = pendingCountry;
    if (isControlled) {
      onChange?.(country);
    } else {
      currencyCtx.setCountry(country.code);
    }
    closeModal();
  }

  function closeModal() {
    setOpen(false);
    setQuery('');
    setStep('picking');
  }

  return (
    <>
      {/* Closed country/currency selector */}
      <button
        type="button"
        onClick={openModal}
        aria-label={`Selected country: ${selected.name}`}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-[#F3F3F3] text-[#404040] hover:bg-[#EAEAEA] transition-colors cursor-pointer ${buttonClassName}`}
      >
        <img
          src={flagUrl(selected.code)}
          alt=""
          width="24"
          height="18"
          className="w-6 h-[18px] object-cover rounded-[2px] shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <span className="text-sm font-medium tracking-wide">{selected.code3}</span>
        <ChevronDown size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#241719]/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Select Your Country"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-[480px] max-h-[calc(100vh-32px)] bg-[#FFFCFC] shadow-[0px_8px_30px_rgba(0,0,0,0.25)] p-7 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#404040] m-0">Select Your Country</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close country selector"
                className="p-1 text-[#666] hover:text-[#222] cursor-pointer"
              >
                <X size={22} strokeWidth={1.8} />
              </button>
            </div>

            {/* STEP 1: PICKING — search + full list */}
            {step === 'picking' && (
              <>
                <div className="relative mt-1 mb-4">
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a country..."
                    className="w-full h-[52px] border border-[#404040] bg-transparent pl-4 pr-11 text-sm outline-none placeholder:text-[#A3A3A3]"
                  />
                  <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777]" aria-hidden="true" />
                </div>

                <div className="max-h-[330px] overflow-y-auto pr-1" role="listbox">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => {
                      const active = country.code === activeCode;
                      return (
                        <button
                          type="button"
                          key={`${country.code}-${country.name}`}
                          onClick={() => pickCountry(country)}
                          role="option"
                          aria-selected={active}
                          className="w-full min-h-[50px] px-0 flex items-center justify-between gap-4 text-left hover:bg-[#F6F3F3] cursor-pointer"
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <img
                              src={flagUrl(country.code)}
                              alt=""
                              width="24"
                              height="18"
                              loading="lazy"
                              className="w-6 h-[18px] object-cover rounded-[2px] shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <span className="text-[15px] text-[#404040] truncate">{country.name}</span>
                          </span>
                          <span className="flex items-center gap-3 shrink-0 text-sm text-[#777]">
                            {country.currency && <span>{country.currency}</span>}
                            {active && <Check size={17} strokeWidth={2} className="text-[#555]" />}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="py-8 text-center text-sm text-[#777]">No countries found.</p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: CONFIRMING — matches the screenshot */}
            {step === 'confirming' && (
              <div className="mx-auto max-w-[360px]">
                <button
                  type="button"
                  onClick={() => setStep('picking')}
                  className="w-full h-[52px] border border-[#D8D8D8] px-4 mb-4 flex items-center justify-between text-left hover:border-[#999] cursor-pointer"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <img
                      src={flagUrl(pendingCountry.code)}
                      alt=""
                      width="24"
                      height="18"
                      className="w-6 h-[18px] object-cover rounded-[2px] shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="text-sm text-[#404040] truncate">
                      {pendingCountry.name} ({pendingCountry.currency})
                    </span>
                  </span>
                  <ChevronDown size={17} strokeWidth={1.8} className="text-[#777]" />
                </button>

                <button
                  type="button"
                  onClick={confirmUpdate}
                  className="h-11 w-full rounded-md bg-[#372A2B] text-xs font-bold uppercase tracking-wide text-white"
                >
                  Update Country
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export { COUNTRIES };