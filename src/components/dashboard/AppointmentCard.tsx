interface AppointmentCardProps {
  time: string;
  client: string;
  service: string;
  points: string;
  status: "confirmed" | "pending" | "progress";
}

const statusColors = {
  confirmed: { dot: "bg-[var(--color-mint)]", bar: "bg-[var(--color-mint)]" },
  pending: { dot: "bg-[#FF9500]", bar: "bg-[#FF9500]" },
  progress: { dot: "bg-[#007AFF]", bar: "bg-[#007AFF]" },
};

export default function AppointmentCard({ time, client, service, points, status }: AppointmentCardProps) {
  const colors = statusColors[status];

  return (
    <div className="relative bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] p-4 cursor-pointer transition-all duration-150 hover:bg-[#EDEDF2] active:scale-[0.98] overflow-hidden">
      {/* Left status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm ${colors.bar}`} />

      {/* Time + dot */}
      <div className="flex items-center justify-between text-[12px] font-medium text-[var(--color-label-tertiary)]">
        <span>{time}</span>
        <span className={`w-[7px] h-[7px] rounded-full ${colors.dot}`} />
      </div>

      {/* Client */}
      <div className="text-[15px] font-semibold tracking-tight text-[var(--color-label-primary)] mt-1.5">
        {client}
      </div>

      {/* Service */}
      <div className="text-[13px] text-[var(--color-label-secondary)] mt-0.5">
        {service}
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[12px] font-medium text-[var(--color-mint-dark)]">Fidelización</span>
        <span className="text-[11px] font-semibold text-[var(--color-label-primary)] bg-[var(--color-mint-light)] px-2 py-0.5 rounded-full">
          {points}
        </span>
      </div>
    </div>
  );
}
