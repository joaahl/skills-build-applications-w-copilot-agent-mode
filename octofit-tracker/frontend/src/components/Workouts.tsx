import { useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason: string;
};

export default function Workouts() {
  const [email, setEmail] = useState('mona@example.com');
  const [selectedEmail, setSelectedEmail] = useState(email);

  return (
    <CapabilityCard<Suggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent(selectedEmail)}`}
      responseKey="suggestions"
      emptyMessage="No workout suggestions found."
      controls={(
        <form className="mb-3" onSubmit={(event) => {
          event.preventDefault();
          setSelectedEmail(email.trim());
        }}>
          <label className="form-label" htmlFor="workout-email">User email</label>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              id="workout-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit">Show suggestions</button>
          </div>
        </form>
      )}
      renderItems={(suggestions) => (
        <ul className="list-group">
          {suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={suggestion._id ?? index}>
              <strong>{suggestion.title}</strong>
              {suggestion.focus && <> &mdash; {suggestion.focus}</>}
              {suggestion.minutes !== undefined && <> &mdash; {suggestion.minutes} minutes</>}
              {suggestion.difficulty && <> &mdash; {suggestion.difficulty}</>}
              <p className="mb-0">{suggestion.reason}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
