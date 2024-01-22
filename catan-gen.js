"use strict";

let DEBUG_RUNS_FILLTILES = 1;
// DEBUG_RUNS_FILLTILES = 5; // for collecting stats in debugStack.fail_xyz
// DEBUG_RUNS_FILLTILES = 5 * 100;
// DEBUG_RUNS_FILLTILES = 1 * 50; // AKA 5 * 10;
// DEBUG_RUNS_FILLTILES = 1 * 4; // not 99? fail_212 [6]=2 [11]=12 ("normal" mode, ONLY adjacent_2_12: false - all others TRUE)
// DEBUG_RUNS_FILLTILES = 1 * 16; // "instantly" (8700ms) = fail_desert_center ("normal" mode)
// DEBUG_RUNS_FILLTILES = 1 * 3; // "instantly" (340ms) = fail_desert_center [0] (Extension "" mode)
// DEBUG_RUNS_FILLTILES = 1 * 6; // "instantly" (580ms) = fail_desert_center [1] (Extension "" mode)
// DEBUG_RUNS_FILLTILES = 1 * 4; // "instantly" (380ms) = fail_desert_center [2] (Extension "" mode)
// DEBUG_RUNS_FILLTILES = 1 * 11; // "instantly" (1150ms) = fail_desert_center [3] (Extension "" mode)
// ^ confirmed via generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard(); generateBoard();
// DEBUG_RUNS_FILLTILES = 1 * 1; // "instantly" (220ms) = "brick" = 8 6 11 = fail_multiple_68_count ("normal" mode)
// DEBUG_RUNS_FILLTILES = 1 * 12; // "instantly" (2730ms) = "wheat" = 8 6 6 5 10 12 = fail_multiple_68_count (Extension "" mode)
// ^ these MULTIPLE RUNS test cases use DEBUG_RANDOM_SEED = 52; // takes longer than 42 (950ms for 5 runs)

const DEBUG_SKIP_FILLTILES_ON_LOAD = !"DEBUG_SKIP_FILLTILES_ON_LOAD"; // useful during testing of OPTIONS with RandomWithSeed

const DEBUG_INITIAL_resource_multiple_6_8 = !"DEBUG_INITIAL_resource_multiple_6_8";
// e.g. seed12 = 20 - 50 SECONDS due to resource_multiple_6_8: false
// but [1880ms 2033ms 2225ms 2368ms] etc. when set to resource_multiple_6_8: true


const DEBUG_USE_RANDOM_WITH_SEED = !"DEBUG_USE_RANDOM_WITH_SEED"; // for randomDefault; might be ignored later by random = createRandomWithSeed(lookupFastSeed())
const DEBUG_SKIP_LOOKUP_FAST = !"DEBUG_SKIP_LOOKUP_FAST"; // ^ to TEST/verify seed's resulting map, MUST skip createRandomWithSeed(lookupFastSeed()) if optionsAllUncheckedAndNormalMap()
let DEBUG_RANDOM_SEED;
// DEBUG_RANDOM_SEED = 42 * 101; // and even this is optional
// DEBUG_RANDOM_SEED = 42;
DEBUG_RANDOM_SEED = 52; // slower than 42 (5 runs 950ms) {DEBUG_RUNS = 1 @ all unchecked: [11 5 9 ... 4 8 11]}

const DEBUG_SEEDS_TRACK = !"DEBUG_SEEDS_TRACK" && DEBUG_USE_RANDOM_WITH_SEED;  // required by calcFastSeedsForNormalMap(); DEBUG_SEEDS_TRACK && debugStack.seeds.push(s),  // add to debugStack.fastSeedArrayForNormalMap -- later used by lookupFastSeed()


const mapModeDefault = !"DEBUG_MAP_MODE_DEFAULT_EXPANDED" ? "" : "normal";

const DEBUG_LOG_TILES_BEFORE_VALID = !"DEBUG_LOG_TILES_BEFORE_VALID"; // aka after EVERY call to tiles = generateTileContent();

const DEBUG_LOG_TILES_AFTER_VALID = !"DEBUG_LOG_TILES_AFTER_VALID"; // cf. DEBUG_LOG_TILES_AFTER_FILL = !doc || DEBUG_LOG_TILES_AFTER_VALID;

let REDRAW_INDEXES_NOT_CHITS = !"DEBUG_REDRAW_INDEXES_NOT_CHITS"; // for testing updateAdjacencyList()



const DEBUG_BENCH_ONLY = !"DEBUG_BENCH_ONLY", BENCH = () => {

  // bench.runs = 40_000_000;
  const result = bench([
    // randUsingGlobalSeed, randUsingMathSeed, randUsingGlobalSeed, randUsingMathSeed,
  ]);
  return result;
};



const debugStack = [];
// during TESTING/stats *only*, because it is WAY faster to "early exit" via "return false" AS SOON AS FAIL.
// debugStack.attempted_count = 0;
// debugStack.fail_resource_count = 0;
// debugStack.fail_68_count = 0;
// debugStack.attempted_212_count = 0;
// debugStack.fail_212_count = 0;
// debugStack.fail_regNum_count = 0;
// debugStack.fail_desert_center_count = 0;
// debugStack.fail_multiple_68_count = 0;
// ^ during TESTING/stats *only*, because it is WAY faster to "early exit" via "return false" AS SOON AS FAIL.
if(DEBUG_SEEDS_TRACK) {
  debugStack.seeds = [];
  debugStack.firstSeed = null; // later will compare strictly: if(debugStack.firstSeed === null) {
  debugStack.fastSeedArrayForNormalMap = [];
};



let doc = globalThis.document;
let DEBUG_LOG_TILES_AFTER_FILL;
DEBUG_LOG_TILES_AFTER_FILL = !doc || DEBUG_LOG_TILES_AFTER_VALID;

let DEBUG_FORCE_CUSTOM_DOC = !"DEBUG_FORCE_CUSTOM_DOC";

// let DEBUG_SHUFFLE_RUNS = !"DEBUG_LOOP_THROUGH_ALL_SHUFFLE_RUNS" && ( 500_000 * 0 );  // disable our easy comparison via hard-coded loop of <DEBUG_SHUFFLE_RUNS> e.g. 500_000

const CONFIG = {
  // I prefer ALL of the original checkboxes to each be NOT selected on load
  adjacent_6_8: false,
  adjacent_2_12: false,
  adjacent_same_numbers: false,
  adjacent_same_resource: false,

  // new "house rules" settings:
  desert_in_center: false,
  resource_multiple_6_8: DEBUG_INITIAL_resource_multiple_6_8, // *warning: unchecking "Resource Can Have <span id="multi_1">2+</span> of 6/8" is SLOW
};

// .log = (t0, t1, fnRan, runs, args, storedStats) => {...} other optional .props: [runs=1000, now=()=>performance.now(), log = void fn(t0, t1, fnRan, args, storedStats) ]
const bench=(a,...b)=>{let c,d,e,f=bench,g=[],h=f.log||((a,b,c,d,e,f)=>{let g=`${(b-a).toFixed(3)} ms\truns = ${d}\t${c.name||c+""}`,h=!e.length;console.info(f[f.push(g)-1],h?"":"\t[...args] =",h?"":e)}),i=f.now??((a,b)=>(a="performance",b=globalThis[a],(b??require("perf_hooks")[a]).now.bind(b)))(),j=f.runs||1e3;return a.forEach(a=>{if("function"!=typeof a)throw TypeError("Every element of 1st argument `fnArray` must be a function:\t"+a);for(d=i(),c=0;c<j;c++)a(...b);e=i(),h(d,e,a,j,b,g)}),g};

