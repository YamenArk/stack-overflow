import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class UpdatePendingQuestionAnswerDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['approved', 'rejected'], { message: "Status must be either 'approved' or 'rejected'." })
  status: 'approved' | 'rejected';
}
