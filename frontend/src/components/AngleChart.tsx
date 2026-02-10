import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Props {
  leftAngles: number[];
  rightAngles: number[];
}

export function AngleChart({ leftAngles, rightAngles }: Props) {
  const data = leftAngles.map((left, i) => ({
    frame: i + 1,
    left: Math.round(left * 10) / 10,
    right: Math.round((rightAngles[i] || 0) * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">
        Knee Flexion Angle — Left vs Right
      </h4>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 25, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="frame"
            label={{ value: 'Frame', position: 'insideBottom', offset: -15 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft', offset: 5 }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}°`]}
            labelFormatter={(label) => `Frame ${label}`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="left"
            stroke="#10B981"
            name="Left Knee"
            dot={false}
            strokeWidth={2.5}
          />
          <Line
            type="monotone"
            dataKey="right"
            stroke="#EF4444"
            name="Right Knee"
            dot={false}
            strokeWidth={2.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