// Calculate the offsets of each hex, then update 'globalOffsetsLeftTop'.
const updateOffsetsLeftTopCSS = () => {

  const size = globalMapMode === "normal" ? normalSize : expandedSize;

  const small_side = (size * 0.866);
  const long_side = size;
  const tiles_css_left_top = [];

  const board_config = () => {
    const board = {};

    switch (globalMapMode) {
      case "normal":
        board.tiles_per_row = [3, 4, 5, 4, 3];
        board.row_step = .73 * long_side; //was .76
        board.center_row = Math.floor(board.tiles_per_row.length / 2);
        board.cell_step = .99 * small_side;
        break;
      case "seafarers":
        break;
      case "expanded": case "":
        board.tiles_per_row = [1, 2, 3, 4, 3, 4, 3, 4, 3, 2, 1];
        board.center_row = Math.floor(board.tiles_per_row.length / 2);
        board.cell_step = 1.51 * long_side * .99;
        board.row_step = small_side / 1.99;
        break;
    };
    return board;
  };

  const board = board_config();

  const build_tile_row = (row, board) => {
    //row_level is row adjusted for the origin of the board
    const row_level = row - Number(board.center_row);
    const y_coordinate = 50 + (row_level * board.row_step);

    //cell adjustments
    const x_is_even_shift = (row % 2) * board.cell_step / 2;
    const x_first_cell_shift = Math.floor(board.tiles_per_row[row] / 2) * (board.cell_step);

    //places cells into a row from left to right
    for (let cell = 0; cell < board.tiles_per_row[row]; cell++) {
      const x_coordinate = 50 - x_first_cell_shift + x_is_even_shift + (cell * board.cell_step);
      tiles_css_left_top.push(`left:${x_coordinate}%;top:${y_coordinate}%`);
    };
  };

  for (let row = 0; row < board.tiles_per_row.length; row++) {
    build_tile_row(row, board);
  };

  globalOffsetsLeftTop = tiles_css_left_top;
};

const normalSize = 17.5; //set to 18 when my images come out
const expandedSize = 16;

// all dice numbers other than 2, 12, and 7 -- used by "adjacent_same_numbers" check
const globalRegularNumbers = [3, 4, 5, 9, 10, 11];

// array of probability dots corresponding to dice numbers [2 thru 12, other than 7].
const probability = ["", "", ".", "..", "...", "....", ".....", "", ".....", "....", "...", "..", "."];

const globalResourceTypes = ["sheep", "wheat", "wood", "brick", "ore", "desert"];

const getDocument = (forceCustomDoc, fnAfterCustom, _doc) => {
  if ( _doc = !forceCustomDoc && doc ) return _doc; // `doc` presumed to be already set via doc = globalThis.document;

  class El {
    id;
    value = "";
    checked = false;
    innerHTML = "";
    attributes = {};
    classes = new Set();
    // style = { setProperty(name, value) { console.log(style.setPropery, { name: value }) } };
    constructor( id = "", _props = {} ) { Object.assign(this, _props, { id }) };
    get id() { return this.id; };
    set id(value) { this._id = value; };
    get value() { return this.value; };
    set value(newValue) { this._value = newValue; };
    get checked() { return this.checked; };
    set checked(newValue) { this._checked = !!newValue; };
    get innerHTML() { return this.innerHTML; };
    set innerHTML(html) { this._innerHTML = html; };
    setAttribute(name, value) { this.attributes[name] = value; };
    getAttribute(name) { return this.attributes[name]; };
    get classList() {
      return {
        add: (className) => { this.classes.add(className); },
        remove: (className) => { this.classes.delete(className); },
        contains: (className) => { return this.classes.has(className); },
        // toggle: (className) => { this.classes[this.classes.has(className) ? "delete" : "add"](className); },
        [Symbol.iterator]: () => { return this.classes.values(); }
      };
    };
  };

  const all = (id, _props) => id == null ? {...all} : all[id] ?? ( all[id] = new El(id, _props) );

  _doc = {
    getElementById: (...args) => all(...args),
    all,
    documentElement: all(Symbol(), { innerHTML: "◆" }),
  };

  if(fnAfterCustom)fnAfterCustom(_doc);

  return _doc;
};

// doc = getDocument( DEBUG_FORCE_CUSTOM_DOC, (_doc) => _doc.all("selected-map", {value: "normal"}) );
doc = getDocument( DEBUG_FORCE_CUSTOM_DOC );



// all these will be updated whenever updateMapMode( mode: "normal" | "" ) is called...
let globalMapMode = "?";
let globalAdjacencyAll = {}; // used to check the Resource adjacencies
let globalAdjacencyHigherIndexOnly = {}; // used to check adjacent tiles for same numbers (6/8, or 2/12, or all other "regular" numbers)
let globalOffsetsLeftTop = [];
let NUM_ARRAY = [];
let RESOURCE_ARRAY = [];
let globalNumArray = [];
let globalResourceArray = [];
let globalDuration = 0;

let fastSeedArray; // populated once inside updateMapMode(mode = "normal")
let fastSeedPrev;
let lookupFastSeed = () => {
  // console.time("lookupFastSeed");
  let fastSeedNext = fastSeedPrev, L = fastSeedArray.length;
  while(L > 1 && fastSeedNext === fastSeedPrev) {
    // "calc | 0" faster than "Math.floor(calc)": bitwise math, no OBJECT.KEY lookup
    fastSeedNext = fastSeedArray[MathRandom() * L | 0];
  };
  // console.timeEnd("lookupFastSeed"); // lookupFastSeed: 0.005859375 ms
  return fastSeedPrev = fastSeedNext;
};
/*
// \/ Usage example: calcFastSeedsForNormalMap(5001, 10_000, 500); // TODO: future? Since maps rn = 1281 (previously 699) (seed 1..5000)
const calcFastSeedsForNormalMap = (seedMin, seedMax, durationMaxMs) => {
  if(DEBUG_SEEDS_TRACK && durationMaxMs) {
    debugStack.fastSeedArrayForNormalMap = [];
    for(let seed = seedMin; seed <= seedMax; seed ++) {
      console.info("calcFastSeedsForNormalMap:", seed, "of", seedMax);
      fillTiles(seed, durationMaxMs);
    };
    console.info( "debugStack.fastSeedArrayForNormalMap:", JSON.stringify( debugStack.fastSeedArrayForNormalMap, 0, "  " ) );
  };
};
// let arrayOfFastSeedObjects = [  // AKA debugStack.fastSeedArrayForNormalMap
//   {
//     "69": 269.7000002861023
//   },
//   {
//     "71": 186.5
//   },
//   {
//     "70": 486.5
//   }
// ];
let arrayOfFastSeedObjects = debugStack.fastSeedArrayForNormalMap;

// let fastSeedsO = {69: 1, 70: 1, 71: 1};
let fastSeedsO = arrayOfFastSeedObjects
.reduce( (acc, obj) => {
  const key = +Object.keys(obj)[0];
  acc[key] = 1; // acc[key] = obj[key];
  return acc;
}, {} );
// let fastSeedArrayNEW = [69, 70, 71];
let fastSeedArrayNEW = Object.keys(fastSeedsO)
.reduce( (acc, obj) => {
  acc.push( +obj );
  return acc;
}, [] );
console.info( "fastSeedArrayNEW:", fastSeedArrayNEW );
*/

