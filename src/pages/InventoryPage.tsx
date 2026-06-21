import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Edit3, Package, Recycle } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PartCard } from '../components/PartCard';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { PART_TYPE_NAMES } from '../data/defaultConfig';
import type { Part, PartType, Rarity } from '../types';
import { getRarityColorClass } from '../utils/helpers';

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PartType | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'weight' | 'energy' | 'rarity'>('rarity');
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [showRecycleConfirm, setShowRecycleConfirm] = useState<string | null>(null);

  const parts = useGameStore((s) => s.parts);
  const config = useGameStore((s) => s.config);
  const updatePart = useGameStore((s) => s.updatePart);
  const recyclePart = useGameStore((s) => s.recyclePart);
  const materials = useGameStore((s) => s.materials);

  const filteredParts = useMemo(() => {
    let result = [...parts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    if (filterType !== 'all') {
      result = result.filter((p) => p.type === filterType);
    }

    if (filterRarity !== 'all') {
      result = result.filter((p) => p.rarity === filterRarity);
    }

    const rarityOrder: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weight':
          return b.weight - a.weight;
        case 'energy':
          return b.energy - a.energy;
        case 'rarity':
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        default:
          return 0;
      }
    });

    return result;
  }, [parts, searchTerm, filterType, filterRarity, sortBy]);

  const handleEditSave = () => {
    if (editingPart) {
      updatePart(editingPart.id, editingPart);
      setEditingPart(null);
    }
  };

  const handleRecycle = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (part) {
      const rate = config.recyclingRates[part.rarity];
      const gained = Math.floor(part.maxDurability * rate);
      alert(`拆解成功！获得 ${gained} 材料`);
    }
    recyclePart(partId);
    setShowRecycleConfirm(null);
  };

  const rarityStats = useMemo(() => {
    const stats: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    parts.forEach((p) => {
      stats[p.rarity]++;
    });
    return stats;
  }, [parts]);

  return (
    <PageContainer
      title="零件仓库"
      subtitle={`共 ${parts.length} 个零件 | 材料: ${materials}`}
    >
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="搜索零件名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/50" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PartType | 'all')}
              className="input max-w-[150px]"
            >
              <option value="all">全部类型</option>
              {Object.entries(PART_TYPE_NAMES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}
              className="input max-w-[150px]"
            >
              <option value="all">全部稀有度</option>
              {Object.entries(config.rarities).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name} ({rarityStats[key as Rarity]})
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input max-w-[150px]"
            >
              <option value="rarity">按稀有度</option>
              <option value="name">按名称</option>
              <option value="weight">按重量</option>
              <option value="energy">按能耗</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-subtle">
          {Object.entries(config.rarities).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm"
              style={{ backgroundColor: value.bgColor, color: value.color }}
            >
              <span className="font-mono font-bold">{rarityStats[key as Rarity]}</span>
              <span>{value.name}</span>
            </div>
          ))}
        </div>
      </div>

      {filteredParts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="font-display text-xl text-white/50 mb-2">仓库空空如也</h3>
          <p className="text-white/30">去盲盒页面获取一些零件吧！</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredParts.map((part, index) => (
              <motion.div
                key={part.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
              >
                <PartCard
                  part={part}
                  size="lg"
                  onEdit={setEditingPart}
                  onRecycle={(id) => setShowRecycleConfirm(id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={editingPart !== null}
        onClose={() => setEditingPart(null)}
        title="编辑零件属性"
        size="lg"
      >
        {editingPart && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">名称</label>
                <input
                  type="text"
                  value={editingPart.name}
                  onChange={(e) =>
                    setEditingPart({ ...editingPart, name: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">稀有度</label>
                <select
                  value={editingPart.rarity}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      rarity: e.target.value as Rarity,
                    })
                  }
                  className="input"
                >
                  {Object.entries(config.rarities).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">类型</label>
                <select
                  value={editingPart.type}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      type: e.target.value as PartType,
                    })
                  }
                  className="input"
                >
                  {Object.entries(PART_TYPE_NAMES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">套装词条</label>
                <select
                  value={editingPart.setBonus || ''}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      setBonus: e.target.value || null,
                    })
                  }
                  className="input"
                >
                  <option value="">无</option>
                  {Object.entries(config.setBonuses).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">重量</label>
                <input
                  type="number"
                  value={editingPart.weight}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      weight: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">能耗</label>
                <input
                  type="number"
                  value={editingPart.energy}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      energy: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">技能槽</label>
                <input
                  type="number"
                  value={editingPart.skillSlots}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      skillSlots: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">最大耐久</label>
                <input
                  type="number"
                  value={editingPart.maxDurability}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      maxDurability: Number(e.target.value),
                      durability: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">描述</label>
              <textarea
                value={editingPart.description}
                onChange={(e) =>
                  setEditingPart({ ...editingPart, description: e.target.value })
                }
                className="input min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setEditingPart(null)}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button onClick={handleEditSave} className="btn btn-primary">
                保存修改
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRecycleConfirm !== null}
        onClose={() => setShowRecycleConfirm(null)}
        title="确认拆解"
        size="sm"
      >
        {showRecycleConfirm && (
          <div>
            {(() => {
              const part = parts.find((p) => p.id === showRecycleConfirm);
              if (!part) return null;
              const rate = config.recyclingRates[part.rarity];
              const gained = Math.floor(part.maxDurability * rate);

              return (
                <div className="space-y-4">
                  <p className="text-white/70">
                    确定要拆解 <span className={getRarityColorClass(part.rarity)}>{part.name}</span> 吗？
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-background-tertiary rounded-lg">
                    <Recycle className="w-5 h-5 text-neon-green" />
                    <span className="text-white/70">预计回收材料:</span>
                    <span className="font-mono font-bold text-neon-green">+{gained}</span>
                  </div>
                  <p className="text-xs text-white/40">
                    回收率: {Math.round(rate * 100)}% ({config.rarities[part.rarity].name})
                  </p>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowRecycleConfirm(null)}
                      className="btn btn-ghost"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleRecycle(showRecycleConfirm)}
                      className="btn btn-warning"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      确认拆解
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
