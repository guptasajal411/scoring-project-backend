import { Module } from "@nestjs/common";
import { MatchController } from "./match.controller";
import { MatchService } from "./match.service";
import { MongooseModule } from "@nestjs/mongoose";
import { MatchSchema } from "./schemas/match.schema";
import { TeamSchema } from "./schemas/team.schema";
import { PlayerSchema } from "./schemas/player.schema";
import { DeliverySchema } from "./schemas/delivery.schema";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: "Match", schema: MatchSchema }]),
        MongooseModule.forFeature([{ name: "Team", schema: TeamSchema }]),
        MongooseModule.forFeature([{ name: "Player", schema: PlayerSchema }]),
        MongooseModule.forFeature([{ name: "Delivery", schema: DeliverySchema }])
    ],
    controllers: [MatchController],
    providers: [MatchService]
})
export class MatchModule { }
