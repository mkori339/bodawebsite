const stages = [
  { key: 'pending_payment', label: 'Payment pending' },
  { key: 'waiting_rider', label: 'Waiting for rider' },
  { key: 'rider_assigned', label: 'Rider assigned' },
  { key: 'in_progress', label: 'Trip in progress' },
  { key: 'completed', label: 'Completed' }
];

export default function RideTimeline({ status }) {
  const activeIndex = stages.findIndex((stage) => stage.key === status);

  return (
    <div className="timeline">
      {stages.map((stage, index) => {
        const stageState = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'idle';

        return (
          <div key={stage.key} className={`timeline-step ${stageState}`}>
            <span className="timeline-dot" />
            <div>
              <strong>{stage.label}</strong>
              <small>{stageState === 'done' ? 'Finished' : stageState === 'active' ? 'Current' : 'Upcoming'}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
