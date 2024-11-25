import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber } from 'class-validator';

export class UpdateMatchDto {
    @IsString()
    @IsNotEmpty()
    matchId: string;

    @IsString()
    @IsNotEmpty()
    bowler: string;

    @IsString()
    @IsNotEmpty()
    striker: string;

    @IsIn([0, 1, 2, 3, 4, 6, "wicket", "wide", "noball+bye", "noball+runs", "bye+overthrow", "runs+overthrow", "noball+legbye"])
    type: 0 | 1 | 2 | 3 | 4 | 6 | "wicket" | "wide" | "noball+bye" | "noball+runs" | "bye+overthrow" | "runs+overthrow" | "noball+legbye";
}
