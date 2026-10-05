// src/main.js
import { DIRECTIONS } from "./config/constants.js";
import { LEVELS } from "./config/levels.js";
import GameManager from "./managers/GameManager.js";
import AudioManager from "./managers/AudioManager.js";
import StorageManager from "./managers/StorageManager.js";
import ScoreManager from "./managers/ScoreManager.js";
import BoardView from "./view/BoardView.js";

const btnNewGame = document.getElementById("btn-newgame");
const btnPause = document.getElementById("btn-pause");
const btnSettings = document.getElementById("btn-settings");
const btnGallery = document.getElementById("btn-gallery");
const valScore = document.getElementById("val-score");
const valLevel = document.getElementById("val-level");

const boardContainer = document.getElementById("board-container");
const hiddenBackground = document.getElementById("hidden-background");
const lineCanvas = document.getElementById("line-canvas");
const matchesLeftEl = document.getElementById("matches-left");
const timerCover = document.getElementById("timer-cover");
const btnShuffle = document.getElementById("btn-shuffle");

const boardOverlay = document.getElementById("board-overlay");
const overlayPauseContent = document.getElementById("overlay-pause-content");
const overlaySettingsContent = document.getElementById("overlay-settings-content");
const overlayGameoverContent = document.getElementById("overlay-gameover-content");
const valFinalScore = document.getElementById("val-final-score");
const btnRestart = document.getElementById("btn-restart");

const rangeMusic = document.getElementById("range-music");
const rangeSfx = document.getElementById("range-sfx");
const txtMusic = document.getElementById("txt-music");
const txtSfx = document.getElementById("txt-sfx");

const galleryModal = document.getElementById("gallery-modal");
const galleryList = document.getElementById("gallery-list");
const btnCloseGallery = document.getElementById("btn-close-gallery");

const spawnerStatusBlock = document.querySelector(".spawner-status-block");
const valSpawnCount = document.getElementById("val-spawn-count");
const spawnerPreviewList = document.getElementById("spawner-preview-list");

let isPaused = false;
let isSettingOpen = false;
let currentLevelIndex = 0;
let matchTimeoutId = null;

const scoreManager = new ScoreManager({
    onScoreChange: ({ gameScore }) => {
        if (valScore) {
            valScore.textContent = gameScore;
        }
    },
});

let boardView = null;
let gameManager = null;

boardView = new BoardView({
    boardContainer,
    hiddenBackground,
    lineCanvas,
    onTileClick: (x, y) => {
        AudioManager.playSfx("click");
        gameManager.handleTileClick(x, y);
    },
});

gameManager = new GameManager({
    directions: DIRECTIONS,
    orientation: "LANDSCAPE",
    onStateChange: (eventType, payload) => {
        switch (eventType) {
            case "LEVEL_STARTED":
                if (valLevel) {
                    valLevel.textContent = payload.levelConfig.id;
                }
                boardView.renderBoard(payload.grid, payload.levelConfig.id);
                updateRemainingMatchesDisplay();
                updateSpawnerUI();
                break;

            case "TIME_TICK": {
                if (timerCover) {
                    const levelConfig = LEVELS[currentLevelIndex];
                    const passedPercentage = Math.min(
                        100,
                        Math.max(
                            0,
                            ((levelConfig.timeLimit - payload.remaining) /
                                levelConfig.timeLimit) *
                                100,
                        ),
                    );
                    timerCover.style.height = `${passedPercentage}%`;
                }
                break;
            }

            case "TILE_SELECTED":
                boardView.setSelected(payload);
                break;

            case "TILE_DESELECTED":
                boardView.setSelected(null);
                break;

            case "GAME_OVER":
                handleGameOverState();
                break;

            case "LEVEL_CLEAR":
                handleLevelClearState(payload.levelIndex);
                break;
        }
    },
    onMatchSuccess: (matchResult) => {
        const isElement =
            matchResult.tileA.element !== "NORMAL" || matchResult.tileB.element !== "NORMAL";
        if (isElement) {
            AudioManager.playSfx("match_element");
        } else {
            AudioManager.playSfx("match");
        }

        boardView.showMatchPath(matchResult.path);

        if (matchTimeoutId) {
            clearTimeout(matchTimeoutId);
            matchTimeoutId = null;
        }

        matchTimeoutId = setTimeout(() => {
            boardView.removeTiles(
                matchResult.path[0],
                matchResult.path[matchResult.path.length - 1],
            );
            scoreManager.recordMatch(matchResult);
            updateRemainingMatchesDisplay();
            updateSpawnerUI();

            if (matchResult.spawnedTiles && matchResult.spawnedTiles.length > 0) {
                AudioManager.playSfx("spawn");
                boardView.addSpawnedTiles(matchResult.spawnedTiles);
                updateRemainingMatchesDisplay();
            }
            matchTimeoutId = null;
        }, 150);
    },

    onShuffle: (data) => {
        AudioManager.playSfx("shuffle");
        boardView.updateAfterShuffle(data.grid);
    },
});

