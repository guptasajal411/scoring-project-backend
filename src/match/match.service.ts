import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Match } from "./schemas/match.schema";
import * as mongoose from "mongoose";
import { Team } from "./schemas/team.schema";
import { Player } from "./schemas/player.schema";
import { Delivery } from "./schemas/delivery.schema";

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
        teams[0].currentStatus = "batting"
        teams[0].stats = {
            totalRuns: 0,
            totalWickets: 0,
            extras: 0,
            overs: 0,
            maidens: 0
        }
        teams[1].currentStatus = "bowling"
        teams[1].stats = {
            totalRuns: 0,
            totalWickets: 0,
            extras: 0,
            overs: 0,
            maidens: 0
        }
        await teams[0].save();
        await teams[1].save();
        const batsmen = await this.getFirstNPlayers(teams[0]._id as mongoose.Types.ObjectId, 2)
        await this.playerModel.findOneAndUpdate({ _id: batsmen[0]._id }, { currentStatus: "striker" }).exec();
        await this.playerModel.findOneAndUpdate({ _id: batsmen[0]._id }, { currentStatus: "non-striker" }).exec();
        const bowler = await this.getFirstNPlayers(teams[0]._id as mongoose.Types.ObjectId, 1)
        await this.playerModel.findOneAndUpdate({ _id: bowler[0]._id }, { currentStatus: "bowler" }).exec();
        await this.playerModel.updateMany({}, { $set: { batting: { runs: 0, ballsFaced: 0, fours: 0, sixes: 0 }, bowling: { overs: 0, runsConceded: 0, wickets: 0, maidens: 0 } } });
        await this.deliveryModel.deleteMany({}).exec();
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
                scoreDetails: {
                    batsman: batsmen[0]._id,
                    bowler: bowler[0]._id,
                    nonStriker: batsmen[1]._id,
                    runs: 0,
                    wickets: 0
                }
            }
        });
        return newMatch;
    }

    async fetchMatchDetails(id?: string): Promise<any> {
        const matchQuery = id
            ? this.matchModel.findById(id)
            : this.matchModel.findOne();
        const match = await matchQuery
            .populate({
                path: "battingTeam",
                populate: {
                    path: "players",
                    model: "Player",
                    select: "_id name batting"
                },
            })
            .populate({
                path: "fieldingTeam",
                populate: {
                    path: "players",
                    model: "Player",
                    select: "_id name bowling"
                },
            })
            .populate({
                path: "innings.scoreDetails.batsman innings.scoreDetails.nonStriker innings.scoreDetails.bowler",
                select: "_id name",
            })
            .exec();
        if (!match) {
            return { match: null }
        }
        const deliveries = await this.deliveryModel.find({ matchId: match._id }).exec();
        const battingTeam = await this.teamModel.findById(match.battingTeam._id).exec();
        const fieldingTeam = await this.teamModel.findById(match.fieldingTeam._id).exec();
        const response = {
            match: match.toObject(),
            deliveries: deliveries
        };
        return response;
    }

    async updateMatchDetails(matchId: string, bowler: string, striker: string, type: 0 | 1 | 2 | 3 | 4 | 6 | "wicket" | "wide" | "noball" | "bye" | "legbye" | "new-ball",): Promise<any> {
        const match = await this.matchModel.findById(matchId);
        if (!match) {
            return { error: true }
        }
        let result: any;
        switch (type) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 6:
                result = await this.handleRuns(matchId, type);
                break;
            // case "wicket":
            //     result = await this.handleWicket(matchId);
            //     break;
            // case "wide":
            // case "noball":
            // case "bye":
            // case "legbye":
            //     result = await this.handleExtras(matchId, type);
            //     break;
            // case "new-ball":
            //     result = await this.handleNewBall(matchId);
            //     break;
            default:
                throw new Error("Invalid type");
        }
        return result;
    }

    async handleRuns(matchId: string, type: number) {
        const match = await this.findMatchById(matchId);
        // match.innings = {...match.innings, ballsYetPlayed: match.innings.ballsYetPlayed++, }
    }

    async getFirstNPlayers(teamId: mongoose.Types.ObjectId, n: number): Promise<mongoose.Types.ObjectId[]> {
        const players = await this.teamModel
            .aggregate([
                { $match: { _id: teamId } },
                { $unwind: "$players" },
                { $limit: n },
                { $project: { _id: "$players", currentStatus: "$currentStatus" } }
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

    async findMatchById(matchId: string): Promise<Match> {
        return await this.matchModel.findById(matchId).exec();
    }
}
