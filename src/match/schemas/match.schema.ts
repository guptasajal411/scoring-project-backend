import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Match extends Document {
    @Prop({ type: Types.ObjectId, ref: "Team", required: true })
    battingTeam: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "Team", required: true })
    fieldingTeam: Types.ObjectId;

    @Prop({
        type: {
            battingTeam: { type: Types.ObjectId, ref: "Team" },
            fieldingTeam: { type: Types.ObjectId, ref: "Team" },
            runs: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            overs: { type: Number, default: 0 },
            ballsYetPlayed: { type: Number, default: 0 },
            extras: {
                wides: { type: Number, default: 0 },
                noBalls: { type: Number, default: 0 },
                byes: { type: Number, default: 0 },
                legByes: { type: Number, default: 0 },
            },
            scoreDetails: [
                {
                    batsman: { type: Types.ObjectId, ref: "Player" },
                    bowler: { type: Types.ObjectId, ref: "Player" },
                    nonStriker: { type: Types.ObjectId, ref: "Player" },
                    runs: { type: Number, default: 0 },
                    wickets: { type: Number, default: 0 },
                },
            ],
        }
    })
    innings: {
        runs: number;
        wickets: number;
        overs: number;
        ballsYetPlayed: number;
        extras: {
            wides: number;
            noBalls: number;
            byes: number;
            legByes: number;
        };
        batsman: Types.ObjectId;
        bowler: Types.ObjectId;
        nonStriker: Types.ObjectId;
    }[];
}

export const MatchSchema = SchemaFactory.createForClass(Match);
