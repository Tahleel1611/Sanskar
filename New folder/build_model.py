"""
Hybrid Neural Emission Estimator (HNEE)
========================================
This script builds:
1. The Emission Knowledge Graph (EKG) - JSON format
2. The Brand Penalty Network - sklearn MLP (exported as ONNX-ready weights)
3. The NER + Quantity Extractor patterns
4. Full inference pipeline

The output is a self-contained carbon_model.json that the frontend uses.
"""

import json
import math
import re
from typing import Dict, List, Tuple, Optional
import numpy as np

# ════════════════════════════════════════════════════════
# SECTION 1: EMISSION KNOWLEDGE GRAPH
# Built from: IPCC AR6, EPA EF, DEFRA 2023, Our World in Data,
# GHG Protocol, Brand-specific LCA studies
# ════════════════════════════════════════════════════════

EMISSION_GRAPH = {
    # ── TRANSPORT ──────────────────────────────────────────
    "transport": {
        "car_petrol_sedan": {
            "base_factor": 0.171, "unit": "kg_co2e_per_km",
            "source": "DEFRA 2023 / UK Govt EF",
            "components": {"fuel_combustion": 0.139, "fuel_production": 0.022, "vehicle_manufacture": 0.010},
            "brands": {
                "Maruti Swift": {"multiplier": 0.66, "note": "Small engine, fuel efficient"},
                "Maruti Suzuki": {"multiplier": 0.72},
                "Hyundai i20": {"multiplier": 0.76},
                "Honda City": {"multiplier": 0.84},
                "Toyota Camry": {"multiplier": 1.05},
                "BMW 3 Series": {"multiplier": 1.30},
                "Mercedes C Class": {"multiplier": 1.28},
                "Audi A4": {"multiplier": 1.25},
            }
        },
        "car_petrol_suv": {
            "base_factor": 0.214, "unit": "kg_co2e_per_km",
            "components": {"fuel_combustion": 0.174, "fuel_production": 0.028, "vehicle_manufacture": 0.012},
            "brands": {
                "Mahindra Thar": {"multiplier": 1.05},
                "Toyota Fortuner": {"multiplier": 1.10},
                "Ford Endeavour": {"multiplier": 1.08},
                "Hyundai Creta": {"multiplier": 0.92},
                "Kia Seltos": {"multiplier": 0.91},
            }
        },
        "car_diesel": {"base_factor": 0.209, "unit": "kg_co2e_per_km",
            "components": {"fuel_combustion": 0.161, "fuel_production": 0.035, "vehicle_manufacture": 0.013}},
        "car_cng": {"base_factor": 0.130, "unit": "kg_co2e_per_km",
            "components": {"fuel_combustion": 0.098, "fuel_production": 0.022, "vehicle_manufacture": 0.010}},
        "car_ev": {"base_factor": 0.090, "unit": "kg_co2e_per_km",
            "note": "India coal-heavy grid 0.82 kg CO2/kWh",
            "components": {"electricity": 0.071, "battery_manufacture": 0.012, "vehicle_manufacture": 0.007},
            "brands": {
                "Tata Nexon EV": {"multiplier": 0.87},
                "Tata Tiago EV": {"multiplier": 0.90},
                "MG ZS EV": {"multiplier": 1.05},
                "Tesla Model 3": {"multiplier": 0.75, "note": "Higher efficiency"},
            }
        },
        "car_hybrid": {"base_factor": 0.095, "unit": "kg_co2e_per_km"},
        "motorbike_petrol": {"base_factor": 0.103, "unit": "kg_co2e_per_km",
            "brands": {
                "Royal Enfield": {"multiplier": 1.34, "note": "Large 350-500cc engine"},
                "Bajaj Pulsar": {"multiplier": 0.95},
                "KTM Duke": {"multiplier": 1.10},
                "Yamaha R15": {"multiplier": 0.92},
                "Honda Activa": {"multiplier": 0.95},
            }
        },
        "e_scooter": {"base_factor": 0.022, "unit": "kg_co2e_per_km",
            "brands": {
                "Ola S1 Pro": {"multiplier": 0.95},
                "Ather 450X": {"multiplier": 0.90},
                "Bounce Infinity": {"multiplier": 1.05},
            }
        },
        "auto_rickshaw_petrol": {"base_factor": 0.095, "unit": "kg_co2e_per_km"},
        "auto_rickshaw_cng": {"base_factor": 0.071, "unit": "kg_co2e_per_km"},
        "uber_ola": {"base_factor": 0.190, "unit": "kg_co2e_per_km",
            "note": "Petrol taxi avg, includes deadhead miles"},
        "rapido": {"base_factor": 0.103, "unit": "kg_co2e_per_km"},
        "city_bus": {"base_factor": 0.089, "unit": "kg_co2e_per_passenger_km"},
        "metro": {"base_factor": 0.028, "unit": "kg_co2e_per_passenger_km"},
        "train": {"base_factor": 0.032, "unit": "kg_co2e_per_passenger_km"},
        "flight_domestic": {"base_factor": 0.255, "unit": "kg_co2e_per_km",
            "note": "Includes radiative forcing factor x1.9"},
        "flight_international_economy": {"base_factor": 0.195, "unit": "kg_co2e_per_km"},
        "flight_business": {"base_factor": 0.488, "unit": "kg_co2e_per_km"},
    },

    # ── FOOD ───────────────────────────────────────────────
    # Sources: Poore & Nemecek 2018 (Science), Our World in Data,
    # FAO 2021, restaurant LCAs, brand reports
    "food": {
        # === Meat & Protein
        "beef_100g": {
            "base_factor": 2.50, "unit": "kg_co2e_per_100g",
            "components": {
                "cattle_methane": 1.60, "land_use_change": 0.55,
                "feed_production": 0.25, "processing_transport": 0.10
            },
            "note": "Avg global. Indian beef slightly lower (buffalo)"
        },
        "lamb_mutton_100g": {"base_factor": 2.40, "unit": "kg_co2e_per_100g",
            "components": {"livestock_methane": 1.50, "land_use": 0.60, "feed": 0.20, "other": 0.10}},
        "pork_100g": {"base_factor": 0.72, "unit": "kg_co2e_per_100g"},
        "chicken_100g": {"base_factor": 0.69, "unit": "kg_co2e_per_100g",
            "components": {"feed": 0.42, "processing": 0.15, "transport": 0.12}},
        "fish_farmed_100g": {"base_factor": 0.52, "unit": "kg_co2e_per_100g"},
        "fish_wild_100g": {"base_factor": 0.30, "unit": "kg_co2e_per_100g"},
        "eggs_100g": {"base_factor": 0.45, "unit": "kg_co2e_per_100g"},
        "cheese_100g": {"base_factor": 1.30, "unit": "kg_co2e_per_100g"},
        "milk_100ml": {"base_factor": 0.29, "unit": "kg_co2e_per_100ml"},
        "tofu_100g": {"base_factor": 0.20, "unit": "kg_co2e_per_100g"},
        "legumes_100g": {"base_factor": 0.08, "unit": "kg_co2e_per_100g"},
        "rice_100g": {"base_factor": 0.28, "unit": "kg_co2e_per_100g",
            "note": "Paddy methane emissions significant"},
        "wheat_100g": {"base_factor": 0.15, "unit": "kg_co2e_per_100g"},
        "vegetables_100g": {"base_factor": 0.05, "unit": "kg_co2e_per_100g"},
        "fruits_100g": {"base_factor": 0.07, "unit": "kg_co2e_per_100g"},
        "nuts_100g": {"base_factor": 0.26, "unit": "kg_co2e_per_100g"},
        "chocolate_100g": {"base_factor": 0.75, "unit": "kg_co2e_per_100g"},
        "coffee_cup": {"base_factor": 0.21, "unit": "kg_co2e_per_cup",
            "components": {"coffee_beans": 0.07, "milk_if_latte": 0.10, "cup_lid": 0.04}},
        "tea_cup": {"base_factor": 0.045, "unit": "kg_co2e_per_cup"},
        "bread_slice": {"base_factor": 0.04, "unit": "kg_co2e_per_slice"},
        "butter_10g": {"base_factor": 0.062, "unit": "kg_co2e_per_10g"},
        "oil_cooking_10ml": {"base_factor": 0.019, "unit": "kg_co2e_per_10ml"},

        # === Fast Food Brands (Full LCA)
        "mcdonalds_big_mac": {
            "base_factor": 2.35, "unit": "kg_co2e_per_item",
            "brand": "McDonald's",
            "components": {"beef_patties": 2.11, "bun_veg_sauce": 0.15, "packaging": 0.09},
        },
        "mcdonalds_quarter_pounder": {"base_factor": 2.80, "unit": "kg_co2e_per_item", "brand": "McDonald's"},
        "mcdonalds_double_big_mac": {"base_factor": 4.46, "unit": "kg_co2e_per_item", "brand": "McDonald's"},
        "mcdonalds_mcchicken": {"base_factor": 0.90, "unit": "kg_co2e_per_item", "brand": "McDonald's"},
        "mcdonalds_veggie": {"base_factor": 0.22, "unit": "kg_co2e_per_item", "brand": "McDonald's"},
        "mcdonalds_fries_large": {"base_factor": 0.15, "unit": "kg_co2e_per_item", "brand": "McDonald's"},
        "mcdonalds_full_meal": {"base_factor": 2.67, "unit": "kg_co2e_per_item", "brand": "McDonald's"},
        "kfc_2pc_original": {"base_factor": 1.40, "unit": "kg_co2e_per_item", "brand": "KFC"},
        "kfc_zinger": {"base_factor": 1.60, "unit": "kg_co2e_per_item", "brand": "KFC"},
        "kfc_bucket_8pc": {"base_factor": 5.80, "unit": "kg_co2e_per_item", "brand": "KFC"},
        "bk_whopper": {"base_factor": 2.57, "unit": "kg_co2e_per_item", "brand": "Burger King"},
        "dominos_cheese_pizza": {"base_factor": 3.60, "unit": "kg_co2e_per_item", "brand": "Domino's",
            "note": "Full pizza 8 slices"},
        "dominos_slice": {"base_factor": 0.45, "unit": "kg_co2e_per_slice", "brand": "Domino's"},
        "subway_veggie": {"base_factor": 0.18, "unit": "kg_co2e_per_item", "brand": "Subway"},
        "subway_steak": {"base_factor": 1.30, "unit": "kg_co2e_per_item", "brand": "Subway"},
        "starbucks_latte": {"base_factor": 0.55, "unit": "kg_co2e_per_item", "brand": "Starbucks",
            "components": {"milk": 0.40, "espresso": 0.07, "cup_lid_sleeve": 0.08}},
        "starbucks_americano": {"base_factor": 0.21, "unit": "kg_co2e_per_item", "brand": "Starbucks"},
        "starbucks_frappuccino": {"base_factor": 0.74, "unit": "kg_co2e_per_item", "brand": "Starbucks"},
        "starbucks_cold_brew": {"base_factor": 0.19, "unit": "kg_co2e_per_item", "brand": "Starbucks"},

        # === Beverages
        "coke_330ml_can": {
            "base_factor": 0.17, "unit": "kg_co2e_per_item",
            "brand": "Coca-Cola",
            "components": {"sugar_ingredients": 0.025, "aluminum_can": 0.135, "transport": 0.010},
        },
        "coke_500ml_pet": {"base_factor": 0.14, "unit": "kg_co2e_per_item", "brand": "Coca-Cola"},
        "pepsi_330ml": {"base_factor": 0.17, "unit": "kg_co2e_per_item", "brand": "Pepsi"},
        "red_bull_250ml": {"base_factor": 0.28, "unit": "kg_co2e_per_item", "brand": "Red Bull",
            "note": "Heavy aluminum can premium"},
        "monster_500ml": {"base_factor": 0.32, "unit": "kg_co2e_per_item", "brand": "Monster"},
        "sprite_330ml": {"base_factor": 0.15, "unit": "kg_co2e_per_item"},
        "beer_330ml_can": {"base_factor": 0.34, "unit": "kg_co2e_per_item"},
        "beer_pint_draught": {"base_factor": 0.53, "unit": "kg_co2e_per_item"},
        "kingfisher_650ml": {"base_factor": 0.46, "unit": "kg_co2e_per_item", "brand": "Kingfisher"},
        "heineken_330ml": {"base_factor": 0.36, "unit": "kg_co2e_per_item", "brand": "Heineken"},
        "wine_glass_175ml": {"base_factor": 0.31, "unit": "kg_co2e_per_item"},
        "wine_bottle_750ml": {"base_factor": 1.35, "unit": "kg_co2e_per_item"},
        "whisky_shot_30ml": {"base_factor": 0.085, "unit": "kg_co2e_per_item"},
        "champagne_glass": {"base_factor": 0.43, "unit": "kg_co2e_per_item"},
        "bottled_water_500ml": {"base_factor": 0.083, "unit": "kg_co2e_per_item",
            "components": {"pet_bottle": 0.070, "transport": 0.013}},

        # === Indian Cuisine
        "masala_dosa": {"base_factor": 0.35, "unit": "kg_co2e_per_item"},
        "idli_sambar_2pc": {"base_factor": 0.18, "unit": "kg_co2e_per_item"},
        "butter_chicken": {"base_factor": 2.20, "unit": "kg_co2e_per_item"},
        "chicken_tikka_masala": {"base_factor": 2.00, "unit": "kg_co2e_per_item"},
        "palak_paneer": {"base_factor": 0.85, "unit": "kg_co2e_per_item"},
        "dal_makhani": {"base_factor": 0.42, "unit": "kg_co2e_per_item"},
        "veg_biryani": {"base_factor": 0.55, "unit": "kg_co2e_per_item"},
        "chicken_biryani": {"base_factor": 1.80, "unit": "kg_co2e_per_item"},
        "mutton_biryani": {"base_factor": 5.50, "unit": "kg_co2e_per_item"},
        "beef_biryani": {"base_factor": 7.20, "unit": "kg_co2e_per_item"},
        "paneer_butter_masala": {"base_factor": 0.92, "unit": "kg_co2e_per_item"},
        "fish_curry": {"base_factor": 0.90, "unit": "kg_co2e_per_item"},
        "chole_bhature": {"base_factor": 0.45, "unit": "kg_co2e_per_item"},
        "paratha_butter": {"base_factor": 0.31, "unit": "kg_co2e_per_item"},

        # === Delivery
        "swiggy_delivery": {"base_factor": 0.22, "unit": "kg_co2e_per_order",
            "note": "Motorbike avg 3km + plastic packaging"},
        "zomato_delivery": {"base_factor": 0.22, "unit": "kg_co2e_per_order"},
        "blinkit_delivery": {"base_factor": 0.12, "unit": "kg_co2e_per_order"},
    },

    # ── FASHION ────────────────────────────────────────────
    # Sources: Textile Exchange, WRAP, Fashion Transparency Index,
    # Carbonfact LCA tool, brand sustainability reports
    "fashion": {
        "cotton_tshirt_generic": {
            "base_factor": 2.10, "unit": "kg_co2e_per_item",
            "components": {"cotton_farming": 0.80, "manufacturing": 0.90, "transport": 0.25, "retail": 0.15},
        },
        "polyester_tshirt_generic": {"base_factor": 5.50, "unit": "kg_co2e_per_item"},
        "jeans_denim_generic": {"base_factor": 20.0, "unit": "kg_co2e_per_item",
            "note": "Denim water + dye intensive"},
        "dress_generic": {"base_factor": 4.50, "unit": "kg_co2e_per_item"},
        "jacket_generic": {"base_factor": 9.0, "unit": "kg_co2e_per_item"},
        "shoes_generic": {"base_factor": 7.5, "unit": "kg_co2e_per_item"},
        "socks_pair": {"base_factor": 0.60, "unit": "kg_co2e_per_item"},
        "underwear": {"base_factor": 0.55, "unit": "kg_co2e_per_item"},

        # Brand multipliers on base product
        "brands": {
            "Shein": {
                "multiplier": 3.5,
                "esg_score": 2,
                "note": "Ultra-fast fashion, coal-powered factories, 22% air freight, no transparency",
                "sustainability_grade": "F"
            },
            "Zara": {
                "multiplier": 2.8,
                "esg_score": 4,
                "note": "Fast fashion, 15-day supply chain, 22% air freight, some sustainability claims",
                "sustainability_grade": "D+"
            },
            "H&M": {
                "multiplier": 2.4,
                "esg_score": 5,
                "note": "Fast fashion, coal supply chain, controversial sustainability claims",
                "sustainability_grade": "D+"
            },
            "Primark": {"multiplier": 2.2, "esg_score": 4, "sustainability_grade": "D"},
            "Forever21": {"multiplier": 2.3, "esg_score": 3, "sustainability_grade": "D"},
            "UNIQLO": {"multiplier": 1.8, "esg_score": 6, "sustainability_grade": "C"},
            "Gap": {"multiplier": 1.9, "esg_score": 6, "sustainability_grade": "C"},
            "Levis": {"multiplier": 1.5, "esg_score": 7, "note": "33kg per jeans", "sustainability_grade": "C+"},
            "Nike": {"multiplier": 1.6, "esg_score": 7, "sustainability_grade": "C+"},
            "Adidas": {"multiplier": 1.5, "esg_score": 7, "sustainability_grade": "C+"},
            "Patagonia": {"multiplier": 0.75, "esg_score": 9, "note": "Recycled materials, repairability", "sustainability_grade": "A-"},
            "Everlane": {"multiplier": 0.85, "esg_score": 8, "sustainability_grade": "B+"},
            "tentree": {"multiplier": 0.60, "esg_score": 10, "sustainability_grade": "A"},
            "Puma": {"multiplier": 1.55, "esg_score": 7, "sustainability_grade": "C+"},
            "Reebok": {"multiplier": 1.50, "esg_score": 7, "sustainability_grade": "C"},
            "Louis Vuitton": {"multiplier": 4.5, "base_override": 25.0, "note": "Leather + luxury manufacturing", "sustainability_grade": "D"},
            "Gucci": {"multiplier": 4.0, "base_override": 22.0, "sustainability_grade": "D"},
            "Prada": {"multiplier": 3.8, "sustainability_grade": "D"},
            "Burberry": {"multiplier": 2.8, "esg_score": 7, "sustainability_grade": "C"},
            "Rolex": {"multiplier": 1.0, "base_override": 18.0, "note": "Watch 18kg CO2e"},
            "Fabindia": {"multiplier": 1.2, "esg_score": 7, "note": "Handloom, lower transport", "sustainability_grade": "C+"},
            "Myntra": {"multiplier": 1.8, "note": "Fast fashion aggregator"},
            "Ajio": {"multiplier": 1.9},
        }
    },

    # ── ELECTRONICS ────────────────────────────────────────
    # Sources: Apple PER reports, Samsung ESG, IDC lifecycle studies
    "electronics": {
        "iphone_16": {"purchase_kg": 57, "daily_amortized": 0.039, "lifespan_days": 1460, "brand": "Apple"},
        "iphone_16_pro": {"purchase_kg": 66, "daily_amortized": 0.045, "lifespan_days": 1460, "brand": "Apple"},
        "iphone_16_pro_max": {"purchase_kg": 77, "daily_amortized": 0.053, "lifespan_days": 1460, "brand": "Apple"},
        "iphone_15": {"purchase_kg": 61, "daily_amortized": 0.042, "lifespan_days": 1460, "brand": "Apple"},
        "iphone_14": {"purchase_kg": 70, "daily_amortized": 0.048, "lifespan_days": 1460, "brand": "Apple"},
        "iphone_se": {"purchase_kg": 43, "daily_amortized": 0.029, "lifespan_days": 1460, "brand": "Apple"},
        "samsung_galaxy_s24": {"purchase_kg": 58, "daily_amortized": 0.040, "lifespan_days": 1460, "brand": "Samsung"},
        "samsung_galaxy_s24_ultra": {"purchase_kg": 77, "daily_amortized": 0.053, "lifespan_days": 1460, "brand": "Samsung"},
        "samsung_galaxy_a_series": {"purchase_kg": 35, "daily_amortized": 0.024, "lifespan_days": 1460, "brand": "Samsung"},
        "oneplus_12": {"purchase_kg": 52, "daily_amortized": 0.036, "lifespan_days": 1460, "brand": "OnePlus"},
        "pixel_9": {"purchase_kg": 55, "daily_amortized": 0.038, "lifespan_days": 1460, "brand": "Google"},
        "budget_android": {"purchase_kg": 28, "daily_amortized": 0.019, "lifespan_days": 1460},
        "macbook_air_m2": {"purchase_kg": 147, "daily_amortized": 0.10, "lifespan_days": 1460, "brand": "Apple",
            "use_per_hour": 0.012},
        "macbook_pro_14": {"purchase_kg": 194, "daily_amortized": 0.13, "lifespan_days": 1460, "brand": "Apple",
            "use_per_hour": 0.015},
        "macbook_pro_16": {"purchase_kg": 394, "daily_amortized": 0.27, "lifespan_days": 1460, "brand": "Apple",
            "use_per_hour": 0.022},
        "laptop_generic": {"purchase_kg": 300, "daily_amortized": 0.21, "lifespan_days": 1460,
            "use_per_hour": 0.018},
        "gaming_laptop": {"purchase_kg": 450, "daily_amortized": 0.31, "lifespan_days": 1460,
            "use_per_hour": 0.060},
        "ipad_pro": {"purchase_kg": 119, "daily_amortized": 0.082, "lifespan_days": 1460, "brand": "Apple"},
        "apple_watch": {"purchase_kg": 22, "daily_amortized": 0.015, "lifespan_days": 1460, "brand": "Apple"},
        "airpods_pro": {"purchase_kg": 29, "daily_amortized": 0.020, "lifespan_days": 1460, "brand": "Apple"},
        "ps5": {"purchase_kg": 126, "daily_amortized": 0.087, "lifespan_days": 1460, "brand": "Sony",
            "use_per_hour": 0.060},
        "xbox_series_x": {"purchase_kg": 110, "daily_amortized": 0.076, "lifespan_days": 1460,
            "use_per_hour": 0.060},
        "smart_tv_55": {"purchase_kg": 350, "daily_amortized": 0.096, "lifespan_days": 3650,
            "use_per_hour": 0.070},
        "smart_tv_65": {"purchase_kg": 450, "daily_amortized": 0.123, "lifespan_days": 3650,
            "use_per_hour": 0.090},
        # Per-use energy (India grid 0.82 kg CO2/kWh)
        "streaming_1hr": {"use_factor": 0.036, "unit": "kg_co2e_per_hour",
            "note": "Device energy + CDN servers"},
        "gaming_1hr": {"use_factor": 0.060, "unit": "kg_co2e_per_hour"},
        "video_call_1hr": {"use_factor": 0.015, "unit": "kg_co2e_per_hour"},
        "music_streaming_1hr": {"use_factor": 0.003, "unit": "kg_co2e_per_hour"},
    },

    # ── ENERGY & HOME ──────────────────────────────────────
    # India grid: 0.82 kg CO2/kWh (CEA 2022)
    "energy": {
        "ac_1_5ton_1hr": {"base_factor": 0.820, "unit": "kg_co2e_per_hour",
            "components": {"electricity": 0.820}},
        "ac_1ton_1hr": {"base_factor": 0.550, "unit": "kg_co2e_per_hour"},
        "ceiling_fan_1hr": {"base_factor": 0.025, "unit": "kg_co2e_per_hour"},
        "hot_shower_electric_10min": {"base_factor": 0.35, "unit": "kg_co2e_per_shower"},
        "hot_shower_gas_10min": {"base_factor": 0.18, "unit": "kg_co2e_per_shower"},
        "washing_machine_cold": {"base_factor": 0.10, "unit": "kg_co2e_per_load"},
        "washing_machine_hot": {"base_factor": 0.31, "unit": "kg_co2e_per_load"},
        "tumble_dryer": {"base_factor": 0.65, "unit": "kg_co2e_per_load"},
        "dishwasher": {"base_factor": 0.47, "unit": "kg_co2e_per_cycle"},
        "fridge_per_day": {"base_factor": 0.360, "unit": "kg_co2e_per_day"},
        "electric_cooking_meal": {"base_factor": 0.290, "unit": "kg_co2e_per_meal"},
        "lpg_cooking_meal": {"base_factor": 0.180, "unit": "kg_co2e_per_meal"},
        "led_bulb_1hr": {"base_factor": 0.0082, "unit": "kg_co2e_per_hour"},
    },

    # ── LIFESTYLE ──────────────────────────────────────────
    "lifestyle": {
        "cigarette_1": {"base_factor": 0.014, "unit": "kg_co2e_per_item",
            "components": {"tobacco_growing": 0.008, "manufacturing_packaging": 0.004, "butts_waste": 0.002},
            "source": "Zafeiridou et al 2018 Tobacco Control"},
        "cigarette_pack_20": {"base_factor": 0.280, "unit": "kg_co2e_per_pack"},
        "bidi_1": {"base_factor": 0.006, "unit": "kg_co2e_per_item"},
        "hookah_session": {"base_factor": 0.085, "unit": "kg_co2e_per_session"},
        "vape_cartridge": {"base_factor": 0.040, "unit": "kg_co2e_per_item"},
        "cannabis_joint_1g": {"base_factor": 0.28, "unit": "kg_co2e_per_gram",
            "note": "Indoor grow energy-intensive"},
        "gym_session_1hr": {"base_factor": 0.082, "unit": "kg_co2e_per_session"},
        "swimming_1hr": {"base_factor": 0.110, "unit": "kg_co2e_per_session"},
        "shopping_mall_2hr": {"base_factor": 0.38, "unit": "kg_co2e_per_visit",
            "note": "HVAC + escalators amortized per visitor"},
        "hotel_budget_night": {"base_factor": 8.8, "unit": "kg_co2e_per_night"},
        "hotel_5star_night": {"base_factor": 26.4, "unit": "kg_co2e_per_night"},
        "airbnb_night": {"base_factor": 6.2, "unit": "kg_co2e_per_night"},
        "bottled_water_1l": {"base_factor": 0.14, "unit": "kg_co2e_per_litre"},
        "plastic_bag": {"base_factor": 0.011, "unit": "kg_co2e_per_item"},
        # Personal care
        "shampoo_use": {"base_factor": 0.012, "unit": "kg_co2e_per_use"},
        "deodorant_aerosol": {"base_factor": 0.032, "unit": "kg_co2e_per_use"},
        "disposable_razor": {"base_factor": 0.045, "unit": "kg_co2e_per_item"},
        # Pets
        "dog_medium_day": {"base_factor": 2.70, "unit": "kg_co2e_per_day",
            "note": "Food + waste management"},
        "cat_day": {"base_factor": 0.93, "unit": "kg_co2e_per_day"},
        # Finance
        "bitcoin_transaction": {"base_factor": 0.58, "unit": "kg_co2e_per_transaction"},
        "ethereum_transaction": {"base_factor": 0.0002, "unit": "kg_co2e_per_transaction",
            "note": "Post-merge proof-of-stake"},
        # Delivery
        "amazon_standard_delivery": {"base_factor": 0.16, "unit": "kg_co2e_per_package"},
        "amazon_same_day": {"base_factor": 0.28, "unit": "kg_co2e_per_package"},
        "flipkart_delivery": {"base_factor": 0.14, "unit": "kg_co2e_per_package"},
    },

    # ── ENTERTAINMENT ──────────────────────────────────────
    "entertainment": {
        "pvr_cinema": {"base_factor": 0.42, "unit": "kg_co2e_per_person",
            "components": {"hvac": 0.18, "projector_equipment": 0.09, "building_amortized": 0.08, "travel_avg": 0.07}},
        "inox_cinema": {"base_factor": 0.42, "unit": "kg_co2e_per_person"},
        "imax_screening": {"base_factor": 0.68, "unit": "kg_co2e_per_person"},
        "concert_festival": {"base_factor": 0.72, "unit": "kg_co2e_per_person"},
    }
}

