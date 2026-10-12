import { Game } from '@/game/Game.js';
import { logger } from '@/utils/logger.js';

const game = new Game({
  stageEl: document.getElementById('stage'),
  uiEl: document.getElementById('ui'),
});

game.start().catch((err) => logger.error('Failed to start game', err));

if (import.meta.hot) import.meta.hot.dispose(() => game.dispose());
