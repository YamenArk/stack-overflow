import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class checkquestionIdDto {
  @Transform(({ value }) => Number(value), { toClassOnly: true }) 
  @IsInt()
  @Min(1)
  questionId: number;
}
