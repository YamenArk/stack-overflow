import { IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class checkIdDto {
  @Transform(({ value }) => Number(value), { toClassOnly: true }) 
  @IsInt()
  @Min(1)
  id: number;
}
