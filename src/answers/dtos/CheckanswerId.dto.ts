import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckanswerIdDto {
  @Transform(({ value }) => Number(value), { toClassOnly: true }) 
  @IsInt()
  @Min(1)
  answerId: number;
}
