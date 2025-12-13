"use client";

import { getPosterUrl } from "@/lib/tmdb/client";
import { cn } from "@/lib/utils";
import type { Tier, TierItem } from "@/types";
import {
    closestCenter,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface TierBoardProps {
    tiers: Tier[];
    onTiersChange: (tiers: Tier[]) => void;
    onItemRemove?: (tierId: string, itemId: string) => void;
    editable?: boolean;
}

export function TierBoard({
    tiers,
    onTiersChange,
    onItemRemove,
    editable = true,
}: TierBoardProps) {
    const [activeItem, setActiveItem] = useState<TierItem | null>(null);
    const [activeTierId, setActiveTierId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findTierByItemId = useCallback(
        (itemId: string): Tier | undefined => {
            return tiers.find((tier) =>
                tier.items.some((item) => item.id === itemId)
            );
        },
        [tiers]
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const { active } = event;
            const itemId = active.id as string;
            const tier = findTierByItemId(itemId);

            if (tier) {
                const item = tier.items.find((i) => i.id === itemId);
                if (item) {
                    setActiveItem(item);
                    setActiveTierId(tier.id);
                }
            }
        },
        [findTierByItemId]
    );

    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            const { active, over } = event;

            if (!over) return;

            const activeId = active.id as string;
            const overId = over.id as string;

            const activeTier = findTierByItemId(activeId);
            const overTier = findTierByItemId(overId) || tiers.find((t) => t.id === overId);

            if (!activeTier || !overTier) return;
            if (activeTier.id === overTier.id) return;

            // Move item to new tier
            const activeItem = activeTier.items.find((i) => i.id === activeId);
            if (!activeItem) return;

            const newTiers = tiers.map((tier) => {
                if (tier.id === activeTier.id) {
                    return {
                        ...tier,
                        items: tier.items.filter((i) => i.id !== activeId),
                    };
                }
                if (tier.id === overTier.id) {
                    const overIndex = tier.items.findIndex((i) => i.id === overId);
                    const newItems = [...tier.items];
                    if (overIndex >= 0) {
                        newItems.splice(overIndex, 0, activeItem);
                    } else {
                        newItems.push(activeItem);
                    }
                    return { ...tier, items: newItems };
                }
                return tier;
            });

            onTiersChange(newTiers);
        },
        [tiers, findTierByItemId, onTiersChange]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            setActiveItem(null);
            setActiveTierId(null);

            if (!over) return;

            const activeId = active.id as string;
            const overId = over.id as string;

            const activeTier = findTierByItemId(activeId);

            if (!activeTier) return;

            // Reorder within same tier
            if (activeId !== overId) {
                const oldIndex = activeTier.items.findIndex((i) => i.id === activeId);
                const newIndex = activeTier.items.findIndex((i) => i.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newTiers = tiers.map((tier) => {
                        if (tier.id === activeTier.id) {
                            return {
                                ...tier,
                                items: arrayMove(tier.items, oldIndex, newIndex),
                            };
                        }
                        return tier;
                    });
                    onTiersChange(newTiers);
                }
            }
        },
        [tiers, findTierByItemId, onTiersChange]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-2">
                {tiers.map((tier) => (
                    <TierRow
                        key={tier.id}
                        tier={tier}
                        editable={editable}
                        onItemRemove={onItemRemove}
                        isActive={activeTierId === tier.id}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem && <TierItemDragOverlay item={activeItem} />}
            </DragOverlay>
        </DndContext>
    );
}

interface TierRowProps {
    tier: Tier;
    editable: boolean;
    onItemRemove?: (tierId: string, itemId: string) => void;
    isActive?: boolean;
}

function TierRow({ tier, editable, onItemRemove, isActive }: TierRowProps) {
    const itemIds = tier.items.map((item) => item.id);

    return (
        <div
            className={cn(
                "flex min-h-[80px] overflow-hidden rounded-lg border transition-all duration-normal",
                isActive
                    ? "border-turquoise shadow-glow-md dropzone-active"
                    : "border-border"
            )}
        >
            {/* Tier label */}
            <div
                className="flex w-16 shrink-0 items-center justify-center font-display text-xl font-bold"
                style={{ backgroundColor: tier.color }}
            >
                {tier.name}
            </div>

            {/* Items container */}
            <div className="flex flex-1 flex-wrap gap-1 bg-surface-1 p-2">
                <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                        {tier.items.map((item) => (
                            <TierItem
                                key={item.id}
                                item={item}
                                tierId={tier.id}
                                editable={editable}
                                onRemove={onItemRemove}
                            />
                        ))}
                    </AnimatePresence>
                </SortableContext>

                {tier.items.length === 0 && (
                    <div className="flex h-16 w-full items-center justify-center text-sm text-muted-foreground">
                        Sürükleyip bırakın
                    </div>
                )}
            </div>
        </div>
    );
}

interface TierItemProps {
    item: TierItem;
    tierId: string;
    editable: boolean;
    onRemove?: (tierId: string, itemId: string) => void;
}

function TierItem({ item, tierId, editable, onRemove }: TierItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled: !editable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const posterUrl = getPosterUrl(item.posterPath, "small");

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
                "group relative h-16 w-11 cursor-grab overflow-hidden rounded-md transition-all duration-fast",
                isDragging && "z-50 cursor-grabbing opacity-50",
                editable && "hover:ring-2 hover:ring-turquoise"
            )}
            {...attributes}
            {...listeners}
        >
            {posterUrl ? (
                <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="44px"
                    draggable={false}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-2 text-[8px] text-muted-foreground">
                    {item.title.slice(0, 3)}
                </div>
            )}

            {/* Remove button */}
            {editable && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(tierId, item.id);
                    }}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                >
                    <X className="h-3 w-3 text-white" />
                </button>
            )}
        </motion.div>
    );
}

function TierItemDragOverlay({ item }: { item: TierItem }) {
    const posterUrl = getPosterUrl(item.posterPath, "small");

    return (
        <div className="h-16 w-11 overflow-hidden rounded-md shadow-glow-turquoise ring-2 ring-turquoise">
            {posterUrl ? (
                <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="44px"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-2 text-[8px] text-muted-foreground">
                    {item.title.slice(0, 3)}
                </div>
            )}
        </div>
    );
}
