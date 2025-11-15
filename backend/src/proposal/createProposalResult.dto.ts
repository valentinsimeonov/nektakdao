// src/proposal/dto/createProposalResult.dto.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class CreateProposalResult {
  @Field(() => Boolean)
  ok: boolean;

  @Field(() => String, { nullable: true })
  status?: string | null;

  @Field(() => ID, { nullable: true })
  id?: string | null;

  @Field(() => String, { nullable: true })
  message?: string | null;
}


export type CreateProposalResultType = CreateProposalResult;