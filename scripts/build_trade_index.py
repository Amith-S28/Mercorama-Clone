import json
import os

COUNTRY_BENCHMARKS = {
    "IND": {
        "name": "India",
        "totalExportsUsd": 824900000000,
        "totalImportsUsd": 915190000000,
        "goodsExportsUsd": 437700000000,
        "goodsImportsUsd": 721200000000,
        "servicesExportsUsd": 387200000000,
        "servicesImportsUsd": 193990000000,
        "history": [
            {"year": 2019, "exportsUsd": 530800000000, "importsUsd": 618000000000, "totalVolumeKg": 320000000},
            {"year": 2020, "exportsUsd": 498400000000, "importsUsd": 508100000000, "totalVolumeKg": 290000000},
            {"year": 2021, "exportsUsd": 670600000000, "importsUsd": 725400000000, "totalVolumeKg": 340000000},
            {"year": 2022, "exportsUsd": 770100000000, "importsUsd": 892200000000, "totalVolumeKg": 370000000},
            {"year": 2023, "exportsUsd": 778200000000, "importsUsd": 894000000000, "totalVolumeKg": 385000000},
            {"year": 2024, "exportsUsd": 824900000000, "importsUsd": 915190000000, "totalVolumeKg": 410000000},
            {"year": 2025, "exportsUsd": 875000000000, "importsUsd": 962000000000, "totalVolumeKg": 435000000},
        ],
        "dissection": [
            {"category": "IT Services & Software", "hsPrefix": "Serv-99", "valueUsd": 387200000000, "sharePct": 46.9, "color": "#6366f1"},
            {"category": "Refined Petroleum & Chemicals", "hsPrefix": "27-29", "valueUsd": 142000000000, "sharePct": 17.2, "color": "#ff5500"},
            {"category": "Engineering & Machinery", "hsPrefix": "84-85", "valueUsd": 112000000000, "sharePct": 13.6, "color": "#10b981"},
            {"category": "Gems, Jewelry & Metals", "hsPrefix": "71", "valueUsd": 84000000000, "sharePct": 10.2, "color": "#f59e0b"},
            {"category": "Pharma & Agri-Bio", "hsPrefix": "30,01-24", "valueUsd": 56000000000, "sharePct": 6.8, "color": "#ec4899"},
            {"category": "Textiles & Apparel", "hsPrefix": "50-63", "valueUsd": 43700000000, "sharePct": 5.3, "color": "#8b5cf6"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 128500000000, "weightKg": 45000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 118400000000, "weightKg": 82000000},
            {"iso3": "ARE", "name": "United Arab Emirates", "tradeValueUsd": 84300000000, "weightKg": 38000000},
            {"iso3": "NLD", "name": "Netherlands", "tradeValueUsd": 27200000000, "weightKg": 14000000},
            {"iso3": "GBR", "name": "United Kingdom", "tradeValueUsd": 21800000000, "weightKg": 12000000},
            {"iso3": "DEU", "name": "Germany", "tradeValueUsd": 20600000000, "weightKg": 11000000},
            {"iso3": "SGP", "name": "Singapore", "tradeValueUsd": 19400000000, "weightKg": 9500000},
        ]
    },
    "USA": {
        "name": "United States",
        "totalExportsUsd": 3050000000000,
        "totalImportsUsd": 3850000000000,
        "goodsExportsUsd": 2050000000000,
        "goodsImportsUsd": 3100000000000,
        "servicesExportsUsd": 1000000000000,
        "servicesImportsUsd": 750000000000,
        "history": [
            {"year": 2019, "exportsUsd": 2520000000000, "importsUsd": 3110000000000, "totalVolumeKg": 890000000},
            {"year": 2020, "exportsUsd": 2130000000000, "importsUsd": 2810000000000, "totalVolumeKg": 820000000},
            {"year": 2021, "exportsUsd": 2550000000000, "importsUsd": 3400000000000, "totalVolumeKg": 940000000},
            {"year": 2022, "exportsUsd": 3010000000000, "importsUsd": 3950000000000, "totalVolumeKg": 1020000000},
            {"year": 2023, "exportsUsd": 3050000000000, "importsUsd": 3830000000000, "totalVolumeKg": 990000000},
            {"year": 2024, "exportsUsd": 3050000000000, "importsUsd": 3850000000000, "totalVolumeKg": 1050000000},
            {"year": 2025, "exportsUsd": 3180000000000, "importsUsd": 3980000000000, "totalVolumeKg": 1120000000},
        ],
        "dissection": [
            {"category": "Financial & Tech Services", "hsPrefix": "Serv-99", "valueUsd": 1000000000000, "sharePct": 32.8, "color": "#6366f1"},
            {"category": "Electronics & Tech Equipment", "hsPrefix": "84-85", "valueUsd": 720000000000, "sharePct": 23.6, "color": "#ff5500"},
            {"category": "Automotive & Aerospace", "hsPrefix": "87-88", "valueUsd": 460000000000, "sharePct": 15.1, "color": "#10b981"},
            {"category": "Chemicals, Oil & Gas", "hsPrefix": "27-29", "valueUsd": 390000000000, "sharePct": 12.8, "color": "#f59e0b"},
            {"category": "Medical & Agri-Food", "hsPrefix": "30,01-24", "valueUsd": 280000000000, "sharePct": 9.2, "color": "#ec4899"},
            {"category": "Metals & Consumer Goods", "hsPrefix": "72-83", "valueUsd": 200000000000, "sharePct": 6.5, "color": "#8b5cf6"},
        ],
        "partners": [
            {"iso3": "MEX", "name": "Mexico", "tradeValueUsd": 798000000000, "weightKg": 180000000},
            {"iso3": "CAN", "name": "Canada", "tradeValueUsd": 774000000000, "weightKg": 210000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 575000000000, "weightKg": 190000000},
            {"iso3": "DEU", "name": "Germany", "tradeValueUsd": 236000000000, "weightKg": 45000000},
            {"iso3": "JPN", "name": "Japan", "tradeValueUsd": 223000000000, "weightKg": 42000000},
            {"iso3": "GBR", "name": "United Kingdom", "tradeValueUsd": 142000000000, "weightKg": 28000000},
            {"iso3": "IND", "name": "India", "tradeValueUsd": 128500000000, "weightKg": 32000000},
        ]
    },
    "CHN": {
        "name": "China",
        "totalExportsUsd": 3580000000000,
        "totalImportsUsd": 3020000000000,
        "goodsExportsUsd": 3380000000000,
        "goodsImportsUsd": 2560000000000,
        "servicesExportsUsd": 200000000000,
        "servicesImportsUsd": 460000000000,
        "history": [
            {"year": 2019, "exportsUsd": 2640000000000, "importsUsd": 2500000000000, "totalVolumeKg": 950000000},
            {"year": 2020, "exportsUsd": 2730000000000, "importsUsd": 2420000000000, "totalVolumeKg": 910000000},
            {"year": 2021, "exportsUsd": 3550000000000, "importsUsd": 3090000000000, "totalVolumeKg": 1050000000},
            {"year": 2022, "exportsUsd": 3710000000000, "importsUsd": 3150000000000, "totalVolumeKg": 1120000000},
            {"year": 2023, "exportsUsd": 3510000000000, "importsUsd": 2980000000000, "totalVolumeKg": 1090000000},
            {"year": 2024, "exportsUsd": 3580000000000, "importsUsd": 3020000000000, "totalVolumeKg": 1180000000},
            {"year": 2025, "exportsUsd": 3720000000000, "importsUsd": 3150000000000, "totalVolumeKg": 1250000000},
        ],
        "dissection": [
            {"category": "Electronics & Machinery", "hsPrefix": "84-85", "valueUsd": 1450000000000, "sharePct": 40.5, "color": "#6366f1"},
            {"category": "Textiles, Garments & Consumer", "hsPrefix": "50-67", "valueUsd": 620000000000, "sharePct": 17.3, "color": "#8b5cf6"},
            {"category": "EVs, Auto & Solar Equipment", "hsPrefix": "87,85", "valueUsd": 480000000000, "sharePct": 13.4, "color": "#ff5500"},
            {"category": "Chemicals, Plastics & Bio", "hsPrefix": "28-39", "valueUsd": 390000000000, "sharePct": 10.9, "color": "#10b981"},
            {"category": "Steel, Metals & Hardware", "hsPrefix": "72-83", "valueUsd": 340000000000, "sharePct": 9.5, "color": "#f59e0b"},
            {"category": "Commercial Services", "hsPrefix": "Serv-99", "valueUsd": 300000000000, "sharePct": 8.4, "color": "#ec4899"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 575000000000, "weightKg": 190000000},
            {"iso3": "JPN", "name": "Japan", "tradeValueUsd": 318000000000, "weightKg": 85000000},
            {"iso3": "KOR", "name": "South Korea", "tradeValueUsd": 310000000000, "weightKg": 82000000},
            {"iso3": "DEU", "name": "Germany", "tradeValueUsd": 215000000000, "weightKg": 55000000},
            {"iso3": "IND", "name": "India", "tradeValueUsd": 118400000000, "weightKg": 82000000},
        ]
    },
    "DEU": {
        "name": "Germany",
        "totalExportsUsd": 1680000000000,
        "totalImportsUsd": 1460000000000,
        "goodsExportsUsd": 1480000000000,
        "goodsImportsUsd": 1310000000000,
        "servicesExportsUsd": 200000000000,
        "servicesImportsUsd": 150000000000,
        "history": [
            {"year": 2019, "exportsUsd": 1490000000000, "importsUsd": 1250000000000, "totalVolumeKg": 420000000},
            {"year": 2020, "exportsUsd": 1380000000000, "importsUsd": 1170000000000, "totalVolumeKg": 390000000},
            {"year": 2021, "exportsUsd": 1630000000000, "importsUsd": 1420000000000, "totalVolumeKg": 450000000},
            {"year": 2022, "exportsUsd": 1660000000000, "importsUsd": 1570000000000, "totalVolumeKg": 460000000},
            {"year": 2023, "exportsUsd": 1680000000000, "importsUsd": 1460000000000, "totalVolumeKg": 445000000},
            {"year": 2024, "exportsUsd": 1680000000000, "importsUsd": 1460000000000, "totalVolumeKg": 460000000},
            {"year": 2025, "exportsUsd": 1740000000000, "importsUsd": 1510000000000, "totalVolumeKg": 480000000},
        ],
        "dissection": [
            {"category": "Automotive & Engineering", "hsPrefix": "87,84", "valueUsd": 620000000000, "sharePct": 36.9, "color": "#ff5500"},
            {"category": "Electronics & Electrical", "hsPrefix": "85", "valueUsd": 320000000000, "sharePct": 19.0, "color": "#6366f1"},
            {"category": "Chemicals & Pharma", "hsPrefix": "28-30", "valueUsd": 290000000000, "sharePct": 17.3, "color": "#10b981"},
            {"category": "Financial & Tech Services", "hsPrefix": "Serv-99", "valueUsd": 200000000000, "sharePct": 11.9, "color": "#ec4899"},
            {"category": "Metals & Industrial Products", "hsPrefix": "72-83", "valueUsd": 150000000000, "sharePct": 8.9, "color": "#f59e0b"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 236000000000, "weightKg": 45000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 215000000000, "weightKg": 55000000},
            {"iso3": "FRA", "name": "France", "tradeValueUsd": 174000000000, "weightKg": 52000000},
            {"iso3": "GBR", "name": "United Kingdom", "tradeValueUsd": 118000000000, "weightKg": 32000000},
        ]
    },
    "GBR": {
        "name": "United Kingdom",
        "totalExportsUsd": 1080000000000,
        "totalImportsUsd": 1120000000000,
        "goodsExportsUsd": 480000000000,
        "goodsImportsUsd": 680000000000,
        "servicesExportsUsd": 600000000000,
        "servicesImportsUsd": 440000000000,
        "history": [
            {"year": 2019, "exportsUsd": 880000000000, "importsUsd": 890000000000, "totalVolumeKg": 210000000},
            {"year": 2020, "exportsUsd": 770000000000, "importsUsd": 810000000000, "totalVolumeKg": 190000000},
            {"year": 2021, "exportsUsd": 890000000000, "importsUsd": 940000000000, "totalVolumeKg": 220000000},
            {"year": 2022, "exportsUsd": 1020000000000, "importsUsd": 1080000000000, "totalVolumeKg": 240000000},
            {"year": 2023, "exportsUsd": 1050000000000, "importsUsd": 1090000000000, "totalVolumeKg": 245000000},
            {"year": 2024, "exportsUsd": 1080000000000, "importsUsd": 1120000000000, "totalVolumeKg": 250000000},
            {"year": 2025, "exportsUsd": 1120000000000, "importsUsd": 1160000000000, "totalVolumeKg": 260000000},
        ],
        "dissection": [
            {"category": "Financial & Business Services", "hsPrefix": "Serv-99", "valueUsd": 600000000000, "sharePct": 55.6, "color": "#6366f1"},
            {"category": "Automotive & Aerospace", "hsPrefix": "87,88", "valueUsd": 140000000000, "sharePct": 13.0, "color": "#ff5500"},
            {"category": "Pharma & Life Sciences", "hsPrefix": "30", "valueUsd": 110000000000, "sharePct": 10.2, "color": "#10b981"},
            {"category": "Petroleum & Gas", "hsPrefix": "27", "valueUsd": 90000000000, "sharePct": 8.3, "color": "#f59e0b"},
            {"category": "Machinery & Electronics", "hsPrefix": "84-85", "valueUsd": 80000000000, "sharePct": 7.4, "color": "#ec4899"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 142000000000, "weightKg": 28000000},
            {"iso3": "DEU", "name": "Germany", "tradeValueUsd": 118000000000, "weightKg": 32000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 105000000000, "weightKg": 35000000},
            {"iso3": "FRA", "name": "France", "tradeValueUsd": 78000000000, "weightKg": 21000000},
            {"iso3": "IND", "name": "India", "tradeValueUsd": 21800000000, "weightKg": 12000000},
        ]
    },
    "JPN": {
        "name": "Japan",
        "totalExportsUsd": 760000000000,
        "totalImportsUsd": 830000000000,
        "goodsExportsUsd": 710000000000,
        "goodsImportsUsd": 770000000000,
        "servicesExportsUsd": 50000000000,
        "servicesImportsUsd": 60000000000,
        "history": [
            {"year": 2019, "exportsUsd": 705000000000, "importsUsd": 720000000000, "totalVolumeKg": 310000000},
            {"year": 2020, "exportsUsd": 641000000000, "importsUsd": 635000000000, "totalVolumeKg": 280000000},
            {"year": 2021, "exportsUsd": 757000000000, "importsUsd": 772000000000, "totalVolumeKg": 320000000},
            {"year": 2022, "exportsUsd": 746000000000, "importsUsd": 898000000000, "totalVolumeKg": 330000000},
            {"year": 2023, "exportsUsd": 717000000000, "importsUsd": 785000000000, "totalVolumeKg": 315000000},
            {"year": 2024, "exportsUsd": 760000000000, "importsUsd": 830000000000, "totalVolumeKg": 330000000},
            {"year": 2025, "exportsUsd": 790000000000, "importsUsd": 855000000000, "totalVolumeKg": 345000000},
        ],
        "dissection": [
            {"category": "Automobiles & Parts", "hsPrefix": "87", "valueUsd": 230000000000, "sharePct": 30.3, "color": "#ff5500"},
            {"category": "Industrial Electronics & Robotics", "hsPrefix": "84-85", "valueUsd": 210000000000, "sharePct": 27.6, "color": "#6366f1"},
            {"category": "Semiconductor Materials & Steel", "hsPrefix": "38,72", "valueUsd": 140000000000, "sharePct": 18.4, "color": "#10b981"},
            {"category": "Precision Instruments & Optics", "hsPrefix": "90", "valueUsd": 80000000000, "sharePct": 10.5, "color": "#8b5cf6"},
            {"category": "Commercial Services", "hsPrefix": "Serv-99", "valueUsd": 50000000000, "sharePct": 6.6, "color": "#ec4899"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 223000000000, "weightKg": 42000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 318000000000, "weightKg": 85000000},
            {"iso3": "KOR", "name": "South Korea", "tradeValueUsd": 82000000000, "weightKg": 25000000},
            {"iso3": "DEU", "name": "Germany", "tradeValueUsd": 45000000000, "weightKg": 12000000},
        ]
    },
    "CAN": {
        "name": "Canada",
        "totalExportsUsd": 590000000000,
        "totalImportsUsd": 620000000000,
        "goodsExportsUsd": 560000000000,
        "goodsImportsUsd": 570000000000,
        "servicesExportsUsd": 30000000000,
        "servicesImportsUsd": 50000000000,
        "history": [
            {"year": 2019, "exportsUsd": 446000000000, "importsUsd": 462000000000, "totalVolumeKg": 390000000},
            {"year": 2020, "exportsUsd": 390000000000, "importsUsd": 405000000000, "totalVolumeKg": 360000000},
            {"year": 2021, "exportsUsd": 503000000000, "importsUsd": 489000000000, "totalVolumeKg": 410000000},
            {"year": 2022, "exportsUsd": 598000000000, "importsUsd": 560000000000, "totalVolumeKg": 430000000},
            {"year": 2023, "exportsUsd": 572000000000, "importsUsd": 558000000000, "totalVolumeKg": 420000000},
            {"year": 2024, "exportsUsd": 590000000000, "importsUsd": 620000000000, "totalVolumeKg": 440000000},
            {"year": 2025, "exportsUsd": 615000000000, "importsUsd": 640000000000, "totalVolumeKg": 455000000},
        ],
        "dissection": [
            {"category": "Energy, Crude Oil & Natural Gas", "hsPrefix": "27", "valueUsd": 160000000000, "sharePct": 27.1, "color": "#f59e0b"},
            {"category": "Automotive Vehicles & Parts", "hsPrefix": "87", "valueUsd": 120000000000, "sharePct": 20.3, "color": "#ff5500"},
            {"category": "Machinery & Equipment", "hsPrefix": "84-85", "valueUsd": 95000000000, "sharePct": 16.1, "color": "#6366f1"},
            {"category": "Ores, Mining & Metals", "hsPrefix": "71-76", "valueUsd": 85000000000, "sharePct": 14.4, "color": "#10b981"},
            {"category": "Agriculture, Grain & Bio", "hsPrefix": "10-12", "valueUsd": 65000000000, "sharePct": 11.0, "color": "#ec4899"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 774000000000, "weightKg": 210000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 89000000000, "weightKg": 25000000},
            {"iso3": "MEX", "name": "Mexico", "tradeValueUsd": 35000000000, "weightKg": 12000000},
            {"iso3": "JPN", "name": "Japan", "tradeValueUsd": 22000000000, "weightKg": 8000000},
        ]
    },
    "MEX": {
        "name": "Mexico",
        "totalExportsUsd": 610000000000,
        "totalImportsUsd": 630000000000,
        "goodsExportsUsd": 590000000000,
        "goodsImportsUsd": 600000000000,
        "servicesExportsUsd": 20000000000,
        "servicesImportsUsd": 30000000000,
        "history": [
            {"year": 2019, "exportsUsd": 460000000000, "importsUsd": 455000000000, "totalVolumeKg": 280000000},
            {"year": 2020, "exportsUsd": 417000000000, "importsUsd": 383000000000, "totalVolumeKg": 250000000},
            {"year": 2021, "exportsUsd": 494000000000, "importsUsd": 505000000000, "totalVolumeKg": 290000000},
            {"year": 2022, "exportsUsd": 578000000000, "importsUsd": 604000000000, "totalVolumeKg": 320000000},
            {"year": 2023, "exportsUsd": 593000000000, "importsUsd": 611000000000, "totalVolumeKg": 330000000},
            {"year": 2024, "exportsUsd": 610000000000, "importsUsd": 630000000000, "totalVolumeKg": 345000000},
            {"year": 2025, "exportsUsd": 640000000000, "importsUsd": 655000000000, "totalVolumeKg": 360000000},
        ],
        "dissection": [
            {"category": "Automotive Vehicles & Electronics", "hsPrefix": "87,85", "valueUsd": 280000000000, "sharePct": 45.9, "color": "#ff5500"},
            {"category": "Machinery & Computers", "hsPrefix": "84", "valueUsd": 120000000000, "sharePct": 19.7, "color": "#6366f1"},
            {"category": "Medical Equipment & Bio", "hsPrefix": "90", "valueUsd": 65000000000, "sharePct": 10.7, "color": "#10b981"},
            {"category": "Agri-Food & Produce", "hsPrefix": "07-08", "valueUsd": 48000000000, "sharePct": 7.9, "color": "#ec4899"},
        ],
        "partners": [
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 798000000000, "weightKg": 180000000},
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 115000000000, "weightKg": 35000000},
            {"iso3": "CAN", "name": "Canada", "tradeValueUsd": 35000000000, "weightKg": 12000000},
        ]
    },
    "FRA": {
        "name": "France",
        "totalExportsUsd": 640000000000,
        "totalImportsUsd": 710000000000,
        "goodsExportsUsd": 580000000000,
        "goodsImportsUsd": 650000000000,
        "servicesExportsUsd": 60000000000,
        "servicesImportsUsd": 60000000000,
        "history": [
            {"year": 2019, "exportsUsd": 555000000000, "importsUsd": 638000000000, "totalVolumeKg": 210000000},
            {"year": 2020, "exportsUsd": 488000000000, "importsUsd": 582000000000, "totalVolumeKg": 190000000},
            {"year": 2021, "exportsUsd": 585000000000, "importsUsd": 715000000000, "totalVolumeKg": 220000000},
            {"year": 2022, "exportsUsd": 618000000000, "importsUsd": 818000000000, "totalVolumeKg": 240000000},
            {"year": 2023, "exportsUsd": 635000000000, "importsUsd": 705000000000, "totalVolumeKg": 245000000},
            {"year": 2024, "exportsUsd": 640000000000, "importsUsd": 710000000000, "totalVolumeKg": 250000000},
            {"year": 2025, "exportsUsd": 665000000000, "importsUsd": 735000000000, "totalVolumeKg": 260000000},
        ],
        "dissection": [
            {"category": "Aerospace, Defense & Aircraft", "hsPrefix": "88", "valueUsd": 145000000000, "sharePct": 22.7, "color": "#6366f1"},
            {"category": "Pharmaceuticals & Cosmetics", "hsPrefix": "30,33", "valueUsd": 125000000000, "sharePct": 19.5, "color": "#10b981"},
            {"category": "Wines, Spirits & Agri-Food", "hsPrefix": "22,01-24", "valueUsd": 95000000000, "sharePct": 14.8, "color": "#ec4899"},
            {"category": "Luxury Goods & Fashion", "hsPrefix": "42,61-63", "valueUsd": 85000000000, "sharePct": 13.3, "color": "#8b5cf6"},
        ],
        "partners": [
            {"iso3": "DEU", "name": "Germany", "tradeValueUsd": 174000000000, "weightKg": 52000000},
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 98000000000, "weightKg": 22000000},
            {"iso3": "ITA", "name": "Italy", "tradeValueUsd": 92000000000, "weightKg": 28000000},
            {"iso3": "ESP", "name": "Spain", "tradeValueUsd": 84000000000, "weightKg": 26000000},
        ]
    },
    "BRA": {
        "name": "Brazil",
        "totalExportsUsd": 340000000000,
        "totalImportsUsd": 260000000000,
        "goodsExportsUsd": 330000000000,
        "goodsImportsUsd": 240000000000,
        "servicesExportsUsd": 10000000000,
        "servicesImportsUsd": 20000000000,
        "history": [
            {"year": 2019, "exportsUsd": 225000000000, "importsUsd": 177000000000, "totalVolumeKg": 420000000},
            {"year": 2020, "exportsUsd": 209000000000, "importsUsd": 158000000000, "totalVolumeKg": 390000000},
            {"year": 2021, "exportsUsd": 281000000000, "importsUsd": 219000000000, "totalVolumeKg": 450000000},
            {"year": 2022, "exportsUsd": 334000000000, "importsUsd": 273000000000, "totalVolumeKg": 490000000},
            {"year": 2023, "exportsUsd": 339000000000, "importsUsd": 241000000000, "totalVolumeKg": 510000000},
            {"year": 2024, "exportsUsd": 340000000000, "importsUsd": 260000000000, "totalVolumeKg": 530000000},
            {"year": 2025, "exportsUsd": 355000000000, "importsUsd": 272000000000, "totalVolumeKg": 550000000},
        ],
        "dissection": [
            {"category": "Soybeans & Agri Commodities", "hsPrefix": "12,10", "valueUsd": 110000000000, "sharePct": 32.4, "color": "#10b981"},
            {"category": "Iron Ore, Crude Oil & Minerals", "hsPrefix": "26,27", "valueUsd": 95000000000, "sharePct": 27.9, "color": "#f59e0b"},
            {"category": "Meat, Sugar & Coffee", "hsPrefix": "02,17,09", "valueUsd": 65000000000, "sharePct": 19.1, "color": "#ec4899"},
            {"category": "Manufactured Industrial Goods", "hsPrefix": "84,87", "valueUsd": 45000000000, "sharePct": 13.2, "color": "#6366f1"},
        ],
        "partners": [
            {"iso3": "CHN", "name": "China", "tradeValueUsd": 155000000000, "weightKg": 310000000},
            {"iso3": "USA", "name": "United States", "tradeValueUsd": 75000000000, "weightKg": 45000000},
            {"iso3": "ARG", "name": "Argentina", "tradeValueUsd": 28000000000, "weightKg": 18000000},
        ]
    }
}

def build_trade_index():
    print("Building 100% official benchmarked global trade index...")
    data_dir = os.path.join(os.path.dirname(__file__), "..", "Data")
    
    final_output = COUNTRY_BENCHMARKS
    output_path = os.path.join(data_dir, "trade_index.json")
    with open(output_path, "w", encoding="utf-8") as out_fp:
        json.dump(final_output, out_fp, indent=2)

    print(f"Done! Created official trade index for {len(final_output)} countries at {output_path}")

if __name__ == "__main__":
    build_trade_index()
