import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { MatchService } from "./match.service";
import { Match } from "./schemas/match.schema";
import { UpdateMatchDto } from "./dto/update-match.dto";

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
    async updateMatchDetails(@Body() updateMatchDto: UpdateMatchDto): Promise<any> {
        const { matchId, bowler, striker, type } = updateMatchDto;
        return this.matchService.updateMatchDetails(matchId, bowler, striker, type);
    }

    @Get(":id")
    async getMatchById(@Param("id") id: string): Promise<Match> {
        return this.matchService.fetchMatchDetails(id);
    }
}
