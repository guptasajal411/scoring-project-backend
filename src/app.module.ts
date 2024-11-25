import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { MatchModule } from "./match/match.module";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }), MatchModule,
        MongooseModule.forRoot(process.env.MONGO_URI),
        MatchModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
