import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

class Extras {
    @Prop({ type: Number, default: 0 })
    wides: number;

    @Prop({ type: Number, default: 0 })
    noBalls: number;

    @Prop({ type: Number, default: 0 })
    byes: number;

    @Prop({ type: Number, default: 0 })
    legByes: number;
}

class ScoreDetails {
    @Prop({ type: Types.ObjectId, ref: "Player" })
    batsman: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "Player" })
    bowler: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "Player" })
    nonStriker: Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    runs: number;

    @Prop({ type: Number, default: 0 })
    wickets: number;
}

class Innings {
    @Prop({ type: Number, default: 0 })
    overs: number;

    @Prop({ type: Number, default: 0 })
    ballsYetPlayed: number;

    @Prop({ type: Extras, _id: false })
    extras: Extras;

    @Prop({ type: ScoreDetails, _id: false })
    scoreDetails: ScoreDetails;
}

@Schema()
export class Match extends Document {
    @Prop({ type: Types.ObjectId, ref: "Team", required: true })
    battingTeam: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "Team", required: true })
    fieldingTeam: Types.ObjectId;

    @Prop({ type: Innings, _id: false })
    innings: Innings;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
