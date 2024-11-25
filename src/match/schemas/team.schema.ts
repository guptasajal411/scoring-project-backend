import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Team extends Document {
    @Prop({ required: true })
    name: string;

    @Prop([{ type: Types.ObjectId, ref: "Player" }])
    players: [{ type: Types.ObjectId, ref: "Player" }];

    @Prop({
        type: String,
        enum: ["batting", "bowling"],
        default: null,
    })
    currentStatus: "batting" | "bowling" | null;

    @Prop({
        type: Object,
        default: { totalRuns: 0, totalWickets: 0, extras: 0, overs: 0, maidens: 0 },
    })
    stats: {
        totalRuns: number;
        totalWickets: number;
        extras: number;
        overs: number;
        maidens: number;
    };
}

export const TeamSchema = SchemaFactory.createForClass(Team);
