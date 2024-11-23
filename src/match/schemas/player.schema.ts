import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Player extends Document {
    @Prop({ required: true })
    name: string;
    @Prop({ required: true, type: Types.ObjectId })
    team: Types.ObjectId;
    @Prop({
        batting: {
            runs: { type: Number, default: 0 },
            ballsFaced: { type: Number, default: 0 },
            fours: { type: Number, default: 0 },
            sixes: { type: Number, default: 0 },
        },
        bowling: {
            overs: { type: Number, default: 0 },
            runsConceded: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            maidens: { type: Number, default: 0 },
        }
    })
    @Prop({
        type: String,
        enum: ["striker", "non-striker", "bowler", "on-field", "in-pavilion"],
        default: null,
    })
    currentStatus: "striker" | "non-striker" | "bowler" | "on-field" | "in-pavilion" | null;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