function updateRemainingMatchesDisplay() {
    if (!gameManager.board || !matchesLeftEl) {
        if (matchesLeftEl) {
            matchesLeftEl.textContent = "0";
        }
        return;
    }

    let activeTilesCount = 0;
    for (let r = 0; r < gameManager.board.rows; r++) {
        for (let c = 0; c < gameManager.board.cols; c++) {
            const tile = gameManager.board.grid[r][c];
            if (tile && tile !== 0) {
                activeTilesCount++;
            }
        }
    }
    matchesLeftEl.textContent = String(activeTilesCount / 2);
}

function updateSpawnerUI() {
    if (!spawnerStatusBlock || !valSpawnCount || !spawnerPreviewList || !gameManager.board) {
        return;
    }

    const { isActive, remaining, previewTiles } = gameManager.board.getSpawnerStatus();

    // Ẩn cụm hiển thị Spawner nếu level không có tính năng này (NONE)
    if (!isActive) {
        spawnerStatusBlock.classList.add("hidden");
        valSpawnCount.textContent = "-";
        spawnerPreviewList.innerHTML = "";
        return;
    }

    // Hiển thị cụm Spawner
    spawnerStatusBlock.classList.remove("hidden");
    valSpawnCount.textContent = remaining;
    spawnerPreviewList.innerHTML = "";

    previewTiles.forEach((tileData) => {
        const miniTile = document.createElement("div");
        miniTile.className = "preview-tile-mini";

        const isElemental = tileData.element === "ICE" || tileData.element === "FIRE";
        if (isElemental) {
            miniTile.classList.add("element-ice-fire");
        }

        const icon = document.createElement("div");
        icon.className = "preview-icon";

        const index = Math.max(0, tileData.typeId - 1);
        const col = index % 5;
        const row = Math.floor(index / 5);
        icon.style.backgroundPosition = `-${col * 24}px -${row * 24}px`;

        miniTile.appendChild(icon);
        spawnerPreviewList.appendChild(miniTile);
    });
}

function hideAllOverlays() {
    boardOverlay.classList.add("hidden");
    overlayPauseContent.classList.add("hidden");
    overlaySettingsContent.classList.add("hidden");
    overlayGameoverContent.classList.add("hidden");
}

function handlePauseToggle() {
    if (isSettingOpen) {
        isSettingOpen = false;
    }

    isPaused = !isPaused;

    if (isPaused) {
        gameManager.timer.pause();
        AudioManager.pauseBgm();
        hideAllOverlays();
        overlayPauseContent.classList.remove("hidden");
        boardOverlay.classList.remove("hidden");
        btnPause.innerHTML = '<i class="bx bx-play"></i> Resume';
    } else {
        hideAllOverlays();
        gameManager.timer.start();
        AudioManager.resumeBgm();
        btnPause.innerHTML = '<i class="bx bx-pause"></i> Pause';
    }
}

function handleSettingsToggle() {
    if (overlaySettingsContent.classList.contains("hidden")) {
        if (!isPaused) {
            gameManager.timer.pause();
            AudioManager.pauseBgm();
        }
        isSettingOpen = true;
        hideAllOverlays();
        overlaySettingsContent.classList.remove("hidden");
        boardOverlay.classList.remove("hidden");
        btnPause.innerHTML = '<i class="bx bx-play"></i> Resume';
    } else {
        isSettingOpen = false;
        hideAllOverlays();
        if (isPaused) {
            overlayPauseContent.classList.remove("hidden");
            boardOverlay.classList.remove("hidden");
        } else {
            gameManager.timer.start();
            AudioManager.resumeBgm();
            btnPause.innerHTML = '<i class="bx bx-pause"></i> Pause';
        }
    }
}

function handleGameOverState() {
    AudioManager.stopBgm();
    AudioManager.playSfx("game_over");
    valFinalScore.textContent = scoreManager.gameScore;
    StorageManager.updateHighScore(scoreManager.gameScore);
    hideAllOverlays();
    overlayGameoverContent.classList.remove("hidden");
    boardOverlay.classList.remove("hidden");
}