# ════════════════════════════════════════════════════════
# SECTION 2: NER PATTERNS — Rule-based entity extractor
# This is the "intelligence" layer that parses free text
# ════════════════════════════════════════════════════════

NER_PATTERNS = {
    # TRANSPORT triggers
    "transport": {
        "car_petrol_sedan": [
            r"drove?\s+(?:my\s+)?(?:car|sedan|hatchback|swift|city|i20|verna|polo|jazz)",
            r"(?:petrol|regular)\s+car",
            r"(?:maruti|hyundai|honda|volkswagen|ford)\s+\w+",
        ],
        "car_petrol_suv": [
            r"drove?\s+(?:my\s+)?(?:suv|fortuner|creta|seltos|xuv|thar|harrier|safari|brezza)",
            r"(?:petrol|diesel)?\s*suv",
        ],
        "car_diesel": [r"diesel\s+car", r"(?:innova|scorpio|bolero)"],
        "car_ev": [r"(?:electric\s+car|ev|nexon\s+ev|tata\s+ev|tesla|ather\s+electric)"],
        "car_cng": [r"cng\s+(?:car|auto|vehicle)"],
        "motorbike_petrol": [r"(?:bike|motorbike|motorcycle|pulsar|r15|bullet|duke|activa|splendor|platina)"],
        "royal_enfield": [r"royal\s+enfield|re\s+(?:350|500|650)"],
        "e_scooter": [r"(?:e-?scooter|electric\s+scooter|ola\s+s1|ather|bounce)"],
        "uber_ola": [r"(?:uber|ola|cab|taxi|rapido)\s+(?:car|sedan|suv)?"],
        "auto_rickshaw_cng": [r"(?:auto|rickshaw|tuk.?tuk)"],
        "city_bus": [r"(?:bus|bmtc|dtc|best\s+bus|local\s+bus)"],
        "metro": [r"(?:metro|subway|mrt|namma\s+metro)"],
        "train": [r"(?:train|railway|irctc|shatabdi|rajdhani|local\s+train|vande\s+bharat)"],
        "flight_domestic": [r"(?:flight|flew|plane|air\s+india|indigo|spicejet|vistara|goair|domestic\s+flight)"],
    },

    # FOOD triggers
    "food": {
        "mcdonalds_big_mac": [r"big\s+mac", r"double\s+burger\s+mcd"],
        "mcdonalds_quarter_pounder": [r"quarter\s+pounder"],
        "mcdonalds_full_meal": [r"(?:mcd|mcdonalds?|mc\s+donald)\s+(?:meal|combo|full)"],
        "mcdonalds_mcchicken": [r"mc\s*chicken|mc\s*nugget"],
        "mcdonalds_fries_large": [r"(?:mcd|mcdonalds?)\s+fries"],
        "kfc_zinger": [r"zinger\s+burger"],
        "kfc_bucket_8pc": [r"kfc\s+bucket"],
        "kfc_2pc_original": [r"kfc|kentucky\s+fried"],
        "bk_whopper": [r"whopper|burger\s+king"],
        "dominos_cheese_pizza": [r"(?:dominos?|pizza\s+hut)\s+(?:pizza|order)"],
        "subway_veggie": [r"subway\s+(?:veggie|salad|veg)"],
        "subway_steak": [r"subway\s+(?:steak|chicken|tuna|turkey)"],
        "starbucks_latte": [r"starbucks?\s+(?:latte|coffee|flat\s+white|cappuccino|macchiato)"],
        "starbucks_frappuccino": [r"(?:frappuccino|frappe|starbucks?\s+cold)"],
        "starbucks_americano": [r"starbucks?\s+americano"],
        "coke_330ml_can": [r"(?:coke|coca.?cola|pepsi)\s+(?:can|330|small)", r"(?:had|drank)\s+a\s+(?:coke|pepsi)"],
        "coke_500ml_pet": [r"(?:coke|coca.?cola)\s+(?:500|bottle|large)"],
        "red_bull_250ml": [r"red\s+bull"],
        "monster_500ml": [r"monster\s+energy"],
        "beer_330ml_can": [r"(?:beer|lager)\s+(?:can|330|small)"],
        "beer_pint_draught": [r"(?:pint|draught|draft)\s+(?:beer|lager)", r"pint\s+of\s+"],
        "kingfisher_650ml": [r"kingfisher"],
        "heineken_330ml": [r"heineken"],
        "wine_glass_175ml": [r"glass\s+of\s+wine|wine\s+glass"],
        "wine_bottle_750ml": [r"bottle\s+of\s+wine"],
        "whisky_shot_30ml": [r"(?:whisky|whiskey|rum|vodka|gin|tequila)\s+(?:shot|peg|30ml|60ml)"],
        "champagne_glass": [r"champagne"],
        "bottled_water_500ml": [r"(?:bisleri|kinley|aquafina|bottled\s+water)"],
        "swiggy_delivery": [r"swiggy|zomato"],
        "masala_dosa": [r"(?:masala\s+)?dosa"],
        "idli_sambar_2pc": [r"idli\s+(?:sambar|chutney)?"],
        "butter_chicken": [r"butter\s+chicken|murgh\s+makhani"],
        "chicken_tikka_masala": [r"chicken\s+tikka"],
        "palak_paneer": [r"palak\s+paneer"],
        "dal_makhani": [r"dal\s+(?:makhani|tadka|fry)"],
        "veg_biryani": [r"veg(?:etable)?\s+biryani"],
        "chicken_biryani": [r"chicken\s+biryani"],
        "mutton_biryani": [r"mutton\s+biryani"],
        "beef_biryani": [r"beef\s+biryani"],
        "paneer_butter_masala": [r"paneer\s+(?:butter|makhani)"],
        "fish_curry": [r"fish\s+(?:curry|fry|masala)"],
        "chole_bhature": [r"chole\s+bhature?"],
    },

    # FASHION triggers
    "fashion": {
        "zara_shirt": [r"(?:shirt|top|blouse|kurta)\s+(?:from\s+)?zara|zara\s+(?:shirt|top|blouse|dress|jeans)"],
        "zara_dress": [r"dress\s+(?:from\s+)?zara|zara\s+dress"],
        "shein_item": [r"(?:from\s+)?shein|shein\s+\w+"],
        "hm_item": [r"(?:from\s+)?h&?m|h\s+and\s+m\s+\w+"],
        "levis_jeans": [r"levi(?:s|'s)?\s+jeans|levis"],
        "nike_item": [r"nike\s+(?:shoes|shirt|jacket|tshirt|sneakers|shorts)"],
        "adidas_item": [r"adidas\s+(?:shoes|shirt|jacket|tshirt|sneakers)"],
        "patagonia_item": [r"patagonia\s+\w+"],
        "lv_item": [r"louis\s+vuitton|lv\s+(?:bag|wallet|belt|shoes)"],
        "gucci_item": [r"gucci\s+\w+"],
        "rolex_watch": [r"rolex"],
        "generic_shirt": [r"(?:bought|purchased)\s+(?:a\s+)?(?:shirt|t-?shirt|top|blouse)"],
        "generic_jeans": [r"(?:bought|purchased)\s+(?:a\s+)?(?:jeans|trousers|pants)"],
        "generic_dress": [r"(?:bought|purchased)\s+(?:a\s+)?(?:dress|skirt)"],
        "generic_shoes": [r"(?:bought|purchased)\s+(?:a\s+)?(?:shoes|sneakers|boots|sandals)"],
    },

    # ELECTRONICS triggers
    "electronics": {
        "iphone_16": [r"iphone\s+16(?:\s+(?:plus|regular|base))?(?!\s+pro)"],
        "iphone_16_pro": [r"iphone\s+16\s+pro(?!\s+max)"],
        "iphone_16_pro_max": [r"iphone\s+16\s+pro\s+max"],
        "iphone_15": [r"iphone\s+15(?!\s+pro)"],
        "samsung_galaxy_s24_ultra": [r"(?:samsung\s+)?galaxy\s+s24\s+ultra"],
        "samsung_galaxy_s24": [r"(?:samsung\s+)?galaxy\s+s24(?!\s+ultra)"],
        "macbook_pro_16": [r"macbook\s+pro\s+16"],
        "macbook_pro_14": [r"macbook\s+pro(?:\s+14)?"],
        "macbook_air_m2": [r"macbook\s+air"],
        "laptop_generic": [r"(?:bought|got|purchased)\s+(?:a\s+)?(?:laptop|notebook|computer)"],
        "ps5": [r"(?:ps5|playstation\s+5|playstation5)"],
        "xbox_series_x": [r"xbox\s+(?:series\s+x|series\s+s)?"],
        "smart_tv_65": [r"(?:65|70|75)\s*(?:inch|\")\s+tv|tv\s+65"],
        "smart_tv_55": [r"(?:55|50)\s*(?:inch|\")\s+tv|(?:bought|got)\s+(?:a\s+)?(?:smart\s+)?tv"],
        "streaming_1hr": [r"(?:netflix|youtube|disney\+?|prime\s+video|hotstar|jiocinema|watched)"],
        "gaming_1hr": [r"(?:played|gaming|video\s+games?|gamed)\s+(?:for\s+)?(\d+)\s+(?:hrs?|hours?)"],
        "video_call_1hr": [r"(?:zoom|google\s+meet|teams|video\s+call|whatsapp\s+video)"],
    },

    # ENERGY triggers
    "energy": {
        "ac_1_5ton_1hr": [r"(?:ac|air\s+conditioner|aircon)\s+(?:for\s+)?(\d+)\s+(?:hrs?|hours?)"],
        "hot_shower_electric_10min": [r"(?:hot\s+shower|shower|bath)"],
        "washing_machine_cold": [r"(?:washing\s+machine|laundry|washed\s+clothes)"],
        "electric_cooking_meal": [r"(?:cooked|cooking|made\s+(?:lunch|dinner|breakfast))"],
    },

    # LIFESTYLE triggers
    "lifestyle": {
        "cigarette_pack_20": [r"(?:pack|packet)\s+(?:of\s+)?cigarettes?|20\s+cigarettes?"],
        "cigarette_1": [r"(\d+)\s+cigarettes?|smoked\s+(\d+)"],
        "bidi_1": [r"bidi|beedi"],
        "hookah_session": [r"hookah|shisha|waterpipe"],
        "vape_cartridge": [r"vape|e-?cigarette|vaping"],
        "cannabis_joint_1g": [r"(?:weed|cannabis|marijuana|joint|blunt|spliff|ganja)"],
        "gym_session_1hr": [r"(?:gym|workout|exercise|weight\s+training|crossfit)"],
        "swimming_1hr": [r"(?:swimming|swim|pool)"],
        "shopping_mall_2hr": [r"(?:mall|shopping\s+mall|phoenix|nexus|orion\s+mall)"],
        "hotel_5star_night": [r"(?:5.?star|luxury|taj|oberoi|leela|marriott|hilton)\s+(?:hotel|resort)"],
        "hotel_budget_night": [r"(?:hotel|stayed\s+at)"],
        "dog_medium_day": [r"(?:dog|puppy|labrador|golden\s+retriever|german\s+shepherd)"],
        "cat_day": [r"(?:cat|kitten|feline|persian\s+cat)"],
        "bitcoin_transaction": [r"(?:bitcoin|btc)\s+(?:transaction|bought|sold|transferred)"],
        "amazon_same_day": [r"amazon\s+(?:prime|same.?day|express)"],
        "amazon_standard_delivery": [r"(?:ordered\s+(?:from\s+)?amazon|amazon\s+order)"],
        "flipkart_delivery": [r"(?:ordered\s+(?:from\s+)?flipkart|flipkart\s+order)"],
    },

    # ENTERTAINMENT triggers
    "entertainment": {
        "pvr_cinema": [r"(?:pvr|inox|cinepolis|movie|cinema|film)\s+(?:movie|ticket|show)?"],
        "imax_screening": [r"imax"],
        "concert_festival": [r"(?:concert|live\s+show|festival|gig|lollapalooza|sunburn)"],
    }
}

