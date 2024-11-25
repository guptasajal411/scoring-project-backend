import { Body, Controller, Get, Param, Post } from "@nestjs/common";
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

    @Post("update-match")
    async updateMatchDetails(
        @Body("matchid") matchId: string,
        @Body("bowler") bowler: string,
        @Body("striker") striker: string,
        @Body("type") type: 0 | 1 | 2 | 3 | 4 | 6 | "wicket" | "wide" | "noball" | "bye" | "legbye" | "new-ball",
    ): Promise<any> {
        return this.matchService.updateMatchDetails(matchId, bowler, striker, type);
    }

    @Get(":id")
    async getMatchById(@Param("id") id: string): Promise<Match> {
        return this.matchService.fetchMatchDetails(id);
    }
}
