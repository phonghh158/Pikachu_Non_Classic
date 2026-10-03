// src/config/levels.js
const SPAWNER_LEVEL = {
    NONE: "NONE",
    BASIC: "BASIC",
    UPGRADE_1: "UPGRADE_1",
    UPGRADE_2: "UPGRADE_2",
    UPGRADE_3: "UPGRADE_3",
    UPGRADE_HORROR: "UPGRADE_HORROR",
};

const SPAWNER_CONFIG = {
    [SPAWNER_LEVEL.NONE]: null,
    [SPAWNER_LEVEL.BASIC]: {
        triggerMatches: 18,
        normalPairs: 2,
        iceFirePairs: 0,
    },
    [SPAWNER_LEVEL.UPGRADE_1]: {
        triggerMatches: 18,
        normalPairs: 3,
        iceFirePairs: 0,
    },
    [SPAWNER_LEVEL.UPGRADE_2]: {
        triggerMatches: 15,
        normalPairs: 2,
        iceFirePairs: 1,
    },
    [SPAWNER_LEVEL.UPGRADE_3]: {
        triggerMatches: 12,
        normalPairs: 1,
        iceFirePairs: 2,
    },
    [SPAWNER_LEVEL.UPGRADE_HORROR]: {
        triggerMatches: 9,
        normalPairs: 1,
        iceFirePairs: 2,
    },
};

const LEVELS = [
    {
        id: 1,
        name: "Level 1",
        timeLimit: 600,
        tileTypeCount: 10,
        iceFirePairs: 0,
        spawnerLevel: SPAWNER_LEVEL.NONE,
    },
    {
        id: 2,
        name: "Level 2",
        timeLimit: 660,
        tileTypeCount: 12,
        iceFirePairs: 4,
        spawnerLevel: SPAWNER_LEVEL.NONE,
    },
    {
        id: 3,
        name: "Level 3",
        timeLimit: 720,
        tileTypeCount: 12,
        iceFirePairs: 8,
        spawnerLevel: SPAWNER_LEVEL.BASIC,
    },
    {
        id: 4,
        name: "Level 4",
        timeLimit: 840,
        tileTypeCount: 14,
        iceFirePairs: 10,
        spawnerLevel: SPAWNER_LEVEL.UPGRADE_1,
    },
    {
        id: 5,
        name: "Level 5",
        timeLimit: 960,
        tileTypeCount: 16,
        iceFirePairs: 12,
        spawnerLevel: SPAWNER_LEVEL.UPGRADE_2,
    },
    {
        id: 6,
        name: "Level 6",
        timeLimit: 1020,
        tileTypeCount: 18,
        iceFirePairs: 14,
        spawnerLevel: SPAWNER_LEVEL.UPGRADE_3,
    },
    {
        id: 7,
        name: "Level Tối Thượng",
        timeLimit: 1080,
        tileTypeCount: 20,
        iceFirePairs: 16,
        spawnerLevel: SPAWNER_LEVEL.UPGRADE_HORROR,
    },
];

export { SPAWNER_LEVEL, SPAWNER_CONFIG, LEVELS };