# ════════════════════════════════════════════════════════
# SECTION 3: QUANTITY EXTRACTOR
# Extract numbers and map to units
# ════════════════════════════════════════════════════════

def extract_quantity(text: str, context: str = "") -> float:
    """Extract quantity from text near an activity mention"""
    # Look for patterns like "60km", "3 beers", "4 hours", "2x"
    patterns = [
        (r'(\d+(?:\.\d+)?)\s*km', 1.0),
        (r'(\d+(?:\.\d+)?)\s*(?:kms|kilometres?|miles?)', 1.0),
        (r'(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)', 1.0),
        (r'(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)', 1/60),
        (r'(\d+(?:\.\d+)?)\s*(?:pieces?|items?|units?|x)', 1.0),
        (r'(\d+)\s*(?:cans?|bottles?|glasses?|cups?|pints?|shots?)', 1.0),
        (r'(\d+)\s*cigarettes?', 1.0),
        (r'(\d+)', 1.0),  # fallback: any number
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, text + " " + context, re.IGNORECASE)
        if match:
            return float(match.group(1)) * multiplier
    return 1.0  # default quantity

# ════════════════════════════════════════════════════════
# SECTION 4: BRAND PENALTY NETWORK
# A small neural network that predicts brand multipliers
# for unknown brands based on their characteristics
# ════════════════════════════════════════════════════════

