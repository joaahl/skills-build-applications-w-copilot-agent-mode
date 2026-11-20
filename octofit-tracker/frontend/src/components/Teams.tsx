import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      responseKey="teams"
      emptyMessage="No teams yet."
      renderItems={(teams) => (
        <ul className="list-group">
          {teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? index}>
              <strong>{team.name}</strong>
              {team.mascot && <> &mdash; Mascot: {team.mascot}</>}
              {' '}&mdash; {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