// My new combined function to update globalMapMode and a few other global values J Bunge's code was using.
// e.g. the adjacency list is retrieved, and the offsets are retrieved.
const updateMapMode = mode => { // ONLY if mode is DIFFERENT than globalMapMode will we ACTUALLY update globalMapMode + globalAdjacencyHigherIndexOnly + globalAdjacencyAll etc.
  if(globalMapMode === mode)return;

  globalMapMode = mode === "normal" ? mode : ""; // only "normal" or "" (for now no seafarers etc.)

  // confirm that the EXTENDED map only has "higher" indexes, therefore NORMAL map should do same
  updateAdjacencyList();

  // This matches each tile to its corresponding offset depending on the mode.
  // Updates globalOffsetsLeftTop which is used by the drawTiles() function.
  updateOffsetsLeftTopCSS();

  // Selects appropriate number and resource arrays depending on the board's globalMapMode.
  NUM_ARRAY = (
    globalMapMode === "normal"
    ? [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]
    : [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12]
  );
  RESOURCE_ARRAY = (
    globalMapMode === "normal"
    ? ["ore", "ore", "ore", "brick", "brick", "brick", "sheep", "sheep", "sheep", "sheep", "wood", "wood", "wood", "wood", "wheat", "wheat", "wheat", "wheat"]
    : ["ore", "ore", "ore", "ore", "ore", "brick", "brick", "brick", "brick", "brick", "sheep", "sheep", "sheep", "sheep", "sheep", "sheep", "wood", "wood", "wood", "wood", "wood", "wood", "wheat", "wheat", "wheat", "wheat", "wheat", "wheat"]
  );

  const htmlTooMany68 = `${globalMapMode === "normal" ? 2 : 3}+`; // AKA normal = "2+" otherwise "3+"
  doc.getElementById("multi_1").innerHTML = htmlTooMany68;
  doc.getElementById("multi_2").innerHTML = htmlTooMany68;

  // previously updateSettingVisibilityForSameResourceCanTouch(globalMapMode);
  const sameResourceClasses = doc.getElementById("sameResourceSetting").classList;
  if (globalMapMode === "normal") {
    // console.time("populate fastSeedArray");
    if (!fastSeedArray) {

      // fastSeedArray = [
      //   2,3,4,16,20,23,29,33,34,35,39,42,48,49,52,55,64,65,69,71,73,77,99,105,106,111,114,116,117,121,123,129,130,133,134,141,143,145,148,154,155,157,161,167,174,177,181,182,183,184,186,188,201,204,214,218,219,222,224,227,232,247,252,257,259,262,263,264,265,278,282,283,285,288,293,299,303,306,311,313,317,322,324,349,354,358,361,367,371,372,378,387,389,393,394,401,402,403,407,417,418,419,423,433,437,439,441,457,467,471,472,475,484,493,496,501,503,509,516,519,522,527,531,537,540,543,545,546,547,555,556,560,564,570,574,575,584,586,589,592,594,595,596,599,600,602,604,609,610,619,622,624,625,628,633,638,642,646,650,653,654,659,662,664,665,666,668,672,679,680,681,688,690,695,698,699,704,708,709,713,716,718,726,727,730,732,736,737,738,739,745,747,748,750,751,756,765,776,778,779,785,786,798,800,801,804,806,807,812,815,816,818,825,826,828,830,834,838,849,851,855,864,867,868,872,875,879,886,889,890,893,897,898,902,903,904,906,907,908,909,913,914,921,923,928,929,933,943,946,950,953,963,981,985,997,1006,1010,1024,1027,1030,1033,1035,1036,1038,1040,1046,1050,1053,1056,1057,1064,1066,1069,1070,1072,1073,1089,1090,1094,1099,1100,1104,1109,1111,1129,1134,1135,1137,1138,1139,1151,1156,1157,1161,1164,1168,1169,1175,1178,1179,1180,1182,1185,1190,1199,1203,1204,1209,1210,1215,1219,1222,1225,1227,1228,1230,1240,1243,1246,1247,1250,1251,1256,1261,1263,1264,1268,1274,1280,1285,1287,1288,1290,1295,1297,1298,1300,1302,1304,1306,1308,1318,1322,1328,1332,1333,1339,1342,1343,1350,1354,1356,1358,1364,1368,1370,1378,1379,1381,1384,1389,1391,1394,1395,1402,1403,1404,1405,1409,1411,1414,1418,1420,1421,1424,1425,1433,1440,1443,1449,1452,1453,1456,1462,1467,1470,1473,1484,1497,1499,1500,1508,1509,1510,1512,1520,1523,1541,1545,1546,1547,1553,1561,1562,1565,1569,1575,1582,1587,1591,1597,1601,1611,1614,1616,1623,1626,1631,1638,1639,1644,1648,1663,1668,1670,1671,1672,1676,1683,1684,1694,1704,1706,1708,1713,1719,1729,1730,1733,1734,1735,1737,1738,1749,1751,1752,1757,1763,1764,1765,1771,1779,1784,1788,1794,1810,1811,1813,1820,1825,1831,1843,1855,1856,1861,1864,1876,1878,1889,1891,1895,1898,1901,1903,1905,1907,1908,1909,1918,1919,1921,1924,1933,1937,1940,1948,1949,1954,1957,1958,1972,1974,1981,1983,1987,1992,1994,1997,1999,2001,2007,2017,2019,2027,2031,2032,2041,2046,2047,2049,2060,2071,2072,2075,2076,2079,2081,2100,2102,2105,2106,2107,2108,2113,2117,2122,2123,2127,2134,2136,2137,2149,2151,2157,2161,2172,2178,2181,2183,2184,2190,2194,2197,2198,2205,2214,2219,2224,2230,2236,2240,2241,2244,2251,2259,2262,2264,2265,2266,2268,2269,2274,2279,2283,2288,2291,2298,2301,2306,2315,2333,2335,2345,2346,2359,2363,2367,2372,2374,2381,2389,2391,2393,2402,2414,2431,2436,2437,2438,2446,2457,2458,2460,2474,2476,2477,2479,2487,2488,2491,2495,2497,2500,2501,2505,2508,2510,2516,2521,2525,2527,2536,2537,2564,2565,2566,2569,2571,2572,2576,2580,2585,2595,2598,2599,2600,2603,2607,2622,2623,2633,2634,2636,2640,2649,2657,2670,2671,2681,2693,2695,2707,2710,2712,2716,2718,2728,2731,2735,2740,2752,2763,2766,2770,2779,2781,2784,2789,2794,2795,2797,2801,2807,2815,2820,2821,2830,2852,2854,2855,2856,2857,2862,2865,2870,2872,2880,2885,2891,2897,2902,2910,2915,2918,2921,2922,2923,2943,2949,2951,2953,2958,2964,2965,2970,2972,2977,2979,2982,
      //   3001,3002,3003,3004,3005,3013,3016,3024,3025,3026,3031,3034,3039,3040,3053,3055,3057,3064,3065,3068,3070,3077,3080,3081,3082,3084,3097,3100,3101,3106,3108,3110,3111,3113,3114,3119,3120,3123,3124,3127,3132,3133,3134,3136,3137,3144,3151,3152,3158,3163,3169,3170,3173,3179,3187,3189,3191,3193,3197,3198,3210,3214,3222,3227,3232,3234,3238,3240,3244,3254,3268,3274,3277,3280,3282,3287,3289,3291,3292,3293,3297,3305,3306,3309,3316,3317,3321,3332,3336,3340,3343,3350,3352,3353,3354,3356,3359,3364,3368,3372,3375,3376,3377,3388,3393,3397,3403,3405,3408,3409,3410,3411,3412,3414,3415,3416,3417,3418,3421,3422,3424,3434,3438,3440,3441,3448,3450,3451,3453,3457,3461,3462,3463,3464,3469,3473,3475,3478,3483,3485,3488,3493,3499,3505,3507,3510,3518,3519,3521,3522,3523,3543,3545,3550,3551,3554,3564,3575,3576,3582,3586,3589,3595,3604,3607,3611,3615,3616,3617,3619,3620,3621,3626,3630,3632,3642,3644,3648,3651,3654,3660,3661,3663,3664,3675,3678,3685,3687,3690,3691,3693,3694,3697,3700,3706,3708,3710,3714,3723,3725,3728,3731,3734,3735,3749,3756,3759,3763,3771,3775,3777,3784,3786,3796,3798,3799,3802,3806,3812,3816,3817,3823,3825,3826,3827,3830,3835,3836,3839,3847,3849,3852,3853,3859,3861,3862,3863,3867,3871,3881,3884,3885,3886,3887,3888,3889,3891,3892,3893,3898,3899,3901,3902,3909,3913,3917,3920,3923,3924,3927,3928,3931,3936,3938,3943,3949,3951,3953,3956,3958,3962,3969,3971,3975,3977,3978,3979,3982,3986,3988,3989,3994,3995,3996,3998,4001,4005,4006,4010,4012,4013,4016,4018,4019,4021,4028,4031,4033,4038,4039,4042,4043,4047,4049,4050,4054,4060,4072,4077,4084,4091,4093,4100,4101,4115,4116,4122,4124,4129,4133,4139,4142,4147,4148,4153,4156,4162,4164,4169,4171,4172,4173,4175,4176,4179,4181,4189,4197,4202,4204,4210,4212,4214,4221,4223,4226,4238,4240,4242,4244,4246,4247,4248,4249,4250,4252,4262,4264,4270,4274,4280,4281,4282,4283,4285,4287,4288,4290,4292,4293,4298,4301,4319,4326,4329,4337,4350,4352,4357,4360,4363,4366,4370,4373,4374,4376,4378,4386,4390,4391,4397,4405,4407,4415,4416,4417,4424,4425,4427,4429,4431,4436,4437,4440,4442,4452,4459,4471,4472,4473,4479,4489,4491,4492,4494,4497,4500,4504,4508,4510,4517,4521,4523,4524,4526,4529,4533,4534,4535,4538,4542,4544,4546,4552,4555,4556,4563,4566,4567,4572,4584,4587,4588,4591,4593,4596,4600,4601,4607,4608,4611,4617,4625,4626,4627,4631,4634,4637,4641,4642,4644,4650,4651,4652,4654,4656,4657,4659,4666,4668,4670,4671,4673,4675,4682,4687,4689,4690,4692,4704,4705,4707,4708,4715,4716,4717,4718,4719,4721,4722,4723,4728,4730,4731,4732,4733,4734,4741,4742,4758,4759,4765,4771,4773,4774,4779,4788,4791,4799,4800,4810,4816,4817,4818,4819,4821,4822,4830,4831,4833,4841,4845,4847,4849,4850,4853,4854,4859,4860,4863,4864,4879,4880,4881,4882,4884,4885,4886,4890,4895,4897,4899,4900,4902,4904,4906,4909,4910,4913,4916,4920,4921,4925,4926,4935,4939,4943,4944,4948,4949,4950,4954,4955,4956,4957,4958,4963,4964,4965,4966,4968,4970,4971,4973,4974,4976,4979,4981,4984,4987,4989,4992
      // ]; // .length = 1281 (previously 699)

      // fastSeedArray = [
      //   2,4,20,23,39,42,49,65,106,114,116,129,130,141,145,155,183,186,201,214,227,247,252,265,285,288,303,324,361,378,389,407,418,423,439,472,484,516,543,545,547,570,595,596,610,642,646,650,654,662,664,665,680,690,708,713,738,756,806,849,851,855,864,868,875,903,908,914,923,929,946,985,997,1056,1073,1099,1129,1139,1169,1180,1182,1190,1204,1219,1230,1251,1256,1287,1290,1295,1297,1308,1332,1333,1342,1358,1364,1378,1379,1405,1411,1433,1440,1456,1500,1510,1523,1541,1546,1553,1561,1562,1565,1575,1597,1601,1611,1614,1623,1626,1631,1639,1704,1706,1708,1713,1719,1735,1737,1794,1813,1843,1878,1895,1898,1901,1907,1909,1948,1949,1957,1983,1987,1999,2001,2019,2027,2046,2071,2102,2105,2123,2127,2134,2136,2157,2161,2178,2197,2205,2214,2219,2240,2265,2268,2288,2291,2333,2345,2346,2359,2460,2474,2491,2501,2505,2516,2536,2569,2571,2572,2595,2598,2607,2622,2623,2634,2636,2640,2649,2657,2693,2695,2712,2752,2766,2794,2801,2815,2830,2852,2854,2857,2872,2880,2891,2910,2915,2921,2922,2970,3001,3002,3003,3004,3025,3040,3080,3084,3106,3111,3120,3144,3158,3173,3179,3197,3210,3282,3297,3316,3317,3336,3375,3393,3397,3403,3409,3418,3422,3440,3448,3451,3457,3462,3478,3522,3550,3575,3576,3582,3620,3626,3648,3654,3660,3663,3685,3694,3697,3714,3731,3734,3756,3777,3786,3823,3849,3862,3863,3881,3902,3917,3924,3931,3936,3943,3986,3995,4006,4019,4028,4031,4084,4100,4116,4129,4172,4173,4189,4197,4202,4244,4247,4250,4283,4292,4301,4329,4352,4363,4370,4386,4415,4429,4497,4534,4535,4546,4555,4556,4566,4584,4596,4651,4656,4659,4666,4668,4673,4690,4715,4719,4733,4734,4742,4779,4791,4819,4830,4831,4853,4854,4879,4881,4884,4885,4886,4899,4913,4916,4935,4943,4944,4948,4957,4966,4974,4981,4989,5002,5027,5035,5051,5074,5078,5088,5103,5118,5121,5154,5165,5176,5181,5184,5222,5233,5244,5252,5304,5325,5334,5335,5340,5376,5397,5403,5409,5470,5472,5478,5487,5523,5572,5573,5575,5590,5600,5648,5668,5688,5716,5724,5787,5803,5814,5839,5862,5944,6073,6090,6125,6136,6162,6179,6188,6242,6261,6265,6282,6346,6360,6370,6418,6443,6508,6514,6586,6632,6641,6667,6682,6683,6693,6717,6729,6739,6742,6762,6768,6795,6796,6808,6849,6858,6865,6870,6890,6899,6962,6978,6995,7000,7002,7007,7010,7050,7052
      // ]; // .length === 448 // via fastSeedArray = getTinyTimings(100) #NotBad

      fastSeedArray = [
        2,4,106,114,116,141,145,155,186,201,214,227,247,252,265,288,324,361,378,389,516,543,545,547,596,642,646,650,662,664,690,708,713,738,855,868,875,903,908,923,929,985,997,1129,1169,1182,1190,1204,1230,1251,1256,1308,1332,1333,1358,1364,1411,1433,1440,1456,1510,1523,1541,1546,1553,1562,1565,1575,1597,1611,1614,1623,1626,1631,1639,1704,1706,1713,1719,1737,1794,1813,1878,1895,1898,1909,1948,1949,1983,1987,2001,2019,2027,2046,2102,2127,2134,2157,2205,2214,2219,2240,2268,2291,2345,2359,2501,2572,2598,2607,2623,2636,2649,2657,2695,2712,2766,2794,2801,2815,2830,2854,2857,2872,2880,2891,2910,2915,2921,3002,3004,3025,3080,3084,3106,3111,3144,3173,3197,3210,3282,3297,3316,3336,3375,3393,3397,3418,3422,3440,3448,3522,3550,3575,3576,3626,3648,3654,3663,3685,3694,3714,3731,3734,3756,3777,3786,3823,3862,3863,3917,3924,3936,3986,3995,4019,4028,4031,4084,4100,4173,4189,4197,4247,4283,4301,4329,4352,4363,4370,4386,4415,4555,4556,4566,4584,4596,4659,4666,4690,4715,4733,4779,4830,4831,4879,4885,4886,4913,4916,4935,4943,4957,4974,4981,4989,5002,5035,5051,5074,5078,5118,5165,5176,5181,5222,5233,5244,5252,5325,5335,5340,5376,5403,5409,5470,5472,5478,5487,5523,5572,5600,5648,5724,5787,5803,5814,5839,5862,6073,6090,6125,6136,6188,6242,6265,6282,6346,6360,6418,6443,6508,6632,6641,6667,6682,6683,6742,6762,6796,6808,6849,6870,6899,6978,6995,7000,7002,7007,7010,7052,7099,7220,7241,7246,7263,7308,7311,7315,7339,7348,7352,7377,7404,7414,7427,7441,7499,7515,7623,7690,7702,7717,7718,7731,7750,7761,7769,7774,7782,7807,7809,7813,7866,7906,7915,7916,7939,7945,7947,8003,8004,8015,8021,8065,8133,8167,8242,8265,8268,8340,8373,8387,8407,8454,8464,8598,8630,8661,8684,8688,8717,8722,8748,8786,8800,8823,8847,8855,8863,8906,8911,8947,8959,8966,8970,8975,8999,9004,9044,9108,9153,9175,9214,9263,9273,9274,9275,9281,9308,9319,9326,9353,9400,9407,9414,9541,9585,9589,9594,9595,9625,9626,9656,9664,9679,9706,9708,9752,9760,9827,9889,9922,10037,10092,10148,10218,10234,10260,10280,10285,10311,10320,10357,10376,10378,10427,10438,10464,10491,10494,10549,10569,10580,10677,10689,10814,10876,10913,10924,10937,11016,11042,11190,11221,11251,11263,11272,11375,11405,11410,11413,11458,11474,11533,11534,11595,11605,11659,11662,11670,11678,11689,11696,11707,11708,11747,11748,11752,11775,11813,11842,11877,11908,11938,11944,11956,12001,12028,12051,12082,12084,12092,12096,12099,12113,12129,12143,12175,12178,12226,12270,12284,12357,12414,12421,12513,12524,12543,12580,12590,12624,12634,12727,12731,12741,12766,12792,12801,12852,12854,12882,12926,12978,13018,13047,13050,13077,13124,13133,13137,13143,13146,13158,13191,13197,13205,13210,13239,13246,13248,13321,13329,13353,13372,13378,13394,13412,13420,13421,13438,13454,13471,13516,13525,13537,13564,13571,13603,13639,13659,13661,13666,13696,13711,13745,13757,13796,13833,13855,13919,13928,13964,13972,14001,14051,14063,14080,14084,14092,14095,14100,14166,14232,14235,14323,14346,14357,14446,14449,14501,14517,14654,14663,14705,14730,14780,14845,14854,14861,14871,14924,14947,15076,15080,15107,15176,15180,15213,15238,15297,15359,15429,15458,15463,15489,15537,15551,15573,15602,15607,15618,15648,15680,15682,15689,15727,15782,15799,15812,15894,15898,15957,15998,16060,16093,16098,16126,16152,16171,16286,16288,16292,16293,16307,16354,16380,16404,16474,16476,16571,16581,16585,16616,16629,16694,16708,16732,16854,16855,16912,16923,16971,16979,17059,17061,17117,17159,17185,17191,17209,17238,17294,17383,17389,17399,17427,17459,17472,17482,17489,17530,17537,17542,17547,17553,17570,17581,17585,17596,17607,17609,17628,17634,17635,17644,17662,17714,17738,17763,17783,17832,17845,17864,17876,17885,17914,17925,17940,17991,18030,18073,18074,18086,18095,18168,18217,18220,18228,18246,18277,18286,18309,18321,18403,18468,18487,18502,18531,18582,18610,18681,18688,18707,18718,18719,18725,18736,18804,18824,18841,18843,18942,18982,19028,19031,19037,19044,19075,19089,19093,19133,19135,19167,19173,19204,19226,19262,19312,19360,19433,19438,19487,19535,19543,19551,19559,19597,19622,19652,19669,19691,19809,19826,19833,19853,19914,19940,19944
      ]; // .length === 749 // via getTinyTimings(60) #RatherGood

    };
    // console.timeEnd("populate fastSeedArray"); // populate fastSeedArray: 0.005126953125 ms
    sameResourceClasses.remove("settingViewToggle");
    // return true; // AKA visible, because NO LONGER `visibility: hidden;`
  } else {
    sameResourceClasses.add("settingViewToggle");
    // return false; // AKA invisible, because it now will have `visibility: hidden;`
  };

  const changes = [globalMapMode, globalAdjacencyHigherIndexOnly, globalAdjacencyAll, globalOffsetsLeftTop, globalNumArray, globalResourceArray];
  return changes; // only care about seeing/troubleshooting these new values if they changed
};

