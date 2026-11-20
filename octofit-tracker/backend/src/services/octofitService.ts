import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectIdString(value: unknown): value is string {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity body must be an object', 400);
  const { userId, teamId, type, minutes } = input;
  if (!isObjectIdString(userId) || !isObjectIdString(teamId)) {
    throw httpError('userId and teamId must be valid IDs', 400);
  }
  if (!isNonEmptyString(type) || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError('Activity type and positive minutes are required', 400);
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) throw httpError('Activity user or team was not found', 404);

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team body must be an object', 400);
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (!isNonEmptyString(name) || !isNonEmptyString(mascot)) {
    throw httpError('Team name and mascot are required', 400);
  }
  if (!Array.isArray(members) || !members.every(isObjectIdString)) {
    throw httpError('Team members must be valid user IDs', 400);
  }

  const memberIds = [...new Set(members)];
  if (memberIds.length > 0) {
    const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id');
    if (existingMembers.length !== memberIds.length) {
      throw httpError('One or more team members were not found', 404);
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));

  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: pointsByTeam.get(String(_id)) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim() }).lean();
  if (!user) throw httpError('User was not found', 404);

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLocaleLowerCase();
  const activityTypes = [...new Set(recentActivities.map(({ type }) => type.toLocaleLowerCase()))];

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLocaleLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivity = activityTypes.find((type) => type === focus);
      return {
        ...workout,
        reason: matchesGoal
          ? `Recommended to support your ${user.fitnessGoal} goal.`
          : matchingActivity
            ? `Recommended based on your recent ${matchingActivity} activity.`
            : '',
        relevance: matchesGoal ? 2 : matchingActivity ? 1 : 0,
      };
    })
    .filter(({ relevance }) => relevance > 0)
    .sort((left, right) => right.relevance - left.relevance || left.title.localeCompare(right.title))
    .map(({ relevance: _relevance, ...workout }) => workout);
}

export { User };
