import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class AddQuestionVoteDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['upvote', 'downvote'], { message: "voteType must be either 'upvote' or 'downvote'." })
  voteType: 'upvote' | 'downvote';
}
