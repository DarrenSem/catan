"use strict";

// getTinyTimings(60).length === 749 (after calcFastSeedsForNormalMap(1, 20_000, 500)) = enough, let's just use these. #RatherGood #MoveOn

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
let DEBUG_RANDOM_SEED;
// DEBUG_RANDOM_SEED = 42 * 101; // and even this is optional
// DEBUG_RANDOM_SEED = 42;
DEBUG_RANDOM_SEED = 52; // slower than 42 (5 runs 950ms) {DEBUG_RUNS = 1 @ all unchecked: [11 5 9 ... 4 8 11]}
const DEBUG_SEEDS_TRACK = !"DEBUG_SEEDS_TRACK" && DEBUG_USE_RANDOM_WITH_SEED;  // required by calcFastSeedsForNormalMap(); DEBUG_SEEDS_TRACK && debugStack.seeds.push(s),  // add to debugStack.fastSeedArrayForNormalMap -- later used by lookupFastSeed()
const DEBUG_SKIP_LOOKUP_FAST = !"DEBUG_SKIP_LOOKUP_FAST"; // ^ *CRITICAL* to TEST/verify/TRACK seed's resulting map, *MUST* skip createRandomWithSeed(lookupFastSeed()) if optionsAllUncheckedAndNormalMap()
const DEBUG_SEEDS_CALC_CONTINUE = !"DEBUG_SEEDS_CALC_CONTINUE"; // to SKIP clearStoredSeeds() in calcFastSeedsForNormalMap() 


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



