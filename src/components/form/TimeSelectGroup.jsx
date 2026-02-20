const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function TimeSelectGroup({ hourId, minuteId, ampmId }) {
  return (
    <div className="time-group">
      <select id={hourId} name={hourId || 'hour'}>
        <option value="">Hour</option>
        {hours.map((hour) => (
          <option key={hour} value={hour}>{hour}</option>
        ))}
      </select>

      <select id={minuteId} name={minuteId || 'minute'}>
        <option value="">Minute</option>
        {minutes.map((minute) => (
          <option key={minute} value={minute}>{minute}</option>
        ))}
      </select>

      <select id={ampmId} name={ampmId || 'ampm'}>
        <option value="">AM/PM</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
