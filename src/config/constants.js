// src/config/constants.js
const GRID_CONFIG = {
    LANDSCAPE: {
        COLS: 18,
        ROWS: 9,
    },
    PORTRAIT: {
        COLS: 8,
        ROWS: 18,
    },
    PADDING: 1,
};

const TILE_TYPE_ID = {
    TYPE_1: 1,
    TYPE_2: 2,
    TYPE_3: 3,
    TYPE_4: 4,
    TYPE_5: 5,
    TYPE_6: 6,
    TYPE_7: 7,
    TYPE_8: 8,
    TYPE_9: 9,
    TYPE_10: 10,
    TYPE_11: 11,
    TYPE_12: 12,
    TYPE_13: 13,
    TYPE_14: 14,
    TYPE_15: 15,
    TYPE_16: 16,
    TYPE_17: 17,
    TYPE_18: 18,
    TYPE_19: 19,
    TYPE_20: 20,
};

const TILE_ELEMENT = {
    NORMAL: "NORMAL",
    ICE: "ICE",
    FIRE: "FIRE",
};

const PATH_RULES = {
    MAX_TURNS: 2,
};

const PENALTY = {
    SHUFFLE_TIME_FACTOR: 0.96,
};

const DIRECTIONS = {
    UP: { dx: 0, dy: -1, name: "UP" },
    DOWN: { dx: 0, dy: 1, name: "DOWN" },
    LEFT: { dx: -1, dy: 0, name: "LEFT" },
    RIGHT: { dx: 1, dy: 0, name: "RIGHT" },
};

const CELL_STATE = {
    OUT_OF_BOUNDS: -1,
    EMPTY: 0,
};

const TILE_SIZE = {
    TILE_WIDTH_L: 48,
    TILE_HEIGHT_L: 64,
    TILE_WIDTH_S: 36,
    TILE_HEIGHT_S: 48,
};

export {
    GRID_CONFIG,
    TILE_TYPE_ID,
    TILE_ELEMENT,
    PATH_RULES,
    PENALTY,
    DIRECTIONS,
    CELL_STATE,
    TILE_SIZE,
};