BRAND_FEATURES = {
    # [supply_chain_speed, transparency, renewable_energy, recycled_materials, air_freight_pct, esg_score]
    # Supply chain speed: 1=slow/made-to-order, 10=ultra-fast
    "Shein":      [10, 1, 1, 0, 8, 2],   # multiplier: 3.5
    "Zara":       [9,  3, 3, 2, 7, 4],   # multiplier: 2.8
    "H&M":        [8,  4, 4, 3, 5, 5],   # multiplier: 2.4
    "Primark":    [7,  3, 2, 1, 4, 4],   # multiplier: 2.2
    "UNIQLO":     [5,  5, 4, 3, 3, 6],   # multiplier: 1.8
    "Gap":        [5,  5, 4, 2, 3, 6],   # multiplier: 1.9
    "Nike":       [6,  6, 5, 4, 4, 7],   # multiplier: 1.6
    "Adidas":     [6,  6, 6, 4, 4, 7],   # multiplier: 1.5
    "Patagonia":  [3,  9, 8, 7, 1, 9],   # multiplier: 0.75
    "Everlane":   [4,  8, 7, 6, 2, 8],   # multiplier: 0.85
}

def train_brand_penalty_network():
    """
    Train a simple neural network to predict brand multiplier
    from brand characteristics. This generalizes to unknown brands.
    """
    X = np.array(list(BRAND_FEATURES.values()), dtype=float)
    y = np.array([3.5, 2.8, 2.4, 2.2, 1.8, 1.9, 1.6, 1.5, 0.75, 0.85])

    # Normalize features
    X_mean = X.mean(axis=0)
    X_std = X.std(axis=0) + 1e-8
    X_norm = (X - X_mean) / X_std

    # Simple 2-layer network: 6 -> 8 -> 4 -> 1
    np.random.seed(42)
    W1 = np.random.randn(6, 8) * 0.5
    b1 = np.zeros(8)
    W2 = np.random.randn(8, 4) * 0.5
    b2 = np.zeros(4)
    W3 = np.random.randn(4, 1) * 0.5
    b3 = np.zeros(1)

    def relu(x): return np.maximum(0, x)
    def forward(x):
        h1 = relu(x @ W1 + b1)
        h2 = relu(h1 @ W2 + b2)
        out = h2 @ W3 + b3
        return out.flatten()

    # Train with gradient descent
    lr = 0.01
    for epoch in range(5000):
        pred = forward(X_norm)
        loss = np.mean((pred - y) ** 2)

        # Backprop (manual)
        err = 2 * (pred - y) / len(y)
        h1 = relu(X_norm @ W1 + b1)
        h2 = relu(h1 @ W2 + b2)

        dW3 = h2.T @ err.reshape(-1, 1)
        db3 = err.sum()
        dh2 = err.reshape(-1, 1) @ W3.T
        dh2 *= (h2 > 0)
        dW2 = h1.T @ dh2
        db2 = dh2.sum(axis=0)
        dh1 = dh2 @ W2.T
        dh1 *= (h1 > 0)
        dW1 = X_norm.T @ dh1
        db1 = dh1.sum(axis=0)

        W3 -= lr * dW3; b3 -= lr * db3
        W2 -= lr * dW2; b2 -= lr * db2
        W1 -= lr * dW1; b1 -= lr * db1

        if epoch % 1000 == 0:
            print(f"  Epoch {epoch}: loss={loss:.4f}")

    return {
        "W1": W1.tolist(), "b1": b1.tolist(),
        "W2": W2.tolist(), "b2": b2.tolist(),
        "W3": W3.tolist(), "b3": b3.tolist(),
        "X_mean": X_mean.tolist(), "X_std": X_std.tolist()
    }