const updateAdjacencyList = () => {

  // start => RIGHT, then clockwise ALL THE WAY AROUND
  const allClockwiseStartingToTheRight = globalMapMode === "normal"

  ? [ 
    [1, 4, 3],                // 0
    [2, 5, 4, 0],             // 1
    [6, 5, 1],                // 2
    [4, 8, 7, 0],             // 3
    [5, 9, 8, 3, 0, 1],       // 4
    [6, 10, 9, 4, 1, 2],      // 5
    [11, 10, 5, 2],           // 6
    [8, 12, 3],               // 7
    [9, 13, 12, 7, 3, 4],     // 8
    [10, 14, 13, 8, 4, 5],    // 9
    [11, 15, 14, 9, 5, 6],    // 10
    [15, 10, 6],              // 11
    [13, 16, 7, 8],           // 12
    [14, 17, 16, 12, 8, 9],   // 13
    [15, 18, 17, 13, 9, 10],  // 14
    [18, 14, 10, 11],         // 15
    [17, 12, 13],             // 16
    [18, 16, 13, 14],         // 17
    [17, 14, 15]              // 18
  ]

  : [
    [2, 4, 1],                // 0
    [4, 7, 3],                // 1
    [5, 8, 4, 0],             // 2
    [7, 10, 6, 1],            // 3
    [8, 11, 7, 1, 0, 2],      // 4
    [9, 12, 8, 2],            // 5
    [10, 13, 3],              // 6
    [11, 14, 10, 3, 1, 4],    // 7
    [12, 15, 11, 4, 2, 5],    // 8
    [16, 12, 5],              // 9
    [14, 17, 13, 6, 3, 7],    // 10
    [15, 18, 14, 7, 4, 8],    // 11
    [16, 19, 15, 8, 5, 9],    // 12
    [17, 20, 6, 10],          // 13
    [18, 21, 17, 10, 7, 11],  // 14
    [19, 22, 18, 11, 8, 12],  // 15
    [23, 19, 12, 9],          // 16
    [21, 24, 20, 13, 10, 14], // 17
    [22, 25, 21, 14, 11, 15], // 18
    [23, 26, 22, 15, 12, 16], // 19
    [24, 13, 17],             // 20
    [25, 27, 24, 17, 14, 18], // 21
    [26, 28, 25, 18, 15, 19], // 22
    [26, 19, 16],             // 23
    [27, 20, 17, 21],         // 24
    [28, 29, 27, 21, 18, 22], // 25
    [28, 22, 19, 23],         // 26
    [29, 24, 21, 25],         // 27
    [29, 25, 22, 26],         // 28
    [27, 25, 28]              // 29
  ];

  // globalAdjacencyAll: used to check the Resource adjacencies
  globalAdjacencyAll = allClockwiseStartingToTheRight.map(
    nearbyList => nearbyList.sort((a, b) => a - b)
  );

  // globalAdjacencyHigherIndexOnly: used to check adjacent tiles for same numbers (e.g. 6/8, 2/12, all others when counting to verify under limit)
  globalAdjacencyHigherIndexOnly = globalAdjacencyAll.map(
    (nearbyList, index) => nearbyList.filter(nearby => nearby > index)
  );

};

