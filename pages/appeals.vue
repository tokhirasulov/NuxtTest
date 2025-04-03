<template>
  <div class="appeals-page">
    <header class="header">
      <div class="header-left">
        <h1>Appeals List</h1>
        <span class="found-count">Found: {{ appeals.length }}</span>
      </div>
      <div class="header-right">
        <button
          class="icon-button"
          :disabled="!canUndo"
          @click="undo"
        >
          <UndoIcon :is-active="canUndo" />
        </button>
        <button
          class="icon-button"
          :disabled="!canRedo"
          @click="redo"
        >
          <RedoIcon :is-active="canRedo" />
        </button>
      </div>
    </header>

    <div class="list-header">
      <div class="list-header-content">
        <div class="header-number">№</div>
        <div class="header-name">Name</div>
        <div class="header-order">Order</div>
        <div class="header-subcategories">Subcategories</div>
        <div class="header-actions">Actions</div>
      </div>
    </div>

    <div class="appeals-list">
      <AppealItem
        v-for="appeal in appeals"
        :key="appeal.id"
        :appeal="appeal"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drop="handleDrop"
      />
    </div>

    <div class="pagination">
      <div class="pagination-info">
        <span>Showing {{ appeals.length }} items</span>
        <span>of {{ totalAppeals }} total</span>
      </div>
      <div class="pagination-controls">
        <button
          class="page-button"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <span class="icon">←</span>
        </button>
        <button
          v-for="page in displayedPages"
          :key="page"
          :class="['page-button', { active: page === currentPage }]"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
        <button
          class="page-button"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          <span class="icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RedoIcon from '~/components/icons/Redo.vue'
import { ref, computed } from 'vue'
import { useAppealsStore } from '~/stores/appeals'
import UndoIcon from '~/components/icons/UndoIcon.vue'
// @ts-ignore
import AppealItem from '~/components/AppealItem.vue'
import type { Appeal } from '~/types/appeal'
import '~/assets/css/main.css'

const store = useAppealsStore()
const draggedAppeal = ref<number | null>(null)

const appeals = computed(() => store.appeals)
const currentPage = computed(() => store.page)
const totalPages = computed(() => store.totalPages)
const totalAppeals = computed(() => store.totalAppeals || 0)
const canUndo = computed(() => store.currentIndex > 0)
const canRedo = computed(() => store.currentIndex < store.history.length - 1)

const displayedPages = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  const halfVisible = Math.floor(maxVisiblePages / 2)

  let start = Math.max(1, currentPage.value - halfVisible)
  let end = Math.min(totalPages.value, start + maxVisiblePages - 1)

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Load initial data
onMounted(() => {
  store.loadFromLocalStorage()
  store.fetchAppeals()
})

const changePage = (page: number) => {
  store.fetchAppeals(page)
}

const handleDragStart = (id: number) => {
  draggedAppeal.value = id
}

const handleDragOver = (e: DragEvent, targetId: number) => {
  e.preventDefault()
  if (!draggedAppeal.value || draggedAppeal.value === targetId) return

  const targetElement = e.target as HTMLElement
  const rect = targetElement.getBoundingClientRect()
  const y = e.clientY - rect.top
  const threshold = rect.height / 3

  targetElement.classList.remove('drop-before', 'drop-after', 'drop-child')

  if (y < threshold) {
    targetElement.classList.add('drop-before')
  } else if (y > rect.height - threshold) {
    targetElement.classList.add('drop-after')
  } else {
    targetElement.classList.add('drop-child')
  }
}

const handleDrop = (e: DragEvent, targetId: number) => {
  e.preventDefault()
  if (!draggedAppeal.value || draggedAppeal.value === targetId) return

  const targetElement = e.target as HTMLElement
  const rect = targetElement.getBoundingClientRect()
  const y = e.clientY - rect.top
  const threshold = rect.height / 3

  let position: 'before' | 'after' | 'child'
  if (y < threshold) {
    position = 'before'
  } else if (y > rect.height - threshold) {
    position = 'after'
  } else {
    position = 'child'
  }

  store.moveAppeal(draggedAppeal.value, targetId, position)
  draggedAppeal.value = null

  targetElement.classList.remove('drop-before', 'drop-after', 'drop-child')
}

const undo = () => {
  store.undo()
}

const redo = () => {
  store.redo()
}
</script>

<style scoped>
.appeals-page {
  min-height: 100vh;
  background: #101319;
  color: #fff;
  padding: 0 72px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 {
  font-size: 1.5em;
  font-weight: 500;
  margin: 0;
}

.found-count {
  background: rgba(76, 110, 245, 0.2);
  color: #4c6ef5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.header-right {
  display: flex;
  gap: 8px;
}

.icon-button {
  background: transparent;
  border: none;
  color: #8b8d90;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.list-header {
  background: #1e2128;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.list-header-content {
  display: grid;
  grid-template-columns: 60px 1fr 80px 2fr 120px;
  padding: 18px 32px;
  gap: 16px;
  color: #8b8d90;
  font-size: 0.9em;
}

.header-number, .header-name, .header-order, .header-subcategories {
  padding-left: 8px;
}

.appeals-list {
  min-height: 400px;
}

.appeals-list > .appeal-item {
  margin-bottom: 10px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: #161A23;
}

.pagination-info {
  color: #8b8d90;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.page-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b8d90;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.page-button.active {
  background: #4c6ef5;
  color: #fff;
  border-color: #4c6ef5;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-button .icon {
  font-size: 1.2em;
  line-height: 1;
}
</style>
