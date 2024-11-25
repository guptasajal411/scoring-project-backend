import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Player extends Document {
    @Prop({ required: true })
    name: string;
    @Prop({ required: true, type: Types.ObjectId })
    team: Types.ObjectId;
    @Prop({
        type: Object,
        default: { runs: 0, ballsFaced: 0, fours: 0, sixes: 0 }
    })
    batting: {
        runs: number,
        ballsFaced: number,
        fours: number,
        sixes: number
    };
    @Prop({
        type: Object,
        default: { overs: 0, runsConceded: 0, wickets: 0, maidens: 0 }
    })
    bowling: {
        overs: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0
    };
    @Prop({
        type: String,
        enum: ["striker", "non-striker", "bowler", "on-field", "in-pavilion"],
        default: null,
    })
    currentStatus: "striker" | "non-striker" | "bowler" | "on-field" | "in-pavilion" | null;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
