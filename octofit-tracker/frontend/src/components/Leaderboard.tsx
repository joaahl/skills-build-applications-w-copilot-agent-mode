import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      responseKey="leaderboard"
      emptyMessage="No leaderboard rankings yet."
      renderItems={(entries) => (
        <ol className="list-group">
          {entries.map((entry, index) => (
            <li className="list-group-item" key={`${entry.rank}-${index}`}>
              Rank {entry.rank}: {entry.teamName} &mdash; {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    />
  );
}
