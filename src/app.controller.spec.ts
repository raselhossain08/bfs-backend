import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CmsService } from './cms/cms.service';

describe('AppController', () => {
  let appController: AppController;

  const mockCmsService = {
    getData: jest.fn(),
    updateData: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: CmsService, useValue: mockCmsService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHealth()).toBe('Hello World!');
    });
  });
});
