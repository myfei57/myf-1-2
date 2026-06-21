import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Boxes,
  Wrench,
  Swords,
  Heart,
  GitCompare,
  Settings,
  Bot,
} from 'lucide-react';
import { ResourceBar } from './ResourceBar';

const navItems = [
  { path: '/', label: '盲盒开盒', icon: Package },
  { path: '/inventory', label: '零件仓库', icon: Boxes },
  { path: '/assembly', label: '组装车间', icon: Wrench },
  { path: '/missions', label: '任务派遣', icon: Swords },
  { path: '/repair', label: '维修中心', icon: Heart },
  { path: '/compare', label: '方案对比', icon: GitCompare },
  { path: '/config', label: '配置管理', icon: Settings },
];

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background-primary/95 backdrop-blur-md border-b border-border-subtle">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-neon-blue/20 rounded-lg">
              <Bot className="w-8 h-8 text-neon-blue" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white glow-text-blue">
                机器人工坊
              </h1>
              <p className="text-xs text-white/50 font-mono">ROBOT WORKSHOP</p>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-neon-blue bg-neon-blue/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-display">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-blue rounded-full"
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>

          <ResourceBar />
        </div>

        <div className="lg:hidden flex items-center gap-1 pb-2 overflow-x-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? 'text-neon-blue bg-neon-blue/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span className="text-xs font-display">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