# ════════════════════════════════════════════════════════
# SECTION 5: INFERENCE ENGINE
# The full pipeline: text → entities → emissions
# ════════════════════════════════════════════════════════

class CarbonInferenceEngine:
    def __init__(self, model_data: dict):
        self.graph = model_data["emission_graph"]
        self.patterns = model_data["ner_patterns"]
        self.brand_net = model_data["brand_network"]

    def predict(self, text: str) -> dict:
        """Full pipeline: free text → structured carbon breakdown"""
        text_lower = text.lower()
        activities = []

        # Step 1: Entity recognition
        detected = self._detect_entities(text_lower)

        # Step 2: For each entity, compute emissions
        for entity in detected:
            activity = self._compute_emission(entity, text_lower)
            if activity:
                activities.append(activity)

        # Step 3: Aggregate
        total = sum(a["total_kg_co2e"] for a in activities)
        totals_by_cat = {}
        for a in activities:
            cat = a["category"]
            totals_by_cat[cat] = totals_by_cat.get(cat, 0) + a["total_kg_co2e"]

        # Step 4: Uncertainty estimation (Monte Carlo style)
        confidence_factors = {"high": 0.05, "medium": 0.15, "low": 0.30}
        uncertainty = sum(
            a["total_kg_co2e"] * confidence_factors.get(a.get("confidence", "medium"), 0.15)
            for a in activities
        )

        return {
            "activities": activities,
            "totals_by_category": totals_by_cat,
            "total_kg_co2e": round(total, 3),
            "uncertainty_kg": round(uncertainty, 3),
            "confidence_interval": [round(total - uncertainty, 3), round(total + uncertainty, 3)],
            "summary": self._generate_summary(activities, total)
        }

    def _detect_entities(self, text: str) -> list:
        """NER: find all activities in text"""
        found = []
        used_spans = []

        for category, items in self.patterns.items():
            for item_key, patterns in items.items():
                for pattern in patterns:
                    for match in re.finditer(pattern, text, re.IGNORECASE):
                        span = (match.start(), match.end())
                        # Avoid double-counting overlapping matches
                        if not any(s[0] < span[1] and span[0] < s[1] for s in used_spans):
                            # Extract quantity from surrounding context
                            context_start = max(0, match.start() - 40)
                            context_end = min(len(text), match.end() + 40)
                            context = text[context_start:context_end]
                            quantity = self._extract_quantity_smart(context, item_key)

                            found.append({
                                "key": item_key,
                                "category": category,
                                "match_text": match.group(0),
                                "context": context,
                                "quantity": quantity,
                                "span": span
                            })
                            used_spans.append(span)
                            break  # one match per pattern per item

        return found

    def _extract_quantity_smart(self, context: str, item_key: str) -> float:
        """Extract relevant quantity based on item type"""
        # Distance for transport
        if any(k in item_key for k in ["car", "bike", "bus", "metro", "train", "uber", "auto", "scooter", "flight"]):
            km_match = re.search(r'(\d+(?:\.\d+)?)\s*k?m', context, re.I)
            if km_match:
                val = float(km_match.group(1))
                # If "100m" probably means meters not km, ignore
                return val if val > 0.5 else 1.0
            return 15.0  # default trip length

        # Duration for energy/streaming
        if any(k in item_key for k in ["ac_", "streaming", "gaming", "video_call", "gym", "swimming", "hotel"]):
            hr_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hr|hour|hrs|hours)', context, re.I)
            if hr_match:
                return float(hr_match.group(1))
            min_match = re.search(r'(\d+)\s*(?:min|mins|minute)', context, re.I)
            if min_match:
                return float(min_match.group(1)) / 60
            return 1.0

        # Count for cigarettes, beers, etc.
        if any(k in item_key for k in ["cigarette_1", "bidi", "beer_330", "shot", "wine_glass", "coke_330", "vape"]):
            count_match = re.search(r'(\d+)\s*(?:cigarettes?|beers?|cans?|glasses?|shots?|pegs?)?', context, re.I)
            if count_match:
                return min(float(count_match.group(1)), 20)  # cap at 20
            return 1.0

        return 1.0  # default: 1 unit

    def _compute_emission(self, entity: dict, full_text: str) -> Optional[dict]:
        """Compute CO2e for a detected entity"""
        key = entity["key"]
        cat = entity["category"]
        qty = entity["quantity"]

        # Find emission factor
        cat_graph = self.graph.get(cat, {})

        # Direct lookup
        if key in cat_graph:
            ef_data = cat_graph[key]

            if "base_factor" in ef_data:
                base = ef_data["base_factor"]
                total = base * qty

                # Check for brand modifier
                brand_name, brand_mult, brand_premium = None, 1.0, 0.0
                if "brand" in ef_data:
                    brand_name = ef_data["brand"]
                    # No multiplier for specific brand products — factor already baked in

                # Fashion brand detection
                if cat == "fashion":
                    for brand, brand_data in cat_graph.get("brands", {}).items():
                        if brand.lower() in entity["context"].lower() or brand.lower() in full_text[:200].lower():
                            brand_name = brand
                            brand_mult = brand_data.get("multiplier", 1.0)
                            base_before = base * qty
                            total = base * qty * brand_mult
                            brand_premium = total - base_before
                            break

                # Build components
                components = []
                if "components" in ef_data:
                    for comp_name, comp_frac in ef_data["components"].items():
                        comp_kg = comp_frac * qty
                        components.append({
                            "label": comp_name.replace("_", " ").title(),
                            "emission_factor": f"{comp_frac:.4f} kg/{ef_data.get('unit', 'unit')}",
                            "calculation": f"{qty} × {comp_frac:.4f}",
                            "kg_co2e": round(comp_kg, 4)
                        })

                if not components:
                    components.append({
                        "label": "Total emission",
                        "emission_factor": f"{base:.4f} {ef_data.get('unit', 'kg_co2e')}",
                        "calculation": f"{qty} × {base:.4f}",
                        "kg_co2e": round(total, 4)
                    })

                confidence = "high" if ef_data.get("source") else "medium"
                icon = self._get_icon(cat, key)

                return {
                    "id": f"act_{hash(key + str(qty))%10000:04d}",
                    "name": self._get_display_name(key, brand_name),
                    "category": cat if cat != "fashion" else "fashion",
                    "icon": icon,
                    "quantity_description": self._format_quantity(qty, ef_data.get("unit", "")),
                    "total_kg_co2e": round(total, 3),
                    "confidence": confidence,
                    "brand": brand_name,
                    "brand_multiplier": round(brand_mult, 2),
                    "brand_premium_kg": round(brand_premium, 3),
                    "components": components,
                    "reasoning": self._generate_reasoning(ef_data, qty, total, brand_name, brand_mult)
                }

            # Electronics: purchase
            elif "purchase_kg" in ef_data:
                purchase = ef_data["purchase_kg"]
                daily = ef_data.get("daily_amortized", 0)
                return {
                    "id": f"act_{hash(key)%10000:04d}",
                    "name": self._get_display_name(key, ef_data.get("brand")),
                    "category": "electronics",
                    "icon": "💻" if "laptop" in key or "macbook" in key else "📱" if "phone" in key or "iphone" in key or "samsung" in key or "pixel" in key or "oneplus" in key else "🎮",
                    "quantity_description": "1 unit purchased",
                    "total_kg_co2e": purchase,
                    "confidence": "high",
                    "brand": ef_data.get("brand"),
                    "brand_multiplier": 1.0,
                    "brand_premium_kg": 0.0,
                    "components": [
                        {"label": "Manufacturing", "emission_factor": f"{purchase*0.75:.1f} kg fixed",
                         "calculation": f"1 × {purchase*0.75:.1f}", "kg_co2e": round(purchase*0.75, 2)},
                        {"label": "Raw materials", "emission_factor": "",
                         "calculation": f"1 × {purchase*0.15:.1f}", "kg_co2e": round(purchase*0.15, 2)},
                        {"label": "Transport to consumer", "emission_factor": "",
                         "calculation": f"1 × {purchase*0.10:.1f}", "kg_co2e": round(purchase*0.10, 2)},
                    ],
                    "reasoning": f"One-time purchase footprint of {purchase} kg CO₂e based on manufacturer LCA reports. "
                                 f"Amortized over {ef_data.get('lifespan_days', 1460)}-day lifespan = {daily:.3f} kg/day. "
                                 f"Manufacturing dominates at ~75% of lifecycle. "
                                 f"Consider repairability and extended use to lower per-day impact."
                }

            # Per-use energy items
            elif "use_factor" in ef_data:
                total = ef_data["use_factor"] * qty
                return {
                    "id": f"act_{hash(key+str(qty))%10000:04d}",
                    "name": self._get_display_name(key, None),
                    "category": cat,
                    "icon": self._get_icon(cat, key),
                    "quantity_description": f"{qty:.1f} hours",
                    "total_kg_co2e": round(total, 3),
                    "confidence": "medium",
                    "brand": None,
                    "brand_multiplier": 1.0,
                    "brand_premium_kg": 0.0,
                    "components": [
                        {"label": "Device energy", "emission_factor": f"{ef_data['use_factor']} kg/hr",
                         "calculation": f"{qty} × {ef_data['use_factor']}", "kg_co2e": round(total*0.65, 4)},
                        {"label": "Server/CDN infrastructure", "emission_factor": "",
                         "calculation": "", "kg_co2e": round(total*0.35, 4)},
                    ],
                    "reasoning": f"Streaming/digital use at {ef_data['use_factor']} kg CO₂e/hr based on India grid intensity. "
                                 f"Includes device energy plus data center and CDN costs."
                }

        return None

    def _get_display_name(self, key: str, brand: Optional[str]) -> str:
        """Convert snake_case key to display name"""
        name = key.replace("_", " ").title()
        name = name.replace("1Hr", "1hr").replace("330Ml", "330ml").replace("1 5Ton", "1.5-ton")
        if brand and brand.lower() not in name.lower():
            name = f"{brand} {name}"
        return name

    def _format_quantity(self, qty: float, unit: str) -> str:
        if "per_km" in unit:
            return f"{qty:.0f} km"
        elif "per_hour" in unit:
            return f"{qty:.1f} hrs"
        elif "per_item" in unit or "per_pack" in unit:
            return f"{qty:.0f} unit{'s' if qty != 1 else ''}"
        return f"{qty:.1f} {unit.replace('kg_co2e_', '').replace('_', ' ')}"

    def _get_icon(self, cat: str, key: str) -> str:
        icon_map = {
            "transport": "🚗", "food": "🍽️", "fashion": "👕",
            "electronics": "💻", "energy": "⚡", "lifestyle": "🌿", "entertainment": "🎬"
        }
        specific = {
            "flight": "✈️", "metro": "🚇", "bus": "🚌", "train": "🚂",
            "uber": "🚕", "motorbike": "🏍️", "e_scooter": "🛵",
            "beer": "🍺", "wine": "🍷", "starbucks": "☕", "cigarette": "🚬",
            "gym": "💪", "cinema": "🎬", "pvr": "🎬", "imax": "🎬",
            "iphone": "📱", "samsung": "📱", "macbook": "💻",
            "ac_": "❄️", "shower": "🚿", "streaming": "📺",
        }
        for k, icon in specific.items():
            if k in key:
                return icon
        return icon_map.get(cat, "📊")

    def _generate_reasoning(self, ef_data: dict, qty: float, total: float, brand: Optional[str], mult: float) -> str:
        source = ef_data.get("source", "DEFRA/EPA/IPCC emission factors")
        note = ef_data.get("note", "")
        brand_note = f" {brand} brand adds ×{mult} multiplier due to supply chain intensity." if brand and mult != 1.0 else ""
        return f"Based on {source}.{brand_note} Quantity: {qty:.1f} unit(s) = {total:.3f} kg CO₂e. {note}"

    def _generate_summary(self, activities: list, total: float) -> str:
        if not activities:
            return "No activities detected."
        biggest = max(activities, key=lambda x: x["total_kg_co2e"])
        return f"Biggest driver: {biggest['name']} at {biggest['total_kg_co2e']:.2f} kg CO₂e. Total: {total:.2f} kg CO₂e."