// \/ logic for gathering TIMINGS for lookupFastSeed() to work - precalculate "fast" seeds if optionsAllUncheckedAndNormalMap()
const STORED_CALC_ARRAY_RESULT = "_CATAN_CALC_ARRAY_RESULT";
const STORED_SEEDS = "_CATAN_SEEDS";
const STORED_TIMINGS = "_CATAN_TIMINGS";
const parseStoredArray = key => {
  try {
    return JSON.parse(`[${localStorage.getItem(key) || ""}]`);
  } catch(e) {
    return [];
  };
};
let storedSeeds = DEBUG_SEEDS_TRACK && parseStoredArray(STORED_SEEDS);
let storedTimings = DEBUG_SEEDS_TRACK && parseStoredArray(STORED_TIMINGS);
const updateStoredSeeds = (seed, msDuration) => {
  if(msDuration) {
    storedSeeds.push(seed);
    storedTimings.push( (msDuration | 0).toFixed(2 - 2) );
  };
  localStorage.setItem(STORED_SEEDS, storedSeeds);
  localStorage.setItem(STORED_TIMINGS, storedTimings);
};
const clearStoredSeeds = () => {
  storedSeeds = [];
  storedTimings = [];
  localStorage.removeItem(STORED_CALC_ARRAY_RESULT);
  updateStoredSeeds();
};
const storeCalcResult = (seedArray, silent) => {
  const result = debugStack.fastSeedArrayForNormalMap = (seedArray || []).slice(0);
  const suffix = "; // .length = " + result.length;
  const code = `fastSeedArray = [\n  ${result}\n]${suffix}`;
  localStorage.setItem(STORED_CALC_ARRAY_RESULT, code);
  if (!silent) console.info(`>>> result = ${STORED_CALC_ARRAY_RESULT} = [${result}]${suffix}`);
};
const updateFastSeedArrayForNormalMap = (seed, msDuration, msDurationMax, seedMax) => {
  if (!msDurationMax || msDuration <= msDurationMax) {
    updateStoredSeeds(seed, msDuration);
    // debugStack.fastSeedArrayForNormalMap.push({ [seed]: msDuration });
    // console.log(seed, JSON.stringify(fastSeedArrayForNormalMap, 0, "  "));
    debugStack.fastSeedArrayForNormalMap.push(seed);
    const what = `${(seed + "").padStart(5, " ")}${seedMax ? `\tof\t${seedMax}` : ""}`;
    const durationParts = msDuration.toFixed(2).split(".");
    console.info(
      `${what}`
      // `${durationParts[0].padStart(3, " ")}.${durationParts[1]}\tms`
      + "\t" +
      `${durationParts[0].padStart(3, " ")}.${durationParts[1]}\tms`
      // `${what}`
    );
  };
  // debugger;
};
const calcFastSeedsForNormalMap = (seedMin, seedMax, durationMaxMs) => {
  if(DEBUG_SEEDS_TRACK && durationMaxMs) {

    // debugger;
    if(!DEBUG_SEEDS_CALC_CONTINUE) {
      clearStoredSeeds();
      debugStack.fastSeedArrayForNormalMap = [];
    } else {
      storedSeeds = parseStoredArray(STORED_SEEDS); // just to be safe
      storedTimings = parseStoredArray(STORED_TIMINGS); // just to be safe
      storeCalcResult(storedSeeds, !!"silent"); // just to be safe
    };

    for(let seed = seedMin; seed <= seedMax; seed ++) {
      fillTiles(seed, durationMaxMs, seedMax);
      // console.info("calcFastSeedsForNormalMap:", seed, "of", seedMax);
    };

    storeCalcResult(debugStack.fastSeedArrayForNormalMap);
    console.info(`${STORED_SEEDS} = [${localStorage.getItem(STORED_SEEDS)}];`);
    console.info(`${STORED_TIMINGS} = [${localStorage.getItem(STORED_TIMINGS)}];`);

  };
};
const getTinyTimings = msDurationMax => (
  msDurationMax && storedSeeds
  .filter( (el, i) => storedTimings[i] <= msDurationMax )
);
// original test run: getTinyTimings(100).length === 448 (!) #NotBad ... and now (after 1..20_000) it is === 1194;
// getTinyTimings(60).length === 749 (after calcFastSeedsForNormalMap(1, 20_000, 500)) = enough, let's just use these. #RatherGood #MoveOn
/*
for example: calcFastSeedsForNormalMap(1, 39, 500); // can sort to remove the slowest of these "fast"
    2	of	39	 11.30	ms
    3	of	39	206.10	ms
    4	of	39	 22.60	ms
   16	of	39	194.80	ms
   20	of	39	 86.80	ms
   23	of	39	 61.30	ms
   29	of	39	278.00	ms
   33	of	39	234.40	ms
   35	of	39	320.10	ms
   39	of	39	105.90	ms
>>> result = _CATAN_CALC_ARRAY = [2, 3, 4, 16, 20, 23, 29, 33, 35, 39]
localStorage.setItem("_CATAN_CALC_ARRAY", `fastSeedArray = [
  2,3,4,16,20,23,29,33,35,39
]; // .length = 10`);
*/
// /\ // \/ logic for gathering TIMINGS for lookupFastSeed() to work - precalculate "fast" seeds if optionsAllUncheckedAndNormalMap()



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
  const btn = doc.getElementById("btnBuild");
  if(btn.style) {
    btn.disabled = !enabled;
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
const fillTiles = (randomSeed, msDurationMax, seedMax) => {

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
  let msDuration = 0, ended = 0, start = performance.now();
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
  msDuration = ended - start;
  if (!DEBUG_SEEDS_TRACK) console.info("fillTile:", msDuration + " ms");

  // if(DEBUG_LOG_TILES_AFTER_FILL)console.info( ">>>shuffleIsValid:", stringify(tiles, 0, "  ") );
  if(DEBUG_LOG_TILES_AFTER_FILL)console.info( ">>>shuffleIsValid:", tiles );

  if (DEBUG_SEEDS_TRACK) {
    if (optionsAllUncheckedAndNormalMap()) {
      updateFastSeedArrayForNormalMap(debugStack.firstSeed, msDuration, msDurationMax, seedMax);
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

  if (!skipFillTiles) fillTiles();
  // if (!skipFillTiles) fillTiles(DEBUG_RANDOM_SEED);

  enableBuildButton();

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

const initialLoad = evt => {

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