function handleLevelClearState(levelIndex) {
    if (matchTimeoutId) {
        clearTimeout(matchTimeoutId);
        matchTimeoutId = null;
    }

    AudioManager.playSfx("level_clear");
    scoreManager.applyClearBonus(gameManager.timer.timeRemaining);
    StorageManager.updateHighScore(scoreManager.gameScore);
    StorageManager.updateMaxLevelReach(LEVELS[levelIndex].id);

    const nextIndex = levelIndex + 1;
    if (nextIndex < LEVELS.length) {
        currentLevelIndex = nextIndex;
        gameManager.startLevel(currentLevelIndex);
        AudioManager.playRandomBgm();
    } else {
        valFinalScore.textContent = scoreManager.gameScore;
        hideAllOverlays();
        overlayGameoverContent.classList.remove("hidden");
        boardOverlay.classList.remove("hidden");
    }
}

function startNewGame() {
    if (matchTimeoutId) {
        clearTimeout(matchTimeoutId);
        matchTimeoutId = null;
    }

    currentLevelIndex = 0;
    isPaused = false;
    isSettingOpen = false;
    btnPause.innerHTML = '<i class="bx bx-pause"></i> Pause';
    hideAllOverlays();
    scoreManager.reset(true);
    gameManager.startLevel(currentLevelIndex);
    updateSpawnerUI();
    AudioManager.playRandomBgm();
}

function openGallery() {
    const maxReached = StorageManager.getMaxLevelReach();
    galleryList.innerHTML = "";

    for (let i = 1; i <= 7; i++) {
        const item = document.createElement("div");
        item.className = "gallery-item";

        if (i <= maxReached) {
            const img = document.createElement("img");
            img.src = `/assets/hide_images/${i}.webp`;
            img.alt = `Level ${i}`;

            const dlBtn = document.createElement("a");
            dlBtn.className = "btn-download";
            dlBtn.href = `/assets/hide_images/${i}.webp`;
            dlBtn.download = `meow_level_${i}.webp`;
            dlBtn.textContent = "Tải về";

            item.appendChild(img);
            item.appendChild(dlBtn);
        } else {
            item.classList.add("locked");
            item.innerHTML = '<i class="bx bx-lock-alt"></i>';
        }

        galleryList.appendChild(item);
    }

    galleryModal.classList.remove("hidden");
}

function closeGallery() {
    galleryModal.classList.add("hidden");
}

btnNewGame.addEventListener("click", () => {
    AudioManager.playSfx("click");
    startNewGame();
});

btnRestart.addEventListener("click", () => {
    AudioManager.playSfx("click");
    startNewGame();
});

btnPause.addEventListener("click", () => {
    AudioManager.playSfx("click");
    handlePauseToggle();
});

btnSettings.addEventListener("click", () => {
    AudioManager.playSfx("click");
    handleSettingsToggle();
});

btnShuffle.addEventListener("click", () => {
    AudioManager.playSfx("click");
    gameManager.triggerShuffle(true);
});

btnGallery.addEventListener("click", () => {
    AudioManager.playSfx("click");
    openGallery();
});

btnCloseGallery.addEventListener("click", () => {
    AudioManager.playSfx("click");
    closeGallery();
});

rangeMusic.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    txtMusic.textContent = val;
    AudioManager.setBgmVolume(val / 100);
});

rangeSfx.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    txtSfx.textContent = val;
    AudioManager.setSfxVolume(val / 100);
});

// function test
function setupLevelCheatKeys() {
    window.addEventListener("keydown", (e) => {
        const levelNum = parseInt(e.key, 10);
        if (levelNum >= 1 && levelNum <= LEVELS.length) {
            currentLevelIndex = levelNum - 1;
            isPaused = false;
            isSettingOpen = false;
            btnPause.innerHTML = '<i class="bx bx-pause"></i> Pause';
            hideAllOverlays();
            gameManager.startLevel(currentLevelIndex);
            AudioManager.playRandomBgm();
        }
    });
}

async function bootstrap() {
    const savedAudio = StorageManager.getAudioSettings();
    rangeMusic.value = Math.round(savedAudio.BGM_VOLUME * 100);
    rangeSfx.value = Math.round(savedAudio.SFX_VOLUME * 100);
    txtMusic.textContent = rangeMusic.value;
    txtSfx.textContent = rangeSfx.value;

    await AudioManager.loadSfx();

    const unlockAudio = () => {
        AudioManager.init();
        if (!AudioManager.bgmAudio) {
            AudioManager.playRandomBgm();
        } else if (AudioManager.bgmAudio.paused) {
            AudioManager.resumeBgm();
        }
        document.removeEventListener("pointerdown", unlockAudio);
    };
    document.addEventListener("pointerdown", unlockAudio);

    setupLevelCheatKeys();

    startNewGame();
}

bootstrap();