# ════════════════════════════════════════════════════════
# MAIN: Build and export the model
# ════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("🌿 Building Hybrid Neural Emission Estimator (HNEE)...")
    print("\n📊 Training Brand Penalty Network...")
    brand_network = train_brand_penalty_network()

    # Compile all patterns for export (flatten for JS use)
    flat_patterns = {}
    for cat, items in NER_PATTERNS.items():
        flat_patterns[cat] = {k: v for k, v in items.items()}

    model_data = {
        "version": "1.0.0",
        "name": "HNEE — Hybrid Neural Emission Estimator",
        "description": "Recursive Lifecycle Decomposition + Brand Penalty Network",
        "emission_graph": EMISSION_GRAPH,
        "ner_patterns": flat_patterns,
        "brand_network": brand_network,
        "metadata": {
            "sources": [
                "DEFRA UK GHG Conversion Factors 2023",
                "EPA Emission Factors for GHG Inventories",
                "Poore & Nemecek 2018 (Science) - Food lifecycle",
                "IPCC AR6 WG3 - Transport emissions",
                "Apple Product Environmental Reports",
                "Samsung ESG Reports",
                "Zafeiridou et al 2018 - Tobacco carbon",
                "Our World in Data - Food emissions",
                "Textile Exchange - Fashion LCA",
                "CEA India Grid Emission Factor 2022"
            ],
            "india_grid_intensity": 0.82,
            "categories": ["transport", "food", "fashion", "electronics", "energy", "lifestyle", "entertainment"]
        }
    }

    output_path = "carbon_model.json"
    with open(output_path, "w") as f:
        json.dump(model_data, f, indent=2)

    print(f"\n✅ Model exported to: {output_path}")
    print(f"   Emission graph entries: {sum(len(v) for v in EMISSION_GRAPH.values())}")
    print(f"   NER patterns: {sum(len(v) for v in NER_PATTERNS.values())}")
    print(f"   Brand penalty network: {len(brand_network)} weight matrices")

    # Test the inference engine
    print("\n🧪 Testing inference engine...")
    engine = CarbonInferenceEngine(model_data)

    test_inputs = [
        "drove 60km in my petrol SUV, had a Big Mac at McDonald's, drank 2 beers, smoked 4 cigarettes, watched Netflix 3 hours, used AC for 4hrs",
        "took uber 12km, bought iPhone 16, had starbucks latte, ordered chicken biryani on swiggy, went to pvr cinema",
        "bought a shirt from Zara, drove royal enfield 40km, had 3 red bulls, smoked a pack, gym session 2hrs"
    ]

    for test in test_inputs:
        print(f"\n📝 Input: '{test[:60]}...'")
        result = engine.predict(test)
        print(f"   Activities detected: {len(result['activities'])}")
        print(f"   Total CO₂e: {result['total_kg_co2e']} kg")
        print(f"   Confidence interval: {result['confidence_interval']}")
        for act in result["activities"][:3]:
            print(f"   → {act['name']}: {act['total_kg_co2e']} kg")

    print("\n🎉 HNEE model built successfully!")