// debugger;
updateMapMode(
  // modeElement?.type && modeElement.value ||
  mapModeDefault
);



// >>> IN CONCLUSION, if PERFECTION re. periodization is most important use 2ndCombo (4294967296) else 1st (233280)
let createRandomWithSeed_FASTER_REPEATS_EARLY=seed=>{
  // console.log("SEED:", seed); debugger;
  seed=Math.abs(isNaN(seed)?Date.now():seed);
  return _=>(
    DEBUG_SEEDS_TRACK && debugStack.seeds.push(seed),  // add to debugStack.fastSeedArrayForNormalMap -- later used by lookupFastSeed()
    seed=(9301*seed+49297)%233280,
    seed/233280
  )
};
// let createRandomWithSeed_SLOWER_REPEATS_LATER=s=>(s=Math.abs(isNaN(s)?Date.now():s),_=>(s=(1664525*s+1013904223)%4294967296,s/4294967296));
const createRandomWithSeed = createRandomWithSeed_FASTER_REPEATS_EARLY;
// let rnd = createRandomWithSeed(SEED); // then use rnd() instead of Math.random()

const MathRandom = Math.random;
// CONFIRMED: one-time pre-cached "Math.random" alias = faster, because no OBJECT.KEY lookup each time

const randomDefault = DEBUG_USE_RANDOM_WITH_SEED ? createRandomWithSeed(DEBUG_RANDOM_SEED) : MathRandom;
let random;

