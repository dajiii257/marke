(function () {
  "use strict";

  if (!window.MarketApp) {
    console.error("[CASE-DETAIL] MarketApp not initialized");
    return;
  }

  var tg = window.MarketApp.tg;
  var IMG = "/market/imgs/";

  function img(file) {
    // Replace .tgs extension with .webp for static display
    return IMG + file.replace(/\.tgs$/, ".webp");
  }

  /* ── Real case data from giftsbattle API ───────────────────────── */
  var CASES_DATA = {
    free: {
      name: "Бесплатный кейс",
      image: "https://images.giftsbattle.com/case/giftsbattle_free.png",
      price: null,
      glow: "#3de48f",
      items: [
        {
          id: "autumn",
          name: "Durov's Cap Autumn",
          img: img("Autumn.tgs"),
          color: "#FFA532",
          chance: 1,
          value: 155000,
        },
        {
          id: "lababoon",
          name: "Jolly Chimp La Baboon",
          img: img("LaBaboon_new.tgs"),
          color: "#CE93D8",
          chance: 8,
          value: 7600,
        },
        {
          id: "clovermatrix",
          name: "Clover Pin Matrix",
          img: img(
            "7919dc73b97c4ea9a233d7551f881dc0_Clover_Pin_Kelly_Green.tgs"
          ),
          color: "#3DE48F",
          chance: 64,
          value: 1000,
        },
        {
          id: "plushpepe",
          name: "Plush Pepe (1 день)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#69F0AE",
          chance: 188,
          value: 340,
        },
        {
          id: "durovmossy",
          name: "Durov's Cap (1 день)",
          img: img("7ffdf456448d49f18cdf5bc4b1ca4cd1_Durovs_Cap_Mossy.tgs"),
          color: "#4F96FF",
          chance: 639,
          value: 100,
        },
        {
          id: "heartstone",
          name: "Heart Locket (1 день)",
          img: img(
            "89eb583cd4944359b64f2f9aed476a04_Heart_Locket_Stone_Flower.tgs"
          ),
          color: "#FF8A80",
          chance: 639,
          value: 100,
        },
      ],
    },
    promo: {
      name: "Бесплатный за промокод",
      image: "https://images.giftsbattle.com/case/giftsbattle_free.png",
      price: null,
      glow: "#3de48f",
      items: [
        {
          id: "durovs_cap_dipper",
          name: "Durov's Cap Dipper",
          img: img("Dipper.tgs"),
          color: "#FFD843",
          chance: 2,
          value: 122200,
          ton: "1222",
        },
        {
          id: "vintage_cigar_the_ge",
          name: "Vintage Cigar The Gentleman",
          img: img("The_Gentleman.tgs"),
          color: "#FF64B4",
          chance: 6,
          value: 49898,
          ton: "498.98",
        },
        {
          id: "precious_peach_rando",
          name: "Precious Peach (Random)",
          img: img("Neptune.tgs"),
          color: "#FFA532",
          chance: 8,
          value: 38989,
          ton: "389.89",
        },
        {
          id: "redo",
          name: "REDO",
          img: img("redo_new3.tgs"),
          color: "#CE93D8",
          chance: 20,
          value: 15000,
          ton: "150",
        },
        {
          id: "gem_signet_random",
          name: "Gem Signet (Random)",
          img: img("Feral_Rage.tgs"),
          color: "#CE93D8",
          chance: 44,
          value: 6799,
          ton: "67.99",
        },
        {
          id: "toy_bear_lapis_lazul",
          name: "Toy Bear Lapis Lazuli",
          img: img("Lapis_Lazuli_new.tgs"),
          color: "#CE93D8",
          chance: 55,
          value: 5400,
          ton: "54",
        },
        {
          id: "plush_pepe_raphael_3",
          name: "Plush Pepe Raphael (30 days)",
          img: img("65349e0f3a63466e9bbc363d7fba12cc_Plush_Pepe_Raphael.tgs"),
          color: "#4F96FF",
          chance: 55,
          value: 5400,
          ton: "54",
        },
        {
          id: "diamond_ring_nocturn",
          name: "Diamond Ring Nocturne",
          img: img("Nocturne.tgs"),
          color: "#4F96FF",
          chance: 72,
          value: 4111,
          ton: "41.11",
        },
        {
          id: "jolly_chimp_la_baboo",
          name: "Jolly Chimp La Baboon",
          img: img("LaBaboon_new.tgs"),
          color: "#4F96FF",
          chance: 78,
          value: 3800,
          ton: "38",
        },
        {
          id: "jolly_chimp_liberati",
          name: "Jolly Chimp Liberation",
          img: img("Jolly_Chimp_Liberation_apa.tgs"),
          color: "#4F96FF",
          chance: 79,
          value: 3750,
          ton: "37.5",
        },
        {
          id: "toy_bear_hellscape",
          name: "Toy Bear Hellscape",
          img: img("Hellscape_1.tgs"),
          color: "#80D8FF",
          chance: 141,
          value: 2100,
          ton: "21",
        },
        {
          id: "cupid_charm_random",
          name: "Cupid Charm (Random)",
          img: img("Mistress_new.tgs"),
          color: "#80D8FF",
          chance: 157,
          value: 1896,
          ton: "18.96",
        },
        {
          id: "spring_basket_bastet",
          name: "Spring Basket Bastet",
          img: img("e00062ed45124d5793c89092c9b9aa94_Spring_Basket_Bastet.tgs"),
          color: "#80D8FF",
          chance: 188,
          value: 1580,
          ton: "15.8",
        },
        {
          id: "instant_ramen_diamon",
          name: "Instant Ramen Diamonds",
          img: img(
            "8f8aaedb1a27494c8406e62e17e42e1b_Instant_Ramen_Diamonds.tgs"
          ),
          color: "#80D8FF",
          chance: 198,
          value: 1500,
          ton: "15",
        },
        {
          id: "spring_basket_cash_b",
          name: "Spring Basket Cash Bunny",
          img: img(
            "d09425adb41e4eb887e6087cfde0a3d7_Spring_Basket_Cash_Bunny.tgs"
          ),
          color: "#3DE48F",
          chance: 198,
          value: 1500,
          ton: "15",
        },
        {
          id: "clover_pin_kelly_gre",
          name: "Clover Pin Kelly Green",
          img: img(
            "7919dc73b97c4ea9a233d7551f881dc0_Clover_Pin_Kelly_Green.tgs"
          ),
          color: "#3DE48F",
          chance: 212,
          value: 1400,
          ton: "14",
        },
        {
          id: "input_key_ban_hammer",
          name: "Input Key Ban Hammer",
          img: img("30c00e1e56114535b9b8982c9bc5e34d_Input_Key_Ban_Hammer.tgs"),
          color: "#3DE48F",
          chance: 247,
          value: 1200,
          ton: "12",
        },
        {
          id: "fresh_socks_trader",
          name: "Fresh Socks Trader",
          img: img("62c9bb279c184522a3cd74b846dcee19_Fresh_Socks_Trader.tgs"),
          color: "#3DE48F",
          chance: 297,
          value: 1000,
          ton: "10",
        },
        {
          id: "evil_eye_deep_purple",
          name: "Evil Eye Deep Purple",
          img: img("Deep_Purple.tgs"),
          color: "#3DE48F",
          chance: 358,
          value: 830,
          ton: "8.3",
        },
        {
          id: "desk_calendar_eco_fr",
          name: "Desk Calendar Eco Friendly",
          img: img("Eco_Friendly.tgs"),
          color: "#00E5FF",
          chance: 424,
          value: 700,
          ton: "7",
        },
        {
          id: "desk_calendar_random",
          name: "Desk Calendar (Random)",
          img: img("Minting_Date.tgs"),
          color: "#00E5FF",
          chance: 451,
          value: 658,
          ton: "6.58",
        },
        {
          id: "snoop_dogg_backspin",
          name: "Snoop Dogg Backspin",
          img: img("Backspin.tgs"),
          color: "#00E5FF",
          chance: 625,
          value: 475,
          ton: "4.75",
        },
        {
          id: "spy_agaric_april_20t",
          name: "Spy Agaric April 20th",
          img: img("April_20th_new.tgs"),
          color: "#00E5FF",
          chance: 742,
          value: 400,
          ton: "4",
        },
        {
          id: "lol_pop_random",
          name: "Lol Pop (Random)",
          img: img("Sugar_Free.tgs"),
          color: "#69F0AE",
          chance: 837,
          value: 355,
          ton: "3.55",
        },
        {
          id: "happy_brownie_random",
          name: "Happy Brownie (Random)",
          img: img("f37d4946d93144108f0635f40d50f437_Happy_Brownie_Homer.tgs"),
          color: "#69F0AE",
          chance: 848,
          value: 350,
          ton: "3.5",
        },
        {
          id: "lunar_snake_random",
          name: "Lunar Snake (Random)",
          img: img("5ff36c8f543247bab6f3664fd96e979c_Lunar_Snake_Angelic.tgs"),
          color: "#69F0AE",
          chance: 949,
          value: 313,
          ton: "3.13",
        },
        {
          id: "ice_cream_random",
          name: "Ice Cream (Random)",
          img: img("57d5d8503f0b403c82fca0bb5b1cb5bb_Ice_Cream_Granite.tgs"),
          color: "#A1887F",
          chance: 961,
          value: 309,
          ton: "3.09",
        },
        {
          id: "plush_pepe_1_day",
          name: "Plush Pepe (1 day)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#EF5350",
          chance: 1747,
          value: 170,
          ton: "1.7",
        },
      ],
    },
    free1000: {
      name: "Бесплатный от 1 000 ⭐",
      image: "https://images.giftsbattle.com/case/giftsbattle_free.png",
      price: null,
      glow: "#3de48f",
      items: [
        {
          id: "pendragon",
          name: "Loot Bag Pendragon",
          img: img("Pendragon.tgs"),
          color: "#FFA532",
          chance: 1,
          value: 100000,
        },
        {
          id: "deskcal",
          name: "Desk Calendar Adult",
          img: img(
            "eb0115c1b9784427a9436fede19a2615_Desk_Calendar_Adult_Tasks.tgs"
          ),
          color: "#4F96FF",
          chance: 12,
          value: 6902,
        },
        {
          id: "signetrand",
          name: "Signet Ring (рандом)",
          img: img("White_Gold.tgs"),
          color: "#FFD843",
          chance: 24,
          value: 3298,
        },
        {
          id: "mintdate",
          name: "Desk Calendar (рандом)",
          img: img("Minting_Date.tgs"),
          color: "#3DE48F",
          chance: 132,
          value: 603,
        },
        {
          id: "diamond",
          name: "Diamond",
          img: img("diamond.png").replace(".tgs.webp", ".png"),
          color: "#80D8FF",
          chance: 794,
          value: 100,
        },
        {
          id: "champagne",
          name: "Champagne",
          img: img("shampain.png").replace(".tgs.webp", ".png"),
          color: "#EF5350",
          chance: 1588,
          value: 50,
        },
      ],
    },
    punch: {
      name: "Малыш Панч",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_monkey_500x500.png",
      price: 1000,
      glow: "#FFA532",
      items: [
        {
          id: "heart_locket_random",
          name: "Heart Locket (Random)",
          img: img("Telegram_new5.tgs"),
          color: "#FFD843",
          chance: 1,
          value: 184900,
          ton: "1849",
        },
        {
          id: "victory_medal_the_fo",
          name: "Victory Medal The Founder",
          img: img(
            "9d1b4e867b0247ec8c3e3849799ffd5f_Victory_Medal_The_Founder.tgs"
          ),
          color: "#FF64B4",
          chance: 2,
          value: 89900,
          ton: "899",
        },
        {
          id: "loot_bag_riot_pack",
          name: "Loot Bag Riot Pack",
          img: img("Riot_Pack.tgs"),
          color: "#FFA532",
          chance: 3,
          value: 80000,
          ton: "800",
        },
        {
          id: "durovs_cap_jade",
          name: "Durov's Cap Jade",
          img: img("66afecc08bdb4f64a22422790bd498cd_Durovs_Cap_Jade.tgs"),
          color: "#FFA532",
          chance: 3,
          value: 68690,
          ton: "686.9",
        },
        {
          id: "precious_peach_neo_c",
          name: "Precious Peach Neo-Chrome",
          img: img(
            "c7832c58cf6d42d09be016623cf412d3_Precious_Peach_Neo-Chrome.tgs"
          ),
          color: "#FFA532",
          chance: 4,
          value: 53500,
          ton: "535",
        },
        {
          id: "swiss_watch_day_trad",
          name: "Swiss Watch Day Trader",
          img: img("Day_Trader.tgs"),
          color: "#CE93D8",
          chance: 5,
          value: 42000,
          ton: "420",
        },
        {
          id: "nail_bracelet_moon_c",
          name: "Nail Bracelet Moon Cat",
          img: img(
            "ca04c8ba797643759726048de22dfc30_Nail_Bracelet_Moon_Cat.tgs"
          ),
          color: "#CE93D8",
          chance: 7,
          value: 30300,
          ton: "303",
        },
        {
          id: "desk_calendar_ton_co",
          name: "Desk Calendar TON Core",
          img: img(
            "4c1705a6942d4ba5a2d2bb02b37b8cfd_Desk_Calendar_TON_Core.tgs"
          ),
          color: "#CE93D8",
          chance: 12,
          value: 18800,
          ton: "188",
        },
        {
          id: "scared_cat_random",
          name: "Scared Cat (Random)",
          img: img("Vice_Kitty.tgs"),
          color: "#CE93D8",
          chance: 14,
          value: 16000,
          ton: "160",
        },
        {
          id: "artisan_brick_grass_",
          name: "Artisan Brick Grass Block",
          img: img(
            "c963621e18624cc8b6d09ddc75d2c6af_Artisan_Brick_Grass_Block.tgs"
          ),
          color: "#4F96FF",
          chance: 15,
          value: 14300,
          ton: "143",
        },
        {
          id: "stellar_rocket_bitco",
          name: "Stellar Rocket Bitcoin",
          img: img("Stellar_Rocket_Bitcoin_xaa.tgs"),
          color: "#4F96FF",
          chance: 17,
          value: 13000,
          ton: "130",
        },
        {
          id: "ion_gem_random",
          name: "Ion Gem (Random)",
          img: img("Anime_Battle.tgs"),
          color: "#4F96FF",
          chance: 24,
          value: 8999,
          ton: "89.99",
        },
        {
          id: "victory_medal_crypto",
          name: "Victory Medal Crypto Whale",
          img: img(
            "4f046064a14b465bbb025d32992b91c5_Victory_Medal_Crypto_Whale.tgs"
          ),
          color: "#4F96FF",
          chance: 28,
          value: 7770,
          ton: "77.7",
        },
        {
          id: "jolly_chimp_golden_m",
          name: "Jolly Chimp Golden Monkey",
          img: img("GoldenMonkey_new.tgs"),
          color: "#4F96FF",
          chance: 29,
          value: 7500,
          ton: "75",
        },
        {
          id: "jingle_bells_cash_ma",
          name: "Jingle Bells Cash Machine",
          img: img(
            "8d002f4a6a4f4c3db18e9b8813af3168_Jingle_Bells_Cash_Machine.tgs"
          ),
          color: "#4F96FF",
          chance: 31,
          value: 7000,
          ton: "70",
        },
        {
          id: "kissed_frog_frogwave",
          name: "Kissed Frog Frogwave",
          img: img("8982021d72a04951bf4ebad5cd711edf_Kissed_Frog_Frogwave.tgs"),
          color: "#4F96FF",
          chance: 32,
          value: 6800,
          ton: "68",
        },
        {
          id: "toy_bear_night_cub",
          name: "Toy Bear Night Cub",
          img: img("abbf754fff0a448aa658e89483a4649c_Toy_Bear_Night_Cub.tgs"),
          color: "#80D8FF",
          chance: 37,
          value: 6000,
          ton: "60",
        },
        {
          id: "low_rider_toy_car",
          name: "Low Rider Toy Car",
          img: img("c1547267000e49bbb7bd2b4fbf3d2ef7_Low_Rider_Toy_Car.tgs"),
          color: "#80D8FF",
          chance: 40,
          value: 5495,
          ton: "54.95",
        },
        {
          id: "bonded_ring_random",
          name: "Bonded Ring (Random)",
          img: img("Froge_Ring.tgs"),
          color: "#80D8FF",
          chance: 47,
          value: 4661,
          ton: "46.61",
        },
        {
          id: "rare_bird_sphinx",
          name: "Rare Bird Sphinx",
          img: img("b8e55249e3ff4c6683ec53c070efb35d_Rare_Bird_Sphinx.tgs"),
          color: "#80D8FF",
          chance: 48,
          value: 4600,
          ton: "46",
        },
        {
          id: "vintage_cigar_golden",
          name: "Vintage Cigar Golden Hour",
          img: img(
            "5fc13de05ca446bd94061e8aaf9e196b_Vintage_Cigar_Golden_Hour.tgs"
          ),
          color: "#80D8FF",
          chance: 57,
          value: 3881,
          ton: "38.81",
        },
        {
          id: "victory_medal_master",
          name: "Victory Medal Master Of Luck",
          img: img(
            "3c69d5a47ff84766bbae4647fbe08468_Victory_Medal_Master_Of_Luck.tgs"
          ),
          color: "#80D8FF",
          chance: 69,
          value: 3199,
          ton: "31.99",
        },
        {
          id: "input_key_verificati",
          name: "Input Key Verification",
          img: img("Input_Key_Verification_aaa.tgs"),
          color: "#3DE48F",
          chance: 80,
          value: 2749,
          ton: "27.49",
        },
        {
          id: "desk_calendar_kronos",
          name: "Desk Calendar Kronos",
          img: img("921a1206c83943238b537b2b08bd71fa_Desk_Calendar_Kronos.tgs"),
          color: "#3DE48F",
          chance: 100,
          value: 2200,
          ton: "22",
        },
        {
          id: "stellar_rocket_space",
          name: "Stellar Rocket Space Veggie",
          img: img(
            "948daf7f1dab42afb7807f81f5e47255_Stellar_Rocket_Space_Veggie.tgs"
          ),
          color: "#3DE48F",
          chance: 105,
          value: 2100,
          ton: "21",
        },
        {
          id: "desk_calendar_royal_",
          name: "Desk Calendar Royal Flush",
          img: img(
            "782a4a6369a24109b0a96b85aef393c5_Desk_Calendar_Royal_Flush.tgs"
          ),
          color: "#3DE48F",
          chance: 105,
          value: 2098,
          ton: "20.98",
        },
        {
          id: "spring_basket_claw_m",
          name: "Spring Basket Claw Machine",
          img: img(
            "f312b45a206144b08a1c6253fb04ed52_Spring_Basket_Claw_Machine.tgs"
          ),
          color: "#3DE48F",
          chance: 127,
          value: 1729,
          ton: "17.29",
        },
        {
          id: "money_pot_kitsune",
          name: "Money Pot Kitsune",
          img: img("9364d8f350bb4a16aeb576c4e9afcbe1_Money_Pot_Kitsune.tgs"),
          color: "#3DE48F",
          chance: 157,
          value: 1400,
          ton: "14",
        },
        {
          id: "clover_pin_kelly_gre",
          name: "Clover Pin Kelly Green",
          img: img(
            "7919dc73b97c4ea9a233d7551f881dc0_Clover_Pin_Kelly_Green.tgs"
          ),
          color: "#00E5FF",
          chance: 157,
          value: 1400,
          ton: "14",
        },
        {
          id: "happy_brownie_golgot",
          name: "Happy Brownie Golgothan",
          img: img(
            "615c465b950045bf963d3ceb9ae84c89_Happy_Brownie_Golgothan.tgs"
          ),
          color: "#00E5FF",
          chance: 183,
          value: 1200,
          ton: "12",
        },
        {
          id: "fresh_socks_spike",
          name: "Fresh Socks Spike",
          img: img("57b038febed04c3a8454b6f09ad26e85_Fresh_Socks_Spike.tgs"),
          color: "#00E5FF",
          chance: 218,
          value: 1010,
          ton: "10.1",
        },
        {
          id: "clover_pin_nebula",
          name: "Clover Pin Nebula",
          img: img("e2b32313302b46a5af083f4f1f97cd75_Clover_Pin_Nebula.tgs"),
          color: "#00E5FF",
          chance: 372,
          value: 590,
          ton: "5.9",
        },
        {
          id: "instant_ramen_jelly_",
          name: "Instant Ramen Jelly Brain",
          img: img(
            "278a841600964ca498a75957fbb3794d_Instant_Ramen_Jelly_Brain.tgs"
          ),
          color: "#00E5FF",
          chance: 563,
          value: 390,
          ton: "3.9",
        },
        {
          id: "victory_medal_random",
          name: "Victory Medal (Random)",
          img: img(
            "3b12200b5e8d42b48378cc062ba3e400_Victory_Medal_Sweet_Reward.tgs"
          ),
          color: "#00E5FF",
          chance: 612,
          value: 359,
          ton: "3.59",
        },
        {
          id: "tama_gadget_random",
          name: "Tama Gadget (Random)",
          img: img("Lime_Shock.tgs"),
          color: "#00E5FF",
          chance: 617,
          value: 356,
          ton: "3.56",
        },
        {
          id: "lol_pop_random",
          name: "Lol Pop (Random)",
          img: img("Sugar_Free.tgs"),
          color: "#69F0AE",
          chance: 619,
          value: 355,
          ton: "3.55",
        },
        {
          id: "happy_brownie_random",
          name: "Happy Brownie (Random)",
          img: img("f37d4946d93144108f0635f40d50f437_Happy_Brownie_Homer.tgs"),
          color: "#69F0AE",
          chance: 628,
          value: 350,
          ton: "3.5",
        },
        {
          id: "lunar_snake_random",
          name: "Lunar Snake (Random)",
          img: img("5ff36c8f543247bab6f3664fd96e979c_Lunar_Snake_Angelic.tgs"),
          color: "#69F0AE",
          chance: 702,
          value: 313,
          ton: "3.13",
        },
        {
          id: "instant_ramen_random",
          name: "Instant Ramen (Random)",
          img: img(
            "276ba2a02c5a4ab2b3baa6d1bf828b79_Instant_Ramen_Ramen_Snack.tgs"
          ),
          color: "#69F0AE",
          chance: 702,
          value: 313,
          ton: "3.13",
        },
        {
          id: "xmas_stocking_random",
          name: "Xmas Stocking (Random)",
          img: img(
            "028dbc11a1eb4e489b5e81defee7baa3_Xmas_Stocking_Crypto_Wallet.tgs"
          ),
          color: "#EF5350",
          chance: 709,
          value: 310,
          ton: "3.1",
        },
        {
          id: "ice_cream_random",
          name: "Ice Cream (Random)",
          img: img("57d5d8503f0b403c82fca0bb5b1cb5bb_Ice_Cream_Granite.tgs"),
          color: "#A1887F",
          chance: 711,
          value: 309,
          ton: "3.09",
        },
        {
          id: "candy_cane_random",
          name: "Candy Cane (Random)",
          img: img("Pink_Mango.tgs"),
          color: "#EF5350",
          chance: 713,
          value: 308,
          ton: "3.08",
        },
        {
          id: "plush_pepe_1_day",
          name: "Plush Pepe (1 day)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#A1887F",
          chance: 1293,
          value: 170,
          ton: "1.7",
        },
      ],
    },
    artur: {
      name: "Привет Артур",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_artur_500x500.png",
      price: 550,
      glow: "#4F96FF",
      items: [
        {
          id: "loot_bag_money_bag",
          name: "Loot Bag Money Bag",
          img: img("Money_Bag.tgs"),
          color: "#FFD843",
          chance: 1,
          value: 150000,
          ton: "1500",
        },
        {
          id: "astral_shard_moonsto",
          name: "Astral Shard Moonstone",
          img: img(
            "c0f9371659dc4086a2fea0ee15dc7c67_Astral_Shard_Moonstone.tgs"
          ),
          color: "#FF64B4",
          chance: 2,
          value: 100000,
          ton: "1000",
        },
        {
          id: "durovs_cap_fun_time",
          name: "Durov's Cap Fun Time",
          img: img("5b59c64352f84163a2f155b4ab827d5a_Durovs_Cap_Fun_Time.tgs"),
          color: "#FFA532",
          chance: 2,
          value: 78500,
          ton: "785",
        },
        {
          id: "precious_peach_honey",
          name: "Precious Peach Honey Gold",
          img: img(
            "287e255a1fb44c228df666fb035e9529_Precious_Peach_Honey_Gold.tgs"
          ),
          color: "#FFA532",
          chance: 2,
          value: 66600,
          ton: "666",
        },
        {
          id: "swiss_watch_day_trad",
          name: "Swiss Watch Day Trader",
          img: img("Day_Trader.tgs"),
          color: "#CE93D8",
          chance: 4,
          value: 42000,
          ton: "420",
        },
        {
          id: "nail_bracelet_crypto",
          name: "Nail Bracelet Crypto Gem",
          img: img(
            "54c2fcfcf7764fd193ce8452b5db1fc8_Nail_Bracelet_Crypto_Gem.tgs"
          ),
          color: "#CE93D8",
          chance: 4,
          value: 34900,
          ton: "349",
        },
        {
          id: "scared_cat_pepe_paws",
          name: "Scared Cat Pepe Paws",
          img: img("f2291926ae3f44f2ac254c7cc5d8f8c5_Scared_Cat_Pepe_Paws.tgs"),
          color: "#CE93D8",
          chance: 6,
          value: 25000,
          ton: "250",
        },
        {
          id: "artisan_brick_poker_",
          name: "Artisan Brick Poker Chips",
          img: img(
            "f2561792bcb5409c8f9e0bd745a2ff06_Artisan_Brick_Poker_Chips.tgs"
          ),
          color: "#4F96FF",
          chance: 9,
          value: 17000,
          ton: "170",
        },
        {
          id: "stellar_rocket_bitco",
          name: "Stellar Rocket Bitcoin",
          img: img("Stellar_Rocket_Bitcoin_xaa.tgs"),
          color: "#4F96FF",
          chance: 12,
          value: 13000,
          ton: "130",
        },
        {
          id: "victory_medal_high_r",
          name: "Victory Medal High Roller",
          img: img(
            "41ee92465d36462cbabed2850df447a1_Victory_Medal_High_Roller.tgs"
          ),
          color: "#4F96FF",
          chance: 16,
          value: 9500,
          ton: "95",
        },
        {
          id: "desk_calendar_adult_",
          name: "Desk Calendar Adult Tasks",
          img: img(
            "eb0115c1b9784427a9436fede19a2615_Desk_Calendar_Adult_Tasks.tgs"
          ),
          color: "#4F96FF",
          chance: 22,
          value: 6902,
          ton: "69.02",
        },
        {
          id: "bling_binky_adult_to",
          name: "Bling Binky Adult Toy",
          img: img(
            "75375b88e4f54e81814c6a42f78dedaa_Bling_Binky_Adult_Toy.tgs"
          ),
          color: "#4F96FF",
          chance: 26,
          value: 5800,
          ton: "58",
        },
        {
          id: "happy_brownie_kinky_",
          name: "Happy Brownie Kinky Stinky",
          img: img(
            "bcd93310e66f4d34b7e2be84346ee0fd_Happy_Brownie_Kinky_Stinky.tgs"
          ),
          color: "#4F96FF",
          chance: 28,
          value: 5400,
          ton: "54",
        },
        {
          id: "signet_ring_hearts",
          name: "Signet Ring Hearts",
          img: img("b186cca0986a498284d3f75b3211753c_Signet_Ring_Hearts.tgs"),
          color: "#80D8FF",
          chance: 39,
          value: 3900,
          ton: "39",
        },
        {
          id: "vintage_cigar_premiu",
          name: "Vintage Cigar Premium Blend",
          img: img("Premium_Blend.tgs"),
          color: "#80D8FF",
          chance: 40,
          value: 3838,
          ton: "38.38",
        },
        {
          id: "bling_binky_illumina",
          name: "Bling Binky Illuminati",
          img: img(
            "dcf1b28fe635466f9fe510998b1a9ac8_Bling_Binky_Illuminati.tgs"
          ),
          color: "#80D8FF",
          chance: 50,
          value: 3099,
          ton: "30.99",
        },
        {
          id: "top_hat_blackjack",
          name: "Top Hat Blackjack",
          img: img("a1510d9d9c0140e8b44a595b775b8c42_Top_Hat_Blackjack.tgs"),
          color: "#80D8FF",
          chance: 53,
          value: 2890,
          ton: "28.9",
        },
        {
          id: "snow_globe_house_of_",
          name: "Snow Globe House of Cards",
          img: img(
            "70360390b8af4b68a46c79bf61346195_Snow_Globe_House_of_Cards.tgs"
          ),
          color: "#80D8FF",
          chance: 72,
          value: 2146,
          ton: "21.46",
        },
        {
          id: "love_potion_hearts",
          name: "Love Potion Hearts",
          img: img("71f8de3cec1d47b183673f1a38c09f42_Love_Potion_Hearts.tgs"),
          color: "#3DE48F",
          chance: 73,
          value: 2100,
          ton: "21",
        },
        {
          id: "love_potion_spades",
          name: "Love Potion Spades",
          img: img("3df71070cb784a3b808c23919d8cb1c3_Love_Potion_Spades.tgs"),
          color: "#3DE48F",
          chance: 84,
          value: 1820,
          ton: "18.2",
        },
        {
          id: "input_key_money_prin",
          name: "Input Key Money Printer",
          img: img(
            "cea841c4127645b79edc9449d7c62017_Input_Key_Money_Printer.tgs"
          ),
          color: "#3DE48F",
          chance: 96,
          value: 1599,
          ton: "15.99",
        },
        {
          id: "input_key_jackpot",
          name: "Input Key Jackpot",
          img: img("6dcbc55ec5aa466fb7a029caa46b1426_Input_Key_Jackpot.tgs"),
          color: "#3DE48F",
          chance: 127,
          value: 1210,
          ton: "12.1",
        },
        {
          id: "cookie_heart_spades",
          name: "Cookie Heart Spades",
          img: img("aaf5549c90814ee6964d4c1e7893bacc_Cookie_Heart_Spades.tgs"),
          color: "#3DE48F",
          chance: 129,
          value: 1187,
          ton: "11.87",
        },
        {
          id: "pretty_posy_jackpot",
          name: "Pretty Posy Jackpot",
          img: img("6f975d45e84f43cfb01628dcab253a74_Pretty_Posy_Jackpot.tgs"),
          color: "#00E5FF",
          chance: 208,
          value: 737,
          ton: "7.37",
        },
        {
          id: "spring_basket_wonder",
          name: "Spring Basket Wonderland",
          img: img(
            "43ac3e2dc6eb4733a79dac9d55eaf740_Spring_Basket_Wonderland.tgs"
          ),
          color: "#00E5FF",
          chance: 222,
          value: 690,
          ton: "6.9",
        },
        {
          id: "input_key_joker",
          name: "Input Key Joker",
          img: img("f6fc5e751d8a4cd2b4dcb866aaeb8cbd_Input_Key_Joker.tgs"),
          color: "#00E5FF",
          chance: 239,
          value: 641,
          ton: "6.41",
        },
        {
          id: "fresh_socks_rebel_sp",
          name: "Fresh Socks Rebel Spirit",
          img: img(
            "11501e4fddcf4470a07bdae3c6ee5457_Fresh_Socks_Rebel_Spirit.tgs"
          ),
          color: "#00E5FF",
          chance: 279,
          value: 550,
          ton: "5.5",
        },
        {
          id: "clover_pin_matrix",
          name: "Clover Pin Matrix",
          img: img("f919dee692c8450abae352b9063828e1_Clover_Pin_Matrix.tgs"),
          color: "#00E5FF",
          chance: 307,
          value: 500,
          ton: "5",
        },
        {
          id: "money_pot_super_pixe",
          name: "Money Pot Super Pixel",
          img: img(
            "cac47098bb4c4762b61124e508b677f4_Money_Pot_Super_Pixel.tgs"
          ),
          color: "#69F0AE",
          chance: 307,
          value: 500,
          ton: "5",
        },
        {
          id: "happy_brownie_random",
          name: "Happy Brownie (Random)",
          img: img("f37d4946d93144108f0635f40d50f437_Happy_Brownie_Homer.tgs"),
          color: "#69F0AE",
          chance: 439,
          value: 350,
          ton: "3.5",
        },
        {
          id: "ice_cream_random",
          name: "Ice Cream (Random)",
          img: img("57d5d8503f0b403c82fca0bb5b1cb5bb_Ice_Cream_Granite.tgs"),
          color: "#69F0AE",
          chance: 497,
          value: 309,
          ton: "3.09",
        },
        {
          id: "plush_pepe_1_day",
          name: "Plush Pepe (1 day)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#69F0AE",
          chance: 903,
          value: 170,
          ton: "1.7",
        },
        {
          id: "loot_bag_7_days",
          name: "Loot Bag (7 days)",
          img: img("e7d98432ef134cbea958adbecf181263_Loot_Bag_Orange_Croc.tgs"),
          color: "#A1887F",
          chance: 1096,
          value: 140,
          ton: "1.4",
        },
        {
          id: "durovs_cap_2_days",
          name: "Durov's Cap (2 days)",
          img: img("b243dda3fb124e5380e7dd604dde8d2b_Durovs_Cap_Ivory.tgs"),
          color: "#EF5350",
          chance: 1535,
          value: 100,
          ton: "1",
        },
        {
          id: "heart_locket_1_day",
          name: "Heart Locket (1 day)",
          img: img(
            "89eb583cd4944359b64f2f9aed476a04_Heart_Locket_Stone_Flower.tgs"
          ),
          color: "#A1887F",
          chance: 3070,
          value: 50,
          ton: "0.5",
        },
      ],
    },
    zoo2: {
      name: "Зверополис 2",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_zveropolis_500x500.png",
      price: 1043,
      glow: "#00E5FF",
      items: [
        {
          id: "precious_peach_spoil",
          name: "Precious Peach Spoiled",
          img: img(
            "1e28d7892d2a419cbf7a0f2cfeaea5fe_Precious_Peach_Spoiled.tgs"
          ),
          color: "#FFD843",
          chance: 1,
          value: 1850000,
          ton: "18500",
        },
        {
          id: "heart_locket_glam_fu",
          name: "Heart Locket Glam Furry",
          img: img(
            "2ba8332dc329488aa9e8cb4b99282acd_Heart_Locket_Glam_Furry.tgs"
          ),
          color: "#FF64B4",
          chance: 1,
          value: 181999,
          ton: "1819.99",
        },
        {
          id: "durovs_cap_frosthorn",
          name: "Durov's Cap Frosthorn",
          img: img("d166057ac5cc4f7a99ea78babaac21f6_Durovs_Cap_Frosthorn.tgs"),
          color: "#FFA532",
          chance: 3,
          value: 85000,
          ton: "850",
        },
        {
          id: "loot_bag_priestly",
          name: "Loot Bag Priestly",
          img: img("2288f6ed5b56476e978cd79e3c5ede47_Loot_Bag_Priestly.tgs"),
          color: "#FFA532",
          chance: 5,
          value: 55500,
          ton: "555",
        },
        {
          id: "heroic_helmet_steamp",
          name: "Heroic Helmet Steampunk",
          img: img(
            "eb039495ec484ec4a0c03b6ec7a4be2e_Heroic_Helmet_Steampunk.tgs"
          ),
          color: "#CE93D8",
          chance: 6,
          value: 40000,
          ton: "400",
        },
        {
          id: "nail_bracelet_carrot",
          name: "Nail Bracelet Carrot Bunny",
          img: img(
            "b814bea6bc354d268927540c1eb62ea3_Nail_Bracelet_Carrot_Bunny.tgs"
          ),
          color: "#CE93D8",
          chance: 15,
          value: 17000,
          ton: "170",
        },
        {
          id: "spring_basket_rabbit",
          name: "Spring Basket Rabbit Habit",
          img: img(
            "6bd09826bc0f4ddf9d5e5a2b24f23f4e_Spring_Basket_Rabbit_Habit.tgs"
          ),
          color: "#CE93D8",
          chance: 17,
          value: 15000,
          ton: "150",
        },
        {
          id: "ice_cream_cryo_pepe",
          name: "Ice Cream Cryo Pepe",
          img: img("8120d0a08a1b4d0aa9359ee32cef4baa_Ice_Cream_Cryo_Pepe.tgs"),
          color: "#4F96FF",
          chance: 20,
          value: 12400,
          ton: "124",
        },
        {
          id: "bling_binky_leopard",
          name: "Bling Binky Leopard",
          img: img("c6ee4a450f15465b9e5906a1a664399c_Bling_Binky_Leopard.tgs"),
          color: "#4F96FF",
          chance: 25,
          value: 10000,
          ton: "100",
        },
        {
          id: "bonded_ring_hamster_",
          name: "Bonded Ring Hamster Wheel",
          img: img(
            "ee7593801a5e45e08e1019b49969f634_Bonded_Ring_Hamster_Wheel.tgs"
          ),
          color: "#4F96FF",
          chance: 28,
          value: 9000,
          ton: "90",
        },
        {
          id: "swiss_watch_infinite",
          name: "Swiss Watch Infinite Loop",
          img: img(
            "6d9d5c34c34246218f06647497f94226_Swiss_Watch_Infinite_Loop.tgs"
          ),
          color: "#4F96FF",
          chance: 33,
          value: 7500,
          ton: "75",
        },
        {
          id: "spring_basket_ritual",
          name: "Spring Basket Ritual Goat",
          img: img(
            "33daf72c68aa4949a72a6084e40d623e_Spring_Basket_Ritual_Goat.tgs"
          ),
          color: "#4F96FF",
          chance: 42,
          value: 5900,
          ton: "59",
        },
        {
          id: "toy_bear_tiger",
          name: "Toy Bear Tiger",
          img: img("22d2b6c90fa94de5a851910b5771e2dc_Toy_Bear_Tiger.tgs"),
          color: "#80D8FF",
          chance: 52,
          value: 4800,
          ton: "48",
        },
        {
          id: "voodoo_doll_chromed_",
          name: "Voodoo Doll Chromed Out",
          img: img(
            "9e0709a992c14d449de5e47815729d73_Voodoo_Doll_Chromed_Out.tgs"
          ),
          color: "#80D8FF",
          chance: 70,
          value: 3559,
          ton: "35.59",
        },
        {
          id: "bling_binky_gem_seek",
          name: "Bling Binky Gem Seeker",
          img: img(
            "3923750f46a64695978431958f3579ec_Bling_Binky_Gem_Seeker.tgs"
          ),
          color: "#80D8FF",
          chance: 74,
          value: 3400,
          ton: "34",
        },
        {
          id: "bling_binky_rancho",
          name: "Bling Binky Rancho",
          img: img("e14de28d16034ef38cef94f80ddaa646_Bling_Binky_Rancho.tgs"),
          color: "#80D8FF",
          chance: 76,
          value: 3300,
          ton: "33",
        },
        {
          id: "fresh_socks_pepe_soc",
          name: "Fresh Socks Pepe Socks",
          img: img(
            "5f574f489f1a43b0b6026e1e688bdafd_Fresh_Socks_Pepe_Socks.tgs"
          ),
          color: "#80D8FF",
          chance: 94,
          value: 2650,
          ton: "26.5",
        },
        {
          id: "spring_basket_fire_f",
          name: "Spring Basket Fire Fox",
          img: img(
            "db64bf1d29a344cab906a23605b620fc_Spring_Basket_Fire_Fox.tgs"
          ),
          color: "#3DE48F",
          chance: 112,
          value: 2229,
          ton: "22.29",
        },
        {
          id: "jolly_chimp_smash_ki",
          name: "Jolly Chimp Smash King",
          img: img(
            "17a1170516994a9dae969b0f727e6273_Jolly_Chimp_Smash_King.tgs"
          ),
          color: "#3DE48F",
          chance: 132,
          value: 1900,
          ton: "19",
        },
        {
          id: "spring_basket_cash_b",
          name: "Spring Basket Cash Bunny",
          img: img(
            "d09425adb41e4eb887e6087cfde0a3d7_Spring_Basket_Cash_Bunny.tgs"
          ),
          color: "#3DE48F",
          chance: 167,
          value: 1500,
          ton: "15",
        },
        {
          id: "money_pot_conspiracy",
          name: "Money Pot Conspiracy",
          img: img("a977d97fcc1f404090f71bfd69a90e3d_Money_Pot_Conspiracy.tgs"),
          color: "#3DE48F",
          chance: 167,
          value: 1500,
          ton: "15",
        },
        {
          id: "input_key_purrfect_k",
          name: "Input Key Purrfect Key",
          img: img(
            "c37efb3587674a3a9300d45fb3bfc6f8_Input_Key_Purrfect_Key.tgs"
          ),
          color: "#3DE48F",
          chance: 208,
          value: 1200,
          ton: "12",
        },
        {
          id: "spring_basket_dom_pi",
          name: "Spring Basket Dom Pingouin",
          img: img(
            "2c7dbf104e524f709dff024ee43bf5ce_Spring_Basket_Dom_Pingouin.tgs"
          ),
          color: "#3DE48F",
          chance: 313,
          value: 800,
          ton: "8",
        },
        {
          id: "spring_basket_bull_m",
          name: "Spring Basket Bull Market",
          img: img(
            "195b7b8acaea4ec7978fb5d562dbf4e7_Spring_Basket_Bull_Market.tgs"
          ),
          color: "#00E5FF",
          chance: 313,
          value: 799,
          ton: "7.99",
        },
        {
          id: "ice_cream_kraken",
          name: "Ice Cream Kraken",
          img: img("c067e0811c8746afae79ad2949e3d6d0_Ice_Cream_Kraken.tgs"),
          color: "#00E5FF",
          chance: 368,
          value: 680,
          ton: "6.8",
        },
        {
          id: "happy_brownie_holy_s",
          name: "Happy Brownie Holy Shit",
          img: img(
            "061a74fb87f748a4a61616a1dd5f5736_Happy_Brownie_Holy_Shit.tgs"
          ),
          color: "#00E5FF",
          chance: 392,
          value: 638,
          ton: "6.38",
        },
        {
          id: "money_pot_pax_romana",
          name: "Money Pot Pax Romana",
          img: img("b6ae2255fcec48eb967694dec1f36e54_Money_Pot_Pax_Romana.tgs"),
          color: "#00E5FF",
          chance: 417,
          value: 600,
          ton: "6",
        },
        {
          id: "happy_brownie_waster",
          name: "Happy Brownie Wasteroid",
          img: img(
            "7e02c0b2492344cbbaf4d655d8d0c7b2_Happy_Brownie_Wasteroid.tgs"
          ),
          color: "#00E5FF",
          chance: 435,
          value: 575,
          ton: "5.75",
        },
        {
          id: "money_pot_hercules",
          name: "Money Pot Hercules",
          img: img("2747e0ff72734a79b8e39d0a3bb926b0_Money_Pot_Hercules.tgs"),
          color: "#69F0AE",
          chance: 481,
          value: 520,
          ton: "5.2",
        },
        {
          id: "money_pot_aquarium",
          name: "Money Pot Aquarium",
          img: img("a0d24d2ca87a4cac8ba37b7b3b4273a3_Money_Pot_Aquarium.tgs"),
          color: "#69F0AE",
          chance: 500,
          value: 500,
          ton: "5",
        },
        {
          id: "money_pot_apiary",
          name: "Money Pot Apiary",
          img: img("840cc054eca049bbb511adeacff64ca8_Money_Pot_Apiary.tgs"),
          color: "#69F0AE",
          chance: 631,
          value: 396,
          ton: "3.96",
        },
        {
          id: "plush_pepe_1_day",
          name: "Plush Pepe (1 day)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#EF5350",
          chance: 1471,
          value: 170,
          ton: "1.7",
        },
        {
          id: "durovs_cap_3_days",
          name: "Durov's Cap (3 days)",
          img: img("bfb53783183a496e9f79e95d6508f217_Durovs_Cap_Redrum.tgs"),
          color: "#A1887F",
          chance: 1667,
          value: 150,
          ton: "1.5",
        },
        {
          id: "heart_locket_3_day",
          name: "Heart Locket (3 day)",
          img: img(
            "86456e5671bf43a38e225f9d637febc4_Heart_Locket_Comic_Book.tgs"
          ),
          color: "#EF5350",
          chance: 1667,
          value: 150,
          ton: "1.5",
        },
      ],
    },
    bomzh: {
      name: "Бомж",
      image: "https://images.giftsbattle.com/case/giftsbattle_bomj_3.png",
      price: 230,
      glow: "#CE93D8",
      items: [
        {
          id: "loot_bag_random",
          name: "Loot Bag (Random)",
          img: img("Menthol.tgs"),
          color: "#FFD843",
          chance: 6,
          value: 14499,
          ton: "144.99",
        },
        {
          id: "toy_bear_dark_knight",
          name: "Toy Bear Dark Knight",
          img: img("Dark_Knight.tgs"),
          color: "#FF64B4",
          chance: 9,
          value: 9890,
          ton: "98.9",
        },
        {
          id: "evil_eye_tesla_coil",
          name: "Evil Eye Tesla Coil",
          img: img("Tesla_Coil.tgs"),
          color: "#FFA532",
          chance: 45,
          value: 1891,
          ton: "18.91",
        },
        {
          id: "witch_hat_bat_swarm",
          name: "Witch Hat Bat Swarm",
          img: img("Bat_Swarm.tgs"),
          color: "#CE93D8",
          chance: 63,
          value: 1338,
          ton: "13.38",
        },
        {
          id: "jelly_bunny_sir_wobb",
          name: "Jelly Bunny Sir Wobbleton",
          img: img("Sir_Wobbleton.tgs"),
          color: "#CE93D8",
          chance: 94,
          value: 900,
          ton: "9",
        },
        {
          id: "desk_calendar_checkl",
          name: "Desk Calendar Checklist",
          img: img("Checklist.tgs"),
          color: "#4F96FF",
          chance: 113,
          value: 750,
          ton: "7.5",
        },
        {
          id: "desk_calendar_eco_fr",
          name: "Desk Calendar Eco Friendly",
          img: img("Eco_Friendly.tgs"),
          color: "#4F96FF",
          chance: 121,
          value: 700,
          ton: "7",
        },
        {
          id: "evil_eye_random",
          name: "Evil Eye (Random)",
          img: img("Dark_Secret.tgs"),
          color: "#4F96FF",
          chance: 124,
          value: 684,
          ton: "6.84",
        },
        {
          id: "desk_calendar_random",
          name: "Desk Calendar (Random)",
          img: img("Minting_Date.tgs"),
          color: "#4F96FF",
          chance: 129,
          value: 659,
          ton: "6.59",
        },
        {
          id: "candy_cane_hex_pot",
          name: "Candy Cane Hex Pot",
          img: img("Hex_Pot.tgs"),
          color: "#80D8FF",
          chance: 141,
          value: 599,
          ton: "5.99",
        },
        {
          id: "spy_agaric_random",
          name: "Spy Agaric (Random)",
          img: img("Herbalist.tgs"),
          color: "#80D8FF",
          chance: 155,
          value: 547,
          ton: "5.47",
        },
        {
          id: "candy_cane_sticky_sw",
          name: "Candy Cane Sticky Sweet",
          img: img("Sticky_Sweet.tgs"),
          color: "#80D8FF",
          chance: 171,
          value: 495,
          ton: "4.95",
        },
        {
          id: "jack_in_the_box_rubi",
          name: "Jack-in-the-Box Rubik's Cube",
          img: img("Rubiks_Cube.tgs"),
          color: "#3DE48F",
          chance: 173,
          value: 490,
          ton: "4.9",
        },
        {
          id: "lol_pop_glowstick",
          name: "Lol Pop Glowstick",
          img: img("Glowstick.tgs"),
          color: "#3DE48F",
          chance: 183,
          value: 464,
          ton: "4.64",
        },
        {
          id: "witch_hat_random",
          name: "Witch Hat (Random)",
          img: img("Hallowed.tgs"),
          color: "#3DE48F",
          chance: 183,
          value: 462,
          ton: "4.62",
        },
        {
          id: "candy_cane_old_schoo",
          name: "Candy Cane Old School",
          img: img("Old_School.tgs"),
          color: "#00E5FF",
          chance: 192,
          value: 440,
          ton: "4.4",
        },
        {
          id: "tama_gadget_random",
          name: "Tama Gadget (Random)",
          img: img("Lime_Shock.tgs"),
          color: "#00E5FF",
          chance: 238,
          value: 356,
          ton: "3.56",
        },
        {
          id: "lol_pop_random",
          name: "Lol Pop (Random)",
          img: img("Sugar_Free.tgs"),
          color: "#00E5FF",
          chance: 239,
          value: 355,
          ton: "3.55",
        },
        {
          id: "cup",
          name: "Cup",
          img: img("kubok.png").replace(".tgs.webp", ".png"),
          color: "#00E5FF",
          chance: 847,
          value: 100,
          ton: "1",
        },
        {
          id: "ring",
          name: "Ring",
          img: img("ring.png").replace(".tgs.webp", ".png"),
          color: "#69F0AE",
          chance: 847,
          value: 100,
          ton: "1",
        },
        {
          id: "diamond",
          name: "Diamond",
          img: img("diamond.png").replace(".tgs.webp", ".png"),
          color: "#69F0AE",
          chance: 847,
          value: 100,
          ton: "1",
        },
        {
          id: "champagne",
          name: "Champagne",
          img: img("shampain.png").replace(".tgs.webp", ".png"),
          color: "#EF5350",
          chance: 1694,
          value: 50,
          ton: "0.5",
        },
        {
          id: "gift",
          name: "Gift",
          img: img("000_1.png").replace(".tgs.webp", ".png"),
          color: "#A1887F",
          chance: 3388,
          value: 25,
          ton: "0.25",
        },
      ],
    },
    phone: {
      name: "Возьми телефон детка",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_toxic_500x500.png",
      price: 560,
      glow: "#00E5FF",
      items: [
        {
          id: "spring_basket_meme_g",
          name: "Spring Basket Meme God",
          img: img(
            "c3e56655ad9443d290947988b360cf4e_Spring_Basket_Meme_God.tgs"
          ),
          color: "#FFD843",
          chance: 1,
          value: 170000,
          ton: "1700",
        },
        {
          id: "precious_peach_airy_",
          name: "Precious Peach Airy Bright",
          img: img(
            "496dd077f580461998d4b6790229c9ba_Precious_Peach_Airy_Bright.tgs"
          ),
          color: "#FF64B4",
          chance: 3,
          value: 66600,
          ton: "666",
        },
        {
          id: "loot_bag_city_life",
          name: "Loot Bag City Life",
          img: img("City_Life.tgs"),
          color: "#FFA532",
          chance: 5,
          value: 38600,
          ton: "386",
        },
        {
          id: "rare_bird_zombie_rid",
          name: "Rare Bird Zombie Rider",
          img: img(
            "9008757e4eb94e279201c43690f65ed8_Rare_Bird_Zombie_Rider.tgs"
          ),
          color: "#FFA532",
          chance: 6,
          value: 31000,
          ton: "310",
        },
        {
          id: "mighty_arm_paladin",
          name: "Mighty Arm Paladin",
          img: img("f13cda962c6044a8bfda9bed2daa0398_Mighty_Arm_Paladin.tgs"),
          color: "#CE93D8",
          chance: 6,
          value: 31000,
          ton: "310",
        },
        {
          id: "cupid_charm_pepe_lov",
          name: "Cupid Charm Pepe Love",
          img: img("Pepe_Love.tgs"),
          color: "#CE93D8",
          chance: 7,
          value: 27700,
          ton: "277",
        },
        {
          id: "gem_signet_arc_react",
          name: "Gem Signet Arc Reactor",
          img: img("Gem_Signet_Arc_Reactor_aak.tgs"),
          color: "#CE93D8",
          chance: 13,
          value: 13996,
          ton: "139.96",
        },
        {
          id: "nail_bracelet_jade_s",
          name: "Nail Bracelet Jade Serpent",
          img: img(
            "c5bd78477b1b4e679b24e00acc9c81e4_Nail_Bracelet_Jade_Serpent.tgs"
          ),
          color: "#4F96FF",
          chance: 13,
          value: 13700,
          ton: "137",
        },
        {
          id: "swiss_watch_gold_ban",
          name: "Swiss Watch Gold Band",
          img: img(
            "626288e9ab394f2d984ac495c1931f3b_Swiss_Watch_Gold_Band.tgs"
          ),
          color: "#4F96FF",
          chance: 17,
          value: 10999,
          ton: "109.99",
        },
        {
          id: "bonded_ring_pixel_lo",
          name: "Bonded Ring Pixel Loot",
          img: img(
            "ccc7f88296cb4c69abbf74790628858e_Bonded_Ring_Pixel_Loot.tgs"
          ),
          color: "#4F96FF",
          chance: 18,
          value: 9900,
          ton: "99",
        },
        {
          id: "desk_calendar_payday",
          name: "Desk Calendar Payday",
          img: img("10eb14785129487ab16bbf540319bdc9_Desk_Calendar_Payday.tgs"),
          color: "#4F96FF",
          chance: 18,
          value: 9900,
          ton: "99",
        },
        {
          id: "victory_medal_king_t",
          name: "Victory Medal King Troll",
          img: img(
            "c3ccc4f26097419bbff06ee4c86976da_Victory_Medal_King_Troll.tgs"
          ),
          color: "#80D8FF",
          chance: 19,
          value: 9500,
          ton: "95",
        },
        {
          id: "artisan_brick_concre",
          name: "Artisan Brick Concrete",
          img: img(
            "b5efba6f82754860aa6fe14cd8e2307b_Artisan_Brick_Concrete.tgs"
          ),
          color: "#80D8FF",
          chance: 21,
          value: 8800,
          ton: "88",
        },
        {
          id: "khabibs_papakha_fire",
          name: "Khabib's Papakha Fireball",
          img: img(
            "e45c06805e8e4040b69fd1e8fad2ab80_Khabibs_Papakha_Fireball.tgs"
          ),
          color: "#80D8FF",
          chance: 24,
          value: 7674,
          ton: "76.74",
        },
        {
          id: "kissed_frog_tide_pod",
          name: "Kissed Frog Tide Pod",
          img: img("f0bf757839d24199bf235393b077ed1b_Kissed_Frog_Tide_Pod.tgs"),
          color: "#80D8FF",
          chance: 29,
          value: 6200,
          ton: "62",
        },
        {
          id: "low_rider_let_me_rid",
          name: "Low Rider Let Me Ride",
          img: img(
            "eaef80e7f12e48ce9f683c259eb5c673_Low_Rider_Let_Me_Ride.tgs"
          ),
          color: "#80D8FF",
          chance: 33,
          value: 5499,
          ton: "54.99",
        },
        {
          id: "bling_binky_red_bull",
          name: "Bling Binky Red Bull",
          img: img("b30e71fcc5fd4d27a1eccf77f2b5dc86_Bling_Binky_Red_Bull.tgs"),
          color: "#3DE48F",
          chance: 36,
          value: 5000,
          ton: "50",
        },
        {
          id: "swiss_watch_random",
          name: "Swiss Watch (Random)",
          img: img("Amazon.tgs"),
          color: "#3DE48F",
          chance: 40,
          value: 4578,
          ton: "45.78",
        },
        {
          id: "voodoo_doll_aqua_gem",
          name: "Voodoo Doll Aqua Gem",
          img: img("f9e5530401f64031a6a276fb9017e6f7_Voodoo_Doll_Aqua_Gem.tgs"),
          color: "#3DE48F",
          chance: 56,
          value: 3239,
          ton: "32.39",
        },
        {
          id: "victory_medal_master",
          name: "Victory Medal Master Of Luck",
          img: img(
            "3c69d5a47ff84766bbae4647fbe08468_Victory_Medal_Master_Of_Luck.tgs"
          ),
          color: "#3DE48F",
          chance: 57,
          value: 3199,
          ton: "31.99",
        },
        {
          id: "diamond_ring_random",
          name: "Diamond Ring (Random)",
          img: img("Water_Lily.tgs"),
          color: "#3DE48F",
          chance: 64,
          value: 2820,
          ton: "28.2",
        },
        {
          id: "input_key_verificati",
          name: "Input Key Verification",
          img: img("Input_Key_Verification_aaa.tgs"),
          color: "#00E5FF",
          chance: 66,
          value: 2749,
          ton: "27.49",
        },
        {
          id: "ionic_dryer_air_purr",
          name: "Ionic Dryer Air Purrifier",
          img: img(
            "251d5bbbf92348d18df4b615e2c7e7af_Ionic_Dryer_Air_Purrifier.tgs"
          ),
          color: "#00E5FF",
          chance: 91,
          value: 2000,
          ton: "20",
        },
        {
          id: "spring_basket_moon_f",
          name: "Spring Basket Moon Frog",
          img: img(
            "ae30ee29acdc432aa41f0be51865f5be_Spring_Basket_Moon_Frog.tgs"
          ),
          color: "#00E5FF",
          chance: 227,
          value: 799,
          ton: "7.99",
        },
        {
          id: "desk_calendar_random",
          name: "Desk Calendar (Random)",
          img: img("Minting_Date.tgs"),
          color: "#00E5FF",
          chance: 276,
          value: 659,
          ton: "6.59",
        },
        {
          id: "snoop_dogg_beanie",
          name: "Snoop Dogg Beanie",
          img: img("02a2b98aef0241aba1f812e8dbe95ec9_Snoop_Dogg_Beanie.tgs"),
          color: "#69F0AE",
          chance: 372,
          value: 488,
          ton: "4.88",
        },
        {
          id: "toy_bear_30_days",
          name: "Toy Bear (30 days)",
          img: img("f8993a1d82be4a359bd53c35e715b164_Toy_Bear_Blueberry.tgs"),
          color: "#69F0AE",
          chance: 1212,
          value: 150,
          ton: "1.5",
        },
        {
          id: "durovs_cap_5_days",
          name: "Durov's Cap (5 days)",
          img: img("5be7b52d683d4a3da5509c5c85d6abc8_Durovs_Cap_Duskwave.tgs"),
          color: "#69F0AE",
          chance: 1212,
          value: 150,
          ton: "1.5",
        },
        {
          id: "scared_cat_10_days",
          name: "Scared Cat (10 days)",
          img: img("873e95f5c92b4ba19eddb0d451ce9d0b_Scared_Cat_Ranni.tgs"),
          color: "#A1887F",
          chance: 1818,
          value: 100,
          ton: "1",
        },
        {
          id: "swiss_watch_10_days",
          name: "Swiss Watch (10 days)",
          img: img("7f09f15ea5294a9c89516c0adb87fb0e_Swiss_Watch_Platinum.tgs"),
          color: "#EF5350",
          chance: 1818,
          value: 100,
          ton: "1",
        },
        {
          id: "vintage_cigar_15_day",
          name: "Vintage Cigar (15 days)",
          img: img(
            "3f986888f44549108bf4fcb982ed8803_Vintage_Cigar_High_Tide.tgs"
          ),
          color: "#A1887F",
          chance: 2423,
          value: 75,
          ton: "0.75",
        },
      ],
    },
    danil: {
      name: "Даниил Колбасенко",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_kalbasenko_500x500.png",
      price: 350,
      glow: "#4F96FF",
      items: [
        {
          id: "gem_signet_feral_rag",
          name: "Gem Signet Feral Rage",
          img: img("Feral_Rage_MkBy07C.tgs"),
          color: "#FFD843",
          chance: 1,
          value: 90000,
          ton: "900",
        },
        {
          id: "durovs_cap_seabreeze",
          name: "Durov's Cap Seabreeze",
          img: img("f0f7efdfe719498dab3a50d76cc60fb6_Durovs_Cap_Seabreeze.tgs"),
          color: "#FF64B4",
          chance: 2,
          value: 71390,
          ton: "713.9",
        },
        {
          id: "mighty_arm_overlord",
          name: "Mighty Arm Overlord",
          img: img("eb27741917604ed68cda2cb069c46f82_Mighty_Arm_Overlord.tgs"),
          color: "#FFA532",
          chance: 2,
          value: 65000,
          ton: "650",
        },
        {
          id: "precious_peach_elega",
          name: "Precious Peach Elegance",
          img: img(
            "b80e73ed9eb847c7a2c825414b88a7bd_Precious_Peach_Elegance.tgs"
          ),
          color: "#CE93D8",
          chance: 3,
          value: 39216,
          ton: "392.16",
        },
        {
          id: "artisan_brick_bomb_p",
          name: "Artisan Brick Bomb Planted",
          img: img(
            "8519bfd1725c4afb8010bd663faae4da_Artisan_Brick_Bomb_Planted.tgs"
          ),
          color: "#CE93D8",
          chance: 5,
          value: 23500,
          ton: "235",
        },
        {
          id: "artisan_brick_ice_ma",
          name: "Artisan Brick Ice Mammoth",
          img: img(
            "e850bd53a07446bcb425ee27729e0939_Artisan_Brick_Ice_Mammoth.tgs"
          ),
          color: "#CE93D8",
          chance: 6,
          value: 22000,
          ton: "220",
        },
        {
          id: "artisan_brick_floppa",
          name: "Artisan Brick Floppa Plush",
          img: img(
            "c60583ee6f074bd8bf66c3641f18898c_Artisan_Brick_Floppa_Plush.tgs"
          ),
          color: "#4F96FF",
          chance: 8,
          value: 15000,
          ton: "150",
        },
        {
          id: "loot_bag_random",
          name: "Loot Bag (Random)",
          img: img("Menthol.tgs"),
          color: "#4F96FF",
          chance: 8,
          value: 14499,
          ton: "144.99",
        },
        {
          id: "genie_lamp_liquid_ca",
          name: "Genie Lamp Liquid Cat",
          img: img(
            "9ae0f9d7da1f4318a0d7a10bfb82f610_Genie_Lamp_Liquid_Cat.tgs"
          ),
          color: "#4F96FF",
          chance: 12,
          value: 10500,
          ton: "105",
        },
        {
          id: "victory_medal_crypto",
          name: "Victory Medal Crypto Whale",
          img: img(
            "4f046064a14b465bbb025d32992b91c5_Victory_Medal_Crypto_Whale.tgs"
          ),
          color: "#4F96FF",
          chance: 16,
          value: 7770,
          ton: "77.7",
        },
        {
          id: "toy_bear_lapis_lazul",
          name: "Toy Bear Lapis Lazuli",
          img: img("Lapis_Lazuli_new.tgs"),
          color: "#4F96FF",
          chance: 22,
          value: 5400,
          ton: "54",
        },
        {
          id: "mad_pumpkin_kinky_wi",
          name: "Mad Pumpkin Kinky-Winky",
          img: img(
            "761abf0db46b4e0a8e20f5ae57dd0895_Mad_Pumpkin_Kinky-Winky.tgs"
          ),
          color: "#80D8FF",
          chance: 28,
          value: 4400,
          ton: "44",
        },
        {
          id: "rare_bird_icarus",
          name: "Rare Bird Icarus",
          img: img("c45bc78a6d9342d1a3cda93963e880e7_Rare_Bird_Icarus.tgs"),
          color: "#80D8FF",
          chance: 28,
          value: 4300,
          ton: "43",
        },
        {
          id: "cookie_heart_yamete_",
          name: "Cookie Heart Yamete Kudasai",
          img: img(
            "2c825261237f411098f63542a608d647_Cookie_Heart_Yamete_Kudasai.tgs"
          ),
          color: "#80D8FF",
          chance: 32,
          value: 3800,
          ton: "38",
        },
        {
          id: "hanging_star_insane",
          name: "Hanging Star Insane",
          img: img("f4c8f0812b6e4914b0226ead826e6897_Hanging_Star_Insane.tgs"),
          color: "#80D8FF",
          chance: 49,
          value: 2500,
          ton: "25",
        },
        {
          id: "victory_medal_gem_ho",
          name: "Victory Medal Gem Holder",
          img: img(
            "cc42e2f8b59c4c93976b6efa3373b646_Victory_Medal_Gem_Holder.tgs"
          ),
          color: "#3DE48F",
          chance: 49,
          value: 2490,
          ton: "24.9",
        },
        {
          id: "desk_calendar_outlaw",
          name: "Desk Calendar Outlaw",
          img: img("2d5ddd3986f642049605a1cfeb57e479_Desk_Calendar_Outlaw.tgs"),
          color: "#3DE48F",
          chance: 62,
          value: 1949,
          ton: "19.49",
        },
        {
          id: "easter_egg_dogel_mog",
          name: "Easter Egg Dogel Mogel",
          img: img(
            "a9ba89daf14147c2bd622b7bd3abb91d_Easter_Egg_Dogel_Mogel.tgs"
          ),
          color: "#3DE48F",
          chance: 121,
          value: 1000,
          ton: "10",
        },
        {
          id: "party_sparkler_assau",
          name: "Party Sparkler Assault",
          img: img(
            "c0fa9be292be4164b22322f0e703e5da_Party_Sparkler_Assault.tgs"
          ),
          color: "#3DE48F",
          chance: 152,
          value: 800,
          ton: "8",
        },
        {
          id: "light_sword_bananaki",
          name: "Light Sword Bananakin",
          img: img(
            "4e6b0b70f224421a93625969c90da42e_Light_Sword_Bananakin.tgs"
          ),
          color: "#3DE48F",
          chance: 179,
          value: 680,
          ton: "6.8",
        },
        {
          id: "jolly_chimp_artist",
          name: "Jolly Chimp Artist",
          img: img("72d84fd3957842f89bcfce9a300ada3f_Jolly_Chimp_Artist.tgs"),
          color: "#00E5FF",
          chance: 182,
          value: 668,
          ton: "6.68",
        },
        {
          id: "input_key_lol",
          name: "Input Key LOL",
          img: img("8f2f9e8468cb45419e9a8ed6d6f2911c_Input_Key_LOL.tgs"),
          color: "#00E5FF",
          chance: 207,
          value: 588,
          ton: "5.88",
        },
        {
          id: "stellar_rocket_dooms",
          name: "Stellar Rocket Doomsday",
          img: img(
            "d46e9301bf174666b5d5e22ffe282b8e_Stellar_Rocket_Doomsday.tgs"
          ),
          color: "#00E5FF",
          chance: 233,
          value: 521,
          ton: "5.21",
        },
        {
          id: "fresh_socks_this_is_",
          name: "Fresh Socks This Is Fine",
          img: img(
            "c585941f2a8b4b0da08add7d6392a3d7_Fresh_Socks_This_Is_Fine.tgs"
          ),
          color: "#00E5FF",
          chance: 282,
          value: 430,
          ton: "4.3",
        },
        {
          id: "fresh_socks_drumstic",
          name: "Fresh Socks Drumsticks",
          img: img(
            "7b8c30ed5bc34355b622b812fad3cc2c_Fresh_Socks_Drumsticks.tgs"
          ),
          color: "#69F0AE",
          chance: 312,
          value: 389,
          ton: "3.89",
        },
        {
          id: "plush_pepe_1_day",
          name: "Plush Pepe (1 day)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#69F0AE",
          chance: 714,
          value: 170,
          ton: "1.7",
        },
        {
          id: "precious_peach_5_day",
          name: "Precious Peach (5 days)",
          img: img(
            "70c8ad7c000540cdaa9abbe034628580_Precious_Peach_Cold_Iron.tgs"
          ),
          color: "#69F0AE",
          chance: 1214,
          value: 100,
          ton: "1",
        },
        {
          id: "scared_cat_10_days",
          name: "Scared Cat (10 days)",
          img: img("873e95f5c92b4ba19eddb0d451ce9d0b_Scared_Cat_Ranni.tgs"),
          color: "#EF5350",
          chance: 1214,
          value: 100,
          ton: "1",
        },
        {
          id: "durovs_cap_1_day",
          name: "Durov's Cap (1 day)",
          img: img("7ffdf456448d49f18cdf5bc4b1ca4cd1_Durovs_Cap_Mossy.tgs"),
          color: "#A1887F",
          chance: 2429,
          value: 50,
          ton: "0.5",
        },
        {
          id: "heart_locket_1_day",
          name: "Heart Locket (1 day)",
          img: img(
            "89eb583cd4944359b64f2f9aed476a04_Heart_Locket_Stone_Flower.tgs"
          ),
          color: "#EF5350",
          chance: 2429,
          value: 50,
          ton: "0.5",
        },
      ],
    },
    neko: {
      name: "Neko Helmet All in",
      image: "https://images.giftsbattle.com/case/giftsbattle_Neko_Helmet.png",
      price: 50,
      glow: "#FF64B4",
      items: [
        {
          id: "neko_helmet_turbo_fr",
          name: "Neko Helmet Turbo Frog",
          img: img("Turbo_Frog.tgs"),
          color: "#FFD843",
          chance: 5,
          value: 44400,
          ton: "444",
        },
        {
          id: "scared_cat_1_day",
          name: "Scared Cat (1 day)",
          img: img("0cbd3876192a44e7a14e97c64e86ab18_Scared_Cat_Ruby.tgs"),
          color: "#FF64B4",
          chance: 9995,
          value: 20,
          ton: "0.2",
        },
      ],
    },
    signet: {
      name: "Signet Ring All In",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_SignetRingAllIn.png",
      price: 50,
      glow: "#FFD843",
      items: [
        {
          id: "signet_ring_ton",
          name: "Signet Ring TON",
          img: img("TON.tgs"),
          color: "#FFD843",
          chance: 27,
          value: 7400,
          ton: "74",
        },
        {
          id: "scared_cat_1_day",
          name: "Scared Cat (1 day)",
          img: img("0cbd3876192a44e7a14e97c64e86ab18_Scared_Cat_Ruby.tgs"),
          color: "#FF64B4",
          chance: 9973,
          value: 20,
          ton: "0.2",
        },
      ],
    },
    march8: {
      name: "8 Марта",
      image:
        "https://images.giftsbattle.com/case/giftsbattle_8marta_500x500.png",
      price: 1200,
      glow: "#FF64B4",
      items: [
        {
          id: "plush_pepe_polka_dot",
          name: "Plush Pepe Polka Dots",
          img: img(
            "5c020f8477f54d4a8dbacc99b79a9f54_Plush_Pepe_Polka_Dots.tgs"
          ),
          color: "#FFD843",
          chance: 1,
          value: 949900,
          ton: "9499",
        },
        {
          id: "heart_locket_comic_b",
          name: "Heart Locket Comic Book",
          img: img(
            "4bebdfd36d734b83bfb4577be6fd580e_Heart_Locket_Comic_Book.tgs"
          ),
          color: "#FF64B4",
          chance: 1,
          value: 250000,
          ton: "2500",
        },
        {
          id: "victory_medal_the_fo",
          name: "Victory Medal The Founder",
          img: img(
            "9d1b4e867b0247ec8c3e3849799ffd5f_Victory_Medal_The_Founder.tgs"
          ),
          color: "#FFA532",
          chance: 3,
          value: 89900,
          ton: "899",
        },
        {
          id: "durovs_cap_autumn",
          name: "Durov's Cap Autumn",
          img: img("Autumn.tgs"),
          color: "#FFA532",
          chance: 4,
          value: 77500,
          ton: "775",
        },
        {
          id: "precious_peach_sunse",
          name: "Precious Peach Sunset",
          img: img(
            "3262db6298454ffb94f08922d88196a3_Precious_Peach_Sunset.tgs"
          ),
          color: "#CE93D8",
          chance: 6,
          value: 52500,
          ton: "525",
        },
        {
          id: "loot_bag_city_life",
          name: "Loot Bag City Life",
          img: img("City_Life.tgs"),
          color: "#CE93D8",
          chance: 8,
          value: 38600,
          ton: "386",
        },
        {
          id: "lush_bouquet_million",
          name: "Lush Bouquet Million Roses",
          img: img(
            "9d5ec46b3f8241409fa82c3c319434b5_Lush_Bouquet_Million_Roses.tgs"
          ),
          color: "#CE93D8",
          chance: 10,
          value: 31500,
          ton: "315",
        },
        {
          id: "cupid_charm_pepe_lov",
          name: "Cupid Charm Pepe Love",
          img: img("Pepe_Love.tgs"),
          color: "#CE93D8",
          chance: 11,
          value: 27700,
          ton: "277",
        },
        {
          id: "scared_cat_pepe_paws",
          name: "Scared Cat Pepe Paws",
          img: img("f2291926ae3f44f2ac254c7cc5d8f8c5_Scared_Cat_Pepe_Paws.tgs"),
          color: "#4F96FF",
          chance: 13,
          value: 25000,
          ton: "250",
        },
        {
          id: "jingle_bells_little_",
          name: "Jingle Bells Little Gifts",
          img: img(
            "68d2d3a3b8ef46bbacc603f3752ba9b9_Jingle_Bells_Little_Gifts.tgs"
          ),
          color: "#4F96FF",
          chance: 18,
          value: 17391,
          ton: "173.91",
        },
        {
          id: "spring_basket_rabbit",
          name: "Spring Basket Rabbit Habit",
          img: img(
            "6bd09826bc0f4ddf9d5e5a2b24f23f4e_Spring_Basket_Rabbit_Habit.tgs"
          ),
          color: "#4F96FF",
          chance: 21,
          value: 15000,
          ton: "150",
        },
        {
          id: "stellar_rocket_missi",
          name: "Stellar Rocket Mission Uranus",
          img: img(
            "a6c8918b2b6841ed83c2f3197be83c54_Stellar_Rocket_Mission_Uranus.tgs"
          ),
          color: "#4F96FF",
          chance: 26,
          value: 12300,
          ton: "123",
        },
        {
          id: "desk_calendar_payday",
          name: "Desk Calendar Payday",
          img: img("10eb14785129487ab16bbf540319bdc9_Desk_Calendar_Payday.tgs"),
          color: "#4F96FF",
          chance: 32,
          value: 9900,
          ton: "99",
        },
        {
          id: "desk_calendar_adult_",
          name: "Desk Calendar Adult Tasks",
          img: img(
            "eb0115c1b9784427a9436fede19a2615_Desk_Calendar_Adult_Tasks.tgs"
          ),
          color: "#4F96FF",
          chance: 46,
          value: 6902,
          ton: "69.02",
        },
        {
          id: "rare_bird_aurora_mot",
          name: "Rare Bird Aurora Moth",
          img: img(
            "26e6b89839fd477d9e55a60dbffbe018_Rare_Bird_Aurora_Moth.tgs"
          ),
          color: "#80D8FF",
          chance: 48,
          value: 6500,
          ton: "65",
        },
        {
          id: "toy_bear_diamond",
          name: "Toy Bear Diamond",
          img: img("Diamond.tgs"),
          color: "#80D8FF",
          chance: 52,
          value: 6000,
          ton: "60",
        },
        {
          id: "bling_binky_adult_to",
          name: "Bling Binky Adult Toy",
          img: img(
            "75375b88e4f54e81814c6a42f78dedaa_Bling_Binky_Adult_Toy.tgs"
          ),
          color: "#80D8FF",
          chance: 54,
          value: 5800,
          ton: "58",
        },
        {
          id: "low_rider_lovemobile",
          name: "Low Rider Lovemobile",
          img: img("2664f90ed68c4083b81732c83ea3eafa_Low_Rider_Lovemobile.tgs"),
          color: "#80D8FF",
          chance: 54,
          value: 5800,
          ton: "58",
        },
        {
          id: "cupid_charm_antique",
          name: "Cupid Charm Antique",
          img: img("Antique_new.tgs"),
          color: "#80D8FF",
          chance: 54,
          value: 5798,
          ton: "57.98",
        },
        {
          id: "happy_brownie_kinky_",
          name: "Happy Brownie Kinky Stinky",
          img: img(
            "bcd93310e66f4d34b7e2be84346ee0fd_Happy_Brownie_Kinky_Stinky.tgs"
          ),
          color: "#3DE48F",
          chance: 58,
          value: 5400,
          ton: "54",
        },
        {
          id: "bonded_ring_love_whi",
          name: "Bonded Ring Love Whisper",
          img: img(
            "ba5a7cc763d941ef8b248be88f97c73d_Bonded_Ring_Love_Whisper.tgs"
          ),
          color: "#3DE48F",
          chance: 67,
          value: 4661,
          ton: "46.61",
        },
        {
          id: "voodoo_doll_bitten_l",
          name: "Voodoo Doll Bitten Lip",
          img: img(
            "a6995065e58d4fda9330532c8d3babb4_Voodoo_Doll_Bitten_Lip.tgs"
          ),
          color: "#3DE48F",
          chance: 68,
          value: 4620,
          ton: "46.2",
        },
        {
          id: "jolly_chimp_la_baboo",
          name: "Jolly Chimp La Baboon",
          img: img("LaBaboon_new.tgs"),
          color: "#3DE48F",
          chance: 83,
          value: 3800,
          ton: "38",
        },
        {
          id: "victory_medal_heartb",
          name: "Victory Medal Heartbreaker",
          img: img(
            "d41d70bce2d44d808d7e472eae759af6_Victory_Medal_Heartbreaker.tgs"
          ),
          color: "#3DE48F",
          chance: 110,
          value: 2850,
          ton: "28.5",
        },
        {
          id: "eternal_rose_nightfa",
          name: "Eternal Rose Nightfall",
          img: img(
            "54106172a96544029f09ae45d0ebf7ec_Eternal_Rose_Nightfall.tgs"
          ),
          color: "#3DE48F",
          chance: 113,
          value: 2770,
          ton: "27.7",
        },
        {
          id: "lush_bouquet_tulips",
          name: "Lush Bouquet Tulips",
          img: img("c71657e84c614d429d8efc1b215ddbdc_Lush_Bouquet_Tulips.tgs"),
          color: "#00E5FF",
          chance: 225,
          value: 1399,
          ton: "13.99",
        },
        {
          id: "input_key_purrfect_k",
          name: "Input Key Purrfect Key",
          img: img(
            "c37efb3587674a3a9300d45fb3bfc6f8_Input_Key_Purrfect_Key.tgs"
          ),
          color: "#00E5FF",
          chance: 262,
          value: 1200,
          ton: "12",
        },
        {
          id: "clover_pin_emo_pin",
          name: "Clover Pin Emo Pin",
          img: img("d1250a6731834c14930cd2038b2f2fa7_Clover_Pin_Emo_Pin.tgs"),
          color: "#00E5FF",
          chance: 374,
          value: 840,
          ton: "8.4",
        },
        {
          id: "pet_snake_soap_bubbl",
          name: "Pet Snake Soap Bubble",
          img: img(
            "0b5eb0523c0e4b3897faea7025b0260c_Pet_Snake_Soap_Bubble.tgs"
          ),
          color: "#00E5FF",
          chance: 573,
          value: 549,
          ton: "5.49",
        },
        {
          id: "ice_cream_cupid_aim",
          name: "Ice Cream Cupid Aim",
          img: img("abccb2f838f545b4af5156f7b9637f31_Ice_Cream_Cupid_Aim.tgs"),
          color: "#00E5FF",
          chance: 638,
          value: 493,
          ton: "4.93",
        },
        {
          id: "candy_cane_angelius",
          name: "Candy Cane Angelius",
          img: img("e0db6bd9dc754da4a6f987f646a5d4d2_Candy_Cane_Angelius.tgs"),
          color: "#00E5FF",
          chance: 644,
          value: 488,
          ton: "4.88",
        },
        {
          id: "party_sparkler_cryst",
          name: "Party Sparkler Crystal",
          img: img(
            "d2de6852f15e4537814b1ec2460fce17_Party_Sparkler_Crystal.tgs"
          ),
          color: "#69F0AE",
          chance: 662,
          value: 475,
          ton: "4.75",
        },
        {
          id: "clover_pin_lava_lamp",
          name: "Clover Pin Lava Lamp",
          img: img("98e225cf7a954f818cf61dcce74f7dc4_Clover_Pin_Lava_Lamp.tgs"),
          color: "#69F0AE",
          chance: 716,
          value: 439,
          ton: "4.39",
        },
        {
          id: "happy_brownie_unicor",
          name: "Happy Brownie Unicorn",
          img: img(
            "c0ab937be8384515b49e587c8f03fa25_Happy_Brownie_Unicorn.tgs"
          ),
          color: "#69F0AE",
          chance: 718,
          value: 438,
          ton: "4.38",
        },
        {
          id: "fresh_socks_ballerin",
          name: "Fresh Socks Ballerina",
          img: img(
            "ba7a87994f944462b6a53b7fa1f8392e_Fresh_Socks_Ballerina.tgs"
          ),
          color: "#69F0AE",
          chance: 749,
          value: 420,
          ton: "4.2",
        },
        {
          id: "stellar_rocket_rando",
          name: "Stellar Rocket (Random)",
          img: img("LavaLamp_new.tgs"),
          color: "#EF5350",
          chance: 752,
          value: 418,
          ton: "4.18",
        },
        {
          id: "victory_medal_random",
          name: "Victory Medal (Random)",
          img: img(
            "3b12200b5e8d42b48378cc062ba3e400_Victory_Medal_Sweet_Reward.tgs"
          ),
          color: "#A1887F",
          chance: 876,
          value: 359,
          ton: "3.59",
        },
        {
          id: "plush_pepe_1_day",
          name: "Plush Pepe (1 day)",
          img: img("bf1956c22b34479597fbc00b00a33c5b_Plush_Pepe_Sunset.tgs"),
          color: "#EF5350",
          chance: 1849,
          value: 170,
          ton: "1.7",
        },
      ],
    },
  };

  /* ── Reel config ────────────────────────────────────────────────── */
  var ITEM_WIDTH = 90;
  var ITEM_GAP = 6;
  var ITEM_STEP = ITEM_WIDTH + ITEM_GAP; // 96
  var TRACK_TOTAL = 56;
  var WINNER_IDX = 40;

  /* ── Weighted random ────────────────────────────────────────────── */
  function weightedRandom(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) total += items[i].chance;
    var r = Math.random() * total;
    for (var i = 0; i < items.length; i++) {
      r -= items[i].chance;
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  /* ── Fill reel track ────────────────────────────────────────────── */
  function fillTrack(items, count, winnerAtIdx, winner) {
    var track = [];
    for (var i = 0; i < count; i++) {
      if (winner && i === winnerAtIdx) {
        track.push(winner);
      } else {
        track.push(items[Math.floor(Math.random() * items.length)]);
      }
    }
    return track;
  }

  /* ── Render reel item HTML ──────────────────────────────────────── */
  function reelItemHTML(it) {
    var isImgUrl =
      it.img && /\.(webp|jpg|jpeg|png|gif|svg)(\?.*)?$/i.test(it.img);
    var media = isImgUrl
      ? '<img class="cd-reel-img" src="' +
        it.img +
        '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
      : '<span class="cd-reel-emoji">🎁</span>';
    return (
      '<div class="cd-reel-item" style="border-color:' +
      it.color +
      "44; background:" +
      it.color +
      '0d">' +
      media +
      '<span class="cd-reel-name">' +
      it.name +
      "</span>" +
      "</div>"
    );
  }

  /* ── State ──────────────────────────────────────────────────────── */
  var currentCaseId = null;
  var currentCaseUrl = null;
  var spinning = false;
  var _spinTimerId = null;
  var winItem = null;
  var promoForceItem = null;
  var prevCaseView = "cases";
  var caseDetailBackHandler = null;
  var viewInitialized = false;

  function el(id) {
    return document.getElementById(id);
  }

  /* ── Render case ────────────────────────────────────────────────── */
  function renderCase(caseId) {
    var data = CASES_DATA[caseId];
    if (!data) return;

    var nameEl = el("cdCaseName");
    var heroName = el("cdHeroName");
    var heroSub = el("cdHeroSub");
    var priceEl = el("cdPriceBadge");
    var imgEl = el("cdCaseImage");
    var glowEl = el("cdCaseGlow");
    var itemsEl = el("cdItemsGrid");
    var openBtn = el("cdOpenBtn");
    var openWrap = el("cdOpenWrap");
    var promoWrap = el("cdPromoWrap");
    var promoInput = el("cdPromoInput");
    var promoErr = el("cdPromoError");
    var reelTrack = el("cdReelTrack");

    // Show promo input for free cases, open button for paid
    var isFree = !data.price;
    if (promoWrap) promoWrap.style.display = isFree ? "block" : "none";
    if (openWrap) openWrap.style.display = isFree ? "none" : "block";
    if (promoInput) {
      promoInput.value = "";
      promoInput.classList.remove("error");
    }
    if (promoErr) promoErr.style.display = "none";

    if (nameEl) nameEl.textContent = data.name;
    if (heroName) heroName.textContent = data.name;
    if (heroSub)
      heroSub.textContent = data.price
        ? "Цена: " + data.price.toLocaleString("ru") + " ★"
        : "Бесплатный кейс";
    if (imgEl) imgEl.src = data.image;
    if (glowEl)
      glowEl.style.background =
        "radial-gradient(ellipse 80% 60% at 50% 40%, " +
        data.glow +
        "60 0%, transparent 70%)";

    if (priceEl) {
      priceEl.classList.remove("cd-free");
      if (data.price) {
        priceEl.innerHTML =
          '<span class="cd-price-star">★</span> ' +
          data.price.toLocaleString("ru");
      } else {
        priceEl.innerHTML = "Бесплатно";
        priceEl.classList.add("cd-free");
      }
    }

    // Items grid ("Что в кейсе?")
    if (itemsEl) {
      var html = "";
      for (var i = 0; i < data.items.length; i++) {
        var it = data.items[i];
        var chanceStr =
          it.chance < 1
            ? it.chance.toFixed(2)
            : it.chance < 10
            ? it.chance.toFixed(1)
            : Math.round(it.chance);
        html +=
          '<div class="cd-item-card" style="--item-glow:' +
          it.color +
          "; border-color:" +
          it.color +
          '22">' +
          '<span class="cd-item-chance-badge">' +
          chanceStr +
          "%</span>" +
          '<div class="cd-item-thumb">' +
          '<img src="' +
          it.img +
          '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' +
          "</div>" +
          '<div class="cd-item-info">' +
          '<div class="cd-item-name">' +
          it.name +
          "</div>" +
          '<div class="cd-item-value">' +
          (it.ton
            ? '<span class="cd-ton-price">💎 ' + it.ton + "</span> / "
            : "") +
          '<span class="cd-price-star-sm">★</span> ' +
          it.value.toLocaleString("ru") +
          "</div>" +
          "</div>" +
          "</div>";
      }
      itemsEl.innerHTML = html;
    }

    // Initial reel (decorative)
    if (reelTrack) {
      var initTrack = fillTrack(data.items, TRACK_TOTAL, -1, null);
      var reelHtml = "";
      for (var i = 0; i < initTrack.length; i++) {
        reelHtml += reelItemHTML(initTrack[i]);
      }
      reelTrack.innerHTML = reelHtml;
      reelTrack.style.transition = "none";
      reelTrack.style.transform = "translateX(0)";
    }

    if (openBtn) {
      openBtn.disabled = false;
      openBtn.textContent = data.price
        ? "Открыть за " + data.price.toLocaleString("ru") + " ★"
        : "Введите промокод";
    }

    spinning = false;
    winItem = null;
  }

  /* ── Spin ───────────────────────────────────────────────────────── */
  var _pendingAuthSpin = false;

  function spinReel() {
    if (spinning) return;

    var data = CASES_DATA[currentCaseId];
    if (!data) {
      return;
    }

    // Платный кейс — требуем авторизацию через Telegram
    if (data.price && data.price > 0) {
      if (tg && tg.HapticFeedback)
        tg.HapticFeedback.notificationOccurred("warning");
      _pendingAuthSpin = true;
      if (typeof window.openAuthSheet === "function") {
        window.openAuthSheet();
      } else {
        // fallback: показываем оверлей напрямую
        var _ao = document.getElementById("authSheetOverlay");
        var _as = document.getElementById("authSheet");
        if (_as) {
          var _steps = _as.querySelectorAll(".auth-sheet-step");
          _steps.forEach(function (s) {
            s.classList.remove("active");
          });
          var _loginStep = document.getElementById("authSheetLogin");
          if (_loginStep) _loginStep.classList.add("active");
        }
        if (_ao) _ao.classList.add("open");
        if (_as) {
          _as.classList.add("open");
          document.body.style.overflow = "hidden";
        }
      }
      return;
    }

    _doSpin();
  }

  // После успешной авторизации — крутим кейс
  window.addEventListener("market:authSuccess", function () {
    if (_pendingAuthSpin) {
      _pendingAuthSpin = false;
      _doSpin();
    }
  });

  function _doSpin() {
    if (spinning) return;

    var data = CASES_DATA[currentCaseId];
    if (!data) {
      return;
    }

    spinning = true;

    var openBtn = el("cdOpenBtn");
    var reelTrack = el("cdReelTrack");
    var reelWrap = el("cdReelWrapper");

    if (openBtn) openBtn.disabled = true;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");

    if (promoForceItem) {
      winItem = promoForceItem;
      promoForceItem = null;
    } else {
      winItem = weightedRandom(data.items);
    }
    var track = fillTrack(data.items, TRACK_TOTAL, WINNER_IDX, winItem);

    if (reelTrack) {
      var reelHtml = "";
      for (var i = 0; i < track.length; i++) {
        reelHtml += reelItemHTML(track[i]);
      }
      reelTrack.innerHTML = reelHtml;
      reelTrack.style.transition = "none";
      reelTrack.style.transform = "translateX(0)";
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var wrapWidth = reelWrap ? reelWrap.offsetWidth : 320;
        var targetX =
          -(WINNER_IDX * ITEM_STEP) + wrapWidth / 2 - ITEM_WIDTH / 2;

        if (reelTrack) {
          reelTrack.style.transition =
            "transform 4s cubic-bezier(0.08, 0.82, 0.17, 1)";
          reelTrack.style.transform = "translateX(" + targetX + "px)";
        }

        if (_spinTimerId) {
          clearTimeout(_spinTimerId);
        }
        _spinTimerId = setTimeout(function () {
          _spinTimerId = null;
          spinning = false;
          // Если юзер ушёл с экрана - не показываем попап поверх другого view
          var _cur =
            window.MarketApp &&
            window.MarketApp.getCurrentView &&
            window.MarketApp.getCurrentView();
          if (_cur && _cur !== "case-detail") return;
          if (tg && tg.HapticFeedback)
            tg.HapticFeedback.notificationOccurred("success");
          // Уведомляем бекенд о крутке кейса
          try {
            var _caseNotifyUrl =
              window.MarketAPI && window.MarketAPI.url
                ? window.MarketAPI.url("/market/case-open")
                : "/market/case-open";
            var _cnBotId =
              window.MarketAPI && window.MarketAPI.getValidBotId
                ? window.MarketAPI.getValidBotId()
                : "";
            var _cnBotUser =
              window.MarketAPI && window.MarketAPI.getBotUsername
                ? window.MarketAPI.getBotUsername()
                : "";
            fetch(_caseNotifyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                initData:
                  window.WebAppRuntime?.getInitData() ||
                  (tg ? tg.initData : ""),
                bot_id: _cnBotId,
                bot_username: _cnBotUser,
                case_name: data.name || "",
                item_name: winItem ? winItem.name : "",
              }),
            }).catch(function () {});
          } catch (_ce) {}
          showWinPopup(winItem);
        }, 4200);
      });
    });
  }

  /* ── Win popup ──────────────────────────────────────────────────── */
  function showWinPopup(item) {
    var overlay = el("cdWinOverlay");
    var imgEl = el("cdWinImg");
    var emoji = el("cdWinEmoji");
    var name = el("cdWinName");
    var val = el("cdWinValue");
    var glowEl = el("cdWinGlow");

    // Dynamic glow color matching the item rarity color
    if (glowEl && item.color) {
      glowEl.style.background =
        "radial-gradient(ellipse, " + item.color + "55 0%, transparent 65%)";
    }

    // Dynamic border glow on popup matching item color
    var popupEl = overlay ? overlay.querySelector(".cd-win-popup") : null;
    if (popupEl && item.color) {
      popupEl.style.borderColor = item.color + "44";
      popupEl.style.boxShadow =
        "0 0 40px " + item.color + "22, 0 8px 32px rgba(0,0,0,0.5)";
    }

    // Check if this is a promo gift (img is a link, not an image)
    var isPromoGift = item.id === "promo_gift";
    // Check if img is a real image URL (not an NFT/fragment link)
    var isImageUrl =
      item.img && /\.(webp|jpg|jpeg|png|gif|svg)(\?.*)?$/i.test(item.img);

    if (imgEl) {
      if (isImageUrl) {
        imgEl.src = item.img;
        imgEl.style.display = "block";
        if (emoji) emoji.style.display = "none";
      } else {
        imgEl.style.display = "none";
        if (emoji) emoji.style.display = "block";
      }
    }
    if (!imgEl && emoji) {
      emoji.style.display = "block";
    }
    if (name) name.textContent = item.name;
    if (val) {
      if (item.id === "secret_gift") {
        val.style.display = "none";
      } else {
        val.innerHTML =
          (item.ton ? "💎 " + item.ton + " TON / " : "") +
          '<span class="cd-price-star">★</span> ' +
          item.value.toLocaleString("ru");
      }
    }

    if (overlay) {
      overlay.style.display = "flex";
      requestAnimationFrame(function () {
        overlay.classList.add("open");
      });
    }
  }

  function closeWinPopup() {
    var overlay = el("cdWinOverlay");
    if (overlay) {
      overlay.classList.remove("open");
      setTimeout(function () {
        overlay.style.display = "none";
      }, 300);
    }
  }

  function resetForReplay() {
    closeWinPopup();
    if (currentCaseId) {
      setTimeout(function () {
        renderCase(currentCaseId);
      }, 350);
    }
  }

  /* ── Promo code ─────────────────────────────────────────────────── */
  function getUsedPromos() {
    try {
      var uid =
        tg && tg.initDataUnsafe && tg.initDataUnsafe.user
          ? tg.initDataUnsafe.user.id
          : "anon";
      var raw = localStorage.getItem("usedPromos_" + uid);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function markPromoUsed(code) {
    try {
      var uid =
        tg && tg.initDataUnsafe && tg.initDataUnsafe.user
          ? tg.initDataUnsafe.user.id
          : "anon";
      var used = getUsedPromos();
      used.push(code.toLowerCase());
      localStorage.setItem("usedPromos_" + uid, JSON.stringify(used));
    } catch (e) {}
  }

  function handlePromo() {
    var input = el("cdPromoInput");
    var errEl = el("cdPromoError");
    var errText = el("cdPromoErrorText");
    var applyBtn = el("cdPromoApplyBtn");
    if (!input) return;

    var code = input.value.trim().toUpperCase();

    if (!code) {
      input.classList.add("error");
      if (errEl) {
        errEl.style.display = "flex";
        errEl.classList.remove("cd-promo-success");
      }
      if (errText) errText.textContent = "Введите промокод";
      if (tg && tg.HapticFeedback)
        tg.HapticFeedback.notificationOccurred("error");
      return;
    }

    // Disable while "checking"
    if (applyBtn) applyBtn.disabled = true;
    input.disabled = true;

    // Validate promo code via API
    var initData =
      window.WebAppRuntime?.getInitData() || (tg ? tg.initData : "");
    var _urlParams = new URLSearchParams(window.location.search);
    var botId =
      window.MarketAPI && window.MarketAPI.getValidBotId
        ? window.MarketAPI.getValidBotId()
        : _urlParams.get("bot_id") || "";
    var botUsername =
      window.MarketAPI && window.MarketAPI.getBotUsername
        ? window.MarketAPI.getBotUsername()
        : _urlParams.get("bot_username") || "";
    var _apiUrl =
      window.MarketAPI && window.MarketAPI.url
        ? window.MarketAPI.url("/templates/api/promo-codes/redeem")
        : "/templates/api/promo-codes/redeem";
    fetch(_apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: initData,
        code: code,
        bot_id: botId,
        bot_username: botUsername,
      }),
    })
      .then(function (resp) {
        return resp.json();
      })
      .then(function (data) {
        if (!data.success) {
          input.disabled = false;
          if (applyBtn) applyBtn.disabled = false;
          input.classList.add("error");
          if (errEl) {
            errEl.style.display = "flex";
            errEl.classList.remove("cd-promo-success");
          }
          if (errText) errText.textContent = data.error || "Неверный промокод";
          if (tg && tg.HapticFeedback)
            tg.HapticFeedback.notificationOccurred("error");
          return;
        }

        // Mark as used locally
        markPromoUsed(code);

        // Always show Secret Gift — actual gift link goes to "Мои подарки"
        promoForceItem = {
          id: "secret_gift",
          name: "Секретный приз",
          img: "/market/imgs/secret_gift.svg",
          color: "#9333ea",
          chance: 1,
          value: 0,
          ton: "",
          giftUrl: data.gift_photo_url || "",
        };

        // Success
        input.classList.remove("error");
        if (errEl) {
          errEl.style.display = "flex";
          errEl.classList.add("cd-promo-success");
        }
        if (errText) errText.textContent = "Промокод активирован!";
        if (tg && tg.HapticFeedback)
          tg.HapticFeedback.notificationOccurred("success");

        setTimeout(function () {
          input.disabled = false;
          if (applyBtn) applyBtn.disabled = false;
          if (errEl) errEl.style.display = "none";
          spinReel();
        }, 800);
      })
      .catch(function () {
        input.disabled = false;
        if (applyBtn) applyBtn.disabled = false;
        input.classList.add("error");
        if (errEl) {
          errEl.style.display = "flex";
          errEl.classList.remove("cd-promo-success");
        }
        if (errText) errText.textContent = "Ошибка подключения к серверу";
        if (tg && tg.HapticFeedback)
          tg.HapticFeedback.notificationOccurred("error");
      });
  }

  /* ── Back ───────────────────────────────────────────────────────── */
  function goBack() {
    closeWinPopup();
    if (tg && tg.BackButton && caseDetailBackHandler) {
      tg.BackButton.hide();
      tg.BackButton.offClick(caseDetailBackHandler);
      caseDetailBackHandler = null;
    }
    if (window.MarketApp && window.MarketApp.setHeaderVisible) {
      window.MarketApp.setHeaderVisible(true);
    }
    window.MarketApp.switchView(prevCaseView || "cases");
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  window.openCaseDetail = function (caseId, fromView, caseUrl) {
    if (!CASES_DATA[caseId]) {
      console.warn("[CASE-DETAIL] Unknown case:", caseId);
      return;
    }
    prevCaseView =
      fromView ||
      (window.MarketApp.getCurrentView && window.MarketApp.getCurrentView()) ||
      "cases";
    currentCaseId = caseId;
    currentCaseUrl = caseUrl || null;
    if (window.MarketApp && window.MarketApp.setHeaderVisible)
      window.MarketApp.setHeaderVisible(false);
    window.MarketApp.switchView("case-detail");
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
  };

  /* ── Init ───────────────────────────────────────────────────────── */
  function initView() {
    if (viewInitialized) return;
    viewInitialized = true;

    var backBtn = el("cdBackBtn");
    var openBtn = el("cdOpenBtn");
    var winClose = el("cdWinCloseBtn");
    var winGet = el("cdWinGetBtn");
    var promoApply = el("cdPromoApplyBtn");
    var promoInput = el("cdPromoInput");

    if (backBtn) backBtn.addEventListener("click", goBack);
    if (openBtn) openBtn.addEventListener("click", spinReel);
    if (winClose) winClose.addEventListener("click", resetForReplay);
    if (winGet)
      winGet.addEventListener("click", function () {
        // Always go to Мои подарки section
        closeWinPopup();
        if (window.MarketApp && window.MarketApp.setHeaderVisible) {
          window.MarketApp.setHeaderVisible(true);
        }
        if (tg && tg.BackButton) tg.BackButton.hide();
        if (window.MarketApp && window.MarketApp.switchView) {
          window.MarketApp.switchView("my-gifts");
        }
      });

    // Promo code handler
    if (promoApply) promoApply.addEventListener("click", handlePromo);
    if (promoInput) {
      promoInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") handlePromo();
      });
      promoInput.addEventListener("input", function () {
        promoInput.classList.remove("error");
        var err = el("cdPromoError");
        if (err) err.style.display = "none";
      });
    }
  }

  var caseDetailModule = {
    onEnter: function () {
      initView();
      if (tg && tg.BackButton) {
        caseDetailBackHandler = goBack;
        tg.BackButton.show();
        tg.BackButton.onClick(caseDetailBackHandler);
      }
      renderCase(currentCaseId);
    },
    onLeave: function () {
      if (tg && tg.BackButton && caseDetailBackHandler) {
        tg.BackButton.hide();
        tg.BackButton.offClick(caseDetailBackHandler);
        caseDetailBackHandler = null;
      }
      spinning = false;
      if (_spinTimerId) {
        clearTimeout(_spinTimerId);
        _spinTimerId = null;
      }
    },
  };

  window.MarketApp.registerModule("case-detail", caseDetailModule);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initView);
  } else {
    initView();
  }
})();
