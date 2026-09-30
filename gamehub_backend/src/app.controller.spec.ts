import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('blackjack demo', () => {
    it('returns events and summary', () => {
      const result = appController.startBlackjackGame({ bet: 50 });

      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.summary.player_bet).toBe(50);
      expect(result.summary.balance_left).toBeGreaterThanOrEqual(0);
      expect(['player', 'dealer', 'none']).toContain(result.summary.winner);
    });

    it('normalizes invalid bet to default value', () => {
      const result = appController.startBlackjackGame({ bet: 'oops' });

      expect(result.summary.player_bet).toBe(50);
    });
  });
});