// shuffleInPlace() is used to randomize both the resources and the numbers.
// Following that, it shuffles the Tiles array created in generateTileContent().
// Algorithm from here: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
const shuffleInPlace = array => {

  // let seemed slightly faster than var (or does it compile to same?)
  // let i = array.length - 1, x, temp;
  // let randomCount = 0;
  // ? while slightly faster than for() likely due to less overhead when you include (all;three;parts)
  // while(i > 0) {
  for (let i = array.length - 1; i > 0;) {
    // randomCount ++;
    // "calc | 0" faster than "Math.floor(calc)": bitwise math, no OBJECT.KEY lookup
    // x = random() * (i + 1) | 0;
    let x = random() * (i + 1) | 0;
    // console.log("???x:", x);
    // temp faster than destructuring [array[x], array[i--]] = [array[i], array[x]]
    // temp = array[i];
    let temp = array[i];
    array[i--] = array[x];
    array[x] = temp;
  };
  // console.error(randomCount, array.length); // randomCount = ( .length - 1 ) always ... so 18 17 17

  // return array;
};



let {
  adjacent_6_8,
  adjacent_2_12,
  adjacent_same_numbers,
  adjacent_same_resource,
  desert_in_center,
  resource_multiple_6_8,
} = CONFIG;

let globalSettingsAdjusted = false;

// This function is used to grab the value of the mode from the select dropdown.
// Then it triggers other changes, e.g. the adjacency list is retrieved, and the offsets are retrieved.
// The changed board is then drawn and generated (filled and validated) via start().
const selectMode = () => {
  updateMapMode(doc.getElementById("pick-mode").value); // only "normal" or "" (for now no seafarers etc.)
  start(!"skipDrawTiles", !"skipFillTiles");
};

const updateBuildButton = enabled => {
  const WAIT = "⏳"; // ⌚🕐⌛⏳
  const btn = doc.getElementById("btnBuild");
  if(btn.style) {
    btn.disabled = !enabled;
    btn.innerHTML = enabled ? "BUILD" : `<small>${WAIT}<small>`;
    if (enabled) setTimeout( () => btn.focus(), 4 );
  };
};

const enableBuildButton = () => {
  // requestAnimationFrame( (timeStamp) => updateBuildButton(!!"enabled") );
  updateBuildButton(!!"enabled");
};

const disableBuildButton = () => {
  // requestAnimationFrame( (timeStamp) => updateBuildButton(!"disabled") );
  updateBuildButton(!"disabled");
};

const toggleSetting = (setting) => { // called via HTML (checkboxes within <section id="popmenu">)

  // setting = 6_8 | 2_12 | same_number | same_resource | desert_center | multiple_6_8

  globalSettingsAdjusted = true;
  disableBuildButton();

  switch (setting) {

    case "6_8":
      adjacent_6_8 = doc.getElementById("adjacent_6_8_input").checked;
      break;

    case "2_12":
      adjacent_2_12 = doc.getElementById("adjacent_2_12_input").checked;
      break;

    case "same_number":
      adjacent_same_numbers = doc.getElementById("adjacent_same_numbers_input").checked;
      break;

    case "same_resource":
      adjacent_same_resource = doc.getElementById("adjacent_same_resource_input").checked;
      break;

    case "desert_center":
      desert_in_center = doc.getElementById('desert_in_center_input').checked;
      break;

    case "multiple_6_8":
      resource_multiple_6_8 = doc.getElementById('resource_multiple_6_8_input').checked;
      break;

  };

};



// Create and return the array of tiles { chit: 2..12/0, resource: "-name-" }
// that fillTiles uses to display the tiles to the board in HTML form.
const generateTileContent = () => {

  if(DEBUG_SEEDS_TRACK) {
    if(debugStack.firstSeed === null) {
      if(debugStack.seeds.length > 0) {
        debugStack.firstSeed = debugStack.seeds[0]; // always keep the ORIGINAL seed
      };
    };
    debugStack.seeds = []; // likely no slower than debugStack.seeds.length = 0;
  };

  shuffleInPlace(globalNumArray); // array.length = 19
  shuffleInPlace(globalResourceArray); // array.length = 18

  // Initialize the array to hold completed tiles.
  const tiles = [];

  // Creates the tiles. Fills in the number and resource of the object, pushes it to tiles array.
  for (let i = 0, L = globalNumArray.length; i < L; i++) {
    tiles.push({
      chit: globalNumArray[i],
      resource: globalResourceArray[i]
    });
  };

  // Creates the desert tile (no number), and adds it to tiles array.
  const desert = {
    chit: 0,
    resource: "desert"
  };
  tiles.push(desert);

  // Expansion mode = add another desert tile.
  if(globalMapMode !== "normal") {
    tiles.push(desert);
  };

  // Shuffles and returns the array of "filled" tile objects.
  shuffleInPlace(tiles); // array.length = 18

  return tiles;
};

// Create the HTML hexagon and chit elements for the board.
const drawTiles = () => {
  //// update the View (the initial border and PLACEHOLDER tiles)
  const mapModeSuffix = globalMapMode === "normal" ? globalMapMode : "expanded";
  let html = `<div class="${globalMapMode}BorderCommon border-${mapModeSuffix}"></div>`;

  for (let id = 0, L = globalOffsetsLeftTop.length; id < L; id ++) {
    html += `
<div class="hex-${mapModeSuffix} hex-base" style="${globalOffsetsLeftTop[id]}" id="tile-${id}")>
  <div class="circle-${mapModeSuffix} circle-base font-size-wrap" id="circle-${id}">
  </div>
</div>`;
  };

  doc.getElementById("board").innerHTML = html;
};

const redrawTiles = tiles => {
  //// update the View (the REAL tiles)
  const probStyle = ` style="top:76%; left:51%"`
  for (let [index, tile] of tiles.entries()) {
    const elTile = doc.getElementById("tile-" + index);
    const elCircle = doc.getElementById("circle-" + index);

    const chit = tile.chit;
    const resource = tile.resource;

    const prob = REDRAW_INDEXES_NOT_CHITS ? "" : probability[chit];
    const number = REDRAW_INDEXES_NOT_CHITS ? index : chit;

    elTile.classList.add(resource);

    // remove all other "resource" class names
    for (let className of elTile.classList) {
      if (className !== resource && globalResourceTypes.includes(className)) {
        elTile.classList.remove(className);
        break;
      };
    };

    elTile.setAttribute("title", resource + `${chit ? ` (${chit})` : ""}`);
    // elTile.setAttribute("title", `${chit ? `${chit} ` : ""}${resource}`);

    elTile.classList.remove("high-prob");
    if(chit === 6 || chit === 8 || REDRAW_INDEXES_NOT_CHITS) {
      elTile.classList.add("high-prob");
    };

    let html;
    elCircle.classList.remove("desert-chit");
    if (resource !== "desert" || REDRAW_INDEXES_NOT_CHITS) {
      html = `<div class="prob-dots-base small-font-size-wrap"${probStyle}>${prob}</div>`
      + `<div class="tile-chit-${globalMapMode} chit-number-base">${number}</div>`;
    } else {
      html = "";
      elCircle.classList.add("desert-chit");
    };
    elCircle.innerHTML = html;

  }; // for (let [index, tile] of tiles.entries()) {

};

