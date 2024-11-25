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
        @InjectModel(Player.name) private playerModel: mongoose.Model<Player>,
        @InjectModel(Delivery.name) private deliveryModel: mongoose.Model<Delivery>
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
        const bowler = await this.getFirstNPlayers(teams[1]._id as mongoose.Types.ObjectId, 1)
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
                model: "Player",
                select: "_id name",
            })
            .exec();
        if (!match) {
            return { match: null }
        }
        const deliveries = await this.deliveryModel
            .find({ matchId: id })
            .sort({ createdAt: 1 })
            .exec();
        const deliveriesWithBallNumber = deliveries.map((delivery, index) => ({
            ...delivery.toObject(),
            ballNumber: index + 1
        }));
        const battingTeam = await this.teamModel.findById(match.battingTeam._id).exec();
        const fieldingTeam = await this.teamModel.findById(match.fieldingTeam._id).exec();
        const response = {
            match: match.toObject(),
            deliveries: deliveriesWithBallNumber
        };
        return response;
    }

    async updateMatchDetails(matchId: string, bowler: string, striker: string, type: 0 | 1 | 2 | 3 | 4 | 6 | "wicket" | "wide" | "noball+bye" | "noball+runs" | "bye+overthrow" | "runs+overthrow" | "noball+legbye"): Promise<any> {
        console.log(matchId)
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
                result = await this.handleRuns(matchId, type, bowler, striker);
                break;
            case "wicket":
                result = await this.handleWicket(matchId, type, bowler, striker);
                break;
            case "wide":
                result = await this.handleWide(matchId, type, bowler, striker);
                break;
            case "noball+bye":
                result = await this.handleNoballBye(matchId, type, bowler, striker);
                break;
            case "noball+runs":
                result = await this.handleNoballRuns(matchId, type, bowler, striker);
                break;
            case "noball+legbye":
                result = await this.handleNoballLegbye(matchId, type, bowler, striker);
                break;
            case "bye+overthrow":
                result = await this.handleLegbyeByeOverthrow(matchId, type, bowler, striker);
                break;
            case "runs+overthrow":
                result = await this.handleRunsOverthrow(matchId, type, bowler, striker);
                break;
            default:
                throw new Error("Invalid type");
        }
        return result;
    }

    async handleRuns(matchId: string, runs: number, bowler: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.ballsYetPlayed': 1,
                    'innings.scoreDetails.runs': runs,
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.runsConceded': runs,
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $inc: {
                    'batting.ballsFaced': 1,
                    'batting.runs': runs,
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalRuns': runs,
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: "normal",
            isWicket: false,
            runsExcludingExtras: runs,
            extras: 0,
            sideEffect: "batting",
            matchId,
        });
        console.log("fetching updated")
        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleWicket(matchId: string, type: string, bowler: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.ballsYetPlayed': 1,
                    'innings.scoreDetails.wickets': 1,
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.wickets': 1,
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $set: {
                    'batting.isOut': true,
                },
                $inc: {
                    'batting.ballsFaced': 1,
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalWickets': 1,
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: type,
            isWicket: true,
            runsExcludingExtras: 0,
            extras: 0,
            sideEffect: "bowling",
            matchId,
        });

        console.log("Fetching");
        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleWide(matchId: string, runs: string, bowler: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.scoreDetails.runs': 1,
                    'innings.scoreDetails.extras.wides': 1,
                },
            },
            { new: true }
        );

        const bowlerObject = await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.runsConceded': 1,
                },
            },
            { new: true }
        );

        await this.teamModel.findOneAndUpdate(
            { _id: bowlerObject.team },
            {
                $inc: {
                    'stats.totalRuns': 1,
                    'stats.extras': 1
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: "wide",
            isWicket: false,
            runsExcludingExtras: 0,
            extras: 1,
            sideEffect: "bowling",
            matchId
        });

        console.log("fetching wide");
        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleNoballBye(matchId: string, runs: string, bowler: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.scoreDetails.runs': 1,
                    'innings.scoreDetails.extras.noBalls': 1,
                    'innings.scoreDetails.extras.byes': 1
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.runsConceded': 1,
                    'bowling.noBalls': 1
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $inc: {
                    'batting.ballsFaced': 1
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalRuns': 1,
                    'stats.extras': 1
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: "noball+bye",
            isWicket: false,
            runsExcludingExtras: 0,
            extras: 1,
            sideEffect: "batting",
            matchId
        });

        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleNoballRuns(matchId: string, runs: string, bowler: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.scoreDetails.runs': 5,
                    'innings.scoreDetails.extras.noBalls': 1,
                },
            },
            { new: true }
        );
        await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.runsConceded': 5,
                    'bowling.noBalls': 1
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $inc: {
                    'batting.ballsFaced': 1,
                    'batting.runs': 4,
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalRuns': 4,
                    'stats.extras': 1,
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: "noball+runs",
            isWicket: false,
            runsExcludingExtras: 4,
            extras: 1,
            sideEffect: "batting",
            matchId,
        });

        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleNoballLegbye(matchId: string, runs: string, bowler: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.scoreDetails.runs': 5,
                    'innings.scoreDetails.extras.noBalls': 1,
                    'innings.scoreDetails.extras.legbyes': 4 + 1,
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.runsConceded': 1,
                    'bowling.noBalls': 1,
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $inc: {
                    'batting.ballsFaced': 1,
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalRuns': 4,
                    'stats.extras': 1,
                    'stats.legbyes': 4,
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: "noball+legbye",
            isWicket: false,
            runsExcludingExtras: 4,
            extras: 1,
            sideEffect: "batting",
            matchId,
        });

        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleLegbyeByeOverthrow(matchId: string, runs: string, type: string, striker: string) {
        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.scoreDetails.runs': 3
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $inc: {
                    'batting.ballsFaced': 1
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalRuns': 3,
                    'stats.extras': 1,
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler: "",
            type: "bye+overthrow",
            isWicket: false,
            runsExcludingExtras: 2,
            extras: 1,
            sideEffect: "batting",
            matchId,
        });

        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
    }

    async handleRunsOverthrow(matchId: string, runs: string, bowler: string, striker: string) {
        const totalRuns = parseInt(runs);

        await this.matchModel.findOneAndUpdate(
            { _id: matchId },
            {
                $inc: {
                    'innings.scoreDetails.runs': 2
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: striker },
            {
                $inc: {
                    'batting.ballsFaced': 1,
                    'batting.runs': 2
                },
            },
            { new: true }
        );

        await this.playerModel.findOneAndUpdate(
            { _id: bowler },
            {
                $inc: {
                    'bowling.runsConceded': 2
                },
            },
            { new: true }
        );

        const strikerObject = await this.playerModel.findById(striker).exec();
        await this.teamModel.findOneAndUpdate(
            { _id: strikerObject.team },
            {
                $inc: {
                    'stats.totalRuns': 2
                },
            },
            { new: true }
        );

        await this.deliveryModel.create({
            batsman: striker,
            bowler,
            type: "runs+overthrow",
            isWicket: false,
            runsExcludingExtras: 2,
            extras: 0,
            sideEffect: "batting",
            matchId,
        });

        const updatedMatch = await this.fetchMatchDetails(matchId);
        return updatedMatch;
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
