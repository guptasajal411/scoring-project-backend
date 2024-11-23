import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Match } from './schemas/match.schema';
import * as mongoose from 'mongoose';
import { Team } from './schemas/team.schema';
import { Player } from './schemas/player.schema';
import { Delivery } from './schemas/delivery.schema';

@Injectable()
export class MatchService {
    constructor(
        @InjectModel(Match.name) private matchModel: mongoose.Model<Match>,
        @InjectModel(Team.name) private teamModel: mongoose.Model<Team>,
        @InjectModel(Player.name) private playerModel: mongoose.Model<Team>,
        @InjectModel(Delivery.name) private deliveryModel: mongoose.Model<Team>
    ) { }

    async findAllMatches(): Promise<Match[]> {
        const matches = await this.matchModel.find({}).exec();
        return matches;
    }

    async startNewMatch(): Promise<Match> {
        await this.deleteAllMatches();
        const teams = await this.getAllTeams();
        const batsmen = await this.getFirstNPlayers(teams[0]._id as mongoose.Types.ObjectId, 2)
        const bowler = await this.getFirstNPlayers(teams[0]._id as mongoose.Types.ObjectId, 1)
        const newMatch = this.matchModel.create({
            battingTeam: teams[0]._id,
            fieldingTeam: teams[1]._id,
            innings: {
                runs: 0,
                wickets: 0,
                overs: 0,
                ballsYetPlayed: 0,
                extras: {
                    wides: 0,
                    noBalls: 0,
                    byes: 0,
                    legByes: 0,
                },
                batsman: batsmen[0]._id,
                bowler: bowler[0]._id,
                nonStriker: batsmen[1]._id
            }
        });
        return newMatch;
    }

    async getFirstNPlayers(teamId: mongoose.Types.ObjectId, n: number): Promise<mongoose.Types.ObjectId[]> {
        const players = await this.teamModel
            .aggregate([
                { $match: { _id: teamId } },
                { $unwind: "$players" },
                { $limit: n },
                { $project: { _id: "$players" } }
            ])
            .exec();
        return players.map(player => player._id);
    }

    async getAllTeams(): Promise<Team[]> {
        const teams = await this.teamModel.find({}).exec();
        return teams;
    }

    async deleteAllMatches(): Promise<mongoose.DeleteResult> {
        const matches = await this.matchModel.deleteMany({}).exec();
        return matches;
    }
}
