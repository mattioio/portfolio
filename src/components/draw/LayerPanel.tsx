import { useState } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import { Plus, Trash2, Eye, EyeOff, GripVertical, FolderOpen, FolderClosed, Copy, ChevronUp, ChevronDown } from 'lucide-react'
import type { DrawingLayer } from '../../store/types'

function LayerRow({ layer, index, slideId, totalLayers }: {
  layer: DrawingLayer
  index: number
  slideId: string
  totalLayers: number
}) {
  const selectedLayerIds = usePortfolioStore((s) => s.selectedDrawingLayerIds)
  const selectLayer = usePortfolioStore((s) => s.selectDrawingLayer)
  const toggleSelection = usePortfolioStore((s) => s.toggleDrawingLayerSelection)
  const removeLayer = usePortfolioStore((s) => s.removeDrawingLayer)
  const toggleVisibility = usePortfolioStore((s) => s.toggleDrawingLayerVisibility)
  const renameLayer = usePortfolioStore((s) => s.renameDrawingLayer)
  const reorderLayers = usePortfolioStore((s) => s.reorderDrawingLayers)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(layer.name)
  const isSelected = selectedLayerIds.includes(layer.id)

  const [dragOver, setDragOver] = useState<'above' | 'below' | null>(null)

  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== layer.name) {
      renameLayer(slideId, layer.id, trimmed)
    }
    setEditing(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      toggleSelection(layer.id)
    } else {
      selectLayer(layer.id)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const next = e.clientY < midY ? 'above' : 'below'
    // Only update state when value actually changes to avoid re-render spam
    setDragOver((prev) => prev === next ? prev : next)
  }

  const handleDragLeave = () => setDragOver(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (isNaN(fromIndex) || fromIndex === index) return
    let toIndex = dragOver === 'above' ? index : index
    if (fromIndex < index && dragOver === 'above') toIndex = index - 1
    if (fromIndex > index && dragOver === 'below') toIndex = index + 1
    toIndex = Math.max(0, Math.min(totalLayers - 1, toIndex))
    if (fromIndex !== toIndex) {
      // Adopt the drop target's group: if dropping onto a grouped layer, join that group;
      // if dropping onto an ungrouped layer, leave any current group
      reorderLayers(slideId, fromIndex, toIndex, layer.groupId ?? null)
    }
  }

  return (
    <div
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex cursor-pointer items-center gap-1.5 border-b border-zinc-800/50 px-1.5 py-2 transition-colors ${
        isSelected
          ? 'bg-zinc-800/80 text-white'
          : 'text-zinc-400 hover:bg-zinc-900'
      }`}
    >
      {dragOver && (
        <div className="absolute left-0 right-0 z-10 h-0.5 bg-blue-500" style={{ [dragOver === 'above' ? 'top' : 'bottom']: -1 }} />
      )}

      {/* Drag handle */}
      <div className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing">
        <GripVertical size={12} />
      </div>

      {/* Visibility toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleVisibility(slideId, layer.id)
        }}
        className={`rounded p-0.5 transition-colors ${
          layer.visible ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 hover:text-zinc-500'
        }`}
        aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>

      {/* Group indicator */}
      {layer.groupId && (
        <FolderOpen size={10} className="flex-shrink-0 text-zinc-600" />
      )}

      {/* Name — double-click to edit */}
      {editing ? (
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setEditing(false)
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-xs text-white outline-none"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 truncate text-xs"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setEditName(layer.name)
            setEditing(true)
          }}
        >
          {layer.name}
        </span>
      )}

      {/* Path count */}
      <span className="text-[10px] text-zinc-600">{layer.paths.length}</span>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeLayer(slideId, layer.id)
        }}
        className="rounded p-0.5 text-zinc-700 transition-colors hover:text-red-400"
        aria-label="Delete layer"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

export function LayerPanel() {
  const selectedSlideId = usePortfolioStore((s) => s.selectedSlideId)
  const slide = usePortfolioStore((s) => s.slides.find((sl) => sl.id === s.selectedSlideId))
  const selectedLayerIds = usePortfolioStore((s) => s.selectedDrawingLayerIds)
  const addLayer = usePortfolioStore((s) => s.addDrawingLayer)
  const updateTransform = usePortfolioStore((s) => s.updateDrawingLayerTransform)
  const setLayerOpacity = usePortfolioStore((s) => s.setDrawingLayerOpacity)

  const layers = slide?.drawingLayers ?? []
  const groups = slide?.drawingGroups ?? []
  const selectedLayer = selectedLayerIds.length === 1 ? layers.find((l) => l.id === selectedLayerIds[0]) : null

  const selectGroup = usePortfolioStore((s) => s.selectGroup)
  const renameGroup = usePortfolioStore((s) => s.renameGroup)
  const removeGroup = usePortfolioStore((s) => s.removeGroup)
  const duplicateGroup = usePortfolioStore((s) => s.duplicateGroup)
  const reorderGroup = usePortfolioStore((s) => s.reorderGroup)

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const toggleCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  // Check if all layers in a group are selected
  const isGroupSelected = (groupId: string) => {
    const groupLayerIds = layers.filter((l) => l.groupId === groupId).map((l) => l.id)
    return groupLayerIds.length > 0 && groupLayerIds.every((id) => selectedLayerIds.includes(id))
  }

  const renderList = () => {
    const reversed = [...layers].reverse()
    const renderedGroupIds = new Set<string>()
    const items: React.ReactNode[] = []

    for (const layer of reversed) {
      const originalIndex = layers.findIndex((l) => l.id === layer.id)

      // If this layer is in a group, show group header before first member
      if (layer.groupId && !renderedGroupIds.has(layer.groupId)) {
        renderedGroupIds.add(layer.groupId)
        const group = groups.find((g) => g.id === layer.groupId)
        if (group) {
          const groupSelected = isGroupSelected(group.id)
          const isCollapsed = collapsedGroups.has(group.id)
          items.push(
            <div
              key={`group-${group.id}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('group-id', group.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDrop={(e) => {
                e.preventDefault()
                const draggedGroupId = e.dataTransfer.getData('group-id')
                if (draggedGroupId && draggedGroupId !== group.id) {
                  // Single reorder step — move dragged group towards target one position at a time
                  // But batch into a single state update to avoid N separate setState calls
                  const fromIdx = groups.findIndex((g) => g.id === draggedGroupId)
                  const toIdx = groups.findIndex((g) => g.id === group.id)
                  if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                    const dir = fromIdx < toIdx ? 'down' : 'up'
                    const steps = Math.abs(fromIdx - toIdx)
                    // First step pushes history; subsequent steps are fast (throttle skips them)
                    for (let s = 0; s < steps; s++) reorderGroup(selectedSlideId!, draggedGroupId, dir)
                  }
                }
              }}
              onClick={() => selectGroup(selectedSlideId!, group.id)}
              className={`flex cursor-pointer items-center gap-1.5 border-b border-zinc-800/50 px-1.5 py-2 transition-colors ${
                groupSelected ? 'bg-blue-900/30 text-blue-300' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              {/* Drag handle */}
              <GripVertical size={12} className="flex-shrink-0 cursor-grab text-zinc-600" />

              {/* Folder icon toggles collapse */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleCollapse(group.id) }}
                className="flex-shrink-0 text-zinc-500 hover:text-zinc-300"
                aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
              >
                {isCollapsed ? <FolderClosed size={12} /> : <FolderOpen size={12} />}
              </button>
              {editingGroupId === group.id ? (
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-xs font-medium text-zinc-200 outline-none border-b border-blue-500"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  onBlur={() => {
                    const trimmed = editGroupName.trim()
                    if (trimmed && trimmed !== group.name) renameGroup(selectedSlideId!, group.id, trimmed)
                    setEditingGroupId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingGroupId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="flex-1 truncate text-xs font-medium"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditGroupName(group.name)
                    setEditingGroupId(group.id)
                  }}
                >
                  {group.name}
                </span>
              )}

              {/* Duplicate */}
              <button
                onClick={(e) => { e.stopPropagation(); duplicateGroup(selectedSlideId!, group.id) }}
                className="rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
                title="Duplicate group"
                aria-label="Duplicate group"
              >
                <Copy size={10} />
              </button>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); removeGroup(selectedSlideId!, group.id) }}
                className="rounded p-0.5 text-zinc-600 transition-colors hover:text-red-400"
                title="Delete group"
                aria-label="Delete group"
              >
                <Trash2 size={10} />
              </button>
            </div>
          )
        }
      }

      // Skip child layers if their group is collapsed
      if (layer.groupId && collapsedGroups.has(layer.groupId)) continue

      items.push(
        <div key={layer.id} style={{ paddingLeft: layer.groupId ? 12 : 0 }}>
          <LayerRow
            layer={layer}
            index={originalIndex}
            slideId={selectedSlideId!}
            totalLayers={layers.length}
          />
        </div>
      )
    }

    return items
  }

  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Layers</span>
        <button
          onClick={() => selectedSlideId && addLayer(selectedSlideId)}
          className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-300"
          title="Add layer (N)"
          aria-label="Add layer"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Selection info */}
      {selectedLayerIds.length > 1 && (
        <div className="border-b border-zinc-800 px-3 py-1.5">
          <span className="text-[10px] text-zinc-500">{selectedLayerIds.length} layers selected</span>
        </div>
      )}

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length > 0 ? renderList() : (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-xs text-zinc-600">No layers yet</p>
            <button
              onClick={() => selectedSlideId && addLayer(selectedSlideId)}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              Add layer
            </button>
          </div>
        )}
      </div>

      {/* Transform controls — only when exactly 1 layer is selected */}
      {selectedLayer && selectedSlideId && (
        <div className="border-t border-zinc-800 px-3 py-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Transform</p>

          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Rotation</span>
              <span className="text-[10px] tabular-nums text-zinc-400">{Math.round(selectedLayer.rotation)}°</span>
            </div>
            <input
              type="range" min="0" max="360"
              value={selectedLayer.rotation}
              onChange={(e) => updateTransform(selectedSlideId, selectedLayer.id, Number(e.target.value), selectedLayer.scale)}
              className="w-full accent-zinc-400"
            />
          </div>

          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Scale</span>
              <span className="text-[10px] tabular-nums text-zinc-400">{Math.round(selectedLayer.scale * 100)}%</span>
            </div>
            <input
              type="range" min="50" max="200"
              value={selectedLayer.scale * 100}
              onChange={(e) => updateTransform(selectedSlideId, selectedLayer.id, selectedLayer.rotation, Number(e.target.value) / 100)}
              className="w-full accent-zinc-400"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Opacity</span>
              <span className="text-[10px] tabular-nums text-zinc-400">{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={(selectedLayer.opacity ?? 1) * 100}
              onChange={(e) => setLayerOpacity(selectedSlideId, selectedLayer.id, Number(e.target.value) / 100)}
              className="w-full accent-zinc-400"
            />
          </div>
        </div>
      )}
    </div>
  )
}