const shuffleIsValid = tilesArray => {

  //// KEEP THIS + DEBUGSTACK.FAIL_ counts *UNTIL I finish ADDING OUR NEW SETTINGS*
  // during TESTING/stats *only*, because it is WAY faster to "early exit" via "return false" AS SOON AS FAIL.
  // debugStack.attempted_count++;
  // let fail_resource = false;
  // let fail_68 = false;
  // let fail_regNum = false;
  // let fail_212 = false;
  // let fail_multiple_68 = false;
  // let fail_desert_center = false;
  // ^ during TESTING/stats *only*, because it is WAY faster to "early exit" via "return false" AS SOON AS FAIL.

  const multiple68Counts = { "sheep": 0, "wheat": 0, "wood": 0, "brick": 0, "ore": 0, "desert": 0 };
  const multiple68Limit = globalMapMode === "normal" ? 1 : 2;
  const desertCenterIndexesExpansion = [11, 14, 15, 18]; // vs. "normal" just checking if 9 === boardLocation

  for (let boardLocation = 0, L = tilesArray.length; boardLocation < L; boardLocation ++) {
    const tile = tilesArray[boardLocation];

    const chit = tile.chit;
    const resource = tile.resource;

    const nearbyListHigherIndexOnly = globalAdjacencyHigherIndexOnly[boardLocation];

    switch (chit) {

      case 6: case 8:

        // DEBUG_RUNS_FILLTILES = 1 * 1; // "instantly" (220ms) = "brick" = 8 6 11 = fail_multiple_68_count ("normal" mode)
        // DEBUG_RUNS_FILLTILES = 1 * 12; // "instantly" (2730ms) = "wheat" = 8 6 6 5 10 12 = fail_multiple_68_count (Extension "" mode)
        // FOURTH confirm no single resource has "too many" 6/8 ("normal" fails if 2+, "" Extension fails if 3+)
        // New house rule: confirm no single resource has 2+ of 6/8 (Expansion = 3+ of 6/8)
        if (!resource_multiple_6_8) {
          if ((++multiple68Counts[resource]) > multiple68Limit) return false;
        };

        // SECOND check the FREQUENT "special" numbers; intuition says they will fail LESS frequently than regNum...
        // ...but INTUITION IS WRONG!
        // 6/8 BEFORE the regNum ... and then check 2/12 after everything (duh)
        if (!adjacent_6_8) {
          // check adjacent tiles for same numbers (6/8 only)
          // if(!passedAdjacencyTest(tiles, 6, 8)) {
          for (let i = 0, N = nearbyListHigherIndexOnly.length; i < N; i++) {
            const nearbyChit = tilesArray[nearbyListHigherIndexOnly[i]].chit;
            if (nearbyChit === 6 || nearbyChit === 8) return false;
          };
        };

        break;

      case 2: case 12:

        if (!adjacent_2_12) {
          // FIFTH check the "special" numbers 2/12 after checking the WAY MORE FREQUENT 6/8 (and the regNum too! Proven by MATH via STATISTICS)
          // debugger;
          // debugStack.attempted_212_count++;
          // check adjacent tiles for same numbers (2/12 only)
          // if(!passedAdjacencyTest(tiles, 2, 12)) {
          for (let i = 0, N = nearbyListHigherIndexOnly.length; i < N; i++) {
            const nearbyChit = tilesArray[nearbyListHigherIndexOnly[i]].chit;
            if (nearbyChit === 2 || nearbyChit === 12) {
              // debugger;
              // debugStack.fail_212_count++;
              return false;
            };
          };
        };

        break;

      case 0: // { chit: 0, resource: "desert" }

        // DEBUG_RUNS_FILLTILES = 1 * 16; // "instantly" (8700ms) = fail_desert_center ("normal" mode)
        // DEBUG_RUNS_FILLTILES = 1; // ALSO will initially fail_desert_center ("normal" mode)
        // DEBUG_RUNS_FILLTILES = 1 * 3; // "instantly" (340ms) = fail_desert_center [0] (Extension "" mode)
        // DEBUG_RUNS_FILLTILES = 1 * 6; // "instantly" (580ms) = fail_desert_center [1] (Extension "" mode)
        // DEBUG_RUNS_FILLTILES = 1 * 4; // "instantly" (380ms) = fail_desert_center [2] (Extension "" mode)
        // DEBUG_RUNS_FILLTILES = 1 * 11; // "instantly" (1150ms) = fail_desert_center [3] (Extension "" mode)
        // SIXTH aka FINAL check = the desert (because this is the least likely to fail)
        // LEAST LIKELY TEST OF ALL (19 tiles, only 1 is the "center"), so def. leave it to VERY END
        // if (!passedDesertCheck(tiles, centerIndexes = globalMapMode === "normal" ? [9] : [11, 14, 15, 18])) {

        // New house rule: confirm desert is not in the center (Expansion = any of the *4* center tiles).
        if (!desert_in_center) {
          if (
            globalMapMode === "normal"
              ? 9 === boardLocation
              : desertCenterIndexesExpansion.includes(boardLocation)
          ) {
            // console.log({ boardLocation }, desertCenterIndexesExpansion, tilesArray);
            // debugger;
            return false;
          };
        };

        break;

    }; // switch (chit) {



    // NOTE: *most* tests run 5-10% faster if adjacent_same_numbers is checked BEFORE adjacent_same_resource

    /// [previous] order of highest..lowest frequency of FAILURE = Resource, 6/8, regNum, multi, 2/12, desert
    //       debugStack.fail_68_count:  903265 1271127 5156137 7004176   4554560 3864993 |Ext: 1417502
    //                .fail_212_count:  257405  362217 1468118 1995046   1294927 1101868 |Ext: 1018287
    //      .fail_desert_center_count:       0   78537  318895  426550    280957  235630 |Ext:  372884
    //        .fail_multiple_68_count:       0       0       0       0   3870992 3284777 |Ext:  540591
    //             .fail_regNum_count:  854811 1202680 4875441 6621241   4307977 3652840 |Ext: 1418343
    // debugStack.fail_resource_count: 1046827 1472817 5972597 8114842   5275926 4477734 |Ext: 1394302
    // ^ "normal" mode; for "" Extension 'fail_68' is slightly more frequent than fail_resource (but _multiple_ is like 10X MORE RARE now!)
    // ^ ...therefore...

    // THIRD check all of the other "non-special" numbers
    if (globalRegularNumbers.includes(chit)) {
      // reminder: globalRegularNumbers = [3, 4, 5, 9, 10, 11];
      if (!adjacent_same_numbers) {
        // check adjacent tiles for same numbers ("regular" numbers AKA not 6/8/2/12)
        // if (!passedAdjacencyTest(tiles, regNum, regNum, alsoCheckMultiple68--)) {
        for (let i = 0, N = nearbyListHigherIndexOnly.length; i < N; i++) {
          if (chit === tilesArray[nearbyListHigherIndexOnly[i]].chit) return false;
        };
      };
    };

    // FIRST check the Resource adjacencies ("the expansion pack can not use this setting")
    if (globalMapMode === "normal") {
      if (!adjacent_same_resource) { // MOST LIKELY / MOST FREQUENT CAUSE OF FAILURE so put this at TOP (in theory)
        // if (!passedResourceCheck(tiles, 1)) { // Checks if any two of its adjacent tiles are of the same resource
        const nearbyListAll = globalAdjacencyAll[boardLocation];
        for (let i = 0, N = nearbyListAll.length; i < N; i++) {
          if (resource === tilesArray[nearbyListAll[i]].resource) {
            return false;
          };
        };
      };
    };

    // NOTE: *most* tests run 5-10% faster if adjacent_same_numbers is checked BEFORE adjacent_same_resource
    // ^ "1 * 12" (SEED 52) = 17238.3391 ms instead of 17387.2612 ms
    // ^ "1 * 50" AKA 5 * 10= 48407 ms instead of 49071, 56581 ms instead of 57857 ms

  }; // for (let boardLocation = 0, L = tilesArray.length; boardLocation < L; boardLocation ++) {



  // during TESTING/stats *only*, because it is WAY faster to "early exit" via "return false" AS SOON AS FAIL.
  // if(
  //  fail_resource
  //  || fail_68
  //  || fail_regNum
  //  || fail_212
  //  || fail_multiple_68
  //  || fail_desert_center
  // )return false;
  // ^ during TESTING/stats *only*, because it is WAY faster to "early exit" via "return false" AS SOON AS FAIL.

  return true;
};

