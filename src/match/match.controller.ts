import { Controller, Get, Post } from "@nestjs/common";
import { MatchService } from "./match.service";
import { Match } from "./schemas/match.schema";

@Controller("match")
export class MatchController {
    constructor(private matchService: MatchService) { }

    @Get()
    async getAllMatches(): Promise<Match> {
        return this.matchService.fetchMatchDetails();
    }

    @Post("new-match")
    async startNewMatch(): Promise<Match> {
        return this.matchService.startNewMatch();
    }

}
