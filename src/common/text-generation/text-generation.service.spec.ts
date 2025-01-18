import { Test, TestingModule } from '@nestjs/testing';
import { TextGenerationService } from './text-generation.service';

describe('TextGenerationService', () => {
  let service: TextGenerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextGenerationService],
    }).compile();

    service = module.get<TextGenerationService>(TextGenerationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
