import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema, Types } from "mongoose";

class TeamStats {
    @Prop({ type: Number, default: 0 })
    totalRuns: number;

    @Prop({ type: Number, default: 0 })
    totalWickets: number;

    @Prop({ type: Number, default: 0 })
    extras: number;

    @Prop({ type: Number, default: 0 })
    overs: number;

    @Prop({ type: Number, default: 0 })
    maidens: number;
}

@Schema()
export class Team extends Document {
    @Prop({ required: true })
    name: string;

    @Prop([{ type: MongooseSchema.Types.ObjectId, ref: "Player" }])
    players: Types.ObjectId[];

    @Prop({
        type: String,
        enum: ["batting", "bowling"],
        default: null,
    })
    currentStatus: "batting" | "bowling" | null;

    @Prop({ type: TeamStats, _id: false, default: {} })
    stats: TeamStats;
}

export type TeamDocument = Team & Document;
export const TeamSchema = SchemaFactory.createForClass(Team);
