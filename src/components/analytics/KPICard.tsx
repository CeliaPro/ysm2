import React from 'react'

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  trend: { value: number, isPositive: boolean }
  color: string
}

const KPICard: React.FC<KPICardProps> = ({
  title, value, subtitle, icon: Icon, trend, color
}) => {
  return (
    <div className={`rounded-lg p-5 shadow bg-white flex items-center gap-4`}>
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
        <Icon className={`h-6 w-6 ${color} text-white drop-shadow`} />
      </div>
      <div>
        <div className="font-bold text-xl">{value}</div>
        <div className="text-gray-500 text-xs">{title}</div>
        <div className="text-xs text-gray-400">{subtitle}</div>
      </div>
      {/* Optionally show trend */}
      <div className={`ml-auto flex items-center gap-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'} text-sm`}>
        {trend.isPositive ? '▲' : '▼'} {trend.value}
      </div>
    </div>
  )
}

export default KPICard
