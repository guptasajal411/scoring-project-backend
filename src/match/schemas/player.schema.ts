import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

class BattingStats {
    @Prop({ type: Number, default: 0 })
    runs: number;

    @Prop({ type: Number, default: 0 })
    ballsFaced: number;

    @Prop({ type: Number, default: 0 })
    fours: number;

    @Prop({ type: Number, default: 0 })
    sixes: number;

    @Prop({ type: Boolean, default: false })
    isOut: boolean;
}

class BowlingStats {
    @Prop({ type: Number, default: 0 })
    overs: number;

    @Prop({ type: Number, default: 0 })
    runsConceded: number;

    @Prop({ type: Number, default: 0 })
    wickets: number;

    @Prop({ type: Number, default: 0 })
    maidens: number;
}

@Schema()
export class Player extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, type: Types.ObjectId })
    team: Types.ObjectId;

    @Prop({ type: BattingStats, _id: false, default: {} })
    batting: BattingStats;

    @Prop({ type: BowlingStats, _id: false, default: {} })
    bowling: BowlingStats;

    @Prop({
        type: String,
        enum: ["striker", "non-striker", "bowler", "on-field", "in-pavilion"],
        default: null,
    })
    currentStatus: "striker" | "non-striker" | "bowler" | "on-field" | "in-pavilion" | null;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