const optionsAllUncheckedAndNormalMap = () => (
  !adjacent_6_8
  && !adjacent_2_12
  && !adjacent_same_numbers
  && !adjacent_same_resource
  && !desert_in_center
  && !resource_multiple_6_8
  && globalMapMode === "normal"
);

// This function ties together the results of generateTileContent() and drawTiles().
// In other words, it populates the HTML created by drawTiles() with the content
// created by generateTileContent().
const fillTiles = (randomSeed, durationMaxMs) => {

  let tiles;

  if (randomSeed != null) {
    random = createRandomWithSeed(randomSeed);
  } else if (!DEBUG_SKIP_LOOKUP_FAST && optionsAllUncheckedAndNormalMap()) {
    // debugger;
    random = createRandomWithSeed(lookupFastSeed());
  } else {
    random = randomDefault;
  };



  // MUST be reset here -- not inside generateTileContent() otherwise that takes FOREEEVVVEEER to finish!
  globalNumArray = NUM_ARRAY.slice(0);
  globalResourceArray = RESOURCE_ARRAY.slice(0);

  // debugger;
  let ended = 0, start = performance.now();
  // console.time("fillTile");

  for(let runs = 0; runs < DEBUG_RUNS_FILLTILES; runs ++) {

    // debugger;
    do {
      tiles = generateTileContent();
      if(DEBUG_LOG_TILES_BEFORE_VALID)console.info("\n\n", tiles);
    } while (!shuffleIsValid(tiles));

    // if(DEBUG_LOG_TILES_AFTER_FILL)console.info( ">>>shuffleIsValid:", stringify(tiles, 0, "  ") );
    // if(DEBUG_LOG_TILES_AFTER_FILL)console.info( ">>>shuffleIsValid:", tiles );

  };

  ended = performance.now();
  // console.timeEnd("fillTile");
  globalDuration = ended - start;
  if (!DEBUG_SEEDS_TRACK) console.info("fillTile:", globalDuration + " ms");

  // if(DEBUG_LOG_TILES_AFTER_FILL)console.info( ">>>shuffleIsValid:", stringify(tiles, 0, "  ") );
  if(DEBUG_LOG_TILES_AFTER_FILL)console.info( ">>>shuffleIsValid:", tiles );

  if (DEBUG_SEEDS_TRACK) {
    if (optionsAllUncheckedAndNormalMap()) {
      if (!durationMaxMs || globalDuration <= durationMaxMs) {
        // console.log( debugStack.seeds.length === ( !globalMapMode ? 83 : (19 + 18 + 18 - 3) ) ); // = (60 - 5) - 3 = (55) - 3 = 52
        debugStack.fastSeedArrayForNormalMap.push({ [debugStack.firstSeed]: globalDuration });
        // console.log(debugStack.firstSeed, JSON.stringify(fastSeedArrayForNormalMap, 0, "  "));
      };
      // debugger;
    };
    debugStack.seeds = []; // likely no slower than debugStack.seeds.length = 0;
    debugStack.firstSeed = null;
  };

  // update the View
  redrawTiles(tiles);

  // return the Model
  return tiles;

};

// This method is called when the button is pressed.
// This is how the DOM interacts with the JS part -- start(true) AKA will NOT call drawTiles().
const generateBoard = evt => {

  if(evt) {
    evt?.preventDefault?.();
  };

  start(!!"skipDrawTiles", !"skipFillTiles");
};

const updateOptionElements = () => {
  doc.getElementById("pick-mode").value = globalMapMode;

  doc.getElementById("adjacent_6_8_input").checked = adjacent_6_8;
  doc.getElementById("adjacent_2_12_input").checked = adjacent_2_12;
  doc.getElementById("adjacent_same_numbers_input").checked = adjacent_same_numbers;
  doc.getElementById("adjacent_same_resource_input").checked = adjacent_same_resource;

  // new settings for our "house rules"...
  if(doc)doc.getElementById("desert_in_center_input").checked = desert_in_center;
  if(doc)doc.getElementById("resource_multiple_6_8_input").checked = resource_multiple_6_8;
};

const toggleOptionsPopup = () => {
  const optionsMenuClasses = doc.getElementById("popmenu").classList;
  const optionsButton = doc.getElementById("btnOps");

  if (optionsMenuClasses.contains("menuToggle")) {

    //THIS OPENS THE MENU
    optionsMenuClasses.remove("menuToggle");
    optionsButton.innerHTML = "Close Options";

    updateOptionElements();

  } else {

    //THIS CLOSES THE MENU
    optionsMenuClasses.add("menuToggle");
    optionsButton.innerHTML = "Options";

    if (globalSettingsAdjusted) { // other than the MapMode (toggling "normal" or "")
      globalSettingsAdjusted = false;
      generateBoard();
    } else {
      enableBuildButton();
    };

  };

};

// A function called initially and also when mode is switched to start board generation.
const start = (skipDrawTiles, skipFillTiles) => {
  if (DEBUG_BENCH_ONLY) return BENCH();

  disableBuildButton();

  if (!skipDrawTiles) drawTiles();

  setTimeout(() => { // required, otherwise you NEVER SEE disableBuildButton's CSS update...

    if (!skipFillTiles) fillTiles();
    // if (!skipFillTiles) fillTiles(DEBUG_RANDOM_SEED);

    enableBuildButton();
  }, 30);

};

const test_js_only = () => {
  console.info("hiya -_-");
  // debugger;

  const skipFillTiles = DEBUG_SKIP_FILLTILES_ON_LOAD
  && !"testing js only therefore must NEVER skipFillTiles during initialLoad";

  start(!"skipDrawTiles", skipFillTiles);
};



// Start the board. Do this when page is first opened, or when mode is changed.
const initialLoadEventName = !!"LOAD" ? "load" : "DOMContentLoaded";

const CSSpreloadClasses = (doc, msDelay, ...classes) => {
  let el, loadNextClass = () => (
    classes.length
    ? setTimeout(
      loadNextClass,
      msDelay,
      el.className = classes.shift()
    )
    : doc.body.removeChild(el)
  );

  return doc.body && loadNextClass(
    classes = classes.flat(),
    doc.body.appendChild(
      el = doc.createElement("span")
    )
  );
};

const initialLoad = evt => {

  CSSpreloadClasses(doc, 9, globalResourceTypes);

  const skipFillTiles = DEBUG_SKIP_FILLTILES_ON_LOAD
  && ( !!evt || !"evt NOT passed therefore NEVER skipFillTiles" );

  ( doc.getElementById("popmenu").style ?? {} ).display = "";

  !"DEBUG_TEST_JS_ONLY"
  // ? test_js_only(!!"DEBUG_forceCustomDoc")
  ? test_js_only()
  : start(!"skipDrawTiles", skipFillTiles);

};

globalThis.window
? window.addEventListener( initialLoadEventName, initialLoad)
: initialLoad();
