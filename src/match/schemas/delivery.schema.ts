import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Delivery extends Document {
    @Prop({ type: Types.ObjectId, ref: "Player", required: true })
    batsman: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: "Player", required: true })
    bowler: Types.ObjectId;

    @Prop({ type: String, enum: ["normal", "wide", "noball", "bye", "legbye"], required: true })
    type: "normal" | "wide" | "noball" | "bye" | "legbye";

    @Prop({ type: Boolean, default: false })
    isWicket: boolean;

    @Prop({ type: Number, default: 0 })
    runsExcludingExtras: number;

    @Prop({ type: Number, default: 0 })
    extras: number;

    @Prop({ type: String, enum: ["batting", "bowling"], default: "batting" })
    sideEffect: "batting" | "bowling";
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
